-- Poplab 0006 — move the RLS helper functions into a non-exposed schema.
--
-- Fixes a real bug introduced by 0002.
--
-- 0002 revoked EXECUTE on current_tenant_ids() and has_tenant_role() from anon
-- and authenticated, to silence the advisor warning that they were reachable
-- over /rest/v1/rpc. But RLS policies are evaluated AS THE QUERYING ROLE, and
-- most of our policies call those very functions — so the revoke did not just
-- hide the RPC, it broke every staff-scoped policy in the database.
--
-- It stayed invisible because an unauthenticated `anon` request never triggers
-- a `to authenticated` policy, so the function was never reached. Enabling
-- anonymous sign-in turned guests INTO authenticated users, every table's staff
-- policy started evaluating, and reads failed outright with
-- "permission denied for function has_tenant_role".
--
-- The correct way to satisfy both constraints is not to revoke EXECUTE but to
-- put the functions somewhere PostgREST does not expose. `private` is not in
-- the exposed schema list, so these stay callable from policies and remain
-- unreachable as RPC.

create schema if not exists private;
revoke all on schema private from anon, authenticated;
grant usage on schema private to anon, authenticated;

/* ------------------------------------------- drop dependent policies first */

drop policy if exists tenants_read_own            on public.tenants;
drop policy if exists tenants_update_own          on public.tenants;
drop policy if exists staff_read_same_tenant      on public.staff;
drop policy if exists staff_managed_by_owner      on public.staff;
drop policy if exists tenant_settings_read        on public.tenant_settings;
drop policy if exists tenant_settings_write       on public.tenant_settings;
drop policy if exists templates_staff             on public.templates;
drop policy if exists template_variants_staff     on public.template_variants;
drop policy if exists events_staff                on public.events;
drop policy if exists event_templates_staff       on public.event_templates;
drop policy if exists albums_staff                on public.albums;
drop policy if exists album_photos_staff          on public.album_photos;
drop policy if exists app_content_staff           on public.app_content;
drop policy if exists print_jobs_staff            on public.print_jobs;
drop policy if exists deliveries_staff            on public.deliveries;
drop policy if exists sessions_staff              on public.sessions;
drop policy if exists inquiries_staff             on public.inquiries;

drop policy if exists "staff write their own tenant assets"  on storage.objects;
drop policy if exists "staff update their own tenant assets" on storage.objects;
drop policy if exists "staff delete their own tenant assets" on storage.objects;
drop policy if exists "booth staff read renders for their tenant" on storage.objects;

drop function if exists public.current_tenant_ids();
drop function if exists public.has_tenant_role(uuid, public.staff_role[]);

/* ------------------------------------------------------ helpers, relocated */

create function private.current_tenant_ids()
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select tenant_id from public.staff
   where user_id = auth.uid() and status = 'active'
$$;

create function private.has_tenant_role(target uuid, allowed public.staff_role[])
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

-- Policies run as the caller, so the caller genuinely needs EXECUTE. Safety
-- comes from the schema not being exposed, not from withholding this grant.
grant execute on function private.current_tenant_ids() to anon, authenticated;
grant execute on function private.has_tenant_role(uuid, public.staff_role[]) to anon, authenticated;

/* --------------------------------------------------- policies, recreated */

create policy tenants_read_own on public.tenants
  for select to authenticated
  using (id in (select private.current_tenant_ids()));

create policy tenants_update_own on public.tenants
  for update to authenticated
  using      (private.has_tenant_role(id, array['owner','manager']::public.staff_role[]))
  with check (private.has_tenant_role(id, array['owner','manager']::public.staff_role[]));

create policy staff_read_same_tenant on public.staff
  for select to authenticated
  using (tenant_id in (select private.current_tenant_ids()));

create policy staff_managed_by_owner on public.staff
  for all to authenticated
  using      (private.has_tenant_role(tenant_id, array['owner']::public.staff_role[]))
  with check (private.has_tenant_role(tenant_id, array['owner']::public.staff_role[]));

create policy tenant_settings_read on public.tenant_settings
  for select to authenticated
  using (tenant_id in (select private.current_tenant_ids()));

create policy tenant_settings_write on public.tenant_settings
  for all to authenticated
  using      (private.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]))
  with check (private.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]));

create policy templates_staff on public.templates
  for all to authenticated
  using      (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));

create policy template_variants_staff on public.template_variants
  for all to authenticated
  using (exists (select 1 from public.templates t where t.id = template_id
    and private.has_tenant_role(t.tenant_id, array['owner','manager','editor']::public.staff_role[])))
  with check (exists (select 1 from public.templates t where t.id = template_id
    and private.has_tenant_role(t.tenant_id, array['owner','manager','editor']::public.staff_role[])));

create policy events_staff on public.events
  for all to authenticated
  using      (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));

create policy event_templates_staff on public.event_templates
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id
    and private.has_tenant_role(e.tenant_id, array['owner','manager','editor']::public.staff_role[])))
  with check (exists (select 1 from public.events e where e.id = event_id
    and private.has_tenant_role(e.tenant_id, array['owner','manager','editor']::public.staff_role[])));

create policy albums_staff on public.albums
  for all to authenticated
  using      (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));

create policy album_photos_staff on public.album_photos
  for all to authenticated
  using (exists (select 1 from public.albums a where a.id = album_id
    and private.has_tenant_role(a.tenant_id, array['owner','manager','editor']::public.staff_role[])))
  with check (exists (select 1 from public.albums a where a.id = album_id
    and private.has_tenant_role(a.tenant_id, array['owner','manager','editor']::public.staff_role[])));

create policy app_content_staff on public.app_content
  for all to authenticated
  using      (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]))
  with check (private.has_tenant_role(tenant_id, array['owner','manager','editor']::public.staff_role[]));

create policy print_jobs_staff on public.print_jobs
  for select to authenticated
  using (private.has_tenant_role(tenant_id, array['owner','manager','editor','booth']::public.staff_role[]));

create policy deliveries_staff on public.deliveries
  for select to authenticated
  using (private.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]));

create policy sessions_staff on public.sessions
  for select to authenticated
  using (private.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]));

create policy inquiries_staff on public.inquiries
  for all to authenticated
  using      (private.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]))
  with check (private.has_tenant_role(tenant_id, array['owner','manager']::public.staff_role[]));

/* ------------------------------------------------------ storage, recreated */

create policy "staff write their own tenant assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('overlays', 'albums', 'brand')
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and ((storage.foldername(name))[1])::uuid in (select private.current_tenant_ids())
  );

create policy "staff update their own tenant assets"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('overlays', 'albums', 'brand')
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and ((storage.foldername(name))[1])::uuid in (select private.current_tenant_ids())
  );

create policy "staff delete their own tenant assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('overlays', 'albums', 'brand')
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and ((storage.foldername(name))[1])::uuid in (select private.current_tenant_ids())
  );

create policy "booth staff read renders for their tenant"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'renders'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and private.has_tenant_role(
          ((storage.foldername(name))[1])::uuid,
          array['owner','manager','editor','booth']::public.staff_role[])
  );
