-- ═══════════════════════════════════════════════════════════════
--  0006 — BROADCAST DAY CLOSURES
--
--  Six operational tables were added to supabase_realtime in 0004, but
--  day_ledger was not. Closing a day writes exactly one row, to that table.
--
--  So closing a day was invisible to every other device. Device B kept the day
--  open, kept accepting production against it, and kept pushing rows for a day
--  the factory had already closed and reported. Nothing reconciled the two
--  afterwards.
--
--  The client now re-reads the open day whenever a ledger row arrives and
--  renders it from the ledger entry rather than from the operational rows,
--  which is only possible if the event reaches it at all.
--
--  REPLICA IDENTITY FULL so UPDATE events carry the old row: re-closing a day
--  is an UPDATE on the same work_date, and without it the payload cannot be
--  matched to the day it belongs to.
-- ═══════════════════════════════════════════════════════════════

do $$
begin
  -- Idempotent: adding a table already in the publication raises 42710, and
  -- this migration must be safe to re-run.
  begin
    execute 'alter publication supabase_realtime add table public.day_ledger';
  exception
    when duplicate_object then null;
  end;
end $$;

alter table public.day_ledger replica identity full;
