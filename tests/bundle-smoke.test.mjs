// ── PRODUCTION BUNDLE SMOKE TEST ──
// Bundles the real entry point exactly as Vite does and runs it, with no test
// surface bolted on. Two things are checked that nothing else can check:
//
//   1. the app boots under genuine module scope, and
//   2. it leaks nothing onto `window`.
//
// (2) is the whole point of the action-delegation refactor. The app used to
// publish ~180 functions globally because inline `onclick=` handlers resolve
// against `window`; markup now names actions instead, so the global surface
// should be empty. If a bridge creeps back, this fails.
//
// Module scope has hidden three real bugs in this codebase already — a
// never-invoked export block, screens reading `currentRole` out of app.js, and
// routing constants stranded there — so it is worth testing the artifact
// itself rather than the source.
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

let win, logs, listeners;

before(() => {
  const bundle = esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'src/js/main.js')],
    bundle: true, format: 'iife', write: false,
    platform: 'browser', target: 'es2020',
  }).outputFiles[0].text;

  logs = { log: [], warn: [], error: [] };
  listeners = [];
  const document = createDocument();
  document.addEventListener = (type) => listeners.push(type);

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

  vm.runInContext(bundle, vm.createContext(sandbox), { filename: 'bundle.js' });
  win = sandbox;
});

describe('the bundled app boots under real module scope', () => {
  test('nothing is logged as an error', () => {
    assert.deepEqual(logs.error.map(e => String(e[0])), []);
  });

  test('the document is assembled from the templates', () => {
    assert.ok(win.document.getElementById('app-root').innerHTML.length > 50000);
  });

  test('the delegated listeners are installed', () => {
    // One per event type the action layer handles. Without these, every
    // control in the app is inert.
    for (const type of ['click', 'change', 'input', 'keydown']) {
      assert.ok(listeners.includes(type), `no delegated ${type} listener`);
    }
  });
});

describe('the app publishes nothing to window', () => {
  // A representative slice of what used to be global: state, business maths,
  // routing, screen renderers, and per-screen handlers.
  const MUST_NOT_LEAK = [
    'S', 'setS', 'uid', 'defaultState', 'loadState',
    'calcOT', 'getFGBalance', 'computeSalaryMonth', 'sessionTeams',
    'fmt', 'fmtN', 'todayStr', 'spBadge',
    'STAGES', 'FG_STAGES', 'ROLE_ACCESS', 'PAGE_TITLES', 'SCREEN_RENDERERS',
    'go', 'renderScreen', 'showScreenError', 'persist', 'pushToFirebase',
    'currentRole', 'fbEnabled', 'setRole', 'setFbEnabled',
    'renderOrders', 'saveOrder', 'renderDashboard', 'renderSupLogin',
    'enterSup', 'selectTeam', 'clearTeamSelection', 'saveUnitTransfer',
    'openAssignModal', 'closeSidebar', 'doLogin',
  ];

  test('no application binding is reachable as a global', () => {
    const leaked = MUST_NOT_LEAK.filter(n => win[n] !== undefined);
    assert.deepEqual(leaked, [],
      'these are still on window, so a bridge has come back: ' + leaked.join(', '));
  });

  test('the only intentional global is the data layer', () => {
    // supabase-db.js is an IIFE that exposes FactoryDB. It predates the module
    // split and is the one global the app still relies on; everything else
    // resolves through imports.
    assert.equal(typeof win.FactoryDB, 'object');
  });
});
