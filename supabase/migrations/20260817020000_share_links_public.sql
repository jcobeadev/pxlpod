-- Public share links, created by the guest with no server round-trip.
insert into storage.buckets (id, name, public) values ('shares','shares',true) on conflict (id) do nothing;
create policy shares_guest_write on storage.objects
  for insert to anon, authenticated
  with check (bucket_id='shares' and (storage.foldername(name))[1] = auth.uid()::text);
alter table public.share_links
  alter column slug set default lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
create policy share_links_guest_insert on public.share_links
  for insert to anon, authenticated with check (created_by = auth.uid());
create policy share_links_public_read on public.share_links
  for select to anon, authenticated using (revoked_at is null and expires_at > now());
