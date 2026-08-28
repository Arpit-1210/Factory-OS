// ── UNIT TRANSFERS + ASSIGN TO ORDER ──
// Both shipped as markup with no implementation behind them: the Transfers
// screen threw ReferenceError on navigation, and the assign modal's buttons
// did nothing. These pin the behaviour now that they exist.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx, win, document: doc } = boot();
const field = (id, value) => { doc.getElementById(id).value = value; };

function factory(patch = {}) {
  return resetState(ctx, Object.assign({
    workDate: '2026-08-19',
    rm: [{ id: 1, name: 'FRP Resin', unit: 'kg', price: 220 }],
    fg: [{ id: 9, name: 'Chair A', price: 5000 }],
  }, patch));
}

describe('saveUnitTransfer', () => {
  test('records the movement in the shape the Sheets script already expects', () => {
    // Date, Direction, Type, Item, Qty, Unit, Note, Logged By — the columns
    // APPS_SCRIPT_CODE writes. Diverging here would break the backup silently.
    const S = factory();
    field('ut-date', '2026-08-19');
    field('ut-dir', 'Unit1→Unit2');
    field('ut-type', 'RM');
    field('ut-item-search', 'FRP Resin');
    field('ut-unit', 'kg');
    field('ut-qty', '25');
    field('ut-value', '5500');
    field('ut-note', 'for the painting batch');
    call(ctx, 'saveUnitTransfer()');

    assert.equal(S.unitTransfers.length, 1);
    const t = S.unitTransfers[0];
    assert.equal(t.date, '2026-08-19');
    assert.equal(t.direction, 'Unit1→Unit2');
    assert.equal(t.type, 'RM');
    assert.equal(t.item, 'FRP Resin');
    assert.equal(t.qty, 25);
    assert.equal(t.unit, 'kg');
    assert.equal(t.value, 5500);
    assert.equal(t.note, 'for the painting batch');
    assert.ok(t.id > 1e15, 'uses the collision-safe id generator');
  });

  test('records the stage for finished goods, and leaves it blank for raw material', () => {
    const S = factory();
    field('ut-type', 'FG'); field('ut-stage', 'Painting');
    field('ut-item-search', 'Chair A'); field('ut-qty', '4');
    call(ctx, 'saveUnitTransfer()');
    assert.equal(S.unitTransfers[0].stage, 'Painting');

    field('ut-type', 'RM'); field('ut-item-search', 'FRP Resin'); field('ut-qty', '2');
    call(ctx, 'saveUnitTransfer()');
    assert.equal(S.unitTransfers[1].stage, '');
  });

  test('refuses an entry with no item or no quantity', () => {
    const S = factory();
    field('ut-item-search', ''); field('ut-qty', '5');
    call(ctx, 'saveUnitTransfer()');
    field('ut-item-search', 'FRP Resin'); field('ut-qty', '0');
    call(ctx, 'saveUnitTransfer()');
    assert.equal((S.unitTransfers || []).length, 0);
  });

  test('falls back to the working date when none is picked', () => {
    const S = factory({ workDate: '2026-07-04' });
    field('ut-date', ''); field('ut-item-search', 'FRP Resin'); field('ut-qty', '1');
    call(ctx, 'saveUnitTransfer()');
    assert.equal(S.unitTransfers[0].date, '2026-07-04');
  });

  test('a transfer is a move, so it never lands in the raw material log', () => {
    // buildPayload() excludes 'Unit2-Transfer' rawLog rows for the same
    // reason: counting a move as consumption understates profit.
    const S = factory();
    field('ut-item-search', 'FRP Resin'); field('ut-qty', '10');
    call(ctx, 'saveUnitTransfer()');
    assert.deepEqual(S.rawLog, []);
    assert.equal(call(ctx, 'buildPayload()').rmCost, 0);
  });
});

describe('renderUnitTransfers', () => {
  const seed = () => {
    const S = factory();
    S.unitTransfers = [
      { id: 1, date: '2026-08-19', direction: 'Unit1→Unit2', type: 'RM', item: 'FRP Resin', qty: 10, unit: 'kg', value: 2200, note: '' },
      { id: 2, date: '2026-08-18', direction: 'Unit2→Unit1', type: 'FG', stage: 'Packing', item: 'Chair A', qty: 3, unit: 'pcs', value: 15000, note: 'returned' },
    ];
    return S;
  };

  test('totals the declared value and counts each direction', () => {
    seed();
    field('ut-filter-dir', 'all'); field('ut-filter-type', 'all');
    call(ctx, 'renderUnitTransfers()');
    const html = doc.getElementById('ut-metrics').innerHTML;
    assert.match(html, /₹17,200/, 'declared value across both rows');
    assert.match(html, /FRP Resin|2/);
  });

  test('honours the direction filter', () => {
    seed();
    field('ut-filter-dir', 'Unit2→Unit1'); field('ut-filter-type', 'all');
    call(ctx, 'renderUnitTransfers()');
    const log = doc.getElementById('ut-log').innerHTML;
    assert.match(log, /Chair A/);
    assert.doesNotMatch(log, /FRP Resin/);
  });

  test('honours the type filter', () => {
    seed();
    field('ut-filter-dir', 'all'); field('ut-filter-type', 'RM');
    call(ctx, 'renderUnitTransfers()');
    const log = doc.getElementById('ut-log').innerHTML;
    assert.match(log, /FRP Resin/);
    assert.doesNotMatch(log, /Chair A/);
  });

  test('says so when there is nothing to show', () => {
    factory();
    call(ctx, 'renderUnitTransfers()');
    assert.match(doc.getElementById('ut-log').innerHTML, /No transfers recorded yet/);
  });

  test('does not throw on a factory with no transfers key at all', () => {
    const S = factory();
    delete S.unitTransfers;
    assert.doesNotThrow(() => call(ctx, 'renderUnitTransfers()'));
  });
});

describe('the item picker', () => {
  test('offers raw materials for RM and finished goods for FG', () => {
    factory();
    field('ut-type', 'RM');
    call(ctx, 'renderUTItemDD()');
    assert.match(doc.getElementById('ut-item-dd').innerHTML, /FRP Resin/);

    field('ut-type', 'FG');
    call(ctx, 'renderUTItemDD()');
    assert.match(doc.getElementById('ut-item-dd').innerHTML, /Chair A/);
  });

  test('shows the stage picker only for finished goods', () => {
    factory();
    field('ut-type', 'FG');
    call(ctx, 'renderUTItemDD()');
    assert.equal(doc.getElementById('ut-stage-wrap').style.display, 'block');

    field('ut-type', 'RM');
    call(ctx, 'renderUTItemDD()');
    assert.equal(doc.getElementById('ut-stage-wrap').style.display, 'none');
  });

  test('narrows as the user types, and says when nothing matches', () => {
    factory();
    field('ut-type', 'RM'); field('ut-item-search', 'resin');
    call(ctx, 'filterUTItems()');
    assert.match(doc.getElementById('ut-item-dd').innerHTML, /FRP Resin/);

    field('ut-item-search', 'zzzz');
    call(ctx, 'filterUTItems()');
    assert.match(doc.getElementById('ut-item-dd').innerHTML, /No matching item/);
  });

  test('picking an item fills the name and defaults the unit', () => {
    factory();
    call(ctx, `selectUTItem('FRP Resin','kg')`);
    assert.equal(doc.getElementById('ut-item-search').value, 'FRP Resin');
    assert.equal(doc.getElementById('ut-unit').value, 'kg');
  });
});

describe('assign to order', () => {
  const withOrder = () => {
    const S = factory();
    S.orders = [
      { id: 7, customer: 'Acme', items: 'Chair A x5', status: 'pending', amount: 25000, advance: 0, createdAt: '2026-08-10' },
      { id: 8, customer: 'Gone', items: 'Chair A x2', status: 'dispatched', amount: 1, advance: 0, createdAt: '2026-08-01' },
    ];
    return S;
  };

  test('lists only open orders that mention the product', () => {
    withOrder();
    call(ctx, `openAssignModal('Chair A', 10, 'fgstock')`);
    const html = doc.getElementById('assign-order-list').innerHTML;
    assert.match(html, /Acme/);
    assert.doesNotMatch(html, /Gone/, 'a dispatched order is not a candidate');
    assert.equal(doc.getElementById('assign-modal').style.display, 'flex');
    assert.match(doc.getElementById('assign-stock-info').textContent, /10 available/);
  });

  test('assigning moves stock out of Packing as a transfer to Order', () => {
    // getFGBalance already treats Order as an exit, so reusing fgTransfers
    // keeps one history of where goods went.
    const S = withOrder();
    S.fgStock = { Packing: { 'Chair A': 10 } };
    call(ctx, `openAssignModal('Chair A', 10, 'fgstock')`);
    doc.getElementById('asg-qty-7').value = '4';
    call(ctx, 'confirmAssign(7)');

    assert.equal(S.fgTransfers.length, 1);
    const t = S.fgTransfers[0];
    assert.equal(t.from, 'Packing');
    assert.equal(t.to, 'Order');
    assert.equal(t.qty, 4);
    assert.equal(t.orderId, 7);
    assert.equal(call(ctx, `getFGBalance('Chair A','Packing')`), 6, '10 packed minus 4 assigned');
  });

  test('refuses to assign more than is packed', () => {
    const S = withOrder();
    S.fgStock = { Packing: { 'Chair A': 3 } };
    call(ctx, `openAssignModal('Chair A', 3, 'fgstock')`);
    doc.getElementById('asg-qty-7').value = '9';
    call(ctx, 'confirmAssign(7)');
    assert.equal((S.fgTransfers || []).length, 0);
  });

  test('says so when no open order wants the product', () => {
    const S = withOrder();
    S.orders = [];
    call(ctx, `openAssignModal('Chair A', 5, 'fgstock')`);
    assert.match(doc.getElementById('assign-order-list').innerHTML, /No open order/);
  });

  test('closing clears the modal', () => {
    withOrder();
    call(ctx, `openAssignModal('Chair A', 5, 'fgstock')`);
    call(ctx, 'closeAssignModal()');
    assert.equal(doc.getElementById('assign-modal').style.display, 'none');
  });
});

describe('the item picker is actually visible', () => {
  // The dropdown is declared `display:none` in the markup and nothing ever
  // set it back, so filterUTItems() filled it correctly from the catalogue and
  // the user saw an empty box no matter what they typed. Every assertion below
  // is about the container being SHOWN, not about its contents.
  const dd = () => doc.getElementById('ut-item-dd');

  test('typing opens the list', () => {
    factory();
    dd().style.display = 'none';
    field('ut-type', 'RM');
    field('ut-item-search', 'resin');
    call(ctx, 'filterUTItems()');

    assert.notEqual(dd().style.display, 'none', 'the list must be on screen');
    assert.match(dd().innerHTML, /FRP Resin/);
  });

  test('an empty query opens the whole catalogue', () => {
    // Clicking the box with nothing typed should show what is available,
    // rather than requiring the user to guess a name first.
    factory();
    dd().style.display = 'none';
    field('ut-type', 'RM');
    field('ut-item-search', '');
    call(ctx, 'filterUTItems()');

    assert.notEqual(dd().style.display, 'none');
    assert.match(dd().innerHTML, /FRP Resin/);
  });

  test('changing the type shows the other catalogue', () => {
    factory();
    field('ut-type', 'FG');
    call(ctx, 'renderUTItemDD()');

    assert.notEqual(dd().style.display, 'none');
    assert.match(dd().innerHTML, /Chair A/);
  });

  test('picking an item closes the list', () => {
    factory();
    field('ut-type', 'RM');
    call(ctx, 'filterUTItems()');
    assert.notEqual(dd().style.display, 'none');

    call(ctx, `selectUTItem('FRP Resin','kg')`);
    assert.equal(dd().style.display, 'none', 'the list must not sit over the form');
  });

  test('logging a transfer closes the list', () => {
    factory();
    field('ut-item-search', 'FRP Resin'); field('ut-qty', '5');
    call(ctx, 'filterUTItems()');
    call(ctx, 'saveUnitTransfer()');

    assert.equal(dd().style.display, 'none');
  });

  test('changing the type clears a stale pick', () => {
    // An RM name is not an FG name. Leaving the previous selection in place
    // let a transfer be logged against an item from the other catalogue.
    factory();
    call(ctx, `selectUTItem('FRP Resin','kg')`);
    assert.equal(doc.getElementById('ut-item-search').value, 'FRP Resin');

    field('ut-type', 'FG');
    call(ctx, 'renderUTItemDD()');

    assert.equal(doc.getElementById('ut-item-search').value, '');
    assert.equal(doc.getElementById('ut-unit').value, '');
  });

  test('an empty catalogue says where to add items', () => {
    const S = factory();
    S.rm = [];
    field('ut-type', 'RM');
    call(ctx, 'filterUTItems()');

    assert.match(dd().innerHTML, /Setup/,
      'an empty box with no explanation reads as a broken screen');
  });
});
