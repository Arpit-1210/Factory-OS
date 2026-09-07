-- ═══════════════════════════════════════════════════════════════
--  0013 — THE LOCK GUARDS ARE NOT AN API
--
--  Supabase grants EXECUTE on everything in `public` to anon and authenticated
--  by default, and PostgREST publishes each function as an RPC endpoint. That
--  swept up the four trigger guards, so `/rest/v1/rpc/fg_stock_lock_guard` and
--  friends were addressable by anyone signed in.
--
--  Nothing could be done with them: Postgres refuses to execute a trigger
--  function outside trigger context ("trigger functions can only be called as
--  triggers"). This is tidiness, not a breach — a grant nobody needs is a
--  grant that can be widened by accident later.
--
--  ── WHY THIS DOES NOT DISARM THE LOCKS ──
--  Trigger firing is not a privilege check. Postgres invokes the trigger
--  function as part of the statement, and never consults EXECUTE to do it.
--  Verified after applying, as a real authenticated owner holding no EXECUTE
--  on either guard: saving through the RPC still locked the row, editing the
--  locked quantity was still refused by the trigger, and the clean unlock
--  still worked — on both the RM and the FG side.
--
--  ── WHAT IS DELIBERATELY LEFT ALONE ──
--  is_owner() and auth_role() keep their grant, and the linter keeps warning
--  about them. That warning is wrong for this schema: RLS policy expressions
--  are evaluated as the querying user, and every owner-write policy calls
--  is_owner(). Revoking it would not harden anything — it would make each of
--  those policies fail with "permission denied for function is_owner" and
--  take every owner write in the app down with it.
--
--  save_opening_stock() and save_rm_opening_stock() keep their grant too:
--  they ARE the API, and each checks is_owner() itself before writing.
-- ═══════════════════════════════════════════════════════════════

revoke all on function public.fg_stock_lock_guard()          from anon, authenticated;
revoke all on function public.fg_stock_lock_guard_delete()   from anon, authenticated;
revoke all on function public.rm_opening_lock_guard()        from anon, authenticated;
revoke all on function public.rm_opening_lock_guard_delete() from anon, authenticated;
