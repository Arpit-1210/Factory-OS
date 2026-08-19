// ── MONTHLY PAYROLL ──
// computeSalaryMonth() is the single source of truth behind both the Salary
// screen and the Excel/Sheets export, so these are the numbers that get paid.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx } = boot();
const salary = (month) => call(ctx, `computeSalaryMonth(${JSON.stringify(month)})`);

const WORKERS = [
  { id: 1, name: 'Ramesh', role: 'Floor worker', wage: 400, isSup: false, present: false, doingOT: false, otHours: 0 },
  { id: 2, name: 'Karan',  role: 'Supervisor',   wage: 800, isSup: true,  present: false, doingOT: false, otHours: 0 },
];
const clone = (o) => JSON.parse(JSON.stringify(o));
const day = (date, attendance) => ({ date, attendance });

function fixture(patch = {}) {
  const S = resetState(ctx, Object.assign({ lab: clone(WORKERS), workDate: '2026-09-01' }, patch));
  return S;
}

describe('computeSalaryMonth — ledger days', () => {
  test('gross = daily wage x days present', () => {
    const S = fixture();
    S.ledger = [
      day('2026-08-01', [{ id: 1, present: true }, { id: 2, present: true }]),
      day('2026-08-02', [{ id: 1, present: true }, { id: 2, present: false }]),
      day('2026-08-03', [{ id: 1, present: true }, { id: 2, present: true }]),
    ];
    const { rows, totals } = salary('2026-08');
    const ramesh = rows.find(r => r.l.id === 1);
    const karan  = rows.find(r => r.l.id === 2);

    assert.equal(ramesh.days, 3);
    assert.equal(ramesh.gross, 1200);          // 400 x 3
    assert.equal(karan.days, 2);
    assert.equal(karan.gross, 1600);           // 800 x 2
    assert.equal(totals.gross, 2800);
  });

  test('OT is paid on hours at wage/8, counted separately from days', () => {
    const S = fixture();
    S.ledger = [
      day('2026-08-01', [{ id: 1, present: true, doingOT: true, otHours: 2 }]),
      day('2026-08-02', [{ id: 1, present: true, doingOT: true, otHours: 3 }]),
    ];
    const ramesh = salary('2026-08').rows.find(r => r.l.id === 1);

    assert.equal(ramesh.days, 2);
    assert.equal(ramesh.otDay, 2);
    assert.equal(ramesh.otHrs, 5);
    assert.equal(ramesh.otAmt, 250);           // 400/8 = 50/hr x 5
    assert.equal(ramesh.gross, 1050);          // 800 base + 250 OT
  });

  test('uses the same wage/8 rate as calcOT — the two must never diverge', () => {
    const S = fixture();
    S.ledger = [day('2026-08-01', [{ id: 2, present: true, doingOT: true, otHours: 3 }])];
    const karan  = salary('2026-08').rows.find(r => r.l.id === 2);
    const direct = call(ctx, 'calcOT({wage:800,doingOT:true,otHours:3})');
    assert.equal(karan.otAmt, direct);
  });

  test('ignores days outside the requested month', () => {
    const S = fixture({ workDate: '2026-09-05' });
    S.ledger = [
      day('2026-07-31', [{ id: 1, present: true }]),
      day('2026-08-01', [{ id: 1, present: true }]),
      day('2026-09-01', [{ id: 1, present: true }]),
    ];
    assert.equal(salary('2026-08').rows.find(r => r.l.id === 1).days, 1);
  });

  test('a worker who never turns up earns 0, not NaN', () => {
    fixture();
    const { rows, totals } = salary('2026-08');
    rows.forEach(r => {
      assert.equal(r.days, 0);
      assert.equal(r.gross, 0);
      assert.equal(r.net, 0);
    });
    assert.equal(totals.gross, 0);
  });
});

describe('computeSalaryMonth — the open working day', () => {
  test('counts today when it is in the month and not yet in the ledger', () => {
    const S = fixture({ workDate: '2026-08-19' });
    S.lab[0].present = true;
    S.lab[0].doingOT = true;
    S.lab[0].otHours = 4;
    const ramesh = salary('2026-08').rows.find(r => r.l.id === 1);
    assert.equal(ramesh.days, 1);
    assert.equal(ramesh.otAmt, 200);           // 400/8 x 4
  });

  test('does NOT double-count a day already written to the ledger', () => {
    // The regression this guards: the open day used to be added
    // unconditionally, so the moment the day was saved every present worker
    // was paid twice for it.
    const S = fixture({ workDate: '2026-08-19' });
    S.lab[0].present = true;
    S.ledger = [day('2026-08-19', [{ id: 1, present: true }])];
    assert.equal(salary('2026-08').rows.find(r => r.l.id === 1).days, 1);
  });

  test('keys off workDate, not the wall clock, so back-dated entry lands right', () => {
    // Data entered on 19 Aug for a 31 Jul shift must be paid in July.
    const S = fixture({ workDate: '2026-07-31' });
    S.lab[0].present = true;
    assert.equal(salary('2026-07').rows.find(r => r.l.id === 1).days, 1);
    assert.equal(salary('2026-08').rows.find(r => r.l.id === 1).days, 0);
  });
});

describe('computeSalaryMonth — advances and deductions', () => {
  test('net = gross - advance - deduction, and totals agree', () => {
    const S = fixture();
    S.ledger = [
      day('2026-08-01', [{ id: 1, present: true }, { id: 2, present: true }]),
      day('2026-08-02', [{ id: 1, present: true }, { id: 2, present: true }]),
    ];
    S.salaryAdj = { '2026-08': {
      1: { advance: 200, deduction: 50, note: 'festival advance' },
      2: { advance: 0,   deduction: 100 },
    } };

    const { rows, totals } = salary('2026-08');
    const ramesh = rows.find(r => r.l.id === 1);
    const karan  = rows.find(r => r.l.id === 2);

    assert.equal(ramesh.gross, 800);
    assert.equal(ramesh.net, 550);             // 800 - 200 - 50
    assert.equal(ramesh.note, 'festival advance');
    assert.equal(karan.net, 1500);             // 1600 - 0 - 100

    assert.equal(totals.gross, 2400);
    assert.equal(totals.adv, 200);
    assert.equal(totals.ded, 150);
    assert.equal(totals.net, 2050);
    assert.equal(totals.net, totals.gross - totals.adv - totals.ded);
  });

  test('adjustments are scoped to their own month', () => {
    const S = fixture();
    S.ledger = [day('2026-08-01', [{ id: 1, present: true }])];
    S.salaryAdj = { '2026-07': { 1: { advance: 999 } } };
    assert.equal(salary('2026-08').rows.find(r => r.l.id === 1).adv, 0);
  });

  test('an advance larger than gross gives a negative net, not a clamp', () => {
    // Carry-forward is the owner's call; the figure must stay visible.
    const S = fixture();
    S.ledger = [day('2026-08-01', [{ id: 1, present: true }])];
    S.salaryAdj = { '2026-08': { 1: { advance: 1000 } } };
    assert.equal(salary('2026-08').rows.find(r => r.l.id === 1).net, -600);
  });

  test('tolerates a missing salaryAdj map', () => {
    const S = fixture();
    delete S.salaryAdj;
    assert.doesNotThrow(() => salary('2026-08'));
  });
});
