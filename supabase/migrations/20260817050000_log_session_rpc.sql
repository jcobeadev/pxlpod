-- Capture analytics: a guest finishing a strip records one session row. Guests
-- can't write public.sessions directly (staff-only), so a SECURITY DEFINER RPC
-- inserts on their behalf. Analytics must never break the capture flow, so an
-- inactive tenant is a silent no-op rather than an error.
create or replace function public.log_session(
  p_tenant_id uuid,
  p_event_id uuid default null,
  p_template_id uuid default null,
  p_variant text default null,
  p_filter_id text default null,
  p_shot_count integer default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.tenants t where t.id = p_tenant_id and t.is_active) then
    return;
  end if;
  insert into public.sessions (
    tenant_id, event_id, template_id, variant_label, filter_id, shot_count,
    surface, started_at, completed_at
  ) values (
    p_tenant_id, p_event_id, p_template_id, p_variant, p_filter_id, p_shot_count,
    'app', now(), now()
  );
end;
$$;

revoke all on function public.log_session(uuid, uuid, uuid, text, text, integer) from public;
grant execute on function public.log_session(uuid, uuid, uuid, text, text, integer) to anon, authenticated;
