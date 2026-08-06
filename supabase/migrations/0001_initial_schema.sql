-- ═══════════════════════════════════════════════════════════════
--  Factory OS v3.0 — Initial Schema
--  Propskart & Urban Pebbles
--
--  DESIGN NOTE (Path B — targeted normalisation):
--  Only data with MULTIPLE concurrent writers is normalised into rows.
--  Owner-only data stays as jsonb documents, because a single writer
--  cannot conflict with itself and rows would cost time we don't have.
--
--    Contended  -> attendance, production_sessions, raw_log,
--                  fg_transfers, fg_stock
--    Single-writer -> factory_doc (orders, bom, dispatches, ...)
--
--  `teams` remains jsonb inside production_sessions on purpose:
--  contention is BETWEEN supervisors, never within one supervisor's
--  own session. One device owns one row per day. That is the minimal
--  change that eliminates the whole last-writer-wins bug class.
-- ═══════════════════════════════════════════════════════════════

-- ── ROLES ──────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('owner', 'supervisor', 'rm');
exception when duplicate_object then null;
end $$;


-- ── USERS ──────────────────────────────────────────────────────
-- Mirrors auth.users, adds the factory role.
-- Roles live HERE, not in the browser. This is what makes DevTools
-- tampering impossible (the old app kept role in a JS variable).
create table if not exists app_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  role        user_role not null default 'supervisor',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Role lookup for RLS policies.
-- SECURITY DEFINER + explicit search_path so policies on app_users
-- don't recurse into themselves.
create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from app_users where id = auth.uid() and active
$$;

create or replace function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'owner', false)
$$;


-- ── CATALOGUES (owner writes, everyone reads) ──────────────────
-- bigint ids preserve the existing uid() values so the Firestore
-- migration can carry ids across unchanged.
create table if not exists workers (
  id            bigint primary key,
  name          text not null,
  role          text not null default 'Floor worker',
  wage          numeric(10,2) not null default 0,
  ot_rate       numeric(10,2) not null default 0,
  is_supervisor boolean not null default false,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

create table if not exists rm_catalogue (
  id         bigint primary key,
  name       text not null,
  unit       text not null default 'kg',
  price      numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists fg_catalogue (
  id         bigint primary key,
  name       text not null,
  price      numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);


-- ── ATTENDANCE (contended: owner + supervisors) ────────────────
-- One row per worker per day. Two devices marking two different
-- workers can never overwrite each other.
create table if not exists attendance (
  work_date  date    not null,
  worker_id  bigint  not null references workers(id) on delete cascade,
  present    boolean not null default false,
  doing_ot   boolean not null default false,
  ot_hours   numeric(5,2) not null default 0,
  marked_by  uuid    references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (work_date, worker_id)
);

create index if not exists attendance_date_idx on attendance (work_date);


-- ── PRODUCTION SESSIONS (contended: many supervisor devices) ───
create table if not exists production_sessions (
  id          uuid primary key default gen_random_uuid(),
  work_date   date   not null,
  sup_id      bigint not null references workers(id),
  sup_name    text   not null,
  sup_wage    numeric(10,2) not null default 0,
  sup_ot      numeric(10,2) not null default 0,
  teams       jsonb  not null default '[]'::jsonb,
  device_id   text,
  created_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  unique (work_date, sup_id)
);

create index if not exists sessions_date_idx on production_sessions (work_date);


-- ── RAW MATERIAL LOG (contended: supervisors + RM role) ────────
create table if not exists raw_log (
  id         bigint primary key,
  work_date  date not null,
  stage      text not null,
  rm_name    text not null,
  unit       text not null default 'kg',
  qty        numeric(12,3) not null default 0,
  unit_price numeric(12,2) not null default 0,
  cost       numeric(14,2) not null default 0,
  logged_by  uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists raw_log_date_idx on raw_log (work_date);


-- ── FG TRANSFERS + STOCK (contended: supervisors + owner) ──────
create table if not exists fg_transfers (
  id         bigint primary key,
  work_date  date not null,
  product    text not null,
  from_stage text,
  to_stage   text,
  qty        numeric(12,2) not null default 0,
  logged_by  uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists fg_transfers_date_idx on fg_transfers (work_date);

create table if not exists fg_stock (
  product    text not null,
  stage      text not null,
  qty        numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (product, stage)
);


-- ── DAY LEDGER ─────────────────────────────────────────────────
-- One row per day, NOT one giant array. This is what removes the
-- 1 MiB ceiling the Firestore `ledger[]` array was heading for.
create table if not exists day_ledger (
  work_date  date primary key,
  payload    jsonb not null,
  saved_by   uuid references auth.users(id),
  updated_at timestamptz not null default now()
);


-- ── OWNER DOCUMENTS (single writer — jsonb is fine here) ───────
-- keys: orders | dispatches | salary_adj | bom | unit_transfers
--       | order_reservations | rm_stock | purchases
create table if not exists factory_doc (
  key        text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);


-- ── AUDIT LOG ──────────────────────────────────────────────────
-- Answers "who changed payroll?" — impossible with the old design.
create table if not exists audit_log (
  id         bigserial primary key,
  actor      uuid references auth.users(id),
  actor_role user_role,
  table_name text not null,
  action     text not null,
  row_key    text,
  changed_at timestamptz not null default now()
);

create index if not exists audit_log_time_idx on audit_log (changed_at desc);


-- ── updated_at TRIGGER ─────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'workers','rm_catalogue','fg_catalogue','attendance',
    'production_sessions','fg_stock','day_ledger','factory_doc'
  ] loop
    execute format(
      'drop trigger if exists trg_touch_%1$s on %1$s;
       create trigger trg_touch_%1$s before update on %1$s
       for each row execute function touch_updated_at();', t);
  end loop;
end $$;


-- ═══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--
--  Replaces the old Firestore rule `allow read, write: if
--  request.auth != null`, under which any supervisor could
--  overwrite the owner's ledger and payroll.
-- ═══════════════════════════════════════════════════════════════

alter table app_users           enable row level security;
alter table workers             enable row level security;
alter table rm_catalogue        enable row level security;
alter table fg_catalogue        enable row level security;
alter table attendance          enable row level security;
alter table production_sessions enable row level security;
alter table raw_log             enable row level security;
alter table fg_transfers        enable row level security;
alter table fg_stock            enable row level security;
alter table day_ledger          enable row level security;
alter table factory_doc         enable row level security;
alter table audit_log           enable row level security;


-- app_users: you see yourself; owner sees and manages everyone
create policy app_users_self_read on app_users
  for select using (id = auth.uid() or is_owner());
create policy app_users_owner_write on app_users
  for all using (is_owner()) with check (is_owner());


-- Catalogues: all authenticated read, owner-only write
create policy workers_read on workers
  for select to authenticated using (true);
create policy workers_owner_write on workers
  for all using (is_owner()) with check (is_owner());

create policy rm_read on rm_catalogue
  for select to authenticated using (true);
create policy rm_owner_write on rm_catalogue
  for all using (is_owner()) with check (is_owner());

create policy fg_read on fg_catalogue
  for select to authenticated using (true);
create policy fg_owner_write on fg_catalogue
  for all using (is_owner()) with check (is_owner());


-- Attendance: all read; owner and supervisors write
create policy attendance_read on attendance
  for select to authenticated using (true);
create policy attendance_write on attendance
  for all
  using      (auth_role() in ('owner','supervisor'))
  with check (auth_role() in ('owner','supervisor'));


-- Production sessions: all read.
-- A supervisor may only touch their OWN row — this is the rule that
-- makes two supervisors on two devices structurally unable to
-- clobber each other.
create policy sessions_read on production_sessions
  for select to authenticated using (true);
create policy sessions_owner_all on production_sessions
  for all using (is_owner()) with check (is_owner());
create policy sessions_sup_insert on production_sessions
  for insert to authenticated
  with check (auth_role() = 'supervisor' and created_by = auth.uid());
create policy sessions_sup_update on production_sessions
  for update to authenticated
  using      (auth_role() = 'supervisor' and created_by = auth.uid())
  with check (auth_role() = 'supervisor' and created_by = auth.uid());
create policy sessions_sup_delete on production_sessions
  for delete to authenticated
  using (auth_role() = 'supervisor' and created_by = auth.uid());


-- Raw log: all read; owner, supervisor and RM write
create policy raw_log_read on raw_log
  for select to authenticated using (true);
create policy raw_log_write on raw_log
  for all
  using      (auth_role() in ('owner','supervisor','rm'))
  with check (auth_role() in ('owner','supervisor','rm'));


-- FG transfers / stock: all read; owner, supervisor and RM write
create policy fg_transfers_read on fg_transfers
  for select to authenticated using (true);
create policy fg_transfers_write on fg_transfers
  for all
  using      (auth_role() in ('owner','supervisor','rm'))
  with check (auth_role() in ('owner','supervisor','rm'));

create policy fg_stock_read on fg_stock
  for select to authenticated using (true);
create policy fg_stock_write on fg_stock
  for all
  using      (auth_role() in ('owner','supervisor','rm'))
  with check (auth_role() in ('owner','supervisor','rm'));


-- Day ledger: all read (needed for monthly reports); owner-only write
create policy ledger_read on day_ledger
  for select to authenticated using (true);
create policy ledger_owner_write on day_ledger
  for all using (is_owner()) with check (is_owner());


-- Owner documents: orders, payroll adjustments and BOM are
-- OWNER-ONLY for read as well. Supervisors have no business
-- reading the order book or salary advances.
create policy factory_doc_owner on factory_doc
  for all using (is_owner()) with check (is_owner());

-- Except the two keys supervisors and RM genuinely need.
create policy factory_doc_shared_read on factory_doc
  for select to authenticated
  using (key in ('rm_stock', 'order_reservations'));


-- Audit log: owner reads, nobody edits
create policy audit_read on audit_log
  for select using (is_owner());
create policy audit_insert on audit_log
  for insert to authenticated with check (true);


-- ── NEW USER HOOK ──────────────────────────────────────────────
-- Every auth signup gets an app_users row, defaulting to the least
-- privileged role. The owner promotes from the user-management screen.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into app_users (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name',''), 'supervisor')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
