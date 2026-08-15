-- Poplab 0001 — tenancy foundation.
--
-- Every table in this database carries tenant_id and enables RLS in the same
-- migration that creates it. A table someone forgets to write a policy for is
-- therefore locked rather than open, which is the failure mode we want.
--
-- NOTE: 0002 revises parts of this file in response to security advisor
-- findings. Read them together; do not copy patterns from here alone.

create extension if not exists pgcrypto;

create type public.staff_role   as enum ('owner', 'manager', 'editor', 'booth');
create type public.staff_status as enum ('invited', 'active', 'revoked');

create table public.tenants (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name           text not null,
  -- Brand tokens the clients load at runtime, so a colour change never needs a
  -- rebuild or an app review.
  brand          jsonb not null default '{}'::jsonb,
  timezone       text not null default 'Asia/Manila',
  currency       text not null default 'PHP',
  sending_domain text,   -- moved to tenant_settings in 0002
  sms_provider   text,   -- moved to tenant_settings in 0002
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.staff (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.staff_role   not null default 'editor',
  status     public.staff_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index staff_user_idx   on public.staff (user_id) where status = 'active';
create index staff_tenant_idx on public.staff (tenant_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger tenants_touch before update on public.tenants
  for each row execute function public.touch_updated_at();
create trigger staff_touch before update on public.staff
  for each row execute function public.touch_updated_at();

-- Tenant resolution.
--
-- SECURITY DEFINER is load-bearing: a policy on `staff` that queried `staff`
-- would recurse infinitely. This runs as owner, bypassing RLS, and is the only
-- function permitted to do so. The pinned search_path matters — without it a
-- caller could shadow `public` and hijack a definer function.
create or replace function public.current_tenant_ids()
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select tenant_id from public.staff
   where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.has_tenant_role(target uuid, allowed public.staff_role[])
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.staff
     where user_id = auth.uid()
       and tenant_id = target
       and status = 'active'
       and role = any(allowed)
  )
$$;

revoke all on function public.current_tenant_ids() from public;
revoke all on function public.has_tenant_role(uuid, public.staff_role[]) from public;
grant execute on function public.current_tenant_ids() to authenticated;
grant execute on function public.has_tenant_role(uuid, public.staff_role[]) to authenticated;

-- Deny by default.
alter table public.tenants enable row level security;
alter table public.staff   enable row level security;

create policy tenants_read_own on public.tenants
  for select to authenticated
  using (id in (select public.current_tenant_ids()));

create policy tenants_update_own on public.tenants
  for update to authenticated
  using      (public.has_tenant_role(id, array['owner','manager']::public.staff_role[]))
  with check (public.has_tenant_role(id, array['owner','manager']::public.staff_role[]));

create policy staff_read_same_tenant on public.staff
  for select to authenticated
  using (tenant_id in (select public.current_tenant_ids()));

create policy staff_managed_by_owner on public.staff
  for all to authenticated
  using      (public.has_tenant_role(tenant_id, array['owner']::public.staff_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner']::public.staff_role[]));

-- Dropped in 0002 — see the note there for why a definer view was the wrong
-- boundary for public brand data.
create view public.tenant_public as
  select id, slug, name, brand, timezone, currency
    from public.tenants
   where is_active;

grant select on public.tenant_public to anon, authenticated;
