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
import { bootDb } from './harness.mjs';

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
