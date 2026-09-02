// ── FINISHED-GOODS STOCK ──
// getFGBalance() decides what the factory believes it physically has at each
// stage. It nets five sources: opening stock, today's production, historical
// production, stage-to-stage transfers, and manual adjustments.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx } = boot();
const bal = (product, stage) =>
  call(ctx, `getFGBalance(${JSON.stringify(product)}, ${JSON.stringify(stage)})`);

/** A production session shaped the way the Supervisor screen writes it. */
const session = (stage, items) => ({
  supId: 1, supName: 'Karan', supWage: 800, supOT: 0,
  teams: [{ id: 1, stage, workers: [], production: items }],
});
const made = (name, qty) => ({ name, qty, value: qty * 100 });

describe('getFGBalance — production', () => {
  test("counts today's production at the stage it was logged", () => {
    const S = resetState(ctx);
    S.sessions = [session('Moulding', [made('Chair A', 10)])];
    assert.equal(bal('Chair A', 'Moulding'), 10);
  });

  test('does not leak production into a stage it was not logged at', () => {
    const S = resetState(ctx);
    S.sessions = [session('Moulding', [made('Chair A', 10)])];
    assert.equal(bal('Chair A', 'Painting'), 0);
  });

  test('adds historical production from the ledger to today', () => {
    const S = resetState(ctx);
    S.sessions = [session('Moulding', [made('Chair A', 4)])];
    S.ledger = [
      { date: '2026-08-17', sessions: [session('Moulding', [made('Chair A', 6)])] },
      { date: '2026-08-18', sessions: [session('Moulding', [made('Chair A', 5)])] },
    ];
    assert.equal(bal('Chair A', 'Moulding'), 15);
  });

  test('sums across multiple teams and sessions at the same stage', () => {
    const S = resetState(ctx);
    S.sessions = [
      session('Finishing', [made('Chair A', 3), made('Chair A', 2)]),
      session('Finishing', [made('Chair A', 5)]),
    ];
    assert.equal(bal('Chair A', 'Finishing'), 10);
  });

  test('matches on baseName so colour variants roll up to the product', () => {
    // The Supervisor screen logs "Chair A — Red" but stock is kept per product.
    const S = resetState(ctx);
    S.sessions = [session('Painting', [
      { name: 'Chair A — Red',  baseName: 'Chair A', qty: 4, value: 400 },
      { name: 'Chair A — Blue', baseName: 'Chair A', qty: 6, value: 600 },
    ])];
    assert.equal(bal('Chair A', 'Painting'), 10);
  });

  test('keeps different products apart', () => {
    const S = resetState(ctx);
    S.sessions = [session('Moulding', [made('Chair A', 10), made('Table B', 3)])];
    assert.equal(bal('Chair A', 'Moulding'), 10);
    assert.equal(bal('Table B', 'Moulding'), 3);
  });
});

describe('getFGBalance — transfers', () => {
  test('a stage-to-stage move debits the source and credits the target', () => {
    const S = resetState(ctx);
    S.sessions = [session('Moulding', [made('Chair A', 10)])];
    S.fgTransfers = [{ id: 1, product: 'Chair A', from: 'Moulding', to: 'Finishing', qty: 4 }];
    assert.equal(bal('Chair A', 'Moulding'), 6);
    assert.equal(bal('Chair A', 'Finishing'), 4);
  });

  test('a dispatch leaves the factory: stock drops and comes back nowhere', () => {
    const S = resetState(ctx);
    S.sessions = [session('Packing', [made('Chair A', 10)])];
    S.fgTransfers = [{ id: 1, product: 'Chair A', from: 'Packing', to: 'Dispatch', qty: 4 }];

    assert.equal(bal('Chair A', 'Packing'), 6);
    // Dispatch is an exit, not a stock-bearing stage — the FG screen only ever
    // queries the four real stages, so the goods are simply gone from stock.
    const inFactory = ['Moulding', 'Finishing', 'Painting', 'Packing']
      .reduce((a, s) => a + bal('Chair A', s), 0);
    assert.equal(inFactory, 6);
  });

  test('an inbound move from outside the four stages is not credited', () => {
    // Guards against Unit2/external sources inflating stock without a matching
    // debit anywhere, which would create goods out of nothing.
    const S = resetState(ctx);
    S.fgTransfers = [{ id: 1, product: 'Chair A', from: 'Unit2', to: 'Packing', qty: 50 }];
    assert.equal(bal('Chair A', 'Packing'), 0);
  });

  test('chained moves settle correctly across all four stages', () => {
    const S = resetState(ctx);
    S.sessions = [session('Moulding', [made('Chair A', 20)])];
    S.fgTransfers = [
      { id: 1, product: 'Chair A', from: 'Moulding',  to: 'Finishing', qty: 15 },
      { id: 2, product: 'Chair A', from: 'Finishing', to: 'Painting',  qty: 10 },
      { id: 3, product: 'Chair A', from: 'Painting',  to: 'Packing',   qty: 7 },
    ];
    assert.equal(bal('Chair A', 'Moulding'),  5);
    assert.equal(bal('Chair A', 'Finishing'), 5);
    assert.equal(bal('Chair A', 'Painting'),  3);
    assert.equal(bal('Chair A', 'Packing'),   7);

    const total = ['Moulding', 'Finishing', 'Painting', 'Packing']
      .reduce((a, s) => a + bal('Chair A', s), 0);
    assert.equal(total, 20, 'moving stock between stages must conserve it');
  });
});

describe('getFGBalance — adjustments and floors', () => {
  test('a positive adjustment adds and a negative one removes', () => {
    const S = resetState(ctx);
    S.sessions = [session('Packing', [made('Chair A', 10)])];
    S.fgAdjustments = [
      { id: 1, product: 'Chair A', stage: 'Packing', qty: 5 },
      { id: 2, product: 'Chair A', stage: 'Packing', qty: -3 },
    ];
    assert.equal(bal('Chair A', 'Packing'), 12);
  });

  test('never reports negative stock', () => {
    // Over-transferring is a data-entry error; the screen must not show -4.
    const S = resetState(ctx);
    S.sessions = [session('Packing', [made('Chair A', 2)])];
    S.fgTransfers = [{ id: 1, product: 'Chair A', from: 'Packing', to: 'Dispatch', qty: 6 }];
    assert.equal(bal('Chair A', 'Packing'), 0);
  });

  test('opening stock is read from S.fgStock[stage][product]', () => {
    // This is the axis app.js uses everywhere, and the one the Supabase row
    // mappers now agree with. See the end-to-end suite at the bottom of this
    // file for the row -> state -> balance path.
    const S = resetState(ctx);
    S.fgStock = { Packing: { 'Chair A': 25 } };
    assert.equal(bal('Chair A', 'Packing'), 25);
  });

  test('opening stock nets against transfers out', () => {
    const S = resetState(ctx);
    S.fgStock = { Packing: { 'Chair A': 25 } };
    S.fgTransfers = [{ id: 1, product: 'Chair A', from: 'Packing', to: 'Dispatch', qty: 5 }];
    assert.equal(bal('Chair A', 'Packing'), 20);
  });

  test('an empty factory reports 0 everywhere, and does not throw', () => {
    resetState(ctx);
    for (const s of ['Moulding', 'Finishing', 'Painting', 'Packing']) {
      assert.equal(bal('Anything', s), 0);
    }
  });

  test('survives a missing fgStock map', () => {
    const S = resetState(ctx);
    delete S.fgStock;
    assert.equal(bal('Chair A', 'Packing'), 0);
  });
});

// ── END TO END: POSTGRES ROW -> STATE -> BALANCE ──
// The fg_stock column swap was invisible to unit tests on either side alone,
// because the two mappers cancelled out. This closes the loop: a row as it
// actually sits in Postgres must reach getFGBalance() as opening stock for the
// right product at the right stage.
describe('fg_stock rows reach getFGBalance with the right orientation', () => {
  const fakeSupabase = (rows) => ({
    createClient: () => ({
      from: (table) => {
        const q = {
          select: () => q, eq: () => q, order: () => q,
          single: () => Promise.resolve({ data: null, error: { message: 'none' } }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        not() { return this; }, update() { return this; }, delete() { return this; },
          then: (res) => Promise.resolve({ data: table === 'fg_stock' ? rows : [], error: null }).then(res),
          upsert: () => Promise.resolve({ data: null, error: null }),
        };
        return q;
      },
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      channel: () => { const ch = { on: () => ch, subscribe: () => ch }; return ch; },
      removeChannel: () => {},
    }),
  });

  test('opening stock lands under its stage, not under its product name', async () => {
    const h = boot({ supabase: fakeSupabase([{ product: 'Chair A', stage: 'Packing', qty: 25 }]) });
    await h.win.FactoryDB.init();

    const S = resetState(h.ctx, { workDate: '2026-08-19' });
    await h.win.FactoryDB.pull(S);

    assert.deepEqual(JSON.parse(JSON.stringify(S.fgStock)), { Packing: { 'Chair A': 25 } });

    const bal2 = (p, s) => call(h.ctx, `getFGBalance(${JSON.stringify(p)}, ${JSON.stringify(s)})`);
    assert.equal(bal2('Chair A', 'Packing'), 25, 'the balance screen must see the pulled stock');
    assert.equal(bal2('Packing', 'Chair A'), 0, 'and must not see it under the swapped key');
  });

  test('a full push/pull cycle preserves what the balance screen reports', async () => {
    const h = boot({ supabase: fakeSupabase([]) });
    await h.win.FactoryDB.init();

    const S = resetState(h.ctx, { workDate: '2026-08-19' });
    S.fgStock = { Moulding: { 'Chair A': 8 }, Packing: { 'Chair A': 3, 'Table B': 5 } };
    const before = ['Moulding', 'Packing'].map(st =>
      ['Chair A', 'Table B'].map(p => call(h.ctx, `getFGBalance(${JSON.stringify(p)}, ${JSON.stringify(st)})`)));

    // Round trip the state through the row mappers. Opening stock goes out
    // through saveOpeningStock() — push() no longer writes fg_stock, because a
    // stale device re-pushing it could overwrite the owner's declaration.
    const rows = [];
    const h2 = boot({ supabase: {
      createClient: () => ({
        from: () => ({ select: () => ({ eq: () => ({ order: () => ({ then: (r) => Promise.resolve({ data: [], error: null }).then(r) }) }) }),
                       delete() { return this; }, update() { return this; },
                       not: () => Promise.resolve({ data: [], error: null }),
                       upsert: (rs) => { rows.push(...rs); return Promise.resolve({ data: rs, error: null }); } }),
        auth: { getSession: () => Promise.resolve({ data: { session: null } }), signOut: () => Promise.resolve({}) },
        channel: () => { const ch = { on: () => ch, subscribe: () => ch }; return ch; },
        removeChannel: () => {},
      }),
    } });
    await h2.win.FactoryDB.init();
    await h2.win.FactoryDB.saveOpeningStock(JSON.parse(JSON.stringify(S.fgStock)), '2026-08-01', false);

    const h3 = boot({ supabase: fakeSupabase(rows.filter(r => r.product && r.stage)) });
    await h3.win.FactoryDB.init();
    const S3 = resetState(h3.ctx, { workDate: '2026-08-19' });
    await h3.win.FactoryDB.pull(S3);

    const after = ['Moulding', 'Packing'].map(st =>
      ['Chair A', 'Table B'].map(p => call(h3.ctx, `getFGBalance(${JSON.stringify(p)}, ${JSON.stringify(st)})`)));

    assert.deepEqual(after, before);
    assert.deepEqual(after, [[8, 0], [3, 5]]);
  });
});

describe('getFGBalance — a day that is both open and closed', () => {
  // S.sessions and the ledger entry for S.workDate describe the SAME
  // production whenever a closed day is open for editing. Counting both adds
  // that day's output to stock twice. computeSalaryMonth() guarded against
  // this from the start; this function did not.
  test('the open day is counted once, not once per source', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session('Moulding', [made('Chair', 10)])];
    S.ledger = [{ date: '2026-08-19', sessions: [session('Moulding', [made('Chair', 10)])] }];

    assert.equal(bal('Chair', 'Moulding'), 10,
      'ten chairs were made, not twenty');
  });

  test('other closed days still count', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session('Moulding', [made('Chair', 10)])];
    S.ledger = [
      { date: '2026-08-19', sessions: [session('Moulding', [made('Chair', 10)])] },
      { date: '2026-08-18', sessions: [session('Moulding', [made('Chair', 4)])] },
    ];

    assert.equal(bal('Chair', 'Moulding'), 14);
  });
});

describe('getFGBalance — production and transfers span the same period', () => {
  test('a transfer out from an earlier day still reduces the balance', () => {
    // The formula nets all-time production against S.fgTransfers. pull() used
    // to fetch only the open day's transfers, so this subtraction silently
    // dropped every earlier movement and stage stock inflated day after day.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.ledger = [{ date: '2026-08-18', sessions: [session('Moulding', [made('Chair', 10)])] }];
    S.fgTransfers = [
      { id: 1, date: '2026-08-18', product: 'Chair', from: 'Moulding', to: 'Finishing', qty: 6 },
    ];

    assert.equal(bal('Chair', 'Moulding'), 4, '10 made, 6 moved on');
    assert.equal(bal('Chair', 'Finishing'), 6, 'and they arrived at the next stage');
  });
});
