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

  -- Replaces the previous declaration wholesale. A product dropped from the
  -- table has to lose its row; an upsert cannot express that.
  --
  -- The WHERE is not decoration. Supabase runs with sql_safe_updates on, so an
  -- unqualified DELETE is rejected outright with 21000 "DELETE requires a
  -- WHERE clause" — the statement never runs. `product` is a NOT NULL part of
  -- the primary key, so this predicate matches every row while satisfying that
  -- guard. Caught only by running against the real database: a stubbed client
  -- has no such rule and reported the save as fine.
  delete from fg_stock where product is not null;

  insert into fg_stock (product, stage, qty, as_of_date, locked)
  select r->>'product',
         r->>'stage',
         (r->>'qty')::numeric,
         as_of,
         coalesce(lock_it, false)
    from jsonb_array_elements(coalesce(rows_in, '[]'::jsonb)) r
   where coalesce((r->>'qty')::numeric, 0) > 0;   -- zero means "no row"

  get diagnostics written = row_count;
  return written;
end $$;

revoke all on function save_opening_stock(jsonb, date, boolean) from public, anon;
grant execute on function save_opening_stock(jsonb, date, boolean) to authenticated;
