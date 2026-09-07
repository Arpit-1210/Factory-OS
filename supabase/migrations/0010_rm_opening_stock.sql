-- ═══════════════════════════════════════════════════════════════
--  RAW MATERIAL OPENING STOCK — the same declaration, for the other half
--  of the inventory.
--
--  Finished goods got this in 0008/0009: a dated, owner-owned, lockable
--  statement of what the factory held on its go-live date. Raw materials had
--  an opening quantity all along — `opening` and `openingDate` inside the
--  `rm_stock` factory_doc blob — but none of what makes it trustworthy:
--
--    · NO LOCK. The blob is rewritten wholesale on every owner push, so the
--      opening balance every raw-material figure rests on could be changed by
--      a stray keystroke, silently, at any time.
--    · THE DATE WAS DECORATION. `openingDate` was stored and never read;
--      getRMBalance() counted the opening quantity on every day in history,
--      including days before the material was declared.
--    · NO WAY TO ENTER IT IN BULK. One material at a time through the stock
--      form, with no sheet import.
--
--  A dedicated table rather than more jsonb, for the same reason fg_stock is
--  one: a lock enforced by a trigger is a rule, and a trigger needs rows.
-- ═══════════════════════════════════════════════════════════════

create table if not exists rm_stock_opening (
  material   text primary key,
  qty        numeric(12,2) not null default 0,
  as_of_date date,
  locked     boolean not null default false,
  locked_by  uuid references auth.users(id),
  locked_at  timestamptz,
  updated_at timestamptz not null default now()
);

comment on table rm_stock_opening is
  'What the factory held of each raw material on its go-live date. Every RM '
  'balance is opening + purchases - issues measured from here.';

alter table rm_stock_opening enable row level security;

-- Readable by everyone signed in: an RM supervisor seeing a different balance
-- from the owner for the same material on the same day would be worse than
-- useless. Writable only by the owner — this is a statement about what the
-- business owned, not shop-floor data.
drop policy if exists rm_opening_read on rm_stock_opening;
create policy rm_opening_read on rm_stock_opening
  for select to authenticated using (true);

drop policy if exists rm_opening_owner_write on rm_stock_opening;
create policy rm_opening_owner_write on rm_stock_opening
  for all using (is_owner()) with check (is_owner());

-- ── THE LOCK, ENFORCED BY POSTGRES ─────────────────────────────
-- Identical rules to fg_stock: a locked row is settled, the only change still
-- permitted is an owner unlocking it, and an unlock must not smuggle a
-- quantity change through with it.
create or replace function rm_opening_lock_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and OLD.locked then
    if NEW.locked = false
       and NEW.qty = OLD.qty
       and NEW.as_of_date is not distinct from OLD.as_of_date
       and is_owner() then
      return NEW;
    end if;
    raise exception
      'opening stock for % is locked (as of %) - an owner must unlock it first',
      OLD.material, OLD.as_of_date
      using errcode = 'check_violation';
  end if;

  if NEW.locked and (TG_OP = 'INSERT' or not OLD.locked) then
    NEW.locked_by := auth.uid();
    NEW.locked_at := now();
  end if;

  NEW.updated_at := now();
  return NEW;
end $$;

drop trigger if exists trg_rm_opening_lock on rm_stock_opening;
create trigger trg_rm_opening_lock
  before insert or update on rm_stock_opening
  for each row execute function rm_opening_lock_guard();

create or replace function rm_opening_lock_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.locked then
    raise exception
      'opening stock for % is locked - an owner must unlock it first', OLD.material
      using errcode = 'check_violation';
  end if;
  return OLD;
end $$;

drop trigger if exists trg_rm_opening_lock_del on rm_stock_opening;
create trigger trg_rm_opening_lock_del
  before delete on rm_stock_opening
  for each row execute function rm_opening_lock_guard_delete();

-- ── ONE ATOMIC WRITE ───────────────────────────────────────────
-- Same shape, and the same two hazards, as save_opening_stock():
--   · a delete and an insert that must both happen are a transaction;
--   · Supabase preloads safeupdate, so the DELETE needs a qualification the
--     planner cannot fold away. A correlated NOT EXISTS survives; a token
--     `where material is not null` would not, because the column is NOT NULL
--     and the planner would drop the test.
create or replace function save_rm_opening_stock(
  rows_in jsonb,
  as_of   date,
  lock_it boolean
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  written integer;
begin
  if not is_owner() then
    raise exception 'only the owner may declare opening stock'
      using errcode = '42501';
  end if;
  if as_of is null then
    raise exception 'opening stock needs the date it was counted'
      using errcode = 'check_violation';
  end if;
  if as_of > current_date then
    raise exception 'the go-live date cannot be in the future'
      using errcode = 'check_violation';
  end if;

  delete from rm_stock_opening o
   where not exists (
     select 1
       from jsonb_array_elements(coalesce(rows_in, '[]'::jsonb)) r
      where r->>'material' = o.material
        and coalesce((r->>'qty')::numeric, 0) > 0
   );

  insert into rm_stock_opening (material, qty, as_of_date, locked)
  select r->>'material',
         (r->>'qty')::numeric,
         as_of,
         coalesce(lock_it, false)
    from jsonb_array_elements(coalesce(rows_in, '[]'::jsonb)) r
   where coalesce((r->>'qty')::numeric, 0) > 0
      on conflict (material) do update
     set qty        = excluded.qty,
         as_of_date = excluded.as_of_date,
         locked     = excluded.locked;

  get diagnostics written = row_count;
  return written;
end $$;

revoke all on function save_rm_opening_stock(jsonb, date, boolean) from public, anon;
grant execute on function save_rm_opening_stock(jsonb, date, boolean) to authenticated;
revoke all on function rm_opening_lock_guard()        from public, anon;
revoke all on function rm_opening_lock_guard_delete() from public, anon;

-- ── CARRY ACROSS WHAT IS ALREADY THERE ─────────────────────────
-- The existing opening quantities live inside the rm_stock document. Losing
-- them would silently drop every raw-material balance by its opening amount,
-- so they are copied over with the date each material already carried.
-- Left UNLOCKED: these were never confirmed by anyone, and marking them
-- settled on their behalf would be a claim the owner never made.
insert into rm_stock_opening (material, qty, as_of_date, locked)
select e->>'name',
       (e->>'opening')::numeric,
       nullif(e->>'openingDate', '')::date,
       false
  from factory_doc, jsonb_array_elements(data) e
 where key = 'rm_stock'
   and coalesce((e->>'opening')::numeric, 0) > 0
   and coalesce(e->>'name', '') <> ''
on conflict (material) do nothing;
