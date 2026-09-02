-- ═══════════════════════════════════════════════════════════════
--  OPENING STOCK — a dated, lockable, owner-owned declaration.
--
--  fg_stock already held opening quantities per (product, stage), but with
--  no answer to three questions the floor actually asks:
--
--    · AS OF WHEN? Without a date the opening balance counted on every day
--      including days before it was true, so asking "what did we hold on the
--      12th" added stock declared on the 1st of the following month.
--    · WHO MAY SET IT? The write policy allowed owner, supervisor AND rm, and
--      the client pushed the whole table from every device on every sync. Any
--      supervisor's phone could overwrite the opening declaration with its own
--      cached copy — including a stale one.
--    · IS IT SETTLED? Nothing recorded that the figures had been reviewed and
--      agreed, so there was no difference between "not entered yet" and
--      "confirmed as zero".
--
--  Locking is enforced HERE, not in the browser. A check the client performs
--  is a courtesy; a check Postgres performs is a rule. The trigger below is
--  what actually stops a locked snapshot being edited, whatever the UI does.
-- ═══════════════════════════════════════════════════════════════

-- ── COLUMNS ────────────────────────────────────────────────────
alter table fg_stock
  add column if not exists as_of_date date,
  add column if not exists locked     boolean not null default false,
  add column if not exists locked_by  uuid references auth.users(id),
  add column if not exists locked_at  timestamptz;

comment on column fg_stock.as_of_date is
  'Go-live date this opening quantity is true as of. Balances ignore the '
  'opening term for any date before it.';
comment on column fg_stock.locked is
  'Confirmed by the owner. Quantities cannot change until an owner unlocks.';

-- ── ONLY THE OWNER DECLARES OPENING STOCK ──────────────────────
-- Was owner/supervisor/rm. Opening stock is a statement about what the
-- business owned on its go-live date; it is not shop-floor data, and every
-- device re-pushing it was how a stale cache could overwrite it.
drop policy if exists fg_stock_write on fg_stock;
create policy fg_stock_owner_write on fg_stock
  for all
  using      (is_owner())
  with check (is_owner());

-- Reading stays open to every authenticated user: supervisors need the same
-- opening figures the owner has, or their stage balances would differ from
-- the owner's for the same product on the same day.

-- ── THE LOCK, ENFORCED BY POSTGRES ─────────────────────────────
create or replace function fg_stock_lock_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A locked row is settled. The one change still permitted is an owner
  -- unlocking it, which must not smuggle a quantity change through with it —
  -- otherwise "unlock" becomes an edit that skips the audit of being unlocked
  -- first.
  if TG_OP = 'UPDATE' and OLD.locked then
    if NEW.locked = false
       and NEW.qty = OLD.qty
       and NEW.as_of_date is not distinct from OLD.as_of_date
       and is_owner() then
      return NEW;
    end if;
    raise exception
      'opening stock for % at % is locked (as of %) — an owner must unlock it first',
      OLD.product, OLD.stage, OLD.as_of_date
      using errcode = 'check_violation';
  end if;

  -- Stamp who locked it and when, rather than trusting the client to say.
  if NEW.locked and (TG_OP = 'INSERT' or not OLD.locked) then
    NEW.locked_by := auth.uid();
    NEW.locked_at := now();
  end if;

  return NEW;
end $$;

drop trigger if exists trg_fg_stock_lock on fg_stock;
create trigger trg_fg_stock_lock
  before insert or update on fg_stock
  for each row execute function fg_stock_lock_guard();

-- A deletion is an edit by another name; the same rule applies.
create or replace function fg_stock_lock_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.locked then
    raise exception
      'opening stock for % at % is locked — an owner must unlock it first',
      OLD.product, OLD.stage
      using errcode = 'check_violation';
  end if;
  return OLD;
end $$;

drop trigger if exists trg_fg_stock_lock_del on fg_stock;
create trigger trg_fg_stock_lock_del
  before delete on fg_stock
  for each row execute function fg_stock_lock_guard_delete();

revoke all on function fg_stock_lock_guard()        from public, anon;
revoke all on function fg_stock_lock_guard_delete() from public, anon;
