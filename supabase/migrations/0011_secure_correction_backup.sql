-- ═══════════════════════════════════════════════════════════════
--  0011 — CLOSE THE CORRECTION BACKUP TO THE PUBLIC API
--
--  `_correction_20260828_backup` was created by hand during the 2026-08-27
--  correction and never had row level security switched on. Every table in
--  `public` is served by PostgREST, and the anon key ships inside the client
--  bundle, so for eleven days anyone holding that key — which is anyone who
--  loaded the app — could read, rewrite or delete all 163 rows.
--
--  ── WHY THIS IS NOT A DROP ──
--  It looks like a spent backup. It is not. The live tables hold NOTHING for
--  2026-08-27:
--
--      attendance          0 rows      (backup: 161)
--      day_ledger          0 rows      (backup:   1)
--      production_sessions 0 rows      (backup:   1)
--
--  The correction removed that day and this table is the only surviving copy
--  of it — a full day of attendance for 161 workers, which is payroll. It is
--  archive, not litter, and it stays.
--
--  ── RLS WITH NO POLICIES, DELIBERATELY ──
--  Enabling RLS without policies denies everything to anon and authenticated,
--  which is exactly right here: nothing in the app reads this table (there is
--  no reference to it anywhere in the source). The service role and the table
--  owner bypass RLS, so the day can still be restored from it if anyone ever
--  needs to.
-- ═══════════════════════════════════════════════════════════════

alter table public._correction_20260828_backup enable row level security;

comment on table public._correction_20260828_backup is
  'ARCHIVE - do not drop. The only surviving copy of 2026-08-27: 161 attendance '
  'rows, the day ledger and one production session, captured 2026-08-27 20:51 UTC '
  'before that day was corrected. The live tables hold nothing for that date. '
  'RLS is on with NO policies deliberately: nothing in the app reads this, so anon '
  'and authenticated get nothing, while the service role and the owner can still '
  'read it to restore from.';
