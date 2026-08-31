// ── STOCK IS A BALANCE AS AT A DATE ──
//
// Every stock figure is the sum of dated movements up to a cut-off. The point
// of that is backdating: open the 19th and you must see what was on the floor
// on the 19th, not what is there now.
//
// It used to sum every movement ever recorded, with the date on the row never
// read. So a past day showed its own production and attendance beside TODAY's
// stock — and the availability checks that gate a transfer were answering for
// the wrong day, blocking moves that were valid when they happened.
//
// The cut-off defaults to S.workDate, so nothing about a normal day changes.
// The "today is unaffected" tests below are what pins that down.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx } = boot();

const fgDay = (date, stage, product, qty) => ({
  date,
  sessions: [{ supId: 9, supName: 'Karan', date, teams: [
    { teamId: 1, stage, team: [], production: [{ name: product, qty, value: qty * 100 }] },
  ] }],
  rawLog: [], attendance: [],
});

/**
 * Point the state at `date` the way openWorkDate() does for a closed day: the
 * open day's production lives in S.sessions, and closedDaysExcludingOpen()
 * deliberately leaves that day out of the ledger sum so it is not counted
 * twice. A fixture that sets workDate without loading the sessions is not a
 * state the app can actually be in.
 */
function openOn(S, date) {
  S.workDate = date;
  const entry = (S.ledger || []).find(e => e.date === date);
  S.sessions = entry ? JSON.parse(JSON.stringify(entry.sessions || [])) : [];
  S.rawLog   = entry ? JSON.parse(JSON.stringify(entry.rawLog   || [])) : [];
  return S;
}

/** Three closed days of Moulding output: 5 on the 18th, 7 on the 19th, 9 on the 20th. */
function threeDays(extra = {}) {
  const S = resetState(ctx, Object.assign({
    workDate: '2026-08-20',
    fgStock: { Moulding: {} },
    fg: [{ id: 1, name: 'Chair A', price: 100 }],
    ledger: [
      fgDay('2026-08-18', 'Moulding', 'Chair A', 5),
      fgDay('2026-08-19', 'Moulding', 'Chair A', 7),
      fgDay('2026-08-20', 'Moulding', 'Chair A', 9),
    ],
  }, extra));
  return openOn(S, S.workDate);
}

describe('finished goods — balance as at the open day', () => {
  test('production after the open day is not counted', () => {
    const S = threeDays();
    openOn(S, '2026-08-19');   // the 20th is now in the future

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 12,
      'the 18th and 19th only — 5 + 7');
  });

  test('the same query on the latest day counts everything', () => {
    threeDays();   // workDate 2026-08-20
    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 21, '5 + 7 + 9');
  });

  test('an explicit cut-off overrides the open day', () => {
    threeDays();
    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding","2026-08-18")'), 5);
    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding","2026-08-19")'), 12);
    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding","2026-08-31")'), 21);
  });

  test('a transfer out after the open day does not deplete it', () => {
    // The case that made past-date entry actively wrong: stock moved onward on
    // the 20th was subtracted from what the 19th was allowed to use.
    const S = threeDays();
    S.fgTransfers = [
      { id: 1, date: '2026-08-20', from: 'Moulding', to: 'Finishing', product: 'Chair A', qty: 10 },
    ];
    openOn(S, '2026-08-19');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 12,
      "the 20th's transfer has not happened yet on the 19th");
    assert.equal(call(ctx, 'getFGBalance("Chair A","Finishing")'), 0,
      'and nothing has arrived downstream either');
  });

  test('a transfer on or before the open day does deplete it', () => {
    const S = threeDays();
    S.fgTransfers = [
      { id: 1, date: '2026-08-19', from: 'Moulding', to: 'Finishing', product: 'Chair A', qty: 4 },
    ];
    openOn(S, '2026-08-19');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 8, '12 − 4');
    assert.equal(call(ctx, 'getFGBalance("Chair A","Finishing")'), 4);
  });

  test('an adjustment after the open day is not applied', () => {
    const S = threeDays();
    S.fgAdjustments = [{ id: 1, date: '2026-08-20', stage: 'Moulding', product: 'Chair A', qty: -6 }];
    openOn(S, '2026-08-19');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 12);
  });

  test('rows with no date at all still count, on any day', () => {
    // Everything written before the dating fixes has no `date`. Dropping those
    // would deflate every balance that depends on them, with no visible cause.
    const S = threeDays();
    S.fgTransfers = [{ id: 1, from: 'Moulding', to: 'Finishing', product: 'Chair A', qty: 3 }];
    openOn(S, '2026-08-18');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 2, '5 − 3');
  });

  test('opening stock is always in scope, however early the cut-off', () => {
    const S = threeDays();
    S.fgStock = { Moulding: { 'Chair A': 100 } };
    openOn(S, '2026-08-18');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 105,
      'the opening balance is what the movements move from');
  });

  test('the open day\'s own unsaved production counts on that day', () => {
    const S = resetState(ctx, {
      workDate: '2026-08-19',
      fgStock: { Moulding: {} },
      ledger: [fgDay('2026-08-18', 'Moulding', 'Chair A', 5)],
      sessions: [{ supId: 9, supName: 'K', date: '2026-08-19', teams: [
        { teamId: 1, stage: 'Moulding', team: [], production: [{ name: 'Chair A', qty: 6 }] },
      ] }],
    });
    void S;

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 11, '5 closed + 6 open');
  });
});

describe('raw materials — balance as at the open day', () => {
  const rmDay = (date, name, qty) => ({ date, sessions: [], attendance: [],
    rawLog: [{ id: date, stage: 'Moulding', name, unit: 'kg', qty }] });

  function rmFixture() {
    return resetState(ctx, {
      workDate: '2026-08-20',
      rm: [{ id: 1, name: 'Resin', unit: 'kg', price: 220 }],
      stock: [{ id: 1, name: 'Resin', unit: 'kg', opening: 100, reorder: 10,
                openingDate: '2026-08-01' }],
      purchases: [
        { id: 1, date: '2026-08-18', name: 'Resin', unit: 'kg', qty: 50, cost: 11000 },
        { id: 2, date: '2026-08-20', name: 'Resin', unit: 'kg', qty: 80, cost: 17600 },
      ],
      ledger: [rmDay('2026-08-18', 'Resin', 10), rmDay('2026-08-19', 'Resin', 20)],
    });
  }

  test('a purchase received after the open day is not yet on hand', () => {
    const S = rmFixture();
    openOn(S, '2026-08-19');

    const r = call(ctx, 'getRMBalance("Resin")');
    assert.equal(r.purchased, 50, 'only the 18th delivery has arrived');
    assert.equal(r.issuedHistory, 10, "the 18th; the open day is counted from rawLog");
    assert.equal(r.issuedOpen, 20, "the 19th's own issues");
    assert.equal(r.balance, 120, '100 + 50 − 10 − 20');
  });

  test('on the latest day everything counts', () => {
    rmFixture();
    const r = call(ctx, 'getRMBalance("Resin")');
    assert.equal(r.purchased, 130);
    assert.equal(r.balance, 200, '100 + 130 − 30');
  });

  test('a reopened closed day is not counted twice', () => {
    // The ledger entry for the open day and S.rawLog describe the SAME issues.
    // Summing the whole ledger and then adding S.rawLog charged them twice,
    // understating the balance and able to raise a false reorder alarm.
    const S = rmFixture();
    S.workDate = '2026-08-19';
    S.reopenDate = '2026-08-19';
    S.rawLog = [{ id: 'x', stage: 'Moulding', name: 'Resin', unit: 'kg', qty: 20 }];

    const r = call(ctx, 'getRMBalance("Resin")');
    assert.equal(r.issuedHistory, 10, "the open day's ledger copy is excluded");
    assert.equal(r.issuedOpen, 20, 'and counted once, from rawLog');
    assert.equal(r.balance, 120, '100 + 50 − 10 − 20');
  });

  test('an unknown material reads as zero rather than throwing', () => {
    rmFixture();
    assert.equal(call(ctx, 'getRMBalance("Nothing").balance'), 0);
  });
});

describe('what the factory floor actually sees', () => {
  test('a transfer is judged against the balance on the day being recorded', () => {
    // saveFGTransfer refuses a move larger than the stage balance. With an
    // all-time balance that check answered for today, so recording a past day
    // could be blocked by stock that had since been moved on — or allowed to
    // move stock that did not exist yet.
    const S = resetState(ctx, {
      workDate: '2026-08-19',
      fgStock: { Moulding: {}, Finishing: {} },
      fg: [{ id: 1, name: 'Chair A', price: 100 }],
      ledger: [
        fgDay('2026-08-19', 'Moulding', 'Chair A', 10),
        fgDay('2026-08-20', 'Moulding', 'Chair A', 50),
      ],
      sessions: [],
    });
    openOn(S, '2026-08-19');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Moulding")'), 10,
      'the 50 made on the 20th is not available on the 19th');

    // Try to move 30 on the 19th — more than that day held.
    S.fgTransfers = [];
    const doc = (id, v) => { call(ctx, `document.getElementById(${JSON.stringify(id)}).value = ${JSON.stringify(v)}`); };
    doc('fgt-from', 'Moulding'); doc('fgt-to', 'Finishing');
    doc('fgt-prod', 'Chair A');  doc('fgt-qty', '30');
    doc('fgt-date', '2026-08-19'); doc('fgt-note', '');
    call(ctx, 'saveFGTransfer()');

    assert.equal(S.fgTransfers.length, 0,
      'the move is refused against the 19th, not permitted by the 20th\'s stock');
  });
});
