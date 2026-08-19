// ── OVERTIME & MONEY FORMATTING ──
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './harness.mjs';

const { win } = boot();
const { calcOT, otAmt, fmt, fmtN, isOverdue, uid, todayStr } = win;

describe('calcOT — OT is (daily wage / 8) per hour', () => {
  test('pays wage/8 per OT hour', () => {
    assert.equal(calcOT({ wage: 800, doingOT: true, otHours: 2 }), 200);
    assert.equal(calcOT({ wage: 600, doingOT: true, otHours: 4 }), 300);
  });

  test('rounds to the nearest rupee', () => {
    // 450/8 = 56.25/hr; x3 = 168.75
    assert.equal(calcOT({ wage: 450, doingOT: true, otHours: 3 }), 169);
  });

  test('pays nothing unless doingOT is set', () => {
    assert.equal(calcOT({ wage: 800, doingOT: false, otHours: 8 }), 0);
  });

  test('ignores the legacy flat `ot` field entirely', () => {
    // `ot` used to be a flat rupee/day amount. It must not reach any total.
    assert.equal(calcOT({ wage: 800, doingOT: true, otHours: 0, ot: 500 }), 0);
  });

  test('survives missing, null and non-numeric input', () => {
    assert.equal(calcOT(null), 0);
    assert.equal(calcOT(undefined), 0);
    assert.equal(calcOT({ doingOT: true }), 0);
    assert.equal(calcOT({ wage: 'abc', doingOT: true, otHours: 'x' }), 0);
  });

  test('otAmt is an alias of calcOT, not a second formula', () => {
    const w = { wage: 725, doingOT: true, otHours: 5 };
    assert.equal(otAmt(w), calcOT(w));
  });
});

describe('formatting helpers', () => {
  test('fmt renders Indian-grouped rupees', () => {
    assert.equal(fmt(0), '₹0');
    assert.equal(fmt(1234), '₹1,234');
    assert.equal(fmt(100000), '₹1,00,000');   // lakh grouping, not 100,000
    assert.equal(fmt(-500), '₹-500');
  });

  test('fmt rounds rather than truncating', () => {
    assert.equal(fmt(99.6), '₹100');
    assert.equal(fmtN(99.4), '99');
  });
});

describe('todayStr', () => {
  test('returns local-calendar YYYY-MM-DD', () => {
    assert.match(todayStr(), /^\d{4}-\d{2}-\d{2}$/);
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    assert.equal(todayStr(), expected);
  });

  test('does not drift to the previous day via UTC', () => {
    // The bug this guards: new Date().toISOString().slice(0,10) is UTC, so in
    // IST (+5:30) everything before 05:30 local lands on yesterday's date.
    assert.equal(todayStr().length, 10);
  });
});

describe('isOverdue', () => {
  test('flags a past due date on a live order', () => {
    assert.equal(isOverdue({ status: 'pending', requiredBy: '2020-01-01' }), true);
  });
  test('never flags a dispatched order', () => {
    assert.equal(isOverdue({ status: 'dispatched', requiredBy: '2020-01-01' }), false);
  });
  test('never flags an order with no due date', () => {
    assert.equal(isOverdue({ status: 'pending', requiredBy: '' }), false);
  });
  test('does not flag a future due date', () => {
    assert.equal(isOverdue({ status: 'pending', requiredBy: '2099-01-01' }), false);
  });
});

describe('uid', () => {
  // Regression guard. uid() used to ADD the random part to the clock
  // (`Date.now() + random*99999`), collapsing the id space into a ~100s band
  // and colliding ~22 times per 2,000 draws. These are Postgres primary keys
  // and the upsert conflict target for raw_log and fg_transfers, so a
  // collision silently overwrote another row. It now shifts instead of adding.
  test('generates distinct ids across a tight loop', () => {
    const ids = new Set();
    for (let i = 0; i < 20000; i++) ids.add(uid());
    assert.equal(ids.size, 20000, `only ${ids.size}/20000 unique ids`);
  });

  test('ids are strictly increasing, so an id can never be reissued', () => {
    let prev = uid();
    for (let i = 0; i < 20000; i++) {
      const next = uid();
      assert.ok(next > prev, `id went backwards: ${next} after ${prev}`);
      prev = next;
    }
  });

  test('stays unique through a bulk import minting hundreds per millisecond', () => {
    // uploadRM/uploadLab call uid() once per spreadsheet row in a tight loop.
    const ids = new Set();
    for (let i = 0; i < 5000; i++) ids.add(uid());
    assert.equal(ids.size, 5000);
  });

  test('stays inside the safe integer range well beyond the app lifetime', () => {
    // Precision loss above 2^53 would silently merge distinct ids.
    const inYear2100 = new Date('2100-01-01T00:00:00Z').getTime() * 2048 + 2047;
    assert.ok(Number.isSafeInteger(inYear2100), 'uid() must stay exactly representable');
    assert.ok(Number.isSafeInteger(uid()));
  });

  test('cannot collide with ids minted by the old formula', () => {
    // Legacy rows are already in Postgres; new ids must not land on them.
    const legacyMax = Date.now() + 99999;
    assert.ok(uid() > legacyMax);
  });
});
