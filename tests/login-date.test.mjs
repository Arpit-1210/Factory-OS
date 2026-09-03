// ── LOGGING IN ON A PARTICULAR DATE ──
//
// The login page offers a work-date field so a missed day can be entered
// afterwards. onLoginSuccess() used to apply it by assigning S.workDate and
// nulling S.reopenDate directly, bypassing openWorkDate() — which is the only
// thing that consults the ledger, loads a closed day, paints the banner and
// persists. Four separate symptoms came out of that one shortcut, and each has
// a test here:
//
//   · the 60-second rollover interval moved the user back to today
//   · a closed day opened EMPTY instead of showing what was recorded
//   · no "editing closed history" banner
//   · a reload lost the chosen day
//
// The dates are relative to the real today because that is what the code
// compares against: todayStr() reads the system clock, and a hard-coded past
// date would stop exercising the rollover once the calendar passed it.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, getState, resetState, call } from './harness.mjs';

const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
                   '-' + String(d.getDate()).padStart(2, '0');
const today = () => iso(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const daysAhead = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

const worker = (id, name) => ({ id, name, role: 'Floor worker', wage: 500, isSup: false,
                                present: false, doingOT: false, otHours: 0 });

/** Sign in with `date` in the login page's work-date field. */
function loginOn(h, date, role = 'owner') {
  h.document.getElementById('login-work-date').value = date || '';
  call(h.ctx, `setRole(${JSON.stringify(role)})`);
  call(h.ctx, 'onLoginSuccess("Tester")');
}

describe('login on a past date — the day holds', () => {
  test('a CLOSED past day is marked reopened, not left looking like today', () => {
    // The reopened flag is what every other guard keys off. Without it the day
    // is indistinguishable from an ordinary open day.
    const h = boot();
    const when = daysAgo(3);
    const S = resetState(h.ctx, {
      workDate: today(),
      lab: [worker(1, 'Ramesh')],
      ledger: [{ date: when, sessions: [], rawLog: [], attendance: [] }],
    });

    loginOn(h, when);

    assert.equal(S.workDate, when, 'the app moves to the requested day');
    assert.equal(S.reopenDate, when, 'and records that it is deliberately in a closed day');
    assert.equal(call(h.ctx, 'isReopened()'), true);
  });

  test("a closed day shows what was recorded, not an empty sheet", () => {
    // The old code cleared sessions/rawLog/attendance and stopped there, so a
    // day that was already closed came up blank — and re-saving that blank day
    // replaced the real ledger entry with it.
    const h = boot();
    const when = daysAgo(2);
    const S = resetState(h.ctx, {
      workDate: today(),
      lab: [worker(1, 'Ramesh'), worker(2, 'Suresh')],
      ledger: [{
        date: when,
        sessions: [{ supId: 9, supName: 'Karan', date: when, teams: [] }],
        rawLog: [{ id: 1, stage: 'Moulding', name: 'Resin', qty: 4, unitPrice: 220, cost: 880 }],
        attendance: [{ id: 1, present: true, doingOT: true, otHours: 2 }],
      }],
    });

    loginOn(h, when);

    assert.equal(S.sessions.length, 1, "the closed day's production comes back");
    assert.equal(S.rawLog.length, 1, 'and its raw log');
    assert.equal(S.lab[0].present, true, 'and its attendance');
    assert.equal(S.lab[0].otHours, 2);
    assert.equal(S.lab[1].present, false, 'workers absent that day stay absent');
  });

  test('the 60-second rollover check does not drag the user back to today', () => {
    // THE headline bug. checkDayRollover() runs on an interval from app.js and
    // its first guard is `if(isReopened()) return`. Login never set reopenDate,
    // so a closed past day failed that guard, fell through to the "past day is
    // saved" branch, and was replaced with today within a minute — taking the
    // day's entered work with it.
    const h = boot();
    const when = daysAgo(4);
    const S = resetState(h.ctx, {
      workDate: today(),
      lab: [worker(1, 'Ramesh')],
      ledger: [{ date: when, sessions: [], rawLog: [], attendance: [] }],
    });

    loginOn(h, when);
    assert.equal(S.workDate, when);

    call(h.ctx, 'checkDayRollover()');

    assert.equal(S.workDate, when, 'the interval leaves a deliberately opened day alone');
    assert.equal(S.reopenDate, when);
  });

  test('an UNSAVED past day opens as itself, with nothing to restore', () => {
    const h = boot();
    const when = daysAgo(1);
    const S = resetState(h.ctx, {
      workDate: today(),
      lab: [worker(1, 'Ramesh', true)],
      sessions: [{ supId: 1, supName: 'X', date: today(), teams: [] }],
      ledger: [],
    });
    S.lab[0].present = true;

    loginOn(h, when);

    assert.equal(S.workDate, when);
    assert.equal(S.reopenDate, null, 'an open day is not "reopened history"');
    assert.equal(S.sessions.length, 0, "today's session does not follow us onto the past day");
    assert.equal(S.lab[0].present, false, "nor today's attendance");
    call(h.ctx, 'checkDayRollover()');
    assert.equal(S.workDate, when, 'and an unsaved past day is never auto-closed away');
  });

  test('the reopen banner is shown, so editing history is not mistaken for today', () => {
    const h = boot();
    const when = daysAgo(5);
    resetState(h.ctx, {
      workDate: today(),
      lab: [worker(1, 'Ramesh')],
      ledger: [{ date: when, sessions: [], rawLog: [], attendance: [] }],
    });

    loginOn(h, when);

    const banner = h.document.getElementById('reopen-banner');
    assert.equal(banner.style.display, 'flex', 'the amber banner is visible');
    const txt = h.document.getElementById('reopen-banner-text').textContent;
    assert.match(txt, /closed/i, 'and says the day is closed');
  });

  test('the header date picker is moved to the chosen day too', () => {
    const h = boot();
    const when = daysAgo(6);
    resetState(h.ctx, { workDate: today(), lab: [], ledger: [] });

    loginOn(h, when);

    assert.equal(h.document.getElementById('work-date').value, when,
      'the header must not keep showing today while work is filed under another day');
  });
});

describe('login on a past date — it survives a reload', () => {
  test('the chosen closed day is persisted and comes back', () => {
    // The old code wrote nothing to localStorage, so a refresh fell into
    // loadState()'s third branch (stored day is closed, reopenDate does not
    // match) and snapped to today with the day wiped.
    const h = boot();
    const when = daysAgo(3);
    resetState(h.ctx, {
      workDate: today(),
      lab: [worker(1, 'Ramesh')],
      ledger: [{ date: when, sessions: [], rawLog: [],
                 attendance: [{ id: 1, present: true, doingOT: false, otHours: 0 }] }],
    });

    loginOn(h, when);

    const saved = h.localStorage.getItem('frp_factory_v5');
    assert.ok(saved, 'the chosen day is written to localStorage immediately');
    assert.equal(JSON.parse(saved).workDate, when);
    assert.equal(JSON.parse(saved).reopenDate, when);

    // Reload: a fresh boot reading back exactly what was stored.
    const h2 = boot({ localStorageSeed: { frp_factory_v5: saved } });
    const S2 = getState(h2.ctx);

    assert.equal(S2.workDate, when, 'a refresh stays on the day being edited');
    assert.equal(S2.reopenDate, when, 'and still knows it is closed history');
    assert.equal(S2.lab[0].present, true, "and keeps the day's attendance");
  });
});

describe('login date — bad input', () => {
  test('a future date is refused and the app stays on today', () => {
    // The header picker rejects future dates; this field did not, and its
    // `max` was set only on logout — so a fresh page offered an unbounded
    // picker, and work would have been filed under a day that has not happened.
    const h = boot();
    const S = resetState(h.ctx, { workDate: today(), lab: [], ledger: [] });

    loginOn(h, daysAhead(7));

    assert.equal(S.workDate, today(), 'the future date is ignored');
    assert.ok(!S.reopenDate);
  });

  test("today's own date behaves exactly like leaving the field blank", () => {
    const h = boot();
    const S = resetState(h.ctx, { workDate: today(), lab: [], ledger: [] });

    loginOn(h, today());

    assert.equal(S.workDate, today());
    assert.ok(!S.reopenDate);
  });

  test('the login date field is capped at today on load', () => {
    const h = boot();
    assert.equal(h.document.getElementById('login-work-date').max, today(),
      'the picker itself must not offer a future day');
  });
});

describe('what gets recorded while logged in on a past date', () => {
  // Every one of these wrote the real calendar date, so work entered for a past
  // day landed on today: the day being edited stayed wrong no matter how
  // carefully it was filled in.
  const onPastDay = (extra = {}) => {
    const h = boot();
    const when = daysAgo(3);
    const S = resetState(h.ctx, Object.assign({
      workDate: when, ledger: [], lab: [],
      rm: [{ id: 1, name: 'Resin', unit: 'kg', price: 220 }],
      fg: [{ id: 1, name: 'Chair A', price: 1000 }],
    }, extra));
    return { h, S, when };
  };

  test('a Quick Transfer of finished goods is dated to the day being worked', () => {
    const { h, S, when } = onPastDay({ fgStock: { Moulding: { 'Chair A': 10 } } });
    h.win.prompt = () => '5';   // quickTransfer asks for the quantity

    call(h.ctx, 'quickTransfer("Moulding","Finishing","Chair A",10)');

    assert.equal(S.fgTransfers.length, 1);
    assert.equal(S.fgTransfers[0].date, when, 'not the calendar date');
  });

  test('a stock adjustment is dated to the day being worked', () => {
    const { h, S, when } = onPastDay();
    h.document.getElementById('fga-stage').value = 'Moulding';
    h.document.getElementById('fga-prod').value = 'Chair A';
    h.document.getElementById('fga-qty').value = '-2';

    call(h.ctx, 'saveFGAdjust()');

    assert.equal(S.fgAdjustments.length, 1);
    assert.equal(S.fgAdjustments[0].date, when);
  });

  test('a raw-material purchase is dated to the day being worked', () => {
    const { h, S, when } = onPastDay();
    h.document.getElementById('pur-mat').options = [{ value: '1', getAttribute: () => 'kg' }];
    h.document.getElementById('pur-mat').selectedIndex = 0;
    h.document.getElementById('pur-qty').value = '10';
    h.document.getElementById('pur-cost').value = '2200';

    call(h.ctx, 'savePurchase()');

    assert.equal(S.purchases.length, 1);
    assert.equal(S.purchases[0].date, when,
      'the receipt must not sort above the issues it covers');
  });

  test('the Unit 2 "today" tile counts the day being worked', () => {
    // The rows are written with S.workDate and were counted against
    // todayStr(), so this tile read 0 while the log underneath filled up.
    const { h, S, when } = onPastDay();
    S.unitTransfers = [
      { id: 1, date: when, direction: 'Unit 1 → Unit 2', type: 'RM', item: 'Resin' },
      { id: 2, date: daysAgo(9), direction: 'Unit 1 → Unit 2', type: 'RM', item: 'Resin' },
    ];

    call(h.ctx, 'renderUnitTransfers()');

    const metrics = h.document.getElementById('ut-metrics').innerHTML;
    assert.match(metrics, />Today<\/div><div class="mv w">1</,
      'one transfer on the open day');
  });

  test('the salary screen opens on the month of the day being worked', () => {
    const h = boot();
    // A day in the previous month, so the calendar month and the work month
    // genuinely differ.
    const d = new Date(); d.setDate(1); d.setDate(0);
    const when = iso(d);
    resetState(h.ctx, { workDate: when, ledger: [], lab: [worker(1, 'Ramesh')] });
    h.document.getElementById('sal-month').value = '';

    call(h.ctx, 'renderSalary()');

    assert.equal(h.document.getElementById('sal-month').value, when.slice(0, 7),
      'otherwise the open day is filtered out of its own payroll');
  });
});

describe('login with NO date chosen opens today', () => {
  // An empty field used to mean "whatever day this device was left on".
  // S.workDate is restored from localStorage and loadState() deliberately keeps
  // an unclosed past day open, so signing in blank could land on last week and
  // a shift got recorded there without anyone choosing it.
  const seedOn = (day, extra = {}) => ({
    frp_factory_v5: JSON.stringify(Object.assign({
      workDate: day, ledger: [], lab: [], sessions: [],
    }, extra)),
  });

  test('a stale open day from last week is not resumed', () => {
    const stale = daysAgo(4);
    const h = boot({ localStorageSeed: seedOn(stale) });
    const S = getState(h.ctx);
    assert.equal(S.workDate, stale, 'the device really was left on that day');

    loginOn(h, '');                       // nothing chosen

    assert.equal(S.workDate, today(), 'signing in blank starts today');
    assert.ok(!S.reopenDate);
  });

  test('a closed-and-reopened past day is not resumed either', () => {
    const stale = daysAgo(4);
    const h = boot({ localStorageSeed: seedOn(stale, {
      reopenDate: stale,
      ledger: [{ date: stale, sessions: [], rawLog: [], attendance: [] }],
    }) });
    const S = getState(h.ctx);

    loginOn(h, '');

    assert.equal(S.workDate, today());
    assert.ok(!S.reopenDate, 'and it is no longer treated as editing history');
  });

  test('a today that is already closed moves on rather than reopening it', () => {
    const h = boot({ localStorageSeed: seedOn(daysAgo(2), {
      ledger: [{ date: today(), sessions: [], rawLog: [], attendance: [] }],
    }) });
    const S = getState(h.ctx);

    loginOn(h, '');

    assert.notEqual(S.workDate, daysAgo(2));
    assert.ok(S.workDate > today(), 'lands on the next day that is not closed');
    assert.ok(!S.reopenDate, 'a fresh day, not reopened history');
  });

  test('an unclosed day left behind is reported, not buried', () => {
    // Moving to today must not silently strand a real shift: an unclosed day
    // has no ledger row, so it is absent from Monthly and payroll while its
    // rows sit in Postgres under a date nothing asks about.
    const stale = daysAgo(3);
    const h = boot({ localStorageSeed: seedOn(stale, {
      lab: [{ id: 1, name: 'R', role: 'w', wage: 500, present: true, doingOT: false, otHours: 0 }],
      sessions: [{ supId: 1, supName: 'R', date: stale, teams: [] }],
    }) });
    const S = getState(h.ctx);

    loginOn(h, '');

    assert.equal(S.workDate, today(), 'still starts today');
    assert.equal(S.unclosedDay, stale, 'and remembers what was left open');
    const banner = h.document.getElementById('unclosed-banner');
    assert.equal(banner.style.display, 'flex');
    assert.match(h.document.getElementById('unclosed-banner-text').textContent,
      /left open and never closed/i);
  });

  test('an EMPTY day left behind is not worth reporting', () => {
    const h = boot({ localStorageSeed: seedOn(daysAgo(3)) });
    const S = getState(h.ctx);

    loginOn(h, '');

    assert.equal(S.workDate, today());
    assert.ok(!S.unclosedDay, 'no attendance, no production, nothing to chase');
    assert.equal(h.document.getElementById('unclosed-banner').style.display, 'none');
  });

  test('a day that WAS closed is not reported as unclosed', () => {
    const stale = daysAgo(3);
    const h = boot({ localStorageSeed: seedOn(stale, {
      ledger: [{ date: stale, sessions: [], rawLog: [], attendance: [] }],
      lab: [{ id: 1, name: 'R', role: 'w', wage: 500, present: true, doingOT: false, otHours: 0 }],
    }) });
    const S = getState(h.ctx);

    loginOn(h, '');
    assert.ok(!S.unclosedDay, 'it is properly recorded — nothing to warn about');
  });

  test('the notice takes you to that day so it can be closed', () => {
    const stale = daysAgo(3);
    const h = boot({ localStorageSeed: seedOn(stale, {
      lab: [{ id: 1, name: 'R', role: 'w', wage: 500, present: true, doingOT: false, otHours: 0 }],
      sessions: [{ supId: 1, supName: 'R', date: stale, teams: [] }],
    }) });
    const S = getState(h.ctx);
    loginOn(h, '');

    call(h.ctx, 'openUnclosedDay()');

    assert.equal(S.workDate, stale, 'the day is open again, ready to be closed');
    assert.equal(h.document.getElementById('unclosed-banner').style.display, 'none',
      'and the notice steps aside once you are on it');
  });

  test('the notice can be dismissed', () => {
    const stale = daysAgo(3);
    const h = boot({ localStorageSeed: seedOn(stale, {
      lab: [{ id: 1, name: 'R', role: 'w', wage: 500, present: true, doingOT: false, otHours: 0 }],
      sessions: [{ supId: 1, supName: 'R', date: stale, teams: [] }],
    }) });
    const S = getState(h.ctx);
    loginOn(h, '');

    call(h.ctx, 'dismissUnclosedDay()');

    assert.ok(!S.unclosedDay);
    assert.equal(h.document.getElementById('unclosed-banner').style.display, 'none');
  });
});
