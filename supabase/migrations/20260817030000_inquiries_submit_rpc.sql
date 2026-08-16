-- Guests can INSERT an inquiry but (by design) can't read it back, so an
-- insert().select("reference") round-trips to a blocked SELECT and looks like a
-- failure even though the row is created. A SECURITY DEFINER RPC inserts and
-- returns the reference in one call — the same pattern used for print jobs.
create or replace function public.submit_inquiry(
  p_tenant_id uuid,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_event_type text default null,
  p_preferred_date date default null,
  p_location text default null,
  p_guest_count integer default null,
  p_notes text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  if not exists (select 1 from public.tenants t where t.id = p_tenant_id and t.is_active) then
    raise exception 'This booth is not accepting inquiries right now.';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Name is required.';
  end if;
  insert into public.inquiries (
    tenant_id, name, email, phone, event_type, preferred_date, location, guest_count, notes
  ) values (
    p_tenant_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_email, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_event_type, '')), ''),
    p_preferred_date,
    nullif(btrim(coalesce(p_location, '')), ''),
    p_guest_count,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning reference into v_ref;
  return v_ref;
end;
$$;

revoke all on function public.submit_inquiry(uuid, text, text, text, text, date, text, integer, text) from public;
grant execute on function public.submit_inquiry(uuid, text, text, text, text, date, text, integer, text) to anon, authenticated;
