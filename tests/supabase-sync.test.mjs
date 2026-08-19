// ── SUPABASE DATA LAYER ──
// Drives FactoryDB against a fake supabase-js client so we can assert exactly
// what rows would hit Postgres, and what comes back out, without a network.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, bootDb } from './harness.mjs';

// ── FAKE SUPABASE CLIENT ────────────────────────────────────────────
function fakeSupabase({ tables = {}, failOn = [], user = null, role = 'owner' } = {}) {
  const writes = [];          // every upsert that reached "Postgres"

  const query = (table) => {
    const q = {
      _filters: [],
      select() { return q; },
      eq(col, val) { q._filters.push([col, val]); return q; },
      order() { return q; },
      single() {
        const rows = tables[table] || [];
        const row = rows.find(r => q._filters.every(([c, v]) => r[c] === v));
        return Promise.resolve(row ? { data: row, error: null }
                                   : { data: null, error: { message: 'not found' } });
      },
      then(res) {           // awaiting the builder runs the select
        const rows = (tables[table] || [])
          .filter(r => q._filters.every(([c, v]) => r[c] === v));
        return Promise.resolve({ data: rows, error: null }).then(res);
      },
      upsert(rows, opts) {
        writes.push({ table, rows, opts });
        if (failOn.includes(table)) {
          return Promise.resolve({ data: null, error: { message: 'RLS denied' } });
        }
        return Promise.resolve({ data: rows, error: null });
      },
    };
    return q;
  };

  return {
    _writes: writes,
    createClient: () => ({
      from: query,
      auth: {
        getSession: () => Promise.resolve({ data: { session: user ? { user } : null } }),
        signInWithPassword: ({ email }) =>
          email === 'bad@x.com'
            ? Promise.resolve({ data: null, error: { message: 'Invalid login credentials' } })
            : Promise.resolve({ data: { user: { id: 'u1', email } }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      channel: () => {
        const ch = { on: () => ch, subscribe: (cb) => { cb && cb('SUBSCRIBED'); return ch; } };
        return ch;
      },
      removeChannel: () => {},
    }),
  };
}

const bootDB = (opts = {}) => {
  const sb = fakeSupabase(opts);
  const h = bootDb({ supabase: sb, onLine: opts.onLine !== false, localStorageSeed: opts.seed || {} });
  return { ...h, sb, DB: h.win.FactoryDB };
};

const rowsFor = (sb, table) => sb._writes.filter(w => w.table === table).flatMap(w => w.rows);

// Objects built inside the vm have a different Object.prototype, so
// assert.deepEqual would reject them as "not reference-equal". Compare values.
const plain = (v) => JSON.parse(JSON.stringify(v));
const sameShape = (actual, expected, msg) => assert.deepEqual(plain(actual), expected, msg);

describe('FactoryDB.init', () => {
  test('fails cleanly when the supabase-js CDN script did not load', async () => {
    const h = bootDb();  // no `supabase` global at all
    assert.equal(await h.win.FactoryDB.init(), false);
    assert.equal(h.win.FactoryDB.isReady(), false);
    assert.match(String(h.logs.error[0]?.[0] ?? ''), /supabase-js not loaded/);
  });

  test('reports ready once the client is constructed', async () => {
    const { DB } = bootDB();
    assert.equal(await DB.init(), true);
    assert.equal(DB.isReady(), true);
  });
});

describe('FactoryDB.signIn — roles come from Postgres, not the browser', () => {
  test('resolves the role from app_users on success', async () => {
    const { DB } = bootDB({ tables: { app_users: [{ id: 'u1', role: 'supervisor', name: 'Karan', active: true }] } });
    await DB.init();
    const r = await DB.signIn('karan@x.com', 'pw');
    assert.equal(r.ok, true);
    assert.equal(r.role, 'supervisor');
    assert.equal(DB.role(), 'supervisor');
  });

  test('rejects a deactivated account even though the password was right', async () => {
    const { DB } = bootDB({ tables: { app_users: [{ id: 'u1', role: 'owner', name: 'A', active: false }] } });
    await DB.init();
    const r = await DB.signIn('a@x.com', 'pw');
    assert.equal(r.ok, false);
    assert.match(r.message, /not active/i);
    assert.equal(DB.role(), null, 'a rejected sign-in must not leave a role behind');
  });

  test('rejects an authenticated user with no app_users row', async () => {
    const { DB } = bootDB({ tables: { app_users: [] } });
    await DB.init();
    const r = await DB.signIn('ghost@x.com', 'pw');
    assert.equal(r.ok, false);
    assert.equal(DB.role(), null);
  });

  test('surfaces the auth error verbatim on bad credentials', async () => {
    const { DB } = bootDB();
    await DB.init();
    const r = await DB.signIn('bad@x.com', 'pw');
    assert.equal(r.ok, false);
    assert.match(r.message, /Invalid login/);
  });
});

describe('FactoryDB.push — role decides what may be written', () => {
  const S = () => ({
    workDate: '2026-08-19',
    lab: [{ id: 1, name: 'Ramesh', role: 'Floor worker', wage: 400, isSup: false, present: true, doingOT: true, otHours: 2 }],
    rm: [{ id: 5, name: 'FRP Resin', unit: 'kg', price: 220 }],
    fg: [{ id: 9, name: 'Chair A', price: 5000 }],
    sessions: [{ supId: 1, supName: 'Karan', supWage: 800, supOT: 0, teams: [{ stage: 'Moulding', production: [] }] }],
    rawLog: [{ id: 77, stage: 'Moulding', name: 'FRP Resin', unit: 'kg', qty: 3, unitPrice: 220, cost: 660 }],
    fgTransfers: [], fgStock: {}, orders: [{ id: 1 }], bom: {}, dispatches: [],
    salaryAdj: {}, unitTransfers: [], orderReservations: [], stock: [], purchases: [], fgAdjustments: [],
  });

  test('owner writes catalogues before the rows that reference them', async () => {
    // attendance.worker_id and production_sessions.sup_id are FKs into
    // workers(id). Catalogue-last would fail with 23503 on a fresh database.
    const { DB, sb } = bootDB();
    await DB.init();
    await DB.push(S(), 'owner');

    const order = sb._writes.map(w => w.table);
    assert.ok(order.indexOf('workers') < order.indexOf('attendance'),
      `workers must precede attendance, got ${order.join(' -> ')}`);
    assert.ok(order.indexOf('workers') < order.indexOf('production_sessions'));
  });

  test('a supervisor never writes the catalogues or owner documents', async () => {
    const { DB, sb } = bootDB();
    await DB.init();
    await DB.push(S(), 'supervisor');

    const tables = new Set(sb._writes.map(w => w.table));
    for (const forbidden of ['workers', 'rm_catalogue', 'fg_catalogue', 'factory_doc']) {
      assert.equal(tables.has(forbidden), false, `supervisor must not write ${forbidden}`);
    }
    assert.equal(tables.has('attendance'), true);
    assert.equal(tables.has('production_sessions'), true);
  });

  test('an RM supervisor writes only raw material movement', async () => {
    const { DB, sb } = bootDB();
    await DB.init();
    await DB.push(S(), 'rm');

    const tables = new Set(sb._writes.map(w => w.table));
    assert.deepEqual([...tables].sort(), ['raw_log']);
    assert.equal(tables.has('attendance'), false, 'RM role must not touch attendance');
    assert.equal(tables.has('workers'), false, 'RM role must not touch the worker catalogue');
  });

  test('attendance rows carry the work date and conflict on (date, worker)', async () => {
    const { DB, sb } = bootDB();
    await DB.init();
    await DB.push(S(), 'supervisor');

    const w = sb._writes.find(x => x.table === 'attendance');
    assert.equal(w.opts.onConflict, 'work_date,worker_id');
    sameShape(w.rows[0], {
      work_date: '2026-08-19', worker_id: 1,
      present: true, doing_ot: true, ot_hours: 2, marked_by: null,
    });
  });

  test('numeric fields are coerced, so a blank input never lands as NaN', async () => {
    const { DB, sb } = bootDB();
    await DB.init();
    const s = S();
    s.lab[0].wage = '';
    s.lab[0].otHours = undefined;
    s.rawLog[0].qty = null;
    await DB.push(s, 'owner');

    assert.equal(rowsFor(sb, 'workers')[0].wage, 0);
    assert.equal(rowsFor(sb, 'attendance')[0].ot_hours, 0);
    assert.equal(rowsFor(sb, 'raw_log')[0].qty, 0);
  });

  test('does nothing at all before init', async () => {
    const { win, sb } = bootDB();
    await win.FactoryDB.push(S(), 'owner');   // init never called
    assert.equal(sb._writes.length, 0);
  });

  test('an RM supervisor does write FG movement when there is any', async () => {
    const { DB, sb } = bootDB();
    await DB.init();
    const s = S();
    s.fgTransfers = [{ id: 3, product: 'Chair A', from: 'Moulding', to: 'Finishing', qty: 4 }];
    s.fgStock = { Packing: { 'Chair A': 12 } };
    await DB.push(s, 'rm');

    const tables = new Set(sb._writes.map(w => w.table));
    assert.deepEqual([...tables].sort(), ['fg_stock', 'fg_transfers', 'raw_log']);
    sameShape(rowsFor(sb, 'fg_transfers')[0], {
      id: 3, work_date: '2026-08-19', product: 'Chair A',
      from_stage: 'Moulding', to_stage: 'Finishing', qty: 4, logged_by: null,
    });
  });
});

describe('FactoryDB — offline outbox', () => {
  test('parks a write while offline instead of losing it', async () => {
    const { DB, localStorage } = bootDB({ onLine: false });
    await DB.init();
    await DB.push({ workDate: '2026-08-19', lab: [{ id: 1, name: 'R', wage: 400 }] }, 'supervisor');

    assert.ok(DB.pendingWrites() > 0, 'offline writes must be queued');
    const q = JSON.parse(localStorage.getItem('_sb_outbox'));
    assert.ok(q.every(op => typeof op._queuedAt === 'number'), 'queued ops are timestamped');
  });

  test('queues a write the server rejected, rather than dropping it', async () => {
    const { DB } = bootDB({ failOn: ['attendance'] });
    await DB.init();
    await DB.push({ workDate: '2026-08-19', lab: [{ id: 1, name: 'R', wage: 400 }], sessions: [] }, 'supervisor');
    assert.ok(DB.pendingWrites() > 0);
  });

  test('replays the queue on reconnect and empties it', async () => {
    const seed = { _sb_outbox: JSON.stringify([
      { table: 'raw_log', rows: [{ id: 1, qty: 5 }], opts: { onConflict: 'id' }, _queuedAt: 1 },
      { table: 'attendance', rows: [{ work_date: '2026-08-19', worker_id: 1 }], opts: {}, _queuedAt: 2 },
    ]) };
    const { DB, sb } = bootDB({ seed });
    await DB.init();
    assert.equal(DB.pendingWrites(), 2);

    assert.equal(await DB.flushOutbox(), true);
    assert.equal(DB.pendingWrites(), 0);
    assert.deepEqual(sb._writes.map(w => w.table), ['raw_log', 'attendance']);
  });

  test('keeps the ops that still fail and clears the ones that landed', async () => {
    const seed = { _sb_outbox: JSON.stringify([
      { table: 'raw_log', rows: [{ id: 1 }], _queuedAt: 1 },
      { table: 'attendance', rows: [{ worker_id: 1 }], _queuedAt: 2 },
    ]) };
    const { DB } = bootDB({ seed, failOn: ['attendance'] });
    await DB.init();
    await DB.flushOutbox();
    assert.equal(DB.pendingWrites(), 1, 'the failing op stays queued for the next retry');
  });

  test('does not flush while offline', async () => {
    const seed = { _sb_outbox: JSON.stringify([{ table: 'raw_log', rows: [{ id: 1 }], _queuedAt: 1 }]) };
    const { DB, sb } = bootDB({ seed, onLine: false });
    await DB.init();
    await DB.flushOutbox();
    assert.equal(sb._writes.length, 0);
    assert.equal(DB.pendingWrites(), 1);
  });

  test('an empty write is a no-op, not a queued empty batch', async () => {
    const { DB, sb } = bootDB({ onLine: false });
    await DB.init();
    await DB.push({ workDate: '2026-08-19', lab: [], sessions: [], rawLog: [], fgTransfers: [], fgStock: {} }, 'supervisor');
    assert.equal(DB.pendingWrites(), 0);
    assert.equal(sb._writes.length, 0);
  });
});

describe('FactoryDB.pull — first-run guard', () => {
  const localData = () => ({
    workDate: '2026-08-19',
    lab: [{ id: 1, name: 'Ramesh', wage: 400 }],
    rm:  [{ id: 5, name: 'FRP Resin', unit: 'kg', price: 220 }],
    fg:  [{ id: 9, name: 'Chair A', price: 5000 }],
    sessions: [], rawLog: [], fgTransfers: [], fgStock: {}, ledger: [],
  });

  test('an empty remote catalogue never wipes a populated local one', async () => {
    // This is the migration-safety guard: on a fresh database every catalogue
    // query returns [], and adopting that would destroy the data being migrated.
    const { DB } = bootDB({ tables: {} });
    await DB.init();
    const S = localData();
    await DB.pull(S);

    assert.equal(S.lab.length, 1, 'local workers must survive an empty remote');
    assert.equal(S.rm.length, 1);
    assert.equal(S.fg.length, 1);
  });

  test('a populated remote catalogue does replace local', async () => {
    const { DB } = bootDB({ tables: {
      workers: [{ id: 2, name: 'Karan', role: 'Supervisor', wage: 800, is_supervisor: true, active: true }],
      rm_catalogue: [{ id: 6, name: 'Gelcoat', unit: 'kg', price: 310 }],
      fg_catalogue: [{ id: 10, name: 'Table B', price: 3000 }],
    } });
    await DB.init();
    const S = localData();
    await DB.pull(S);

    assert.deepEqual(S.lab.map(l => l.name), ['Karan']);
    assert.equal(S.lab[0].isSup, true);
    assert.deepEqual(S.rm.map(r => r.name), ['Gelcoat']);
    assert.deepEqual(S.fg.map(f => f.name), ['Table B']);
  });

  test('merges attendance onto the worker roster for the work date', async () => {
    const { DB } = bootDB({ tables: {
      workers: [{ id: 1, name: 'Ramesh', role: 'Floor worker', wage: 400, active: true }],
      attendance: [{ work_date: '2026-08-19', worker_id: 1, present: true, doing_ot: true, ot_hours: 3 }],
    } });
    await DB.init();
    const S = localData();
    await DB.pull(S);

    assert.equal(S.lab[0].present, true);
    assert.equal(S.lab[0].doingOT, true);
    assert.equal(S.lab[0].otHours, 3);
  });

  test('a worker with no attendance row defaults to absent, not undefined', async () => {
    const { DB } = bootDB({ tables: {
      workers: [{ id: 1, name: 'Ramesh', wage: 400, active: true }],
      attendance: [],
    } });
    await DB.init();
    const S = localData();
    await DB.pull(S);

    assert.equal(S.lab[0].present, false);
    assert.equal(S.lab[0].doingOT, false);
    assert.equal(S.lab[0].otHours, 0);
  });

  test('owner-only documents are left alone when RLS returns nothing', async () => {
    // A supervisor pulling must not have their local orders clobbered with {}.
    const { DB } = bootDB({ tables: { factory_doc: [] } });
    await DB.init();
    const S = Object.assign(localData(), { orders: [{ id: 1, customer: 'Acme' }] });
    await DB.pull(S);
    sameShape(S.orders, [{ id: 1, customer: 'Acme' }]);
  });

  test('maps factory_doc keys onto their state fields', async () => {
    const { DB } = bootDB({ tables: { factory_doc: [
      { key: 'orders', data: [{ id: 7 }] },
      { key: 'salary_adj', data: { '2026-08': {} } },
      { key: 'rm_stock', data: [{ id: 1, opening: 50 }] },
    ] } });
    await DB.init();
    const S = localData();
    await DB.pull(S);

    sameShape(S.orders, [{ id: 7 }]);
    sameShape(S.salaryAdj, { '2026-08': {} });
    sameShape(S.stock, [{ id: 1, opening: 50 }]);
  });

  test('rebuilds the day ledger with its date attached', async () => {
    const { DB } = bootDB({ tables: { day_ledger: [
      { work_date: '2026-08-18', payload: { goods: 5000, rmCost: 1200 } },
    ] } });
    await DB.init();
    const S = localData();
    await DB.pull(S);

    sameShape(S.ledger, [{ date: '2026-08-18', goods: 5000, rmCost: 1200 }]);
  });

  test('returns the state untouched before init', async () => {
    const { win } = bootDB();
    const S = localData();
    assert.equal(await win.FactoryDB.pull(S), S);
    assert.equal(S.lab.length, 1);
  });
});

describe('FactoryDB — fg_stock column mapping', () => {
  // app.js reads opening stock as S.fgStock[STAGE][PRODUCT] — see
  // getFGBalance() at src/js/app.js:3544 and the dashboard at :1633.
  test('writes the product into product and the stage into stage', async () => {
    const { DB, sb } = bootDB();
    await DB.init();
    await DB.push({
      workDate: '2026-08-19',
      fgStock: { Packing: { 'Chair A': 12 } },   // [stage][product], as app.js builds it
      lab: [], sessions: [], rawLog: [], fgTransfers: [],
    }, 'rm');

    const row = rowsFor(sb, 'fg_stock')[0];
    sameShape(row, { product: 'Chair A', stage: 'Packing', qty: 12 });
  });

  test('survives a full round trip through Postgres unchanged', async () => {
    // The old defect was invisible to the app precisely because it round
    // tripped: both mappers inverted the same way and cancelled out. So a
    // passing round trip alone proves nothing — the row assertion above is
    // what pins the orientation. This checks the pair still composes.
    const { DB, sb } = bootDB();
    await DB.init();
    await DB.push({
      workDate: '2026-08-19', fgStock: { Packing: { 'Chair A': 12 } },
      lab: [], sessions: [], rawLog: [], fgTransfers: [],
    }, 'rm');

    const stored = rowsFor(sb, 'fg_stock');
    sameShape(stored, [{ product: 'Chair A', stage: 'Packing', qty: 12 }]);

    const back = bootDB({ tables: { fg_stock: stored } });
    await back.DB.init();
    const S = { workDate: '2026-08-19', lab: [], rm: [], fg: [], sessions: [], rawLog: [], fgTransfers: [], fgStock: {}, ledger: [] };
    await back.DB.pull(S);
    sameShape(S.fgStock, { Packing: { 'Chair A': 12 } }, 'round trip is lossless despite the swap');
  });
});
