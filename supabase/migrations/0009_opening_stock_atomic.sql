-- ═══════════════════════════════════════════════════════════════
--  Saving opening stock must be ONE operation.
--
--  The client wrote a declaration as two requests: delete every row, then
--  insert the new set. Between those two calls the factory's opening stock did
--  not exist. If the insert then failed — a dropped connection, an RLS
--  refusal, one malformed quantity — the declaration was gone from Postgres
--  with nothing in its place, and the only copy left was the browser tab that
--  happened to still be open.
--
--  A delete and an insert that must both happen are a transaction, and the
--  place to put a transaction is the database. This function replaces the
--  whole declaration atomically: either the new set lands, or the old one is
--  still there.
--
--  SECURITY DEFINER so it may write the table, with the owner check made
--  explicitly on the way in rather than left to the caller's RLS — the point
--  of definer rights is that the policy no longer applies, so the rule has to
--  be restated here. auth.uid() still reads the caller's JWT inside a definer
--  function, so is_owner() answers for whoever actually called it.
--
--  The lock triggers still fire: re-saving over a LOCKED declaration raises,
--  and the transaction rolls back with the existing figures intact.
-- ═══════════════════════════════════════════════════════════════

create or replace function save_opening_stock(
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

  -- ── WHY THIS IS NOT `delete from fg_stock` ──
  --
  -- Supabase preloads the safeupdate extension, which refuses an unqualified
  -- DELETE outright: 21000, "DELETE requires a WHERE clause". The statement
  -- never runs, so every save failed and opening stock could not be declared
  -- at all. A stubbed client has no such rule, which is why only a run against
  -- the real database caught it.
  --
  -- A token predicate is not enough either. `where product is not null` reads
  -- like a WHERE, but `product` is NOT NULL, so the planner can prove it always
  -- true and drop it — leaving exactly the unqualified scan the guard rejects.
  -- The correlated NOT EXISTS below cannot be folded away, because whether a
  -- row survives genuinely depends on the payload.
  --
  -- It is also simply the better statement: it removes only the rows this
  -- declaration drops, instead of churning every row to rewrite the same
  -- numbers.
  delete from fg_stock f
   where not exists (
     select 1
       from jsonb_array_elements(coalesce(rows_in, '[]'::jsonb)) r
      where r->>'product' = f.product
        and r->>'stage'   = f.stage
        and coalesce((r->>'qty')::numeric, 0) > 0
   );

  -- Everything still declared, written or rewritten. Zero means "no row", so
  -- those never arrive here and were removed above.
  --
  -- The lock triggers still fire on both statements: re-saving over a locked
  -- declaration raises, and this whole function rolls back with the existing
  -- figures untouched.
  insert into fg_stock as t (product, stage, qty, as_of_date, locked)
  select r->>'product',
         r->>'stage',
         (r->>'qty')::numeric,
         as_of,
         coalesce(lock_it, false)
    from jsonb_array_elements(coalesce(rows_in, '[]'::jsonb)) r
   where coalesce((r->>'qty')::numeric, 0) > 0
      on conflict (product, stage) do update
     set qty        = excluded.qty,
         as_of_date = excluded.as_of_date,
         locked     = excluded.locked;

  get diagnostics written = row_count;
  return written;
end $$;

revoke all on function save_opening_stock(jsonb, date, boolean) from public, anon;
grant execute on function save_opening_stock(jsonb, date, boolean) to authenticated;
