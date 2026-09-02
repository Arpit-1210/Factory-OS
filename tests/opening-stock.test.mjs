// ── OPENING STOCK: THE GO-LIVE DECLARATION ──
//
// What the factory held, per product per stage, on the day it started using
// this system. Everything after it is derived, so this figure is a constant
// offset on every balance, every valuation and every reorder alarm — which is
// why it is dated, owner-only, and locked once confirmed.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, getState, resetState, call } from './harness.mjs';

const { ctx, document } = boot();

const base = (extra = {}) => resetState(ctx, Object.assign({
  workDate: '2026-08-20',
  fg: [{ id: 1, name: 'Chair A', price: 1000 }, { id: 2, name: 'Table B', price: 2000 }],
  fgStock: {}, ledger: [], sessions: [],
  fgOpening: { asOfDate: null, locked: false, lockedBy: null, lockedAt: null },
}, extra));

const fresh = (extra) => { const S = base(extra); clearCells(); return S; };

const STAGES = ['Moulding', 'Finishing', 'Painting', 'Packing'];
const cell = (stage, productIndex) => document.getElementById('fgo-c-' + stage + '-' + productIndex);

/**
 * The value the LAST render put in a cell.
 *
 * The DOM stub keeps innerHTML as a string rather than parsing it into
 * elements, so a cell the screen rendered is only readable out of the markup.
 * getElementById would hand back a fresh blank stub (or, worse, one still
 * holding a value an earlier test typed into it).
 */
const rendered = (stage, idx) => {
  const html = document.getElementById('fgo-body').innerHTML;
  const m = new RegExp('id="fgo-c-' + stage + '-' + idx + '"[^>]*value="([^"]*)"').exec(html);
  return m ? m[1] : null;
};

/** Clear the memoised cell stubs — one `document` is shared by every test. */
const clearCells = () => {
  STAGES.forEach(st => [0, 1, 2].forEach(i => { cell(st, i).value = ''; }));
  document.getElementById('fgo-status').innerHTML = '';
  document.getElementById('fgo-body').innerHTML = '';
};

describe('the opening balance is dated', () => {
  test('it does not count on days before the go-live date', () => {
    // The whole reason for the date. Without it the opening balance counted on
    // every day in history, including days before the business declared it.
    const S = fresh({
      fgStock: { Packing: { 'Chair A': 40 } },
      fgOpening: { asOfDate: '2026-08-10', locked: true },
    });
    void S;

    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing","2026-08-09")'), 0,
      'the day before go-live: this system knows nothing');
    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing","2026-08-10")'), 40,
      'on go-live day itself the declaration applies');
    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing","2026-08-31")'), 40,
      'and every day after');
  });

  test('an undated declaration counts on every day, as it always did', () => {
    // Anything entered before opening stock was dated has no as-of date.
    // Dropping it would deflate every balance that rests on it.
    fresh({ fgStock: { Packing: { 'Chair A': 40 } },
           fgOpening: { asOfDate: null, locked: false } });

    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing","2020-01-01")'), 40);
  });

  test('production after go-live adds to the opening balance', () => {
    fresh({
      fgStock: { Packing: { 'Chair A': 40 } },
      fgOpening: { asOfDate: '2026-08-10', locked: true },
      ledger: [{ date: '2026-08-15', rawLog: [], attendance: [], sessions: [
        { supId: 9, supName: 'K', date: '2026-08-15', teams: [
          { teamId: 1, stage: 'Packing', team: [], production: [{ name: 'Chair A', qty: 7 }] }] }] }],
    });

    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing","2026-08-14")'), 40, 'opening only');
    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing","2026-08-16")'), 47, '40 + 7');
  });
});

describe('entering the declaration', () => {
  test('the table lists every catalogue product across the four stages', () => {
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');

    const body = document.getElementById('fgo-body').innerHTML;
    assert.match(body, /Chair A/);
    assert.match(body, /Table B/);
    ['Moulding', 'Finishing', 'Painting', 'Packing'].forEach(st => {
      assert.ok(cell(st, 0), 'a cell exists for ' + st);
    });
  });

  test('existing quantities are shown for editing', () => {
    fresh({ fgStock: { Packing: { 'Chair A': 12 } } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');

    assert.equal(rendered('Packing', 0), '12');
    assert.equal(rendered('Moulding', 0), '', 'blank rather than a bare zero');
  });

  test('a locked declaration renders its inputs disabled', () => {
    fresh({ fgStock: { Packing: { 'Chair A': 12 } },
           fgOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');

    assert.match(document.getElementById('fgo-body').innerHTML, /disabled/);
    assert.equal(document.getElementById('fgo-unlock').style.display, '');
    assert.equal(document.getElementById('fgo-confirm').style.display, 'none');
  });
});

describe('confirm and lock', () => {
  test('a confirmed declaration is dated, locked and mirrored into state', async () => {
    const S = fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');
    document.getElementById('fgo-date').value = '2026-08-01';
    cell('Packing', 0).value = '25';
    cell('Moulding', 1).value = '4';

    await call(ctx, 'confirmOpeningStock()');

    assert.equal(S.fgOpening.asOfDate, '2026-08-01');
    assert.equal(S.fgOpening.locked, true);
    assert.deepEqual(JSON.parse(JSON.stringify(S.fgStock.Packing)), { 'Chair A': 25 });
    assert.deepEqual(JSON.parse(JSON.stringify(S.fgStock.Moulding)), { 'Table B': 4 });
  });

  test('a blank cell means zero, and zero means no row', async () => {
    // "If a product has zero stock at all stages, leave blank (treated as
    // zero)" — a zero row would otherwise persist for ever and read as a
    // declaration about a product nobody counted.
    const S = fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');
    document.getElementById('fgo-date').value = '2026-08-01';
    cell('Packing', 0).value = '5';
    cell('Packing', 1).value = '';        // Table B left blank

    await call(ctx, 'confirmOpeningStock()');

    assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(S.fgStock.Packing))), ['Chair A']);
    assert.equal(call(ctx, 'getFGBalance("Table B","Packing")'), 0);
  });

  test('a future go-live date is refused', async () => {
    const S = fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');
    document.getElementById('fgo-date').value = '2099-01-01';
    cell('Packing', 0).value = '5';

    await call(ctx, 'confirmOpeningStock()');

    assert.ok(!S.fgOpening.locked, 'nothing was locked');
    assert.deepEqual(JSON.parse(JSON.stringify(S.fgStock)), {}, 'and nothing was written');
  });

  test('a non-owner cannot confirm', async () => {
    const S = fresh();
    call(ctx, 'setRole("supervisor")');
    call(ctx, 'openOpeningStock()');
    document.getElementById('fgo-date').value = '2026-08-01';

    await call(ctx, 'confirmOpeningStock()');

    assert.ok(!S.fgOpening.locked);
  });

  test('a non-owner cannot unlock', async () => {
    const S = fresh({ fgOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("supervisor")');

    await call(ctx, 'unlockOpeningStock()');

    assert.equal(S.fgOpening.locked, true, 'still locked');
  });

  test('an owner can unlock to correct the figures', async () => {
    const S = fresh({ fgStock: { Packing: { 'Chair A': 12 } },
                     fgOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("owner")');

    await call(ctx, 'unlockOpeningStock()');

    assert.equal(S.fgOpening.locked, false);
    assert.equal(S.fgOpening.asOfDate, '2026-08-01', 'the date survives the unlock');
  });
});

describe('importing from a sheet', () => {
  const sheet = (rows) => {
    ctx.XLSX = {
      read: () => ({ SheetNames: ['S1'], Sheets: { S1: rows } }),
      utils: { sheet_to_json: (ws) => ws, aoa_to_sheet: (a) => a, book_new: () => ({}),
               book_append_sheet: () => {} },
    };
    ctx.FileReader = function () {
      this.readAsBinaryString = () => { this.onload({ target: { result: '' } }); };
    };
  };
  const upload = () => call(ctx, 'uploadOpeningStock({target:{files:[{}],value:""}})');

  test('columns are matched by heading, in any order', () => {
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');
    sheet([['Product', 'Packing', 'Moulding'], ['Chair A', 9, 3]]);

    upload();

    assert.equal(rendered('Packing', 0), '9');
    assert.equal(rendered('Moulding', 0), '3');
  });

  test('a product the catalogue does not have is reported, not silently dropped', () => {
    // The common import mistake. Dropping the row quietly is how half a sheet
    // goes missing without anyone noticing.
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');
    sheet([['Product', 'Packing'], ['Chair A', 5], ['Ghost Chair', 7]]);

    upload();

    assert.equal(rendered('Packing', 0), '5', 'the known product still imports');
    assert.match(document.getElementById('fgo-status').innerHTML, /Ghost Chair/);
    assert.match(document.getElementById('fgo-status').innerHTML, /not in the product catalogue/);
  });

  test('importing into a locked declaration is refused', () => {
    fresh({ fgOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openOpeningStock()');
    sheet([['Product', 'Packing'], ['Chair A', 5]]);

    upload();

    assert.match(document.getElementById('fgo-status').innerHTML, /locked/i);
  });
});

describe('the standing notice on FG Stock', () => {
  test('says so when nothing has been declared', () => {
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'renderOpeningNotice()');

    const el = document.getElementById('fgo-notice');
    assert.equal(el.style.display, 'block');
    assert.match(el.innerHTML, /No opening stock has been declared/);
  });

  test('distinguishes entered-but-unconfirmed from nothing at all', () => {
    fresh({ fgStock: { Packing: { 'Chair A': 5 } } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'renderOpeningNotice()');

    assert.match(document.getElementById('fgo-notice').innerHTML, /entered but not confirmed/);
  });

  test('is silent once the declaration is locked', () => {
    fresh({ fgStock: { Packing: { 'Chair A': 5 } },
           fgOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'renderOpeningNotice()');

    assert.equal(document.getElementById('fgo-notice').style.display, 'none');
  });
});

describe('you cannot dispatch what you do not have', () => {
  const order = (qty) => ({
    id: 'ORD-1', customer: 'Acme', status: 'ready', items: 'Chair A x' + qty,
    amount: 1000, advance: 0, fgItems: [{ name: 'Chair A', qty, price: 1000 }],
  });

  test('an order larger than the Packing balance is refused', () => {
    // The transfer screen and the assign modal both check this; the dispatch
    // path did not, and wrote the deduction unchecked.
    const S = fresh({ fgStock: { Packing: { 'Chair A': 3 } },
                     fgOpening: { asOfDate: '2026-08-01', locked: true },
                     orders: [order(10)] });

    call(ctx, 'updateOrderStatus("ORD-1","dispatched")');

    assert.equal(S.orders[0].status, 'ready', 'the order is left exactly as it was');
    assert.ok(!(S.fgTransfers || []).length, 'and no stock was moved');
  });

  test('an order it can fill goes out normally', () => {
    const S = fresh({ fgStock: { Packing: { 'Chair A': 10 } },
                     fgOpening: { asOfDate: '2026-08-01', locked: true },
                     orders: [order(4)] });

    call(ctx, 'updateOrderStatus("ORD-1","dispatched")');

    assert.equal(S.orders[0].status, 'dispatched');
    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing")'), 6, '10 − 4');
  });

  test('stock already assigned counts towards the order', () => {
    const S = fresh({ fgStock: { Packing: { 'Chair A': 4 } },
                     fgOpening: { asOfDate: '2026-08-01', locked: true },
                     orders: [Object.assign(order(6), { assignedItems: { 'Chair A': 4 } })] });
    // 4 of the 6 were assigned earlier (and already left Packing); only 2
    // remain to find, and there are 4 on hand.
    call(ctx, 'updateOrderStatus("ORD-1","dispatched")');

    assert.equal(S.orders[0].status, 'dispatched');
  });
});
