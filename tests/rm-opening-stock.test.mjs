// ── RAW MATERIAL OPENING STOCK ──
//
// The finished-goods twin of this is tests/opening-stock.test.mjs. Same
// declaration, one column instead of four: a material has a quantity, not a
// position in a production line.
//
// Raw materials always had an opening quantity, inside the rm_stock document.
// What they did not have was a lock, a date that meant anything, or any way to
// enter it in bulk.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx, document } = boot();

const base = (extra = {}) => resetState(ctx, Object.assign({
  workDate: '2026-08-20',
  rm: [{ id: 1, name: 'Resin', unit: 'kg', price: 220 },
       { id: 2, name: 'Hardener', unit: 'kg', price: 180 }],
  stock: [{ id: 1, name: 'Resin', unit: 'kg', opening: 0, reorder: 10 },
          { id: 2, name: 'Hardener', unit: 'kg', opening: 0, reorder: 10 }],
  purchases: [], ledger: [], rawLog: [],
  rmOpeningQty: {},
  rmOpening: { asOfDate: null, locked: false, lockedBy: null, lockedAt: null },
}, extra));

const cell = (idx) => document.getElementById('rmo-c-' + idx);
const clearCells = () => {
  [0, 1, 2].forEach(i => { cell(i).value = ''; });
  document.getElementById('rmo-status').innerHTML = '';
  document.getElementById('rmo-body').innerHTML = '';
};
const fresh = (extra) => { const S = base(extra); clearCells(); return S; };

const rendered = (idx) => {
  const html = document.getElementById('rmo-body').innerHTML;
  const m = new RegExp('id="rmo-c-' + idx + '"[^>]*value="([^"]*)"').exec(html);
  return m ? m[1] : null;
};
const shown = () => {
  const html = document.getElementById('rmo-body').innerHTML;
  return (html.match(/<td style="font-weight:500">([^<]*)<\/td>/g) || [])
    .map(m => m.replace(/<[^>]*>/g, ''));
};

describe('the opening balance is dated', () => {
  test('it does not count on days before the go-live date', () => {
    fresh({ rmOpeningQty: { Resin: 500 },
            rmOpening: { asOfDate: '2026-08-10', locked: true } });

    assert.equal(call(ctx, 'getRMBalance("Resin","2026-08-09").balance'), 0,
      'the day before go-live: this system knows nothing');
    assert.equal(call(ctx, 'getRMBalance("Resin","2026-08-10").balance'), 500,
      'on go-live day the declaration applies');
    assert.equal(call(ctx, 'getRMBalance("Resin","2026-08-31").balance'), 500);
  });

  test('purchases and issues after go-live move it', () => {
    fresh({
      rmOpeningQty: { Resin: 500 },
      rmOpening: { asOfDate: '2026-08-10', locked: true },
      purchases: [{ id: 1, date: '2026-08-12', name: 'Resin', unit: 'kg', qty: 100, cost: 22000 }],
      ledger: [{ date: '2026-08-15', sessions: [], attendance: [],
                 rawLog: [{ id: 1, stage: 'Moulding', name: 'Resin', unit: 'kg', qty: 40 }] }],
    });

    assert.equal(call(ctx, 'getRMBalance("Resin","2026-08-11").balance'), 500, 'opening only');
    assert.equal(call(ctx, 'getRMBalance("Resin","2026-08-13").balance'), 600, '+ the delivery');
    assert.equal(call(ctx, 'getRMBalance("Resin","2026-08-16").balance'), 560, '− what was issued');
  });

  test('the legacy per-material opening is still honoured before migration', () => {
    // rm_stock_opening is populated by migration 0010. A device that has not
    // pulled it yet must not suddenly report every material short by its
    // opening quantity.
    fresh({ rmOpeningQty: {},
            stock: [{ id: 1, name: 'Resin', unit: 'kg', opening: 250, reorder: 10 }] });

    assert.equal(call(ctx, 'getRMBalance("Resin").balance'), 250,
      'the old figure still counts until the declaration replaces it');
  });

  test('the declaration wins over the legacy figure once it exists', () => {
    fresh({ rmOpeningQty: { Resin: 300 },
            rmOpening: { asOfDate: '2026-08-01', locked: true },
            stock: [{ id: 1, name: 'Resin', unit: 'kg', opening: 250, reorder: 10 }] });

    assert.equal(call(ctx, 'getRMBalance("Resin").balance'), 300, 'not 250');
  });

  test('a material declared at zero is zero, not fallen back to the old figure', () => {
    // The subtle one: an owner clearing a material to zero must not have the
    // stale rm_stock number silently reinstated.
    fresh({ rmOpeningQty: { Hardener: 5 },
            rmOpening: { asOfDate: '2026-08-01', locked: true },
            stock: [{ id: 1, name: 'Resin', unit: 'kg', opening: 250, reorder: 10 }] });

    assert.equal(call(ctx, 'getRMBalance("Resin").balance'), 250,
      'a material absent from the declaration still falls back');
  });
});

describe('entering the declaration', () => {
  test('the table lists every catalogue material with its unit', () => {
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');

    assert.deepEqual(shown(), ['Resin', 'Hardener']);
    assert.match(document.getElementById('rmo-body').innerHTML, /kg/);
  });

  test('existing quantities are shown for editing', () => {
    fresh({ rmOpeningQty: { Resin: 120 } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');

    assert.equal(rendered(0), '120');
    assert.equal(rendered(1), '', 'blank rather than a bare zero');
  });

  test('a locked declaration renders its inputs disabled', () => {
    fresh({ rmOpeningQty: { Resin: 120 },
            rmOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');

    assert.match(document.getElementById('rmo-body').innerHTML, /disabled/);
    assert.equal(document.getElementById('rmo-unlock').style.display, '');
    assert.equal(document.getElementById('rmo-confirm').style.display, 'none');
  });

  test('the date defaults to the finished-goods go-live date when there is one', () => {
    // The same stock-take almost certainly counted both halves of the store.
    fresh({ fgOpening: { asOfDate: '2026-07-15', locked: true } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');

    assert.equal(document.getElementById('rmo-date').value, '2026-07-15');
  });
});

describe('confirm and lock', () => {
  test('a confirmed declaration is dated, locked and mirrored into state', async () => {
    const S = fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    document.getElementById('rmo-date').value = '2026-08-01';
    cell(0).value = '500';
    cell(1).value = '80';

    await call(ctx, 'confirmRMOpeningStock()');

    assert.equal(S.rmOpening.asOfDate, '2026-08-01');
    assert.equal(S.rmOpening.locked, true);
    assert.deepEqual(JSON.parse(JSON.stringify(S.rmOpeningQty)), { Resin: 500, Hardener: 80 });
    assert.equal(call(ctx, 'getRMBalance("Resin").balance'), 500);
  });

  test('the legacy rm_stock figures are kept in step', () => {
    // The Stock screen still shows `opening` in its own column; the two
    // disagreeing on screen would read as a bug.
    const S = fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    document.getElementById('rmo-date').value = '2026-08-01';
    cell(0).value = '500';

    return call(ctx, 'confirmRMOpeningStock()').then(() => {
      assert.equal(S.stock.find(s => s.name === 'Resin').opening, 500);
      assert.equal(S.stock.find(s => s.name === 'Hardener').opening, 0, 'and cleared where blank');
    });
  });

  test('a blank cell means zero, and zero means no row', async () => {
    const S = fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    document.getElementById('rmo-date').value = '2026-08-01';
    cell(0).value = '5';
    cell(1).value = '';

    await call(ctx, 'confirmRMOpeningStock()');

    assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(S.rmOpeningQty))), ['Resin']);
  });

  test('a future go-live date is refused', async () => {
    const S = fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    document.getElementById('rmo-date').value = '2099-01-01';
    cell(0).value = '5';

    await call(ctx, 'confirmRMOpeningStock()');

    assert.ok(!S.rmOpening.locked, 'nothing was locked');
  });

  test('a non-owner can neither confirm nor unlock', async () => {
    const S = fresh({ rmOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("supervisor")');

    await call(ctx, 'confirmRMOpeningStock()');
    await call(ctx, 'unlockRMOpeningStock()');

    assert.equal(S.rmOpening.locked, true, 'still locked');
  });

  test('an owner can unlock to correct the figures', async () => {
    const S = fresh({ rmOpeningQty: { Resin: 500 },
                      rmOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("owner")');

    await call(ctx, 'unlockRMOpeningStock()');

    assert.equal(S.rmOpening.locked, false);
    assert.equal(S.rmOpening.asOfDate, '2026-08-01', 'the date survives the unlock');
  });
});

describe('searching a real material list', () => {
  const many = () => {
    const rm = [];
    for (let i = 1; i <= 30; i++) rm.push({ id: i, name: 'Resin Grade ' + i, unit: 'kg', price: 100 });
    rm.push({ id: 99, name: 'Gelcoat', unit: 'kg', price: 310 });
    const S = fresh({ rm, stock: [] });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    return S;
  };
  const search = (q) => {
    document.getElementById('rmo-search').value = q;
    call(ctx, 'filterRMOpeningStock()');
  };

  test('a search narrows the table', () => {
    many();
    assert.equal(shown().length, 31);

    search('gelcoat');

    assert.deepEqual(shown(), ['Gelcoat']);
    assert.match(document.getElementById('rmo-count').textContent, /Showing 1 of 31/);
  });

  test('a quantity typed before searching is NOT lost when the row is filtered away', () => {
    const S = many();
    cell(0).value = '77';
    call(ctx, 'onRMOpeningCell()');

    search('gelcoat');
    assert.deepEqual(shown(), ['Gelcoat']);

    search('');
    assert.equal(rendered(0), '77', 'the quantity survived the round trip');

    document.getElementById('rmo-date').value = '2026-08-01';
    return call(ctx, 'confirmRMOpeningStock()').then(() => {
      assert.equal(JSON.parse(JSON.stringify(S.rmOpeningQty))['Resin Grade 1'], 77);
    });
  });

  test('"only rows with a quantity" is the review pass', () => {
    many();
    cell(0).value = '9';
    call(ctx, 'onRMOpeningCell()');

    document.getElementById('rmo-only-filled').checked = true;
    call(ctx, 'toggleRMOpeningFilled()');

    assert.deepEqual(shown(), ['Resin Grade 1']);
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
  const upload = () => call(ctx, 'uploadRMOpeningStock({target:{files:[{}],value:""}})');

  test('quantities are read from the sheet', () => {
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    sheet([['Material', 'Opening Qty', 'Unit'], ['Resin', 420, 'kg'], ['Hardener', 60, 'kg']]);

    upload();

    assert.equal(rendered(0), '420');
    assert.equal(rendered(1), '60');
  });

  test('a material the catalogue does not have is reported, not silently dropped', () => {
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    sheet([['Material', 'Opening Qty'], ['Resin', 5], ['Unobtainium', 7]]);

    upload();

    assert.equal(rendered(0), '5', 'the known material still imports');
    assert.match(document.getElementById('rmo-status').innerHTML, /Unobtainium/);
    assert.match(document.getElementById('rmo-status').innerHTML, /not in the material catalogue/);
  });

  test('importing into a locked declaration is refused', () => {
    fresh({ rmOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'openRMOpeningStock()');
    sheet([['Material', 'Opening Qty'], ['Resin', 5]]);

    upload();

    assert.match(document.getElementById('rmo-status').innerHTML, /locked/i);
  });
});

describe('the standing notice on the Stock screen', () => {
  test('says so when nothing has been declared', () => {
    fresh();
    call(ctx, 'setRole("owner")');
    call(ctx, 'renderRMOpeningNotice()');

    const el = document.getElementById('rmo-notice');
    assert.equal(el.style.display, 'block');
    assert.match(el.innerHTML, /No raw-material opening stock has been declared/);
  });

  test('distinguishes entered-but-unconfirmed from nothing at all', () => {
    fresh({ rmOpeningQty: { Resin: 5 } });
    call(ctx, 'setRole("owner")');
    call(ctx, 'renderRMOpeningNotice()');

    assert.match(document.getElementById('rmo-notice').innerHTML, /entered but not confirmed/);
  });

  test('is silent once the declaration is locked', () => {
    fresh({ rmOpeningQty: { Resin: 5 },
            rmOpening: { asOfDate: '2026-08-01', locked: true } });
    call(ctx, 'renderRMOpeningNotice()');

    assert.equal(document.getElementById('rmo-notice').style.display, 'none');
  });
});

describe('the declaration is an OPTIONAL read', () => {
  // rm_stock_opening arrives with migration 0010. Between deploying this code
  // and applying that migration the table does not exist. That gap must be
  // uneventful — not a pull that reports failure, because lastPullOk gates
  // removeMissing() and a false there stops deletions propagating at all.
  const bootWith = async (rmOpeningError) => {
    const { bootDb } = await import('./harness.mjs');
    const tables = { rm_stock_opening: [{ material: 'Resin', qty: 400,
                                          as_of_date: '2026-08-01', locked: true }] };
    const query = (table) => {
      const q = {
        _f: [], select: () => q, eq: () => q, order: () => q,
        single: () => Promise.resolve({ data: null, error: { message: 'none' } }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        not: () => q, update: () => q, delete: () => q,
        upsert: (r) => Promise.resolve({ data: r, error: null }),
        then(res) {
          if (table === 'rm_stock_opening' && rmOpeningError) {
            return Promise.resolve({ data: null, error: rmOpeningError }).then(res);
          }
          return Promise.resolve({ data: tables[table] || [], error: null }).then(res);
        },
      };
      return q;
    };
    const { win } = bootDb({ supabase: { createClient: () => ({
      from: query,
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
              signOut: () => Promise.resolve({ error: null }) },
      channel: () => { const ch = { on: () => ch, subscribe: (cb) => { cb && cb('SUBSCRIBED'); return ch; } }; return ch; },
      removeChannel: () => {},
    }) } });
    await win.FactoryDB.init();
    return win.FactoryDB;
  };

  test('a pull still SUCCEEDS when the table does not exist yet', async () => {
    const DB = await bootWith({ code: '42P01', message: 'relation "rm_stock_opening" does not exist' });
    const S = { workDate: '2026-09-01', lab: [], sessions: [], rawLog: [],
                fgTransfers: [], fgStock: {}, rm: [], fg: [], ledger: [], stock: [] };

    await DB.pull(S);

    assert.equal(DB.lastPullOk(), true,
      'a missing optional table must not stop deletions reconciling for everyone');
    assert.equal(DB.lastPullDate(), '2026-09-01');
  });

  test('and the declaration is read when the table IS there', async () => {
    const DB = await bootWith(null);
    const S = { workDate: '2026-09-01', lab: [], sessions: [], rawLog: [],
                fgTransfers: [], fgStock: {}, rm: [], fg: [], ledger: [], stock: [] };

    await DB.pull(S);

    assert.equal(DB.lastPullOk(), true);
    assert.equal(S.rmOpeningQty.Resin, 400);
    assert.equal(S.rmOpening.asOfDate, '2026-08-01');
    assert.equal(S.rmOpening.locked, true);
  });
});
