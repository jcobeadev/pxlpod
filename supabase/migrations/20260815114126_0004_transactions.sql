-- Poplab 0004 — the transactional tables.
--
-- Everything a guest CREATES: print passes, share links, deliveries, analytics
-- and booking inquiries. Two rules run through all of it.
--
-- First, none of these tables grants INSERT to anon. Every write arrives via a
-- Next.js route handler using the service role, because price, expiry and code
-- are server decisions. A client that can mint its own free, never-expiring
-- print pass is a client that eventually will.
--
-- Second, anything holding a guest's photo or contact detail expires on its own.
-- Print renders die with the event; delivery destinations are stored hashed, so
-- the log can prove a send happened without ever becoming a contact list.

create type public.print_status    as enum ('issued', 'redeemed', 'expired', 'deleted');
create type public.delivery_channel as enum ('email', 'sms');
create type public.delivery_status  as enum ('queued', 'sent', 'failed');
create type public.capture_surface  as enum ('app', 'web');
create type public.inquiry_status   as enum ('new', 'contacted', 'quoted', 'booked', 'completed', 'lost');

/* ------------------------------------------------------------- print jobs */

create table public.print_jobs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  variant_label text,

  -- Shown to the guest and typed by staff at the booth. Short enough to read
  -- aloud across a noisy night market.
  code        text not null,
  render_path text not null,
  price_cents int  not null default 0 check (price_cents >= 0),

  -- The anonymous install that created it, from Supabase anonymous sign-in.
  created_by  uuid references auth.users(id) on delete set null,

  status      public.print_status not null default 'issued',
  issued_at   timestamptz not null default now(),
  expires_at  timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  cash_cents  int check (cash_cents >= 0),

  constraint print_jobs_redeemed_consistent
    check ((status = 'redeemed') = (redeemed_at is not null))
);

-- A code only needs to be unique among passes that can still be redeemed.
create unique index print_jobs_active_code on public.print_jobs (tenant_id, code)
  where status = 'issued';
create index print_jobs_event_idx   on public.print_jobs (event_id, status);
create index print_jobs_creator_idx on public.print_jobs (created_by);
create index print_jobs_expiry_idx  on public.print_jobs (expires_at) where status = 'issued';

/* ------------------------------------------------------------ share links */

create table public.share_links (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  slug        text not null unique,
  render_path text not null,
  created_by  uuid references auth.users(id) on delete set null,
  views       int not null default 0,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index share_links_creator_idx on public.share_links (created_by);
create index share_links_expiry_idx  on public.share_links (expires_at) where revoked_at is null;

/* ------------------------------------------------------------- deliveries */

create table public.deliveries (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  channel     public.delivery_channel not null,
  -- sha256 of the normalised address or number. Enough to rate-limit and to
  -- prove a send, never enough to reconstruct who was contacted.
  destination_hash text not null,
  status      public.delivery_status not null default 'queued',
  provider_id text,
  error       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index deliveries_tenant_idx on public.deliveries (tenant_id, created_at desc);
create index deliveries_rate_idx   on public.deliveries (destination_hash, created_at desc);

/* --------------------------------------------------------------- sessions */

-- Analytics only. Never image data. This is what answers the one question the
-- business actually has: start -> shot -> shared -> printed.
create table public.sessions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  event_id     uuid references public.events(id) on delete set null,
  install_id   uuid,
  surface      public.capture_surface not null default 'app',
  template_id  uuid references public.templates(id) on delete set null,
  variant_label text,
  filter_id    text,
  shot_count   int,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  saved        boolean not null default false,
  shared       boolean not null default false,
  share_destination text,
  printed      boolean not null default false
);

create index sessions_tenant_time_idx on public.sessions (tenant_id, started_at desc);
create index sessions_template_idx    on public.sessions (template_id, started_at desc);

/* -------------------------------------------------------------- inquiries */

create table public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  event_type   text,
  preferred_date date,
  location     text,
  guest_count  int check (guest_count > 0),
  hours        numeric(4,1) check (hours > 0),
  package      text,
  notes        text,
  reference    text not null,
  status       public.inquiry_status not null default 'new',
  converted_event_id uuid references public.events(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, reference),
  constraint inquiries_has_contact check (email is not null or phone is not null)
);

create index inquiries_tenant_idx on public.inquiries (tenant_id, status, created_at desc);

create trigger inquiries_touch before update on public.inquiries
  for each row execute function public.touch_updated_at();

/* ---------------------------------------------------------------- codes */

-- Unambiguous alphabet: no 0/O, no 1/I. Staff read these off a guest's screen
-- in bad light, and a misread code is a refused sale in front of a queue.
create or replace function public.generate_code(len int default 6)
returns text
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  out text := '';
  i int;
begin
  for i in 1..len loop
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return out;
end $$;

/* -------------------------------------------------- issue / redeem passes */

-- Issuing sets expiry from the event itself rather than from a clock, so a pass
-- can never outlive the pop-up that can print it.
create or replace function public.issue_print_job(
  p_event_id    uuid,
  p_template_id uuid,
  p_variant     text,
  p_render_path text,
  p_created_by  uuid
) returns public.print_jobs
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  ev  public.events;
  job public.print_jobs;
  attempt int := 0;
begin
  select * into ev from public.events where id = p_event_id;
  if not found then
    raise exception 'Event % not found', p_event_id using errcode = 'no_data_found';
  end if;
  if not ev.printing_enabled then
    raise exception 'Printing is not enabled for "%"', ev.title using errcode = 'check_violation';
  end if;
  if now() > ev.ends_at + make_interval(mins => ev.print_grace_minutes) then
    raise exception 'Event "%" has closed', ev.title using errcode = 'check_violation';
  end if;

  -- Retry on the vanishingly rare code collision rather than failing the guest.
  loop
    attempt := attempt + 1;
    begin
      insert into public.print_jobs
        (tenant_id, event_id, template_id, variant_label, code, render_path,
         price_cents, created_by, expires_at)
      values
        (ev.tenant_id, ev.id, p_template_id, p_variant, public.generate_code(6),
         p_render_path, ev.print_price_cents, p_created_by,
         ev.ends_at + make_interval(mins => ev.print_grace_minutes))
      returning * into job;
      return job;
    exception when unique_violation then
      if attempt >= 5 then raise; end if;
    end;
  end loop;
end $$;

-- Redemption is a single conditional UPDATE, which is the whole point: two
-- staff scanning the same code in the same second cannot both win, because
-- only one of them matches `status = 'issued'`.
create or replace function public.redeem_print_job(
  p_tenant_id   uuid,
  p_code        text,
  p_redeemed_by uuid,
  p_cash_cents  int
) returns public.print_jobs
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  job public.print_jobs;
begin
  update public.print_jobs
     set status = 'redeemed', redeemed_at = now(),
         redeemed_by = p_redeemed_by, cash_cents = p_cash_cents
   where tenant_id = p_tenant_id
     and upper(code) = upper(p_code)
     and status = 'issued'
     and expires_at > now()
  returning * into job;

  if found then return job; end if;

  -- Nothing matched. Say precisely why, so staff know whether to reprint,
  -- apologise, or ask the guest to check the code.
  select * into job from public.print_jobs
   where tenant_id = p_tenant_id and upper(code) = upper(p_code)
   order by issued_at desc limit 1;

  if not found then
    raise exception 'No pass with code %', upper(p_code) using errcode = 'no_data_found';
  elsif job.status = 'redeemed' then
    raise exception 'Pass % was already printed at %', upper(p_code), job.redeemed_at
      using errcode = 'unique_violation';
  else
    raise exception 'Pass % expired at %', upper(p_code), job.expires_at
      using errcode = 'check_violation';
  end if;
end $$;

revoke all on function public.issue_print_job(uuid, uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function public.redeem_print_job(uuid, text, uuid, int)       from public, anon, authenticated;
revoke all on function public.generate_code(int)                            from public, anon, authenticated;

/* --------------------------------------------------------------------- RLS */

alter table public.print_jobs  enable row level security;
alter table public.share_links enable row level security;
alter table public.deliveries  enable row level security;
alter table public.sessions    enable row level security;
alter table public.inquiries   enable row level security;

-- Guests read only what they created. No INSERT policy anywhere here: writes go
-- through the API with the service role.
create policy print_jobs_read_own on public.print_jobs
  for select to authenticated
  using (created_by = auth.uid());

create policy print_jobs_staff on public.print_jobs
  for select to authenticated
  using (public.has_tenant_role(tenant_id,
         array['owner','manager','editor','booth']::public.staff_role[]));

create policy share_links_read_own on public.share_links
  for select to authenticated
  using (created_by = auth.uid());

-- A guest may revoke their own link from the privacy screen.
create policy share_links_revoke_own on public.share_links
  for update to authenticated
  using      (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy deliveries_staff on public.deliveries
  for select to authenticated
  using (public.has_tenant_role(tenant_id,
         array['owner','manager']::public.staff_role[]));

create policy sessions_staff on public.sessions
  for select to authenticated
  using (public.has_tenant_role(tenant_id,
         array['owner','manager']::public.staff_role[]));

create policy inquiries_staff on public.inquiries
  for all to authenticated
  using      (public.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]));

/* ------------------------------------------------------------- retention */

-- Called by Vercel Cron. Expiring a pass also drops its render, because the
-- photo is the part that matters — a stale row is bookkeeping, a stale face is
-- a liability.
create or replace function public.purge_expired()
returns table (expired_passes int, dead_links int)
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  p int; l int;
begin
  update public.print_jobs set status = 'expired'
   where status = 'issued' and expires_at <= now();
  get diagnostics p = row_count;

  update public.share_links set revoked_at = now()
   where revoked_at is null and expires_at <= now();
  get diagnostics l = row_count;

  return query select p, l;
end $$;

revoke all on function public.purge_expired() from public, anon, authenticated;
