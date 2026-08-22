// ── SCREEN RENDER DISPATCH + ERROR BOUNDARY ──
// A render failure used to leave a blank screen and kill the rest of go().
// Three real bugs hid behind that, and one of them (renderRawPnL) was reported
// as "production sync is not connected to the backend" — a dead screen and a
// dead sync are indistinguishable to a user. Every screen renders through
// renderScreen() now, and a failure says so on the page.
//
// Note what is deliberately no longer testable: a renderer that does not
// exist. The router holds direct function references, so a missing one is an
// import error at build time rather than a runtime surprise. The failure that
// can still reach a user is a renderer that THROWS, which is what these
// exercise — by feeding it state it cannot handle, exactly as the two real
// crashes did.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const ALL_SCREENS = [
  'dashboard', 'att', 'sup', 'raw', 'day', 'month', 'orders', 'payments', 'dispatch',
  'transfers', 'salary', 'export', 'bom', 'inventory', 'stock', 'rmpurchase',
  'fgstock', 'docs', 'setup', 'sheets',
];

/** The banner is created with createElement, so it lives as a child of the
 *  screen container rather than in the stub's id map. */
const bannerIn = (doc, name) =>
  doc.getElementById('sc-' + name).children.find(c => c.id === 'screen-error-' + name);

function owner() {
  const h = boot();
  resetState(h.ctx, { workDate: '2026-08-19' });
  // Role lives in core/session.js and is written through its setter. Assigning
  // a global would no longer reach it, which is the point of the refactor.
  call(h.ctx, 'setRole("owner")');
  return h;
}

/** An owner whose Stock screen will throw: renderStock iterates S.rm. */
function withFailingStock() {
  const h = owner();
  const S = resetState(h.ctx, { workDate: '2026-08-19' });
  call(h.ctx, 'setRole("owner")');
  S.rm = null;
  call(h.ctx, 'go("stock")');
  return h;
}

describe('go() never dies on a screen that fails', () => {
  test('every screen an owner can reach navigates without throwing', () => {
    const h = owner();
    for (const s of ALL_SCREENS) {
      assert.doesNotThrow(() => call(h.ctx, `go(${JSON.stringify(s)})`), `go(${s}) threw`);
    }
  });

  test('a failing screen does not stop the rest of go() from finishing', () => {
    // The active class and page title are set before the render, so the user
    // still lands on the screen rather than being stranded on the previous one.
    const h = withFailingStock();
    assert.ok(h.document.getElementById('sc-stock').classList.contains('active'));
    assert.equal(h.document.getElementById('page-title').textContent, 'RM Stock');
    assert.ok(bannerIn(h.document, 'stock'), 'and it says the screen failed');
  });
});

describe('a renderer that throws', () => {
  test('is caught and logged with the screen name', () => {
    const h = withFailingStock();
    const logged = h.logs.error.find(e => String(e[0]) === '[screen:stock]');
    assert.ok(logged, 'the failure must reach the console for debugging');
    assert.ok(String(logged[1].message).length > 0);
  });

  test('and says so on the page', () => {
    const h = withFailingStock();
    const box = bannerIn(h.document, 'stock');
    assert.ok(box, 'a banner must be inserted into the screen');
    assert.match(box.innerHTML, /failed to load/i);
  });

  test('tells the user their data is safe and this is not a sync fault', () => {
    // The whole point: stop a render crash being misreported as a backend
    // problem, which is exactly what happened with the Raw Material screen.
    const h = withFailingStock();
    const box = bannerIn(h.document, 'stock');
    assert.match(box.innerHTML, /data is safe/i);
    assert.match(box.innerHTML, /not a sync problem/i);
  });

  test('the banner clears once the screen renders successfully again', () => {
    const h = withFailingStock();
    assert.ok(bannerIn(h.document, 'stock'), 'banner is up');

    resetState(h.ctx, { workDate: '2026-08-19' });   // S.rm is an array again
    call(h.ctx, 'setRole("owner")');
    call(h.ctx, 'go("stock")');
    assert.equal(bannerIn(h.document, 'stock'), undefined, 'stale banner must not persist');
  });

  test('repeated failures do not stack duplicate banners', () => {
    const h = withFailingStock();
    call(h.ctx, 'go("stock")');
    call(h.ctx, 'go("stock")');

    const boxes = h.document.getElementById('sc-stock').children
      .filter(c => c.id === 'screen-error-stock');
    assert.equal(boxes.length, 1);
  });
});

describe('access control still applies before any rendering', () => {
  test('a supervisor cannot reach an owner-only screen', () => {
    const h = boot();
    resetState(h.ctx, { workDate: '2026-08-19' });
    call(h.ctx, 'setRole("supervisor")');
    call(h.ctx, 'go("salary")');
    assert.equal(h.document.getElementById('sc-salary').classList.contains('active'), false);
  });

  test('an unknown screen name is ignored rather than crashing', () => {
    const h = owner();
    assert.doesNotThrow(() => call(h.ctx, 'renderScreen("nonexistent")'));
  });
});
