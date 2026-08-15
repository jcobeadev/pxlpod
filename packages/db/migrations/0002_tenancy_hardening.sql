-- Poplab 0002 — fixes every finding the security advisor raised against 0001.
--
-- 1. ERROR security_definer_view: `tenant_public` read past RLS as its owner.
--    The reasoning was "the column list is the boundary" — true, but fragile,
--    because that boundary lives in a view definition someone will later edit
--    without thinking about who reads it. Replaced with a real split: the
--    public-safe columns stay on `tenants` with an anon SELECT policy, and the
--    sensitive ones move to `tenant_settings`, staff-only. The boundary is now
--    a table grant, which is much harder to widen by accident.
--
-- 2. WARN function_search_path_mutable on touch_updated_at.
--
-- 3/4. WARN anon and authenticated could call the SECURITY DEFINER helpers over
--    /rest/v1/rpc. `revoke ... from public` was not enough: Supabase grants the
--    API roles directly, so they need revoking by name.

drop view if exists public.tenant_public;

create table public.tenant_settings (
  tenant_id      uuid primary key references public.tenants(id) on delete cascade,
  sending_domain text,
  sms_provider   text,
  plan           text not null default 'free',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

insert into public.tenant_settings (tenant_id, sending_domain, sms_provider)
  select id, sending_domain, sms_provider from public.tenants;

alter table public.tenants
  drop column sending_domain,
  drop column sms_provider;

alter table public.tenant_settings enable row level security;

create trigger tenant_settings_touch before update on public.tenant_settings
  for each row execute function public.touch_updated_at();

create policy tenant_settings_read on public.tenant_settings
  for select to authenticated
  using (tenant_id in (select public.current_tenant_ids()));

create policy tenant_settings_write on public.tenant_settings
  for all to authenticated
  using      (public.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]));

-- `tenants` now holds nothing an anonymous guest may not see, so the app can
-- read its own brand at launch without a definer view in the way.
create policy tenants_read_public on public.tenants
  for select to anon, authenticated
  using (is_active);

comment on table public.tenants is
  'Public-safe tenant record: anonymous clients read this for branding. Anything that must not reach the public internet belongs in tenant_settings, not here.';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- These helpers exist to be called by RLS policies, never by a client.
revoke execute on function public.current_tenant_ids() from anon, authenticated;
revoke execute on function public.has_tenant_role(uuid, public.staff_role[]) from anon, authenticated;
