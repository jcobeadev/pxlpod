-- Poplab 0007 — make staff access structurally impossible for anonymous users.
--
-- Guests sign in anonymously so RLS can scope their print passes and share
-- links to them. That gives them the `authenticated` role, which is the same
-- role every staff policy targets. Today that is safe only because an
-- anonymous user never has a row in `staff` — a true invariant, but one held
-- up by convention rather than by the schema.
--
-- Rather than add an is_anonymous check to twenty-odd policies (and rely on
-- whoever writes the twenty-first remembering), enforce it in the two helper
-- functions every staff policy already routes through. An anonymous caller now
-- gets an empty tenant list and false for every role check, no matter what the
-- staff table says.
--
-- The advisor will keep reporting auth_allow_anonymous_sign_ins on these
-- tables, because it inspects which roles a policy targets rather than what the
-- policy resolves to. That warning is expected here and does not indicate
-- access; tools/verify_rls.mts asserts the actual behaviour as a real guest.

create or replace function private.is_anonymous()
returns boolean
language sql stable
set search_path = public, pg_temp
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

grant execute on function private.is_anonymous() to anon, authenticated;

create or replace function private.current_tenant_ids()
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select tenant_id from public.staff
   where user_id = auth.uid()
     and status = 'active'
     and not private.is_anonymous()
$$;

create or replace function private.has_tenant_role(target uuid, allowed public.staff_role[])
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select not private.is_anonymous()
     and exists (
       select 1 from public.staff
        where user_id = auth.uid()
          and tenant_id = target
          and status = 'active'
          and role = any(allowed)
     )
$$;

comment on function private.has_tenant_role(uuid, public.staff_role[]) is
  'Staff role check for RLS. Returns false for anonymous sessions by construction, so a guest cannot reach staff-scoped rows even if a staff row were somehow created for them.';
