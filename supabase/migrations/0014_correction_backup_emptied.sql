-- ═══════════════════════════════════════════════════════════════
--  0014 — THE CORRECTION BACKUP IS EMPTY NOW
--
--  0011 put row level security on `_correction_20260828_backup` and left a
--  comment on the table saying, in as many words, DO NOT DROP: it held the
--  only copy of 2026-08-27, and the live tables held nothing for that date.
--
--  That is no longer true. On 2026-09-11 the owner cleared the factory's
--  operational data for a fresh start — attendance, sessions, the ledger,
--  transfers, the raw log, the worker list and this backup — with no snapshot
--  taken. All 163 rows are gone and cannot be recovered.
--
--  A comment that tells the next reader to protect data the table no longer
--  holds is worse than no comment: it is a promise the schema cannot keep, and
--  it would send someone hunting for records that do not exist. The table is
--  left in place so the RLS and the revoked grants from 0011 and 0012 stay
--  where they are rather than being re-litigated, but nothing depends on it.
-- ═══════════════════════════════════════════════════════════════

comment on table public._correction_20260828_backup is
  'EMPTY since 2026-09-11. Held the only surviving copy of 2026-08-27 - 161 '
  'attendance rows, the day ledger and one production session - until the '
  'factory data was cleared for a fresh start at the owner''s request. Those '
  'rows were deleted with no snapshot and are NOT recoverable. The table is '
  'kept only so the RLS and the revoked grants from 0011/0012 stay in place; '
  'nothing reads it, and it is safe to drop.';
