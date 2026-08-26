-- ═══════════════════════════════════════════════════════════════
--  Repair the two server-side causes of "supervisor cannot log in",
--  and stop the offline outbox filling with writes that can never land.
--
--  Run this in the Supabase SQL editor (as `postgres`), or via
--  `supabase db push`. Every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════


-- ── 1. NULL TOKEN COLUMNS IN auth.users ────────────────────────
--
-- GoTrue scans these columns into plain Go `string`s, not into
-- sql.NullString. Its own signup path writes '' into every one of them, so
-- an account created BY GoTrue is always fine. An account created any other
-- way — a raw `insert into auth.users`, or the "Add user" button in some
-- Studio versions — leaves them NULL, and the scan then fails with
--
--     500 {"error_code":"unexpected_failure","msg":"Database error querying schema"}
--
-- on EVERY sign-in attempt for that one account, while every other account
-- works normally. That per-user behaviour is what makes it look like a role
-- problem ("only the supervisor cannot log in") when it is nothing of the
-- kind: the app never gets as far as reading app_users.role.
--
-- This app has no account-creation path of its own (there is no signUp and
-- no admin.createUser call anywhere in src/), so every account here was
-- necessarily created out of band — i.e. exactly the population at risk.
--
-- To see who is affected before running the fix:
--   select email, confirmation_token is null, recovery_token is null,
--          email_change is null, reauthentication_token is null
--     from auth.users order by created_at;
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '')
where confirmation_token is null
   or recovery_token is null
   or email_change is null
   or email_change_token_new is null
   or email_change_token_current is null
   or phone_change is null
   or phone_change_token is null
   or reauthentication_token is null;

-- Going forward, create accounts through the Auth Admin API
-- (supabase.auth.admin.createUser, or POST /auth/v1/admin/users) — never with
-- a raw INSERT, which reintroduces exactly this.


-- ── 2. AUTH USERS WITH NO app_users ROW ────────────────────────
--
-- handle_new_user() (migration 0001) creates the app_users row on signup, but
-- it is an AFTER INSERT trigger: any account that predates 0001 has no row.
-- fetchRole() then finds nothing and the sign-in is refused.
--
-- Everyone lands on the least-privileged role, exactly as the trigger does.
-- The owner promotes from there.
insert into app_users (id, email, name, role)
select u.id,
       coalesce(u.email, ''),
       coalesce(u.raw_user_meta_data->>'name', ''),
       'supervisor'
  from auth.users u
  left join app_users a on a.id = u.id
 where a.id is null;


-- ── 3. LET A SUPERVISOR CLOSE THEIR OWN DAY ────────────────────
--
-- `ledger_owner_write` (0001) is owner-only for INSERT, UPDATE and DELETE,
-- but the Day screen is in ROLE_ACCESS.supervisor and the Save Day button is
-- rendered unconditionally. So a supervisor was offered a button that could
-- only ever fail: the write was refused with 42501, silently parked in the
-- offline outbox, retried on every reconnect forever, and the app still said
-- "✓ Day saved!".
--
-- The app now reports that refusal instead of hiding it, but a factory where
-- the supervisor closes the shift needs the write to actually work. This adds
-- INSERT and UPDATE for supervisors, stamped with their own uid. DELETE stays
-- owner-only: removing a closed day is not a shift-floor action.
--
-- If you would rather keep closing the day strictly owner-only, drop this
-- section — the app will now tell the supervisor why it refused, which is all
-- that was actually broken about it.
do $$ begin
  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'day_ledger'
                    and policyname = 'ledger_sup_insert') then
    create policy ledger_sup_insert on day_ledger
      for insert to authenticated
      with check (auth_role() = 'supervisor' and saved_by = auth.uid());
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'day_ledger'
                    and policyname = 'ledger_sup_update') then
    create policy ledger_sup_update on day_ledger
      for update to authenticated
      using      (auth_role() = 'supervisor')
      with check (auth_role() = 'supervisor' and saved_by = auth.uid());
  end if;
end $$;


-- ── 4. KEEP MIGRATION 0001 RE-RUNNABLE ─────────────────────────
--
-- 0002 revoked EXECUTE on handle_new_user() from public, anon and
-- authenticated. Firing a trigger does NOT check EXECUTE — PostgreSQL checks
-- it once, at CREATE TRIGGER time — so that revoke is correct and breaks
-- nothing at runtime.
--
-- It does, however, mean that re-running 0001's `create trigger
-- on_auth_user_created` as any role that is not the function owner now fails
-- with 42501. Grant it back to postgres explicitly so re-applying the schema
-- from scratch stays safe.
grant execute on function public.handle_new_user() to postgres;


-- ── 5. NARROW THE app_users WRITE POLICY ───────────────────────
--
-- `app_users_owner_write` is declared `for all`, which includes SELECT — so
-- is_owner() was evaluated on every read of app_users, including the one
-- every single sign-in performs, for no benefit: app_users_self_read already
-- gives owners full read access. Restricting it to the write verbs removes a
-- SECURITY DEFINER call from the login path.
do $$ begin
  if exists (select 1 from pg_policies
              where schemaname = 'public' and tablename = 'app_users'
                and policyname = 'app_users_owner_write') then
    drop policy app_users_owner_write on app_users;
  end if;
end $$;

create policy app_users_owner_insert on app_users
  for insert to authenticated with check (is_owner());
create policy app_users_owner_update on app_users
  for update to authenticated using (is_owner()) with check (is_owner());
create policy app_users_owner_delete on app_users
  for delete to authenticated using (is_owner());


-- ── 6. DIAGNOSTICS ─────────────────────────────────────────────
--
-- Two checks worth running by hand after this migration.
--
-- (a) Are the real supervisors flagged as such? If is_supervisor is false for
--     them, the Start Production screen is empty no matter who is marked
--     present, because it filters on that flag. The owner can now fix this
--     from the Setup screen (tap the SUP button on a worker row), or here:
--
--       select id, name, is_supervisor, active from workers order by name;
--       -- update workers set is_supervisor = true where id in (...);
--
-- (b) Does every sign-in-capable account have a role?
--
--       select u.email, a.role, a.active
--         from auth.users u left join app_users a on a.id = u.id
--        order by u.created_at;
