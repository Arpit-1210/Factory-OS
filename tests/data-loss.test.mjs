// ══════════════════════════════════════════════════════════════════
//  DATA LOSS — the four ways a day's work disappeared
//
//  Every test here pins a defect that was live in production and that the
//  existing suite passed straight over. They are written from the floor
//  report, not from the code, so they stay meaningful if the implementation
//  is rewritten:
//
//    1. Closing the day must not clear the day unless the day was saved.
//    2. An empty or unreadable server must never erase local history.
//    3. A supervisor must not push rows another user owns.
//    4. The flags that trigger a wipe must be consumed, not left armed.
// ══════════════════════════════════════════════════════════════════

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, bootDb, call, getState, resetState } from './harness.mjs';

// ── A supabase double with per-table failure injection ──────────────
function fakeSupabase({ tables = {}, failOn = [], user = { id: 'u1' } } = {}) {
  const writes = [];
  const deletes = [];

  const query = (table) => {
    const q = {
      _filters: [],
      select() { return q; },
      eq(col, val) { q._filters.push([col, val]); return q; },
      not(col, op, val) { q._filters.push([col, op, val]); return q; },
      order() { return q; },
      maybeSingle() {
        const row = (tables[table] || []).find(r => r.id === (user && user.id));
        return Promise.resolve({ data: row || null, error: null });
      },
      single() { return q.maybeSingle(); },
      update() { return Promise.resolve({ data: null, error: null }); },
      delete() { deletes.push({ table, filters: q._filters }); return q; },
      then(res) {
        if (failOn.includes(table)) {
          return Promise.resolve({ data: null, error: { message: table + ' unavailable' } }).then(res);
        }
        return Promise.resolve({ data: tables[table] || [], error: null }).then(res);
      },
      upsert(rows, opts) {
        writes.push({ table, rows, opts });
        if (failOn.includes(table)) {
          return Promise.resolve({ data: null, error: { code: '42501', message: 'RLS denied' } });
        }
        return Promise.resolve({ data: rows, error: null });
      },
    };
    return q;
  };

  return {
    _writes: writes,
    _deletes: deletes,
    createClient: () => ({
      from: query,
      auth: {
        getSession: () => Promise.resolve({ data: { session: user ? { user } : null } }),
        signInWithPassword: ({ email }) =>
          Promise.resolve({ data: { user: { id: user.id, email } }, error: null }),
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

const rowsFor = (sb, table) => sb._writes.filter(w => w.table === table).flatMap(w => w.rows);
const plain = (v) => JSON.parse(JSON.stringify(v));


// ══════════════════════════════════════════════════════════════════
//  1. SAVE DAY
// ══════════════════════════════════════════════════════════════════
describe('closing the day', () => {
  const openDay = {
    workDate: '2026-08-19',
    lab: [{ id: 1, name: 'Ramesh', role: 'Floor worker', wage: 600, present: true, doingOT: false, otHours: 0 }],
    sessions: [{ supId: 1, supName: 'Ramesh', supWage: 600, supOT: 0, teams: [
      { teamId: 1, stage: 'Moulding', team: [], production: [{ name: 'Pot', qty: 2, unitVal: 100, value: 200 }] },
    ] }],
  };

  test('a refused write leaves the day OPEN and loses nothing', async () => {
    // The report was "data appears in Monthly, then vanishes after re-login".
    // The cause was this: the day was cleared and flagged as closed BEFORE the
    // write was attempted, so a refusal still destroyed the shift locally
    // while nothing ever reached day_ledger.
    const sb = fakeSupabase({ failOn: ['day_ledger'] });
    const h = boot({ supabase: sb, localStorageSeed: {} });
    const { ctx, localStorage } = h;

    await call(ctx, 'initFirebase()');
    resetState(ctx, openDay);
    call(ctx, 'setRole("owner")');

    await call(ctx, 'saveDay()');
    const S = getState(ctx);

    assert.equal(S.workDate, '2026-08-19', 'the work date must not advance past a failed save');
    assert.equal(S.sessions.length, 1, 'the production must still be there to retry with');
    assert.equal(S.lab[0].present, true, 'attendance must not be cleared by a failed save');
    assert.equal(localStorage.getItem('_day_cleared_2026-08-19'), null,
      'the day must not be flagged closed when it was not written');
    assert.equal(localStorage.getItem('_last_saved_date'), null);
  });

  test('the user is told the save failed, not congratulated', async () => {
    const sb = fakeSupabase({ failOn: ['day_ledger'] });
    const h = boot({ supabase: sb });
    await call(h.ctx, 'initFirebase()');
    resetState(h.ctx, openDay);
    call(h.ctx, 'setRole("owner")');

    await call(h.ctx, 'saveDay()');

    const alerts = h.logs.log.filter(a => a[0] === 'alert').map(a => String(a[1]));
    assert.ok(alerts.length, 'the user must be told something');
    assert.ok(alerts.every(m => !/day saved/i.test(m)),
      'a refused write must never report success — got: ' + alerts.join(' | '));
    assert.ok(alerts.some(m => /still open/i.test(m)),
      'the message must say the day is still open');
  });

  test('a successful write closes the day and records it', async () => {
    const sb = fakeSupabase();
    const h = boot({ supabase: sb });
    await call(h.ctx, 'initFirebase()');
    resetState(h.ctx, openDay);
    call(h.ctx, 'setRole("owner")');

    await call(h.ctx, 'saveDay()');
    const S = getState(h.ctx);

    assert.equal(S.workDate, '2026-08-20', 'the work date advances only on success');
    assert.equal(S.sessions.length, 0);
    assert.equal(S.ledger.length, 1);
    assert.equal(S.ledger[0].date, '2026-08-19');

    const ledgerRows = rowsFor(sb, 'day_ledger');
    assert.equal(ledgerRows.length, 1, 'the closed day must reach day_ledger');
    assert.equal(ledgerRows[0].work_date, '2026-08-19');
    assert.equal(h.localStorage.getItem('_day_cleared_2026-08-19'), '1');
  });
});


// ══════════════════════════════════════════════════════════════════
//  2. THE PULL MUST NOT DESTROY LOCAL HISTORY
// ══════════════════════════════════════════════════════════════════
describe('pull never erases what the server does not have', () => {
  const localLedger = [
    { date: '2026-08-17', goodsValue: 1000, labourCost: 200, rmCost: 100, netProfit: 700 },
    { date: '2026-08-18', goodsValue: 2000, labourCost: 300, rmCost: 100, netProfit: 1600 },
  ];

  test('an EMPTY day_ledger keeps the local month', async () => {
    // S.ledger is the only source for the Monthly screen, monthly payroll,
    // consumed-RM history and every Excel export. It was assigned
    // unconditionally from the server, so one empty read wiped the lot — and
    // pullFromFirebase() writes the result straight to localStorage, so the
    // wipe was committed to disk a line later.
    const sb = fakeSupabase({ tables: { day_ledger: [] } });
    const h = bootDb({ supabase: sb });
    const DB = h.win.FactoryDB;
    await DB.init();

    const S = { workDate: '2026-08-19', ledger: localLedger.map(e => ({ ...e })), lab: [], rm: [], fg: [] };
    await DB.pull(S);

    assert.equal(S.ledger.length, 2, 'an empty remote ledger must not erase local days');
    assert.equal(plain(S.ledger)[0].date, '2026-08-17');
  });

  test('an UNREADABLE day_ledger keeps the local month', async () => {
    const sb = fakeSupabase({ failOn: ['day_ledger'] });
    const h = bootDb({ supabase: sb });
    const DB = h.win.FactoryDB;
    await DB.init();

    const S = { workDate: '2026-08-19', ledger: localLedger.map(e => ({ ...e })), lab: [], rm: [], fg: [] };
    await DB.pull(S);

    assert.equal(S.ledger.length, 2, 'a failed read is not an empty table');
    assert.equal(DB.lastPullOk(), false, 'a failed query must be reported, not swallowed');
  });

  test('a populated day_ledger does replace the local copy', async () => {
    const sb = fakeSupabase({ tables: { day_ledger: [
      { work_date: '2026-08-18', payload: { goodsValue: 5, netProfit: 5 } },
    ] } });
    const h = bootDb({ supabase: sb });
    const DB = h.win.FactoryDB;
    await DB.init();

    const S = { workDate: '2026-08-19', ledger: localLedger.map(e => ({ ...e })), lab: [], rm: [], fg: [] };
    await DB.pull(S);

    assert.equal(S.ledger.length, 1, 'the server is authoritative when it HAS data');
    assert.equal(S.ledger[0].date, '2026-08-18');
  });

  test('the row work_date wins over a stale payload date', async () => {
    // month.js filters on `date`; a payload carrying a different one made the
    // entry invisible in every month while sitting correctly in Postgres.
    const sb = fakeSupabase({ tables: { day_ledger: [
      { work_date: '2026-08-18', payload: { date: 'nonsense', goodsValue: 5 } },
    ] } });
    const h = bootDb({ supabase: sb });
    await h.win.FactoryDB.init();

    const S = { workDate: '2026-08-19', ledger: [], lab: [], rm: [], fg: [] };
    await h.win.FactoryDB.pull(S);
    assert.equal(S.ledger[0].date, '2026-08-18');
  });

  test('an in-progress session is not deleted by an unrelated remote change', async () => {
    // enterSup() creates the session in memory the moment a supervisor taps
    // their card. Any realtime event — the owner marking attendance on another
    // device was the common one — used to replace S.sessions wholesale and
    // delete it, after which "+ Add New Team" and every worker tap silently
    // did nothing.
    const sb = fakeSupabase({ tables: { production_sessions: [] } });
    const h = bootDb({ supabase: sb });
    await h.win.FactoryDB.init();

    const S = {
      workDate: '2026-08-19', lab: [], rm: [], fg: [], ledger: [],
      sessions: [{ supId: 7, supName: 'Karan', supWage: 900, supOT: 0, teams: [] }],
    };
    await h.win.FactoryDB.pull(S);

    assert.equal(S.sessions.length, 1, 'a local session with no remote row yet must survive the pull');
    assert.equal(S.sessions[0].supId, 7);
  });
});


// ══════════════════════════════════════════════════════════════════
//  3. A SUPERVISOR MUST ONLY PUSH THEIR OWN ROWS
// ══════════════════════════════════════════════════════════════════
describe('push respects row ownership', () => {
  test('another supervisor\'s session is not pushed', async () => {
    // sessions_read lets a supervisor SELECT everyone's rows for the day, so
    // pull() handed them over — and push() stamped its own uid on all of them.
    // sessions_sup_update refuses that with 42501, and because postgrest sends
    // one INSERT ... ON CONFLICT statement, the refusal aborted the batch
    // INCLUDING this supervisor's own row. Their whole day never synced.
    const sb = fakeSupabase({
      user: { id: 'sup-A' },
      tables: { app_users: [{ id: 'sup-A', role: 'supervisor', name: 'A', active: true }] },
    });
    const h = bootDb({ supabase: sb });
    const DB = h.win.FactoryDB;
    await DB.init();
    await DB.signIn('a@x.com', 'pw');

    const S = {
      workDate: '2026-08-19', lab: [], rm: [], fg: [], rawLog: [], fgTransfers: [], fgStock: {},
      sessions: [
        { supId: 1, supName: 'A', supWage: 900, supOT: 0, teams: [], createdBy: 'sup-A' },
        { supId: 2, supName: 'B', supWage: 900, supOT: 0, teams: [], createdBy: 'sup-B' },
      ],
    };
    await DB.push(S, 'supervisor');

    const pushed = rowsFor(sb, 'production_sessions');
    assert.equal(pushed.length, 1, 'only the caller\'s own session may be pushed');
    assert.equal(pushed[0].sup_id, 1);
    assert.equal(pushed[0].created_by, 'sup-A');
  });

  test('the owner pushes every session and preserves its author', async () => {
    const sb = fakeSupabase({
      user: { id: 'owner-1' },
      tables: { app_users: [{ id: 'owner-1', role: 'owner', name: 'O', active: true }] },
    });
    const h = bootDb({ supabase: sb });
    const DB = h.win.FactoryDB;
    await DB.init();
    await DB.signIn('o@x.com', 'pw');

    const S = {
      workDate: '2026-08-19', lab: [], rm: [], fg: [], rawLog: [], fgTransfers: [], fgStock: {},
      sessions: [
        { supId: 1, supName: 'A', supWage: 900, supOT: 0, teams: [], createdBy: 'sup-A' },
        { supId: 2, supName: 'B', supWage: 900, supOT: 0, teams: [], createdBy: 'sup-B' },
      ],
    };
    await DB.push(S, 'owner');

    const pushed = rowsFor(sb, 'production_sessions');
    assert.equal(pushed.length, 2);
    // Stamping the owner's uid here is what locked the real authors out of
    // their own rows on their next save.
    assert.deepEqual(pushed.map(r => r.created_by).sort(), ['sup-A', 'sup-B']);
  });

  test('a permanent rejection is reported, not queued forever', async () => {
    // 42501 and 23503 will fail identically on every retry. Queueing them made
    // the outbox grow without bound, pinned the sync indicator to an error the
    // user reads as "bad wifi", and permanently disabled Restore from backup.
    const sb = fakeSupabase({
      user: { id: 'u1' },
      failOn: ['attendance'],
      tables: { app_users: [{ id: 'u1', role: 'supervisor', name: 'A', active: true }] },
    });
    const h = bootDb({ supabase: sb });
    const DB = h.win.FactoryDB;
    await DB.init();
    await DB.signIn('a@x.com', 'pw');

    const S = {
      workDate: '2026-08-19', rm: [], fg: [], rawLog: [], fgTransfers: [], fgStock: {}, sessions: [],
      lab: [{ id: 1, name: 'R', role: 'Floor worker', wage: 600, present: true, doingOT: false, otHours: 0 }],
    };
    await DB.push(S, 'supervisor');

    assert.equal(DB.pendingWrites(), 0, 'a write the server will never accept must not be queued');
    const err = DB.lastWriteError();
    assert.equal(err && err.table, 'attendance');
    assert.equal(err && err.code, '42501');
  });
});


// ══════════════════════════════════════════════════════════════════
//  3b. DELETES PROPAGATE — BUT ONLY WHEN WE KNOW WHAT THE SERVER HAS
// ══════════════════════════════════════════════════════════════════
describe('removing a row removes it on the server too', () => {
  const signedIn = async (opts) => {
    const sb = fakeSupabase(Object.assign({
      user: { id: 'u1' },
      tables: { app_users: [{ id: 'u1', role: 'supervisor', name: 'A', active: true }] },
    }, opts || {}));
    const h = bootDb({ supabase: sb });
    await h.win.FactoryDB.init();
    await h.win.FactoryDB.signIn('a@x.com', 'pw');
    return { sb, DB: h.win.FactoryDB };
  };

  const stateWith = (rawLog) => ({
    workDate: '2026-08-19', lab: [], rm: [], fg: [], fgTransfers: [], fgStock: {},
    sessions: [], ledger: [], rawLog,
  });

  test('a raw-material issue deleted locally is deleted remotely', async () => {
    // push() used to upsert only, so delRaw() removed the row from the screen
    // and the next pull put it straight back — a delete that undid itself.
    const { sb, DB } = await signedIn({ tables: {
      app_users: [{ id: 'u1', role: 'supervisor', name: 'A', active: true }],
      raw_log: [
        { id: 11, work_date: '2026-08-19', stage: 'Moulding', rm_name: 'Resin', unit: 'kg', qty: 1, unit_price: 10, cost: 10, logged_by: 'u1' },
        { id: 12, work_date: '2026-08-19', stage: 'Moulding', rm_name: 'Gelcoat', unit: 'kg', qty: 1, unit_price: 10, cost: 10, logged_by: 'u1' },
      ],
    } });

    const S = stateWith([]);
    await DB.pull(S);
    assert.equal(S.rawLog.length, 2);

    S.rawLog = S.rawLog.filter(r => r.id !== 12);   // the user presses ✕
    await DB.push(S, 'supervisor');

    const del = sb._deletes.find(d => d.table === 'raw_log');
    assert.ok(del, 'the deletion must reach Postgres');
    const kept = del.filters.find(f => f[1] === 'in');
    assert.equal(kept[2], '(11)', 'only the surviving row may be kept');
  });

  test('nothing is deleted when the last pull failed', async () => {
    // This is the dangerous direction. With no successful pull, an empty local
    // list is not evidence that the user deleted anything — loadState() clears
    // the day on a date rollover — and an empty keep-list would leave the work
    // date as the whole predicate, deleting the entire day.
    const { sb, DB } = await signedIn({ failOn: ['raw_log'] });

    const S = stateWith([]);
    await DB.pull(S);
    assert.equal(DB.lastPullOk(), false);

    await DB.push(S, 'supervisor');
    assert.equal(sb._deletes.filter(d => d.table === 'raw_log').length, 0,
      'a failed pull must disable reconciliation entirely');
  });

  test("another person's raw-log row is never deleted", async () => {
    const { sb, DB } = await signedIn({ tables: {
      app_users: [{ id: 'u1', role: 'supervisor', name: 'A', active: true }],
      raw_log: [
        { id: 21, work_date: '2026-08-19', stage: 'Moulding', rm_name: 'Resin', unit: 'kg', qty: 1, unit_price: 10, cost: 10, logged_by: 'someone-else' },
      ],
    } });

    const S = stateWith([]);
    await DB.pull(S);
    S.rawLog = [];                       // this device holds none of its own
    await DB.push(S, 'supervisor');

    const del = sb._deletes.find(d => d.table === 'raw_log');
    assert.ok(del, 'reconciliation still runs');
    assert.ok(del.filters.some(f => f[0] === 'logged_by' && f[1] === 'u1'),
      'it must be scoped to rows this user wrote');
  });
});


// ══════════════════════════════════════════════════════════════════
//  4. THE WIPE FLAGS MUST BE CONSUMED
// ══════════════════════════════════════════════════════════════════
describe('the day-cleared flags are consumed, not left armed', () => {
  test('a stale _day_cleared_ flag fires once and is then cleared', () => {
    // This flag is also written for TODAY when someone signs in against a past
    // date. It was never removed, so one such login made every reload for the
    // rest of the day clear attendance and sessions before the pull could
    // restore them — the "attendance disappears after refresh" report.
    const today = new Date();
    const iso = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');

    const h = boot({ localStorageSeed: {
      frp_factory_v5: JSON.stringify({
        workDate: iso,
        lab: [{ id: 1, name: 'R', role: 'w', wage: 600, present: true, doingOT: false, otHours: 0 }],
        sessions: [{ supId: 1, supName: 'R', teams: [] }],
      }),
      ['_day_cleared_' + iso]: '1',
    } });

    assert.equal(h.localStorage.getItem('_day_cleared_' + iso), null,
      'the flag must be removed once it has done its job');
  });

  test('_last_saved_date does not re-arm itself', () => {
    const today = new Date();
    const iso = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');

    const h = boot({ localStorageSeed: {
      frp_factory_v5: JSON.stringify({ workDate: iso, lab: [], sessions: [] }),
      _last_saved_date: iso,
    } });

    assert.equal(h.localStorage.getItem('_last_saved_date'), null,
      'once consumed it must not match again on the next load and wipe the new day');
  });
});
