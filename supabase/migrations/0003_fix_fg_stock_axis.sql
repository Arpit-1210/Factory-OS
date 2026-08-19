-- ═══════════════════════════════════════════════════════════════
--  Un-swap fg_stock.product and fg_stock.stage.
--
--  app.js has always keyed opening stock as S.fgStock[STAGE][PRODUCT]
--  (getFGBalance at app.js:3544, dashboard tile at app.js:1633), but the
--  two mappers in supabase-db.js read it as [PRODUCT][STAGE]. Every row
--  written before that fix therefore landed with the columns reversed:
--  product = 'Packing', stage = 'Chair A'.
--
--  The app never noticed — fgStockToRows and rowsToFgStock inverted the
--  same way, so the round trip cancelled out. Only direct SQL readers saw
--  the damage. This migration puts the existing rows the right way round
--  so they agree with the corrected mappers.
--
--  Idempotent: it only moves rows whose `product` is a known stage name
--  and whose `stage` is not, so re-running it is a no-op. A product
--  genuinely named after a stage would be ambiguous and is left alone by
--  the second condition.
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  stages text[] := array['Moulding', 'Finishing', 'Painting', 'Packing'];
  moved  integer;
begin
  -- The primary key is (product, stage), so an in-place UPDATE swapping the
  -- two columns can transiently collide with a row that already holds the
  -- target pair. Lift the affected rows out, delete, then reinsert swapped.
  create temporary table _fg_stock_swap on commit drop as
    select stage as product, product as stage, qty, updated_at
      from fg_stock
     where product = any(stages)
       and not (stage = any(stages));

  get diagnostics moved = row_count;

  if moved = 0 then
    raise notice 'fg_stock: nothing to swap, columns already correct';
    return;
  end if;

  delete from fg_stock
   where product = any(stages)
     and not (stage = any(stages));

  -- If a correctly-oriented row already exists for the same (product, stage),
  -- keep the larger quantity rather than failing the migration outright.
  insert into fg_stock (product, stage, qty, updated_at)
  select product, stage, qty, updated_at from _fg_stock_swap
  on conflict (product, stage) do update
    set qty        = greatest(fg_stock.qty, excluded.qty),
        updated_at = now();

  raise notice 'fg_stock: swapped % row(s) into (product, stage) order', moved;
end $$;
