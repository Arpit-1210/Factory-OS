-- ═══════════════════════════════════════════════════════════════
--  0012 — AND TAKE IT OFF THE API SURFACE ENTIRELY
--
--  0011 stops the rows from being returned. This stops the table from being
--  addressable at all.
--
--  RLS alone is enough to deny the data: with no policies, anon and
--  authenticated select zero rows and delete zero rows (both verified). But
--  the table-level GRANTs Supabase hands to those roles by default survive
--  the RLS switch, so `/rest/v1/_correction_20260828_backup` stays a live
--  endpoint that answers with an empty array rather than a 404.
--
--  For an archive nothing reads, the grant has no purpose, and a permission
--  that exists is a permission a future policy can accidentally widen.
--  Revoking it means a mistake in some later migration cannot re-expose the
--  rows on its own.
-- ═══════════════════════════════════════════════════════════════

revoke all on table public._correction_20260828_backup from anon, authenticated;
