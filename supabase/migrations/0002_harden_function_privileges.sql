-- ═══════════════════════════════════════════════════════════════
--  Harden function exposure flagged by the Supabase security advisor.
--  Applied after 0001. Takes the advisor from 7 warnings down to 2.
-- ═══════════════════════════════════════════════════════════════

-- 1. Pin search_path on the trigger helper.
create or replace function touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;


-- 2. Trigger-only functions must not be callable over the REST API at all.
--    Triggers fire as part of the table operation and do NOT check caller
--    EXECUTE privilege, so revoking here breaks nothing.
revoke execute on function public.handle_new_user()  from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;


-- 3. auth_role() and is_owner() MUST stay executable by `authenticated`.
--    RLS policy expressions are evaluated in the CALLING role's context,
--    so revoking EXECUTE from authenticated would break every policy that
--    references them. Anonymous callers have no legitimate use — revoke.
--
--    The advisor will continue to report these two as
--    `authenticated_security_definer_function_executable`. That is expected
--    and accepted: both return only the caller's OWN role, which the caller
--    already knows. There is no data disclosure.
revoke execute on function public.auth_role() from public, anon;
revoke execute on function public.is_owner()  from public, anon;
grant  execute on function public.auth_role() to authenticated;
grant  execute on function public.is_owner()  to authenticated;
