-- Poplab 0003 — the catalog.
--
-- Everything the branded app and the web booth READ: templates, events, albums
-- and editable copy. Reads go direct from the clients with the anon key, so the
-- policies here are the only thing between a guest and an unpublished draft.
-- Each table gets exactly two policies: a narrow public one gated on a publish
-- flag, and a broad staff one gated on tenant membership.

create type public.publish_status  as enum ('draft', 'published', 'archived');
create type public.event_status    as enum ('inquiry', 'confirmed', 'deposit_paid', 'completed', 'cancelled');
create type public.event_visibility as enum ('public', 'private');

/* --------------------------------------------------------------- templates */

create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text not null default '',
  category    text not null check (category in ('strip','combo','classic','fisheye')),

  -- The full template document, validated against the shared zod schema before
  -- it is written. Source of truth for geometry; the columns below are
  -- denormalised copies kept for querying and sorting only.
  spec        jsonb not null,

  -- Distinct photoIndex values, NOT the window count. A double strip is eight
  -- windows and four shots.
  shot_count  int  not null check (shot_count between 1 and 8),
  printable   boolean not null default true,
  thumbnail_path text,

  status      public.publish_status not null default 'draft',
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index templates_tenant_idx on public.templates (tenant_id, status);
create index templates_published_idx on public.templates (tenant_id, published_at desc)
  where status = 'published';

create table public.template_variants (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.templates(id) on delete cascade,
  label        text not null,
  overlay_path text not null,
  text_color   text not null default '#14140F' check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_default   boolean not null default false,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);

create index template_variants_template_idx on public.template_variants (template_id, sort);

-- Exactly one default colourway per template.
create unique index template_variants_one_default
  on public.template_variants (template_id) where is_default;

/* ------------------------------------------------------------------ events */

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  title       text not null,
  slug        text not null,
  description text not null default '',

  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  timezone    text not null default 'Asia/Manila',

  venue_name  text,
  address     text,
  city        text,
  lat         double precision,
  lng         double precision,

  cover_path  text,
  ticket_url  text,
  visibility  public.event_visibility not null default 'public',
  status      public.event_status     not null default 'confirmed',
  is_published boolean not null default false,

  -- Pop-ups only: printing exists while an event runs, not at a fixed shop.
  -- The grace window keeps the queue at closing time servable.
  printing_enabled    boolean not null default false,
  print_price_cents   int     not null default 0 check (print_price_cents >= 0),
  print_grace_minutes int     not null default 30 check (print_grace_minutes between 0 and 240),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (tenant_id, slug),
  constraint events_ends_after_starts check (ends_at > starts_at)
);

create index events_tenant_time_idx on public.events (tenant_id, starts_at desc);
create index events_live_idx on public.events (tenant_id, starts_at, ends_at)
  where is_published and visibility = 'public';

-- "Is a pop-up running right now, and can it print?" — asked by the app on
-- every delivery screen, so it gets a function rather than a hand-rolled
-- timestamp comparison repeated in three clients.
create or replace function public.live_events(target_tenant uuid)
returns setof public.events
language sql
stable
set search_path = public, pg_temp
as $$
  select * from public.events
   where tenant_id = target_tenant
     and is_published
     and visibility = 'public'
     and now() >= starts_at
     and now() <= ends_at + make_interval(mins => print_grace_minutes)
   order by starts_at
$$;

grant execute on function public.live_events(uuid) to anon, authenticated;

create table public.event_templates (
  event_id    uuid not null references public.events(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  sort        int not null default 0,
  primary key (event_id, template_id)
);

/* ------------------------------------------------------------------ albums */

create table public.albums (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  event_id     uuid references public.events(id) on delete set null,
  title        text not null,
  cover_path   text,
  is_published boolean not null default false,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index albums_tenant_idx on public.albums (tenant_id, sort);

create table public.album_photos (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid not null references public.albums(id) on delete cascade,
  path       text not null,
  width      int,
  height     int,
  caption    text,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create index album_photos_album_idx on public.album_photos (album_id, sort);

/* ------------------------------------------------------------- app content */

-- Hero copy, About, Packages, FAQ, socials, the live banner. Keyed so the
-- console can add a block without a migration.
create table public.app_content (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, key)
);

/* -------------------------------------------------------------- timestamps */

create trigger templates_touch before update on public.templates
  for each row execute function public.touch_updated_at();
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
create trigger albums_touch before update on public.albums
  for each row execute function public.touch_updated_at();

/* --------------------------------------------------------------------- RLS */

alter table public.templates         enable row level security;
alter table public.template_variants enable row level security;
alter table public.events            enable row level security;
alter table public.event_templates   enable row level security;
alter table public.albums            enable row level security;
alter table public.album_photos      enable row level security;
alter table public.app_content       enable row level security;

-- Public reads. Note every one of these is gated on a publish flag; a draft
-- template is invisible to the anon key even though the table is readable.
create policy templates_read_published on public.templates
  for select to anon, authenticated
  using (status = 'published');

create policy template_variants_read_published on public.template_variants
  for select to anon, authenticated
  using (exists (
    select 1 from public.templates t
     where t.id = template_id and t.status = 'published'
  ));

create policy events_read_published on public.events
  for select to anon, authenticated
  using (is_published and visibility = 'public');

create policy event_templates_read_published on public.event_templates
  for select to anon, authenticated
  using (exists (
    select 1 from public.events e
     where e.id = event_id and e.is_published and e.visibility = 'public'
  ));

create policy albums_read_published on public.albums
  for select to anon, authenticated
  using (is_published);

create policy album_photos_read_published on public.album_photos
  for select to anon, authenticated
  using (exists (
    select 1 from public.albums a
     where a.id = album_id and a.is_published
  ));

create policy app_content_read on public.app_content
  for select to anon, authenticated
  using (true);

-- Staff access, scoped to the tenant. `editor` and above may write content;
-- `booth` staff exist only to run the print station and get nothing here.
create policy templates_staff on public.templates
  for all to authenticated
  using      (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));

create policy template_variants_staff on public.template_variants
  for all to authenticated
  using (exists (
    select 1 from public.templates t
     where t.id = template_id
       and public.has_tenant_role(t.tenant_id, array['owner','manager','editor']::public.staff_role[])
  ))
  with check (exists (
    select 1 from public.templates t
     where t.id = template_id
       and public.has_tenant_role(t.tenant_id, array['owner','manager','editor']::public.staff_role[])
  ));

create policy events_staff on public.events
  for all to authenticated
  using      (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));

create policy event_templates_staff on public.event_templates
  for all to authenticated
  using (exists (
    select 1 from public.events e
     where e.id = event_id
       and public.has_tenant_role(e.tenant_id, array['owner','manager','editor']::public.staff_role[])
  ))
  with check (exists (
    select 1 from public.events e
     where e.id = event_id
       and public.has_tenant_role(e.tenant_id, array['owner','manager','editor']::public.staff_role[])
  ));

create policy albums_staff on public.albums
  for all to authenticated
  using      (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));

create policy album_photos_staff on public.album_photos
  for all to authenticated
  using (exists (
    select 1 from public.albums a
     where a.id = album_id
       and public.has_tenant_role(a.tenant_id, array['owner','manager','editor']::public.staff_role[])
  ))
  with check (exists (
    select 1 from public.albums a
     where a.id = album_id
       and public.has_tenant_role(a.tenant_id, array['owner','manager','editor']::public.staff_role[])
  ));

create policy app_content_staff on public.app_content
  for all to authenticated
  using      (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));
