-- Poplab 0005 — storage buckets.
--
-- Four buckets, and the split is the same one that runs through the schema:
-- artwork the operator publishes is public, photographs of guests are not.
--
-- Path convention everywhere: <tenant_id>/<rest>. The first folder segment IS
-- the tenancy boundary, which is why every policy below reads it back out with
-- storage.foldername() rather than trusting the caller.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Template overlays. Public: they are the artwork on a strip anyone can see.
  ('overlays', 'overlays', true,  10485760, array['image/png','image/webp']),
  -- Portfolio albums from past events.
  ('albums',   'albums',   true,  10485760, array['image/jpeg','image/png','image/webp']),
  -- Logos, icons, splash art.
  ('brand',    'brand',    true,   5242880, array['image/png','image/svg+xml','image/webp']),
  -- Guests' composed strips, held only long enough to print or share.
  -- PRIVATE: reachable exclusively through short-lived signed URLs.
  ('renders',  'renders',  false, 15728640, array['image/jpeg','image/png','video/mp4','image/gif'])
on conflict (id) do nothing;

/* ---------------------------------------------------------- public assets */

create policy "public assets are readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('overlays', 'albums', 'brand'));

-- Staff may write only inside their own tenant's folder. The uuid cast doubles
-- as validation: a path that does not start with a tenant id fails outright
-- rather than landing somewhere unowned.
create policy "staff write their own tenant assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('overlays', 'albums', 'brand')
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and ((storage.foldername(name))[1])::uuid in (select public.current_tenant_ids())
  );

create policy "staff update their own tenant assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('overlays', 'albums', 'brand')
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and ((storage.foldername(name))[1])::uuid in (select public.current_tenant_ids())
  );

create policy "staff delete their own tenant assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('overlays', 'albums', 'brand')
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and ((storage.foldername(name))[1])::uuid in (select public.current_tenant_ids())
  );

/* --------------------------------------------------------------- renders */

-- No anon policy at all, so a guest's strip is unreachable without a signed URL
-- even if someone learns the path. Writes come from the API using the service
-- role, which bypasses RLS; booth staff need reads so the print station can
-- fetch the file to print.
create policy "booth staff read renders for their tenant"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'renders'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.has_tenant_role(
          ((storage.foldername(name))[1])::uuid,
          array['owner','manager','editor','booth']::public.staff_role[])
  );
