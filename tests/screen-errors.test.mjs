// ── SCREEN RENDER DISPATCH + ERROR BOUNDARY ──
// A render failure used to leave a blank screen and kill the rest of go().
// Three real bugs hid behind that, and one of them (renderRawPnL) was reported
// as "production sync is not connected to the backend" — a dead screen and a
// dead sync are indistinguishable to a user. Now every screen renders through
// renderScreen(), and a failure says so on the page.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const ALL_SCREENS = [
  'dashboard','att','sup','raw','day','month','orders','payments','dispatch',
  'transfers','salary','export','bom','inventory','stock','rmpurchase',
  'fgstock','docs','setup','sheets',
];

/** The banner is created with createElement, so it lives as a child of the
 *  screen container rather than in the stub's id map. */
const bannerIn = (doc, name) =>
  doc.getElementById('sc-' + name).children.find(c => c.id === 'screen-error-' + name);

function owner() {
  const h = boot();
  resetState(h.ctx, { workDate: '2026-08-19' });
  call(h.ctx, 'currentRole = "owner"');
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
    const h = owner();
    call(h.ctx, 'go("transfers")');
    assert.ok(h.document.getElementById('sc-transfers').classList.contains('active'));
    // PAGE_TITLES has no entry for transfers/salary/dispatch/bom/export, so the
    // header falls back to the raw route name. Cosmetic, but pinned so the
    // fallback stays deliberate rather than becoming a blank title.
    assert.equal(h.document.getElementById('page-title').textContent, 'transfers');
  });
});

describe('a missing renderer is reported, not thrown', () => {
  // This case was originally exercised by go("transfers"), whose renderer had
  // never been written. It has since been implemented, so the missing renderer
  // is now simulated by removing one — which is the better test anyway: it
  // asserts the boundary's behaviour rather than depending on a live bug.
  function withMissingRenderer() {
    const h = owner();
    call(h.ctx, 'delete window.renderStock');
    call(h.ctx, 'go("stock")');
    return h;
  }

  test('the boundary catches it instead of letting go() throw', () => {
    const h = withMissingRenderer();
    const logged = h.logs.error.find(e => String(e[0]) === '[screen:stock]');
    assert.ok(logged, 'the failure must reach the console for debugging');
    assert.match(String(logged[1].message), /not defined|never implemented/);
  });

  test('and says so on the page, naming the fault', () => {
    const h = withMissingRenderer();
    const box = bannerIn(h.document, 'stock');
    assert.ok(box, 'a banner must be inserted into the screen');
    assert.match(box.innerHTML, /failed to load/i);
    assert.match(box.innerHTML, /renderStock/, 'names the actual fault');
  });

  test('tells the user their data is safe and this is not a sync fault', () => {
    // The whole point: stop a render crash being misreported as a backend
    // problem, which is exactly what happened with the Raw Material screen.
    const h = withMissingRenderer();
    const box = bannerIn(h.document, 'stock');
    assert.match(box.innerHTML, /data is safe/i);
    assert.match(box.innerHTML, /not a sync problem/i);
  });
});

describe('a renderer that throws mid-way', () => {
  test('is caught, logged and surfaced', () => {
    const h = owner();
    call(h.ctx, 'window.renderStock = function(){ throw new Error("boom in stock"); }');
    assert.doesNotThrow(() => call(h.ctx, 'go("stock")'));

    const box = bannerIn(h.document, 'stock');
    assert.ok(box);
    assert.match(box.innerHTML, /boom in stock/);
    assert.ok(h.logs.error.some(e => String(e[0]) === '[screen:stock]'));
  });

  test('leaves whatever it managed to draw in place', () => {
    // A half-rendered screen is more useful than a blank one, so the banner is
    // prepended rather than replacing the container.
    const h = owner();
    call(h.ctx, `window.renderStock = function(){
      document.getElementById('stock-list').innerHTML = '<p>partial</p>';
      throw new Error('failed after drawing');
    }`);
    call(h.ctx, 'go("stock")');

    assert.equal(h.document.getElementById('stock-list').innerHTML, '<p>partial</p>');
    assert.ok(bannerIn(h.document, 'stock'), 'and still warns');
  });

  test('the banner clears once the screen renders successfully again', () => {
    const h = owner();
    call(h.ctx, 'window.renderStock = function(){ throw new Error("transient"); }');
    call(h.ctx, 'go("stock")');
    assert.ok(bannerIn(h.document, 'stock'), 'banner is up');

    call(h.ctx, 'window.renderStock = function(){ /* fixed */ };');
    call(h.ctx, 'go("stock")');
    assert.equal(bannerIn(h.document, 'stock'), undefined, 'stale banner must not persist');
  });

  test('repeated failures do not stack duplicate banners', () => {
    const h = owner();
    call(h.ctx, 'window.renderStock = function(){ throw new Error("again"); }');
    call(h.ctx, 'go("stock")');
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
    call(h.ctx, 'currentRole = "supervisor"');
    call(h.ctx, 'go("salary")');
    assert.equal(h.document.getElementById('sc-salary').classList.contains('active'), false);
  });

  test('an unknown screen name is ignored rather than crashing', () => {
    const h = owner();
    assert.doesNotThrow(() => call(h.ctx, 'renderScreen("nonexistent")'));
  });
});
