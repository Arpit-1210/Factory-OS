// ── DAY CYCLE: P&L ROLL-UP, SAVE, AND OVERNIGHT ROLLOVER ──
// buildPayload() is what gets written to the ledger, pushed to Sheets and read
// back by payroll and the monthly report, so a wrong figure here is wrong
// everywhere. The rollover functions are what the last two commits fixed.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx, localStorage } = boot();
const plain = (v) => JSON.parse(JSON.stringify(v));

const worker = (id, name, wage, extra = {}) =>
  Object.assign({ id, name, role: 'Floor worker', wage, isSup: false,
                  present: false, doingOT: false, otHours: 0 }, extra);

/** A session shaped the way saveSup() writes it (teams carry `team` + `teamId`). */
const session = (supId, supName, supWage, teams) => ({
  supId, supName, supWage, supOT: 0, teams,
});
const team = (teamId, stage, members, production) => ({ teamId, stage, team: members, production });

describe('buildPayload — daily P&L', () => {
  test('nets goods against labour, overtime and raw material', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [
      worker(1, 'Ramesh', 400, { present: true }),
      worker(2, 'Suresh', 500, { present: true, doingOT: true, otHours: 4 }),
      worker(3, 'Absent', 600),
    ];
    S.sessions = [session(9, 'Karan', 800, [
      team(1, 'Moulding', [S.lab[0], S.lab[1]], [{ name: 'Chair A', qty: 5, value: 5000 }]),
    ])];
    S.rawLog = [{ id: 1, stage: 'Moulding', name: 'Resin', unit: 'kg', qty: 4, unitPrice: 220, cost: 880 }];

    const p = call(ctx, 'buildPayload()');

    assert.equal(p.workersPresent, 2, 'absent workers are not counted or paid');
    assert.equal(p.goodsValue, 5000);
    assert.equal(p.labourCost, 900);        // 400 + 500, absent excluded
    assert.equal(p.overtimeCost, 250);      // 500/8 x 4
    assert.equal(p.rmCost, 880);
    assert.equal(p.netProfit, 5000 - 900 - 250 - 880);
    assert.equal(p.margin, Math.round(p.netProfit / 5000 * 100));
  });

  test('excludes Unit2 transfers from raw material cost', () => {
    // A transfer to the second unit is a move, not consumption — counting it
    // would understate profit and double-charge the material.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'Ramesh', 400, { present: true })];
    S.rawLog = [
      { id: 1, stage: 'Moulding', name: 'Resin', qty: 2, unitPrice: 220, cost: 440 },
      { id: 2, stage: 'Unit2-Transfer', name: 'Resin', qty: 10, unitPrice: 220, cost: 2200 },
    ];
    const p = call(ctx, 'buildPayload()');

    assert.equal(p.rmCost, 440);
    assert.equal(p.rawLog.length, 1, 'the transfer is kept out of the saved log too');
  });

  test('margin is 0 rather than NaN or Infinity on a day with no output', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'Ramesh', 400, { present: true })];
    const p = call(ctx, 'buildPayload()');
    assert.equal(p.goodsValue, 0);
    assert.equal(p.margin, 0);
    assert.equal(p.netProfit, -400);
  });

  test('attributes the supervisor wage to team 1 only, never to every team', () => {
    // One supervisor covers the whole session; charging their wage to each
    // team would multiply it by the number of teams.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [
      worker(1, 'A', 400, { present: true }),
      worker(2, 'B', 400, { present: true }),
      worker(9, 'Karan', 800, { present: true, isSup: true }),
    ];
    S.sessions = [session(9, 'Karan', 800, [
      team(1, 'Moulding',  [S.lab[0]], [{ name: 'Chair A', qty: 1, value: 1000 }]),
      team(2, 'Finishing', [S.lab[1]], [{ name: 'Chair A', qty: 1, value: 1000 }]),
    ])];

    const p = call(ctx, 'buildPayload()');
    assert.equal(p.stageLab.Moulding, 1200);   // 400 worker + 800 supervisor
    assert.equal(p.stageLab.Finishing, 400);   // worker only
  });

  test('flattens every team production line into productLog with its stage', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'A', 400, { present: true })];
    S.sessions = [session(9, 'Karan', 800, [
      team(1, 'Moulding',  [S.lab[0]], [{ name: 'Chair A', qty: 2, value: 2000 }]),
      team(2, 'Painting',  [], [{ name: 'Chair A', qty: 1, value: 900 }]),
    ])];

    const p = call(ctx, 'buildPayload()');
    assert.equal(p.productLog.length, 2);
    assert.deepEqual(plain(p.productLog).map(x => [x.stage, x.qty, x.supName]),
      [['Moulding', 2, 'Karan'], ['Painting', 1, 'Karan']]);
  });

  test('snapshots attendance for every worker, present or not', () => {
    // Payroll reads this back per month, so absentees must be recorded as
    // absent rather than omitted.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'A', 400, { present: true, doingOT: true, otHours: 2 }), worker(2, 'B', 500)];
    const p = call(ctx, 'buildPayload()');

    assert.equal(p.attendance.length, 2);
    assert.equal(p.attendance[0].present, true);
    assert.equal(p.attendance[0].otHours, 2);
    assert.equal(p.attendance[1].present, false);
  });

  test('stamps the payload with workDate, not the wall clock', () => {
    resetState(ctx, { workDate: '2026-07-04' });
    assert.equal(call(ctx, 'buildPayload()').date, '2026-07-04');
  });
});

describe('saveDay — writing the day into the ledger', () => {
  test('appends the day and keeps the ledger sorted by date', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'A', 400, { present: true })];
    S.ledger = [{ date: '2026-08-20', goodsValue: 1 }, { date: '2026-08-01', goodsValue: 2 }];

    call(ctx, 'saveDay()');
    assert.deepEqual(S.ledger.map(e => e.date), ['2026-08-01', '2026-08-19', '2026-08-20']);
  });

  test('closes the day: advances to tomorrow and clears the shift', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'A', 400, { present: true, doingOT: true, otHours: 3 })];
    S.sessions = [session(9, 'Karan', 800, [])];
    S.rawLog = [{ id: 1, stage: 'Moulding', name: 'Resin', qty: 4, unitPrice: 220, cost: 880 }];

    call(ctx, 'saveDay()');

    assert.equal(S.workDate, '2026-08-20', 'save-and-start-next moves the day on');
    assert.deepEqual(plain(S.sessions), []);
    assert.deepEqual(plain(S.rawLog), []);
    assert.equal(S.lab[0].present, false, 'attendance is reset for the new day');
    assert.equal(S.lab[0].otHours, 0);
    assert.equal(localStorage.getItem('_day_cleared_2026-08-19'), '1');
    assert.equal(localStorage.getItem('_last_saved_date'), '2026-08-19');
  });

  test('rolls over a month end correctly', () => {
    const S = resetState(ctx, { workDate: '2026-08-31' });
    S.lab = [worker(1, 'A', 400, { present: true })];
    call(ctx, 'saveDay()');
    assert.equal(S.workDate, '2026-09-01');
  });

  test('re-saving the same day overwrites it instead of duplicating', () => {
    // Duplicate ledger rows for one date would double-count that day in both
    // payroll and the monthly P&L.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'A', 400, { present: true })];
    call(ctx, 'saveDay()');

    // Re-open the same date (as a correction) and save again.
    S.workDate = '2026-08-19';
    S.lab = [worker(1, 'A', 400, { present: true }), worker(2, 'B', 500, { present: true })];
    call(ctx, 'saveDay()');

    const rows = S.ledger.filter(e => e.date === '2026-08-19');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].labourCost, 900, 'the ledger holds the corrected figures');
  });

  test('the ledger keeps its own copy of rawLog, which the day-clear cannot empty', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'A', 400, { present: true })];
    S.rawLog = [{ id: 1, stage: 'Moulding', name: 'Resin', qty: 4, unitPrice: 220, cost: 880 }];

    call(ctx, 'saveDay()');

    const saved = S.ledger.find(e => e.date === '2026-08-19');
    assert.equal(saved.rawLog.length, 1, 'saveDay clears S.rawLog — history must not go with it');
    assert.equal(saved.rawLog[0].cost, 880);
  });
});

describe('isDaySaved', () => {
  test('the current working day is never "already saved"', () => {
    // Otherwise the open day would be pruned out from under the supervisor.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.ledger = [{ date: '2026-08-19' }];
    assert.equal(call(ctx, 'isDaySaved("2026-08-19")'), false);
  });

  test('a past day present in the ledger is saved', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.ledger = [{ date: '2026-08-18' }];
    assert.equal(call(ctx, 'isDaySaved("2026-08-18")'), true);
  });

  test('a past day flagged in localStorage is saved even without a ledger row', () => {
    resetState(ctx, { workDate: '2026-08-19' });
    localStorage.setItem('_day_cleared_2026-08-17', '1');
    assert.equal(call(ctx, 'isDaySaved("2026-08-17")'), true);
    localStorage.removeItem('_day_cleared_2026-08-17');
  });

  test('an unknown day is not saved, and no date at all is falsy', () => {
    resetState(ctx, { workDate: '2026-08-19' });
    assert.equal(call(ctx, 'isDaySaved("2026-01-01")'), false);
    assert.equal(!!call(ctx, 'isDaySaved(undefined)'), false);
  });
});

describe('adoptWorkDate — moving to a new working day', () => {
  test('resets attendance for everyone', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [worker(1, 'A', 400, { present: true, doingOT: true, otHours: 5 })];

    call(ctx, 'adoptWorkDate("2026-08-20")');

    assert.equal(S.workDate, '2026-08-20');
    assert.equal(S.lab[0].present, false);
    assert.equal(S.lab[0].doingOT, false);
    assert.equal(S.lab[0].otHours, 0);
  });

  test('carries unsaved in-progress work forward onto the new date', () => {
    // A supervisor mid-shift at midnight must not lose the session they are
    // still entering.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [Object.assign(session(9, 'Karan', 800, []), { date: '2026-08-19' })];
    S.rawLog = [{ id: 1, date: '2026-08-19', stage: 'Moulding', name: 'Resin', qty: 1, cost: 220 }];

    call(ctx, 'adoptWorkDate("2026-08-20")');

    assert.equal(S.sessions.length, 1, 'unsaved session survives the rollover');
    assert.equal(S.sessions[0].date, '2026-08-20', 'and is re-dated to the new day');
    assert.equal(S.rawLog.length, 1);
    assert.equal(S.rawLog[0].date, '2026-08-20');
  });

  test('drops work belonging to a day that was already saved', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.ledger = [{ date: '2026-08-18' }];
    S.sessions = [
      Object.assign(session(9, 'Karan', 800, []), { date: '2026-08-18' }),   // in the ledger
      Object.assign(session(8, 'Rahul', 800, []), { date: '2026-08-19' }),   // still open
      Object.assign(session(7, 'Vikas', 800, []), {}),                       // no date at all
    ];

    // One argument: nothing has just been saved, so only the ledgered day goes.
    call(ctx, 'adoptWorkDate("2026-08-20")');

    assert.deepEqual(plain(S.sessions).map(s => s.supName), ['Rahul', 'Vikas'],
      'unsaved and undated work is carried forward, ledgered work is not');
    assert.deepEqual(plain(S.sessions).map(s => s.date), ['2026-08-20', '2026-08-20']);
  });

  test('told a day was just saved, it drops the work from that day too', () => {
    // Carrying it forward would replay production already in the ledger, and
    // getFGBalance() counts both the open day and history — so it would be
    // added to stock twice.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [
      Object.assign(session(8, 'Rahul', 800, []), { date: '2026-08-19' }),
      Object.assign(session(7, 'Vikas', 800, []), { date: '2026-08-20' }),
    ];

    call(ctx, 'adoptWorkDate("2026-08-20", "2026-08-19")');

    assert.deepEqual(plain(S.sessions).map(s => s.supName), ['Vikas']);
  });

  // Regression guard. adoptWorkDate() wrote _day_cleared_<savedDate>, then
  // filtered sessions through isDaySaved() while S.workDate was still the OLD
  // date — hitting its "the open day is never saved" branch, whose side effect
  // DELETED the flag just written. Moving the reassignment above the filters
  // fixes it, and stops saved production being carried into the new day.
  test('flags the day it was told was saved', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [Object.assign(session(8, 'Rahul', 800, []), { date: '2026-08-19' })];

    call(ctx, 'adoptWorkDate("2026-08-20", "2026-08-19")');

    assert.equal(localStorage.getItem('_day_cleared_2026-08-19'), '1',
      'the day just saved must stay flagged so it is never re-adopted');
  });

  test('persists the new date to localStorage', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    call(ctx, 'adoptWorkDate("2026-08-21")');
    const stored = JSON.parse(localStorage.getItem('frp_factory_v5'));
    assert.equal(stored.workDate, '2026-08-21');
  });
});

describe('checkDayRollover — the overnight auto-advance', () => {
  test('advances to today when the stale day was already saved', () => {
    const today = call(ctx, 'todayStr()');
    const S = resetState(ctx, { workDate: '2020-01-01' });
    S.ledger = [{ date: '2020-01-01' }];

    call(ctx, 'checkDayRollover()');
    assert.equal(S.workDate, today);
  });

  test('leaves a stale UNSAVED day alone so it can still be saved by hand', () => {
    // Auto-advancing here would silently discard a whole day's production.
    const S = resetState(ctx, { workDate: '2020-01-01' });
    S.sessions = [Object.assign(session(9, 'Karan', 800, []), { date: '2020-01-01' })];

    call(ctx, 'checkDayRollover()');
    assert.equal(S.workDate, '2020-01-01');
    assert.equal(S.sessions.length, 1);
  });

  test('does nothing when the working day is already today', () => {
    const today = call(ctx, 'todayStr()');
    const S = resetState(ctx, { workDate: today });
    S.sessions = [Object.assign(session(9, 'Karan', 800, []), { date: today })];

    call(ctx, 'checkDayRollover()');
    assert.equal(S.workDate, today);
    assert.equal(S.sessions.length, 1);
  });

  test('prunes leftover rows from days already in the ledger', () => {
    const today = call(ctx, 'todayStr()');
    const S = resetState(ctx, { workDate: today });
    S.ledger = [{ date: '2026-08-18' }];
    S.sessions = [
      Object.assign(session(9, 'Karan', 800, []), { date: '2026-08-18' }),
      Object.assign(session(8, 'Rahul', 800, []), { date: today }),
    ];

    call(ctx, 'checkDayRollover()');
    assert.deepEqual(S.sessions.map(s => s.supName), ['Rahul']);
  });

  test('is scheduled to run on a timer, not only on user action', () => {
    const { timers } = boot();
    assert.ok(timers.intervals.some(t => t.ms === 60000),
      'a 60s rollover check must be installed at boot');
  });
});
