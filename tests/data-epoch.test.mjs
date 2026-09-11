// ── DATA EPOCH ──
// Clearing data in Postgres used not to reach the floor. Every device mirrors
// the whole state in localStorage, and pull() keeps its local rows whenever
// the server looks empty — the guard that stops a half-loaded phone wiping the
// factory. So a device kept showing figures that had been deleted, and an
// owner device pushed them all back on the next edit.
//
// Nothing can reach into another browser's storage, so the device has to be
// told to let go: one timestamp in `data_epoch`, bumped by the owner, and each
// device drops its cache and reloads onto whatever Postgres holds.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, bootDb, getState, call } from './harness.mjs';

const EPOCH = '2026-09-11T16:00:00.000Z';
const STATE_KEYS = ['frp_factory_v5', '_sessions_backup_', '_sb_outbox', '_att_dirty'];

/** A fake supabase whose data_epoch table holds whatever the test wants. */
function fakeSupabase({ epoch = EPOCH, error = null, missing = false } = {}) {
  const query = (table) => {
    const q = {
      _f: [],
      select() { return q; },
      eq(c, v) { q._f.push([c, v]); return q; },
      order() { return q; },
      maybeSingle() {
        if (error) return Promise.resolve({ data: null, error: { message: error } });
        if (table !== 'data_epoch' || missing) return Promise.resolve({ data: null, error: null });
        return Promise.resolve({ data: { epoch }, error: null });
      },
      single() { return q.maybeSingle(); },
      not() { return q; }, update() { return q; }, delete() { return q; },
      upsert(rows) { return Promise.resolve({ data: rows, error: null }); },
      then(res) { return Promise.resolve({ data: [], error: null }).then(res); },
    };
    return q;
  };
  return {
    createClient: () => ({
      from: query,
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      channel: () => { const ch = { on: () => ch, subscribe: () => ch }; return ch; },
      removeChannel: () => {},
    }),
  };
}

/**
 * A fake supabase serving whole tables, for driving a real pull().
 * `tables` is { tableName: rows }; anything absent reads as empty.
 */
function fakeTables(tables) {
  const query = (table) => {
    const rows = () => (tables[table] || [])
      .filter(r => q._f.every(([c, v]) => r[c] === v));
    const q = {
      _f: [],
      select() { return q; },
      eq(c, v) { q._f.push([c, v]); return q; },
      order() { return q; },
      not() { return q; }, update() { return q; }, delete() { return q; },
      maybeSingle() { return Promise.resolve({ data: rows()[0] || null, error: null }); },
      single() { return q.maybeSingle(); },
      upsert(r) { return Promise.resolve({ data: r, error: null }); },
      then(res) { return Promise.resolve({ data: rows(), error: null }).then(res); },
    };
    return q;
  };
  return {
    createClient: () => ({
      from: query,
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      channel: () => { const ch = { on: () => ch, subscribe: () => ch }; return ch; },
      removeChannel: () => {},
    }),
  };
}

/** Boot the data layer with a seeded localStorage and a countable reload. */
async function device({ seed = {}, ...opts } = {}) {
  const reloads = { count: 0 };
  const h = bootDb({
    supabase: fakeSupabase(opts),
    localStorageSeed: seed,
    globals: { location: { href: 'http://localhost/', origin: 'http://localhost',
                           reload() { reloads.count += 1; } } },
  });
  const DB = h.win.FactoryDB;
  await DB.init();
  return { ...h, DB, reloads };
}

/** A device carrying the state blob and everything that can restore it. */
const staleCache = () => ({
  frp_factory_v5: JSON.stringify({ lab: [{ id: 1, name: 'Ajay' }], sessions: [{ supId: 1 }] }),
  _sessions_backup_: JSON.stringify({ sessions: [{ supId: 1 }], date: '2026-09-10', savedAt: Date.now() }),
  _sb_outbox: JSON.stringify([{ table: 'attendance', rows: [{ worker_id: 1 }] }]),
  _att_dirty: JSON.stringify({ date: '2026-09-10', ids: { 1: true } }),
});

describe('a device holding data the server has cleared', () => {
  test('drops every cache key and reloads', async () => {
    const d = await device({ seed: staleCache() });

    assert.equal(await d.DB.enforceEpoch(), true, 'it reports that it is reloading');
    for (const k of STATE_KEYS) {
      assert.equal(d.localStorage.getItem(k), null, k + ' was dropped');
    }
    assert.equal(d.reloads.count, 1, 'and the page was reloaded onto the server state');
  });

  test('drops the outbox too, so the cleared rows are not pushed back', async () => {
    // The whole point: the outbox is queued WRITES. Leave it and this device
    // re-uploads the attendance that was just deleted.
    const d = await device({ seed: staleCache() });
    assert.notEqual(d.localStorage.getItem('_sb_outbox'), null, 'queued before');

    await d.DB.enforceEpoch();
    assert.equal(d.localStorage.getItem('_sb_outbox'), null, 'and gone after');
    assert.equal(d.DB.pendingWrites(), 0);
  });

  test('records the epoch first, so it does not wipe on every boot', async () => {
    const d = await device({ seed: staleCache() });
    await d.DB.enforceEpoch();

    assert.equal(d.localStorage.getItem('_data_epoch'), EPOCH);
    // Second boot, same server epoch: nothing left to do.
    assert.equal(await d.DB.enforceEpoch(), false);
    assert.equal(d.reloads.count, 1, 'no second reload');
  });
});

describe('a device that is already up to date', () => {
  test('is left alone', async () => {
    const seed = Object.assign(staleCache(), { _data_epoch: EPOCH });
    const d = await device({ seed });

    assert.equal(await d.DB.enforceEpoch(), false);
    assert.equal(d.reloads.count, 0);
    assert.notEqual(d.localStorage.getItem('frp_factory_v5'), null,
      'its state is current and must survive');
  });
});

describe('a device with nothing to lose', () => {
  test('adopts the epoch without wiping or reloading', async () => {
    const d = await device({ seed: {} });   // fresh install, no state at all

    assert.equal(await d.DB.enforceEpoch(), false);
    assert.equal(d.reloads.count, 0, 'a new device has no reason to reload');
    assert.equal(d.localStorage.getItem('_data_epoch'), EPOCH,
      'but it remembers the epoch, so the next bump reaches it');
  });
});

describe('the check never stops the factory loading', () => {
  test('a failing read changes nothing', async () => {
    const d = await device({ seed: staleCache(), error: 'permission denied' });

    assert.equal(await d.DB.enforceEpoch(), false);
    assert.equal(d.reloads.count, 0);
    assert.notEqual(d.localStorage.getItem('frp_factory_v5'), null, 'state untouched');
  });

  test('a database without the table changes nothing', async () => {
    const d = await device({ seed: staleCache(), missing: true });

    assert.equal(await d.DB.enforceEpoch(), false);
    assert.equal(d.reloads.count, 0);
    assert.notEqual(d.localStorage.getItem('frp_factory_v5'), null, 'state untouched');
  });
});

describe('what the floor actually sees afterwards', () => {
  // The question this whole mechanism has to answer: someone picks up a phone
  // that still holds the deleted data — do they end up looking at the database
  // or at the cache? Simulated across the reload, in two boots, because the
  // reload is the point at which the cache stops existing.
  test('the app shows the database, not the cache', async () => {
    // The server: data cleared, workers restored, epoch bumped.
    const server = {
      data_epoch: [{ id: 1, epoch: EPOCH }],
      workers: [
        { id: 1,   name: 'Ajay',             role: 'Floor worker', wage: 450, is_supervisor: false, active: true },
        { id: 209, name: 'SUBODH CHOUDHARY', role: 'Supervisor',   wage: 700, is_supervisor: true,  active: true },
      ],
      fg_catalogue: [{ id: 1, name: 'Chair A', price: 900 }],
      rm_catalogue: [{ id: 1, name: 'Resin', unit: 'kg', price: 220 }],
      // Everything operational is empty, exactly as Postgres is now.
      attendance: [], production_sessions: [], raw_log: [], fg_transfers: [],
      fg_stock: [], day_ledger: [], factory_doc: [], rm_stock_opening: [],
    };
    const sb = fakeTables(server);

    // ── BOOT 1: the phone as it is today — stale cache, no epoch recorded.
    const one = boot({
      supabase: sb,
      localStorageSeed: staleCache(),
      globals: { location: { href: 'http://localhost/', origin: 'http://localhost',
                             reload() { one.reloaded = true; } } },
    });
    await call(one.ctx, 'FactoryDB.init()');
    const S1 = getState(one.ctx);
    assert.ok((S1.sessions || []).length > 0, 'it starts out showing the deleted session');

    await call(one.ctx, 'FactoryDB.pull(S)');
    assert.equal(one.reloaded, true, 'the device resets itself');
    for (const k of STATE_KEYS) {
      assert.equal(one.localStorage.getItem(k), null, k + ' is gone');
    }

    // ── BOOT 2: what that reload lands on — only the epoch survives.
    const carried = {};
    const epochSeen = one.localStorage.getItem('_data_epoch');
    if (epochSeen) carried._data_epoch = epochSeen;

    const two = boot({ supabase: fakeTables(server), localStorageSeed: carried });
    await call(two.ctx, 'FactoryDB.init()');
    await call(two.ctx, 'FactoryDB.pull(S)');
    const S2 = getState(two.ctx);

    assert.equal((S2.sessions || []).length, 0, 'no sessions — the database has none');
    assert.equal((S2.ledger || []).length, 0, 'no closed days');
    assert.equal((S2.rawLog || []).length, 0, 'no raw material issued');
    assert.equal((S2.fgTransfers || []).length, 0, 'no stage movements');
    assert.equal((S2.lab || []).length, 2, 'the workers the database holds');
    assert.deepEqual((S2.lab || []).map(l => l.name).sort(),
      ['Ajay', 'SUBODH CHOUDHARY'], 'by name, from Postgres');
    assert.equal((S2.lab || []).filter(l => l.present).length, 0,
      'and nobody is marked present, because attendance was cleared');
    assert.equal(two.localStorage.getItem('_data_epoch'), EPOCH,
      'the epoch is remembered, so this does not happen again');
  });
});

describe('the reset survives a write that lands after it', () => {
  // location.reload() does not stop the running script. pullFromFirebase()
  // writes S back to the state key on the line after the pull, so the cache
  // can be re-created between the reset and the actual unload — and with the
  // new epoch already recorded, the device would never reset again.
  test('a marker, not the deletes, is what makes it stick', async () => {
    const d = await device({ seed: staleCache() });
    await d.DB.enforceEpoch();
    assert.equal(d.localStorage.getItem('_reset_pending'), '1');

    // The race: sync.js writes the stale state straight back.
    d.localStorage.setItem('frp_factory_v5',
      JSON.stringify({ sessions: [{ supId: 1 }], ledger: [{ date: '2026-09-10' }] }));

    // Next boot lands on that write — and must still start clean.
    const next = boot({ supabase: fakeTables({ data_epoch: [{ id: 1, epoch: EPOCH }] }),
                        localStorageSeed: {
                          _reset_pending: d.localStorage.getItem('_reset_pending'),
                          _data_epoch: d.localStorage.getItem('_data_epoch'),
                          frp_factory_v5: d.localStorage.getItem('frp_factory_v5'),
                        } });
    const S = getState(next.ctx);

    assert.equal((S.sessions || []).length, 0, 'the resurrected session is discarded');
    assert.equal((S.ledger || []).length, 0, 'and so is the ledger');
    assert.equal(next.localStorage.getItem('_reset_pending'), null,
      'the marker is consumed, so this happens exactly once');

    // The app re-saves a cache as it boots, which is fine — what matters is
    // that the thing it saves is the clean state, not the resurrected one.
    const resaved = JSON.parse(next.localStorage.getItem('frp_factory_v5') || '{}');
    assert.equal((resaved.sessions || []).length, 0, 'the new cache carries no sessions');
    assert.equal((resaved.ledger || []).length, 0, 'and no ledger');
  });
});

describe('pull', () => {
  test('stops before reading when the device is resetting', async () => {
    const d = await device({ seed: staleCache() });
    const S = { workDate: '2026-09-11', lab: [{ id: 1, name: 'Ajay' }] };

    const out = await d.DB.pull(S);
    assert.equal(d.reloads.count, 1, 'the reset happened');
    assert.equal(out, S, 'and pull returned without applying a pull');
    assert.equal(d.DB.lastPullOk(), false);
  });
});
