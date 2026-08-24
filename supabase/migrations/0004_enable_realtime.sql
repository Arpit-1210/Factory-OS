-- ═══════════════════════════════════════════════════════════════
--  Turn on realtime for the tables the app subscribes to.
--
--  THE BUG THIS FIXES
--  startSync() in supabase-db.js opens a `postgres_changes` channel on six
--  tables and the client happily reports SUBSCRIBED — so the sync indicator
--  says "Synced" — but Postgres only streams changes for tables that belong
--  to the `supabase_realtime` publication, and none of them ever did.
--
--  The result: every device saw only its own edits. A supervisor logging
--  production on a phone did reach the database, but no other device was told,
--  so the owner's laptop kept showing stale figures until it was reloaded.
--  Nothing in the UI hinted at it, because the subscription itself succeeded.
--
--  REPLICA IDENTITY FULL
--  Realtime evaluates RLS against the row in the change event. With the
--  default replica identity an UPDATE or DELETE only carries the primary key,
--  which is not enough for a policy that reads other columns — those events
--  get filtered out and silently never arrive. FULL puts the whole row in the
--  WAL record. These tables are small (hundreds of rows a day), so the extra
--  WAL is not a concern here.
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  t text;
  watched text[] := array[
    'attendance',
    'production_sessions',
    'raw_log',
    'fg_transfers',
    'fg_stock',
    'factory_doc'
  ];
begin
  foreach t in array watched loop
    -- Idempotent: adding a table twice raises 42710, and this migration should
    -- be safe to re-run against a database that is already partly configured.
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
      raise notice 'realtime: added %', t;
    exception
      when duplicate_object then raise notice 'realtime: % already published', t;
    end;

    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;
