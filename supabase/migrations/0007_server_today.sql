-- ═══════════════════════════════════════════════════════════════
--  0007 — LET THE CLIENT ASK WHAT DAY IT IS
--
--  Every work_date the app writes comes from todayStr(), which reads the
--  DEVICE clock. The rows land in a Postgres `date` column, and the monthly
--  reports are grouped by it. A phone with a wrong date therefore files a real
--  shift under the wrong day, and nothing anywhere reports the disagreement.
--  Each device also runs its own 60-second rollover check, so around midnight
--  two devices can be on different days at the same moment.
--
--  Correcting the clock is not something the app can do. Detecting the
--  disagreement and saying so is, and that needs one authoritative answer to
--  "what day is it".
--
--  ── WHOSE DAY? ──
--  NOT current_date. That is the date in the DATABASE's timezone, which is
--  UTC. The factory is in Ranchi (IST, UTC+5:30), so between midnight and
--  05:30 IST the two disagree by a day, every day. Since the client compares
--  this against the device's local date to detect a wrong clock, the UTC
--  version raised a false "this device's date is wrong" alarm on every device
--  for five and a half hours a night — while staying silent about a genuinely
--  wrong clock during exactly those hours.
--
--  The business day is the factory's day, so the timezone is named explicitly
--  rather than inherited from whatever the database happens to be set to.
--
--  STABLE, not VOLATILE: the value is fixed within a statement.
--  No SECURITY DEFINER: this needs no special privilege, so the function runs
--  as the caller and grants nothing.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.server_today()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

revoke all on function public.server_today() from public;
grant execute on function public.server_today() to anon, authenticated;
