-- Guests submit booking inquiries from the app. They may INSERT (for an active
-- tenant) but never read — the pipeline is staff-only. A default reference means
-- the client need not mint one.
alter table public.inquiries
  alter column reference set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
create policy inquiries_public_insert on public.inquiries
  for insert to anon, authenticated
  with check (exists (select 1 from public.tenants t where t.id = tenant_id and t.is_active));
