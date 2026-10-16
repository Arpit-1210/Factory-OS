-- ═══════════════════════════════════════════════════════════════
--  0016 — KEEP WHAT A TRANSFER IS, NOT JUST WHERE IT WENT
--
--  fg_transfers held id, date, product, from, to and qty. The app records
--  more than that about a transfer, and the extra fields lived only in the
--  browser:
--
--    auto         the automatic transfer made when production is logged at a
--                 stage (the previous stage hands the goods over)
--    product_in   the product name on the receiving side ("Chair A — Red")
--    product_out  the product name on the sending side ("Chair A")
--    colour       the paint colour, for Painting
--    note         free text ("Dispatch ORD-12 — Customer")
--    order_id     set when stock is assigned to an order
--
--  Because the server never stored them, the next pull rebuilt each transfer
--  without them. getFGBalance() ignores an auto transfer on the receiving
--  side (production already counts there), so once `auto` was lost the stage
--  it moved INTO counted the goods twice: 10 made in Finishing showed as 20
--  after a sync. The paint colour split disappeared the same way.
--
--  Idempotent. The client only writes these columns after it has seen they
--  exist, so applying this before or after deploying the new build is safe.
--
--  Rows written before this migration have auto = false: nothing on the
--  server records which of them were automatic, so they stay as they are.
-- ═══════════════════════════════════════════════════════════════
alter table fg_transfers
  add column if not exists product_in  text,
  add column if not exists product_out text,
  add column if not exists auto        boolean not null default false,
  add column if not exists colour      text,
  add column if not exists note        text,
  add column if not exists order_id    text;
