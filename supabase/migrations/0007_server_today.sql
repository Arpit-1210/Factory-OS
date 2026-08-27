-- ═══════════════════════════════════════════════════════════════
--  0007 — LET THE CLIENT ASK WHAT DAY IT IS
--
--  Every work_date the app writes comes from todayStr(), which reads the
--  DEVICE clock. The rows land in a Postgres `date` column, and the monthly
--  reports are grouped by it. A phone with a wrong date — or simply in a
--  different timezone — therefore files a real shift under the wrong day, and
--  nothing anywhere reports the disagreement. Each device also runs its own
--  60-second rollover check, so around midnight two devices can be on
--  different days at the same moment.
--
--  Correcting the clock is not something the app can do. Detecting the
--  disagreement and saying so is, and that needs one authoritative answer to
--  "what day is it".
--
--  STABLE, not VOLATILE: the value is fixed within a statement.
--  No SECURITY DEFINER: current_date needs no special privilege, so the
--  function runs as the caller and grants nothing.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.server_today()
returns date
language sql
stable
set search_path = ''
as $$ select current_date $$;

revoke all on function public.server_today() from public;
grant execute on function public.server_today() to anon, authenticated;
