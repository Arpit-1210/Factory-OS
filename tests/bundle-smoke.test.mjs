// ── FULL BUNDLE SMOKE TEST ──
// The other suites evaluate app.js as a classic SCRIPT, where every top-level
// declaration is global. The browser loads it as a MODULE, where they are not.
// That difference has hidden two real bugs already:
//
//   * the window-export block was an IIFE that never ran — invisible while
//     declarations were global, fatal to all 114 inline handlers under modules
//   * PAGE_TITLES and SCREEN_RENDERERS lived in app.js but were read by
//     core/router.js — fine as globals, a ReferenceError as modules
//
// So this suite bundles the REAL entry point the same way Vite does and runs
// that, which is the only way to catch a module-scope mistake without a
// browser.
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDocument, createLocalStorage } from './dom-stub.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Minimal supabase-js stand-in: enough for FactoryDB.init() to succeed. */
const fakeSupabase = {
  createClient: () => ({
    from: () => {
      const q = {
        select: () => q, eq: () => q, order: () => q,
        single: () => Promise.resolve({ data: null, error: { message: 'none' } }),
        then: (r) => Promise.resolve({ data: [], error: null }).then(r),
        upsert: () => Promise.resolve({ data: null, error: null }),
      };
      return q;
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: () => { const ch = { on: () => ch, subscribe: () => ch }; return ch; },
    removeChannel: () => {},
  }),
};

let win, logs, ctx;

before(() => {
  const bundle = esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'src/js/main.js')],
    bundle: true, format: 'iife', write: false,
    platform: 'browser', target: 'es2020',
  }).outputFiles[0].text;

  logs = { log: [], warn: [], error: [] };
  const document = createDocument();
  const sandbox = {
    document,
    localStorage: createLocalStorage(),
    navigator: { onLine: true, serviceWorker: { getRegistrations: () => Promise.resolve([]) } },
    location: { href: 'http://localhost/', reload() {}, origin: 'http://localhost' },
    caches: { keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) },
    supabase: fakeSupabase,
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    alert: () => {}, confirm: () => true, prompt: () => null,
    Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    Intl, Map, Set, URL,
    console: { log: (...a) => logs.log.push(a), warn: (...a) => logs.warn.push(a),
               error: (...a) => logs.error.push(a), info: () => {}, debug: () => {} },
    innerWidth: 1280, innerHeight: 800,
    addEventListener: () => {}, removeEventListener: () => {},
    open: () => ({ document: createDocument(), focus() {}, print() {}, close() {} }),
    print: () => {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  ctx = vm.createContext(sandbox);
  vm.runInContext(bundle, ctx, { filename: 'bundle.js' });
  win = sandbox;
});

describe('the bundled app boots under real module scope', () => {
  test('no error is logged during boot', () => {
    const real = logs.error.filter(e => !/supabase-db.js not loaded/.test(String(e[0])));
    assert.deepEqual(real.map(e => String(e[0])), []);
  });

  test('the window-export block ran to completion', () => {
    assert.ok(logs.log.some(l => String(l[0]).includes('Factory OS ready')));
  });

  test('the document was assembled from the templates', () => {
    assert.ok(win.document.getElementById('app-root').innerHTML.length > 50000);
  });
});

describe('every module reached window under module scope', () => {
  const EXPECTED = {
    'core/config': ['STAGES', 'FG_STAGES', 'ROLE_ACCESS', 'APPS_SCRIPT_CODE'],
    'core/format': ['fmt', 'fmtN', 'todayStr', 'spBadge'],
    'core/state': ['defaultState', 'loadState', 'setS', 'uid'],
    'core/calc': ['calcOT', 'getFGBalance', 'computeSalaryMonth', 'sessionTeams'],
    'core/session': ['setRole', 'setFbEnabled'],
    'core/router': ['go', 'renderScreen', 'PAGE_TITLES', 'SCREEN_RENDERERS'],
    'core/auth': ['doLogin', 'doLogout', 'togglePwd'],
    'core/sync': ['persist', 'pushToFirebase', 'startFirebaseSync', 'updateSyncDot'],
    'core/day-rollover': ['isDaySaved', 'adoptWorkDate', 'checkDayRollover'],
    'components/sidebar': ['openSidebar', 'closeSidebar', 'toggleSection'],
    'components/screen-error': ['showScreenError', 'clearScreenError'],
  };

  for (const [mod, names] of Object.entries(EXPECTED)) {
    test(mod, () => {
      const missing = names.filter(n => win[n] === undefined);
      assert.deepEqual(missing, [], `${mod} did not publish: ${missing.join(', ')}`);
    });
  }
});

describe('every screen renders through the real bundle', () => {
  const SCREENS = ['dashboard', 'att', 'sup', 'raw', 'day', 'month', 'orders', 'payments',
    'inventory', 'stock', 'rmpurchase', 'fgstock', 'salary', 'dispatch', 'bom',
    'docs', 'export', 'setup', 'sheets'];

  test('none of them throws', () => {
    const threw = [];
    for (const s of SCREENS) {
      try { win.renderScreen(s); } catch (e) { threw.push(`${s}: ${e.message}`); }
    }
    assert.deepEqual(threw, []);
  });

  test('and none raises an error banner', () => {
    // A banner means the renderer threw and the boundary caught it — which is
    // how PAGE_TITLES/SCREEN_RENDERERS being stranded in app.js would surface.
    const failures = {};
    for (const s of SCREENS) {
      win.renderScreen(s);
      const box = win.document.getElementById('sc-' + s).children
        .find(c => c.id === 'screen-error-' + s);
      if (box) failures[s] = box.innerHTML.replace(/<[^>]+>/g, ' ').trim().slice(-90);
    }
    assert.deepEqual(failures, {});
  });

  test('transfers renders too, now that it has been implemented', () => {
    // It was the last screen with no renderer at all; go("transfers") threw
    // ReferenceError and the boundary reported it. Both now hold: it renders,
    // and it leaves no banner behind.
    win.renderScreen('transfers');
    const box = win.document.getElementById('sc-transfers').children
      .find(c => c.id === 'screen-error-transfers');
    assert.equal(box, undefined);
  });

  test('a renderer that goes missing is still reported (the check is not vacuous)', () => {
    // The delete has to run INSIDE the context: vm proxies the sandbox, and
    // deleting a property on the outer object does not reach the context's
    // global. Doing it from outside silently no-ops and the test passes
    // vacuously — which is exactly what this test exists to prevent.
    vm.runInContext('delete window.renderStock', ctx);
    win.renderScreen('stock');
    const box = win.document.getElementById('sc-stock').children
      .find(c => c.id === 'screen-error-stock');
    assert.ok(box, 'the boundary must still catch a missing renderer');
    assert.match(box.innerHTML, /renderStock/);
  });
});
