// ── TWO DATA-LAYER REGRESSIONS ──
//
// 1. fg_transfers kept only id/date/product/from/to/qty, so the automatic
//    transfer made by logging production lost its `auto` flag on the next pull
//    and the stage it moved INTO counted the goods twice (10 became 20).
//
// 2. PostgREST returns at most 1000 rows per request. pull() read whole tables
//    with one request, so past 1000 rows it silently dropped the rest — and
//    day_ledger is ordered oldest-first, so the NEWEST days were the ones lost.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const MAX = 1000;   // what PostgREST allows per response

function fakeSupabase({ tables = {}, noXferCols = false, role = 'owner' } = {}) {
  const writes = [];
  const requests = [];     // [table, from, to] for every ranged read
  const query = (table) => {
    const q = {
      _f: [], _cols: '', _range: null,
      select(c) { q._cols = c || ''; return q; },
      eq(c, v) { q._f.push([c, v]); return q; },
      order() { return q; },
      limit() { return q; },
      range(a, b) {
        requests.push([table, a, b]);
        const rows = (tables[table] || []).filter(r => q._f.every(([c, v]) => r[c] === v));
        // A real server never returns more than MAX rows, whatever was asked.
        return Promise.resolve({ data: rows.slice(a, Math.min(b + 1, a + MAX)), error: null });
      },
      maybeSingle() {
        if (table === 'app_users') return Promise.resolve({ data: { role, name: 'T', active: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      single() { return q.maybeSingle(); },
      not() { return q; }, update() { return q; }, delete() { return q; },
      upsert(rows, opts) { writes.push({ table, rows, opts }); return Promise.resolve({ data: rows, error: null }); },
      then(res) {
        if (table === 'fg_transfers' && noXferCols && /auto/.test(q._cols)) {
          return Promise.resolve({ data: null, error: { code: '42703', message: 'column fg_transfers.auto does not exist' } }).then(res);
        }
        // An un-ranged read is truncated at MAX, exactly like the real thing.
        const rows = (tables[table] || []).filter(r => q._f.every(([c, v]) => r[c] === v));
        return Promise.resolve({ data: rows.slice(0, MAX), error: null }).then(res);
      },
    };
    return q;
  };
  return {
    _writes: writes, _requests: requests,
    createClient: () => ({
      from: query,
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
        signInWithPassword: () => Promise.resolve({ data: { user: { id: 'u1' } }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      channel: () => { const ch = { on: () => ch, subscribe: () => ch }; return ch; },
      removeChannel: () => {},
    }),
  };
}

const plain = (v) => JSON.parse(JSON.stringify(v));

describe('an automatic transfer survives a round trip through the database', () => {
  const day = '2026-10-16';
  const sessions = [{
    supId: 1, supName: 'Karan', supWage: 0, supOT: 0,
    teams: [
      { teamId: 1, stage: 'Moulding',  team: [], production: [{ name: 'Chair A', qty: 10, value: 1000, stage: 'Moulding' }] },
      { teamId: 2, stage: 'Finishing', team: [], production: [{ name: 'Chair A', qty: 10, value: 1000, stage: 'Finishing' }] },
    ],
  }];
  const auto = { id: 77, date: day, from: 'Moulding', to: 'Finishing', product: 'Chair A',
                 productOut: 'Chair A', productIn: 'Chair A', qty: 10, auto: true,
                 note: 'Auto — Karan (Team 2)' };

  async function roundTrip(opts) {
    const sb = fakeSupabase(opts);
    const h = boot({ supabase: sb });
    const DB = h.win.FactoryDB;
    await DB.init();

    const S = { workDate: day, lab: [], rm: [], fg: [], sessions: [], rawLog: [], fgStock: {}, ledger: [],
                fgTransfers: [], orders: [], dispatches: [], salaryAdj: {}, bom: {}, unitTransfers: [],
                stock: [], purchases: [], fgAdjustments: [], orderReservations: [] };
    await DB.pull(S);                     // learns whether the columns exist
    S.fgTransfers = [auto];
    await DB.push(S, 'owner');
    const row = sb._writes.filter(w => w.table === 'fg_transfers').flatMap(w => w.rows)[0];

    // What Postgres would now hold, read back on a fresh device.
    const back = { workDate: day, lab: [], rm: [], fg: [], sessions: [], rawLog: [], fgStock: {}, ledger: [], fgTransfers: [] };
    const sb2 = fakeSupabase({ tables: { fg_transfers: [{ ...row }] } });
    const h2 = boot({ supabase: sb2 });
    await h2.win.FactoryDB.init();
    await h2.win.FactoryDB.pull(back);
    return { row, back, h2 };
  }

  test('with migration 0016 applied, the flag and names are stored and restored', async () => {
    const { row, back, h2 } = await roundTrip({});
    assert.equal(row.auto, true);
    assert.equal(row.product_in, 'Chair A');
    assert.equal(row.note, 'Auto — Karan (Team 2)');
    const t = plain(back.fgTransfers)[0];
    assert.equal(t.auto, true);
    assert.equal(t.productIn, 'Chair A');

    resetState(h2.ctx, { workDate: day, sessions: plain(sessions), fgTransfers: plain(back.fgTransfers) });
    const finishing = call(h2.ctx, `getFGBalance("Chair A", "Finishing")`);
    assert.equal(finishing, 10, 'made 10 in Finishing — must not become 20 after a sync');
    assert.equal(call(h2.ctx, `getFGBalance("Chair A", "Moulding")`), 0);
  });

  test('before the migration, nothing new is written, so no write can be rejected', async () => {
    const { row } = await roundTrip({ noXferCols: true });
    for (const col of ['auto', 'product_in', 'product_out', 'colour', 'note', 'order_id']) {
      assert.equal(col in row, false, col + ' must not be sent to a database that lacks it');
    }
    assert.equal(row.product, 'Chair A');
  });
});

describe('tables larger than the 1000-row response cap are read in full', () => {
  const ledger = Array.from({ length: 1234 }, (_, i) => {
    const d = new Date(Date.UTC(2023, 0, 1 + i)).toISOString().slice(0, 10);
    return { work_date: d, payload: { goodsValue: i } };
  });
  const transfers = Array.from({ length: 2350 }, (_, i) => ({
    id: i + 1, work_date: '2026-10-01', product: 'P' + (i % 9), from_stage: 'Moulding', to_stage: 'Finishing', qty: 1,
  }));

  test('the newest closed day is not cut off', async () => {
    const sb = fakeSupabase({ tables: { day_ledger: ledger, fg_transfers: transfers } });
    const h = boot({ supabase: sb });
    await h.win.FactoryDB.init();
    const S = { workDate: '2026-10-16', lab: [], rm: [], fg: [], sessions: [], rawLog: [], fgStock: {}, ledger: [], fgTransfers: [] };
    await h.win.FactoryDB.pull(S);

    assert.equal(S.ledger.length, 1234, 'every closed day');
    assert.equal(S.ledger[S.ledger.length - 1].date, ledger[1233].work_date, 'the newest day is present');
    assert.equal(S.fgTransfers.length, 2350, 'every transfer');
  });

  test('reads are paged, and a short page ends the loop', async () => {
    const sb = fakeSupabase({ tables: { day_ledger: ledger } });
    const h = boot({ supabase: sb });
    await h.win.FactoryDB.init();
    await h.win.FactoryDB.pull({ workDate: '2026-10-16', lab: [], rm: [], fg: [], sessions: [], rawLog: [], fgStock: {}, ledger: [], fgTransfers: [] });
    const pages = [...new Set(sb._requests.filter(r => r[0] === 'day_ledger').map(r => r[1] + '-' + r[2]))];
    assert.deepEqual(pages, ['0-999', '1000-1999']);
  });
});
