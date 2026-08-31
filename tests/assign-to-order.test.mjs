// ── ASSIGNING PACKED STOCK TO A CUSTOMER ORDER ──
//
// Two faults met here and between them made the feature unusable for the
// products it mattered most for.
//
//   1. Production logs a VARIANT name — "Chair A — Red" — while an order is
//      written from the catalogue and says "Chair A". The modal searched the
//      order text for the full variant name, so every coloured product
//      reported "No open order lists this product" no matter how much of it
//      was sitting in Packing. There was no way to assign it at all.
//
//   2. Dispatch reads `order.assignedItems` to move only what has not been
//      assigned yet. Nothing ever wrote that field, so an assignment was
//      invisible to dispatch and the whole order quantity left Packing a
//      second time.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx, document } = boot();

const order = (extra = {}) => Object.assign({
  id: 'ORD-1', customer: 'Acme', status: 'ready',
  items: 'Chair A x5', amount: 5000, advance: 0,
  fgItems: [{ name: 'Chair A', qty: 5, price: 1000 }],
}, extra);

/** A closed day that packed `qty` of `name` (with `base` as its catalogue product). */
const packedDay = (date, name, base, qty) => ({
  date, rawLog: [], attendance: [],
  sessions: [{ supId: 9, supName: 'K', date, teams: [
    { teamId: 1, stage: 'Packing', team: [],
      production: [{ name, baseName: base, qty, value: qty * 1000 }] },
  ] }],
});

const modalHTML = () => document.getElementById('assign-order-list').innerHTML;

describe('finding the orders that want a product', () => {
  test('a colour variant is matched to the order for its catalogue product', () => {
    resetState(ctx, {
      workDate: '2026-08-31',
      fg: [{ id: 1, name: 'Chair A', price: 1000 }],
      fgStock: { Packing: {} },
      ledger: [packedDay('2026-08-30', 'Chair A — Red', 'Chair A', 20)],
      orders: [order()],
    });

    assert.equal(call(ctx, 'getFGBalance("Chair A — Red","Packing")'), 20,
      'the stock is unquestionably there');

    call(ctx, 'openAssignModal("Chair A — Red", 20, "fgstock")');

    assert.ok(!modalHTML().includes('No open order'),
      'the order for "Chair A" is offered for "Chair A — Red"');
    assert.ok(modalHTML().includes('Acme'));
  });

  test('a plain product still matches its own order', () => {
    resetState(ctx, {
      workDate: '2026-08-31',
      fg: [{ id: 1, name: 'Chair A', price: 1000 }],
      fgStock: { Packing: { 'Chair A': 20 } },
      orders: [order()],
    });

    call(ctx, 'openAssignModal("Chair A", 20, "fgstock")');
    assert.ok(!modalHTML().includes('No open order'));
  });

  test('an unrelated product is not offered the order', () => {
    resetState(ctx, {
      workDate: '2026-08-31',
      fg: [{ id: 1, name: 'Chair A', price: 1000 }, { id: 2, name: 'Table B', price: 2000 }],
      fgStock: { Packing: { 'Table B': 5 } },
      orders: [order()],
    });

    call(ctx, 'openAssignModal("Table B", 5, "fgstock")');
    assert.ok(modalHTML().includes('No open order'),
      'matching on the base name must not match everything');
  });

  test('a dispatched order is not offered again', () => {
    resetState(ctx, {
      workDate: '2026-08-31',
      fg: [{ id: 1, name: 'Chair A', price: 1000 }],
      fgStock: { Packing: { 'Chair A': 20 } },
      orders: [order({ status: 'dispatched' })],
    });

    call(ctx, 'openAssignModal("Chair A", 20, "fgstock")');
    assert.ok(modalHTML().includes('No open order'));
  });
});

describe('assigning, then dispatching, moves the stock once', () => {
  function assignThenDispatch(productName) {
    const S = resetState(ctx, {
      workDate: '2026-08-31',
      fg: [{ id: 1, name: 'Chair A', price: 1000 }],
      fgStock: { Packing: {} },
      ledger: [packedDay('2026-08-30', productName, 'Chair A', 20)],
      orders: [order()],
    });

    call(ctx, `openAssignModal(${JSON.stringify(productName)}, 20, "fgstock")`);
    document.getElementById('asg-qty-ORD-1').value = '5';
    call(ctx, 'confirmAssign("ORD-1")');
    return S;
  }

  test('the assignment is recorded on the order', () => {
    const S = assignThenDispatch('Chair A');
    assert.deepEqual(JSON.parse(JSON.stringify(S.orders[0].assignedItems)), { 'Chair A': 5 },
      'keyed by the catalogue name, which is what dispatch looks up');
  });

  test('a variant assignment is recorded under its catalogue name', () => {
    const S = assignThenDispatch('Chair A — Red');
    assert.deepEqual(JSON.parse(JSON.stringify(S.orders[0].assignedItems)), { 'Chair A': 5 });
  });

  test('dispatch does not take the quantity out of Packing a second time', () => {
    const S = assignThenDispatch('Chair A');
    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing")'), 15, '20 − 5 assigned');

    call(ctx, 'updateOrderStatus("ORD-1","dispatched")');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing")'), 15,
      'the 5 already assigned are not moved again');
    assert.equal(S.fgTransfers.length, 1, 'one movement for one order line');
    assert.equal(S.fgTransfers[0].to, 'Order');
  });

  test('dispatching an unassigned order still deducts the full quantity', () => {
    // The other half of the same rule: what was never assigned must still move
    // when the order goes out.
    const S = resetState(ctx, {
      workDate: '2026-08-31',
      fg: [{ id: 1, name: 'Chair A', price: 1000 }],
      fgStock: { Packing: { 'Chair A': 20 } },
      orders: [order()],
    });

    call(ctx, 'updateOrderStatus("ORD-1","dispatched")');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing")'), 15, '20 − 5 dispatched');
    assert.equal(S.fgTransfers.length, 1);
    assert.equal(S.fgTransfers[0].to, 'Dispatch');
  });

  test('a part assignment is topped up at dispatch, not doubled', () => {
    const S = resetState(ctx, {
      workDate: '2026-08-31',
      fg: [{ id: 1, name: 'Chair A', price: 1000 }],
      fgStock: { Packing: { 'Chair A': 20 } },
      orders: [order()],
    });

    call(ctx, 'openAssignModal("Chair A", 20, "fgstock")');
    document.getElementById('asg-qty-ORD-1').value = '2';
    call(ctx, 'confirmAssign("ORD-1")');
    call(ctx, 'updateOrderStatus("ORD-1","dispatched")');

    assert.equal(call(ctx, 'getFGBalance("Chair A","Packing")'), 15,
      '2 assigned + 3 remaining = the 5 the order was for');
    assert.deepEqual(S.fgTransfers.map(t => [t.to, t.qty]), [['Order', 2], ['Dispatch', 3]]);
  });
});

describe('baseProductName', () => {
  test('strips a colour suffix and leaves anything else alone', () => {
    assert.equal(call(ctx, 'baseProductName("Chair A — Red")'), 'Chair A');
    assert.equal(call(ctx, 'baseProductName("Chair A")'), 'Chair A');
    // An en dash or a bare hyphen is part of the product name, not a variant
    // separator — production writes an em dash with spaces around it.
    assert.equal(call(ctx, 'baseProductName("Chair A-Red")'), 'Chair A-Red');
    assert.equal(call(ctx, 'baseProductName("")'), '');
  });
});
