// ── A PUSH MUST NOT DELETE A DAY THIS DEVICE HAS NEVER READ ──
//
// push() reconciles deletions: "remove every row for this day that is not in
// my local list". That is only safe if the local list mirrors the server, so
// it is gated on `lastPullOk`.
//
// But `lastPullOk` is one flag for the whole client — it records that a pull
// worked, not WHICH day it worked on. adoptWorkDate(), the midnight rollover,
// moves S.workDate to the new day and clears the day's slots without pulling.
// The flag stays true while the local list is empty for a date never read.
//
// The next push then reconciled that empty list against the new day. A
// supervisor's scope is narrowed to created_by so they could only erase their
// own row — but an OWNER's scope is the work_date alone. An owner's laptop
// left open overnight would delete every supervisor's production session for
// the new day, at the first thing anyone touched.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { bootDb } from './harness.mjs';

/**
 * A fake supabase that RECORDS DELETES.
 *
 * The other fakes in this suite stub `delete()` as a no-op passthrough, which
 * is precisely why this bug could not be seen: the dangerous statement was
 * invisible to every existing test.
 */
function fakeSupabase({ tables = {} } = {}) {
  const deletes = [];
  const upserts = [];

  const query = (table) => {
    const q = {
      _filters: [], _delete: false, _not: null,
      select() { return q; },
      eq(col, val) { q._filters.push([col, val]); return q; },
      order() { return q; },
      single: () => Promise.resolve({ data: null, error: { message: 'none' } }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      delete() { q._delete = true; return q; },
      update() { return q; },
      not(col, op, val) { q._not = [col, op, val]; return q; },
      upsert(rows, opts) { upserts.push({ table, rows, opts });
                           return Promise.resolve({ data: rows, error: null }); },
      then(res) {
        if (q._delete) {
          deletes.push({ table, scope: Object.fromEntries(q._filters), not: q._not });
          return Promise.resolve({ data: [], error: null }).then(res);
        }
        return Promise.resolve({ data: tables[table] || [], error: null }).then(res);
      },
    };
    return q;
  };

  return {
    _deletes: deletes,
    _upserts: upserts,
    createClient: () => ({
      from: query,
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'owner-1' } } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      channel: () => { const ch = { on: () => ch, subscribe: (cb) => { cb && cb('SUBSCRIBED'); return ch; } }; return ch; },
      removeChannel: () => {},
    }),
  };
}

const state = (workDate, extra = {}) => Object.assign({
  workDate, lab: [], sessions: [], rawLog: [], fgTransfers: [], fgStock: {},
  rm: [], fg: [], ledger: [],
}, extra);

const deletesFor = (sb, table) => sb._deletes.filter(d => d.table === table);

describe('the reconcile guard is per-day, not just per-pull', () => {
  test('a push for the day that WAS pulled still reconciles deletes', async () => {
    // The guard must not be so strict it stops doing its job: a supervisor who
    // deletes a session needs that deletion to reach the server.
    const sb = fakeSupabase();
    const { win } = bootDb({ supabase: sb });
    const DB = win.FactoryDB;
    await DB.init();

    const S = state('2026-09-01');
    await DB.pull(S);
    assert.equal(DB.lastPullOk(), true, 'the pull succeeded');
    assert.equal(DB.lastPullDate(), '2026-09-01', 'and recorded which day it read');

    await DB.push(S, 'owner');

    assert.ok(deletesFor(sb, 'production_sessions').length > 0,
      'deletions for the pulled day are reconciled as before');
    assert.equal(deletesFor(sb, 'production_sessions')[0].scope.work_date, '2026-09-01');
  });

  test('a push for a day that was NEVER pulled deletes nothing', async () => {
    // THE BUG. Pull day 1, roll over to day 2 without pulling, then push.
    const sb = fakeSupabase();
    const { win } = bootDb({ supabase: sb });
    const DB = win.FactoryDB;
    await DB.init();

    const S = state('2026-09-01');
    await DB.pull(S);                       // lastPullOk = true, for the 1st

    // Midnight. adoptWorkDate() moves the date and clears the slots; it does
    // not pull. This is exactly the state it leaves behind.
    S.workDate = '2026-09-02';
    S.sessions = [];
    S.rawLog = [];

    assert.equal(DB.lastPullOk(), true, 'the stale flag is still set — that is the trap');

    await DB.push(S, 'owner');

    assert.equal(deletesFor(sb, 'production_sessions').length, 0,
      "an owner's empty list must not erase the new day's sessions");
    assert.equal(deletesFor(sb, 'raw_log').length, 0,
      'nor its raw log');
    assert.equal(deletesFor(sb, 'fg_transfers').length, 0,
      'nor its transfers');
  });

  test('once the new day IS pulled, reconciling resumes', async () => {
    const sb = fakeSupabase();
    const { win } = bootDb({ supabase: sb });
    const DB = win.FactoryDB;
    await DB.init();

    const S = state('2026-09-01');
    await DB.pull(S);
    S.workDate = '2026-09-02';
    S.sessions = [];
    await DB.push(S, 'owner');
    assert.equal(deletesFor(sb, 'production_sessions').length, 0, 'blocked while unread');

    await DB.pull(S);                       // now the device has read the 2nd
    assert.equal(DB.lastPullDate(), '2026-09-02');
    await DB.push(S, 'owner');

    assert.ok(deletesFor(sb, 'production_sessions').length > 0,
      'the guard steps aside once the day has actually been read');
    assert.equal(deletesFor(sb, 'production_sessions').at(-1).scope.work_date, '2026-09-02');
  });

  test('a failed pull still blocks reconciling, as it always did', async () => {
    const sb = fakeSupabase();
    const { win } = bootDb({ supabase: sb });
    const DB = win.FactoryDB;
    await DB.init();

    const S = state('2026-09-01');
    // No pull at all — lastPullOk is false from the start.
    assert.equal(DB.lastPullOk(), false);
    assert.equal(DB.lastPullDate(), null);

    await DB.push(S, 'owner');

    assert.equal(sb._deletes.length, 0, 'nothing is reconciled without a successful pull');
  });
});
