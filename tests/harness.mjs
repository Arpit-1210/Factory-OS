// ── APP HARNESS ──
// Boots the real application the way the browser does — one bundled module
// graph entered through src/js/main.js — inside a vm context with a small DOM
// stub, and hands back the resulting window.
//
// Timers are captured rather than scheduled so tests stay deterministic and
// the process can exit (a 60s rollover check is installed at boot).

import vm from 'node:vm';
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDocument, createElement, createLocalStorage } from './dom-stub.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => {
  const src = fs.readFileSync(path.join(ROOT, p), 'utf8');
  return process.env.STRICT ? '"use strict";\n' + src : src;
};

// Modules whose exports the tests reach into. Screens are discovered so a new
// one is covered without editing this list.
const TEST_MODULES = [
  'core/config', 'core/format', 'core/state', 'core/seed-data', 'core/calc',
  'core/session', 'core/router', 'core/auth', 'core/sync', 'core/sheets-sync',
  'core/xlsx', 'core/day-rollover', 'core/actions', 'templates/index',
  'components/sidebar', 'components/screen-error', 'components/assign-modal',
  ...fs.readdirSync(path.join(ROOT, 'src/js/screens'))
    .filter(f => f.endsWith('.js'))
    .map(f => 'screens/' + f.replace(/\.js$/, '')),
];

/**
 * Bundle the real entry point, plus a TEST-ONLY surface.
 *
 * The app publishes nothing to `window` any more: markup names actions
 * (`data-click="saveOrder"`) and core/actions.js resolves them through real
 * imports. That is the point of the refactor, but it leaves tests with no way
 * to reach a module's internals.
 *
 * So the bundle appends live getters for every exported binding — getters, not
 * a snapshot. `S` is replaced wholesale by setS() on a remote pull, and a copy
 * would silently go stale, which is precisely the class of bug this refactor
 * removed from production. A setter is included so a test can stub a renderer.
 *
 * None of this ships: index.html loads main.js, which has no such surface.
 *
 * The whole graph is bundled as ONE unit, as Vite does. Bundling modules
 * separately looks equivalent and is not — esbuild inlines each entry's
 * dependencies, so two entries would each carry a private copy of state.js,
 * meaning a second `S` and a second seeded catalogue.
 *
 * Memoised: ~200 tests each call boot(), and re-bundling per call would
 * dominate the run.
 */
let _bundle = null;
function bundleApp() {
  if (_bundle !== null) return _bundle;

  const imports = TEST_MODULES
    .map((m, i) => `import * as m${i} from './src/js/${m}.js';`)
    .join('\n');
  const list = TEST_MODULES.map((_, i) => `m${i}`).join(', ');

  const entry = [
    'window.__stub = {};',
    "import './src/js/main.js';",
    imports,
    `for (const ns of [${list}]) {`,
    '  for (const k of Object.keys(ns)) {',
    '    const from = ns;',
    '    Object.defineProperty(window, k, {',
    '      configurable: true,',
    '      get() { return k in window.__stub ? window.__stub[k] : from[k]; },',
    '      set(v) { window.__stub[k] = v; },',
    '    });',
    '  }',
    '}',
  ].join('\n');

  const out = esbuild.buildSync({
    stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
    bundle: true, format: 'iife', write: false,
    platform: 'browser', target: 'es2020',
  });
  _bundle = out.outputFiles[0].text;
  if (process.env.STRICT) _bundle = '"use strict";\n' + _bundle;
  return _bundle;
}

export function boot(opts = {}) {
  const {
    localStorageSeed = {},
    supabase = undefined,   // inject a fake supabase-js global
    onLine = true,
    quiet = true,
    // Extra globals to place in the sandbox, applied last so they win.
    // The end-to-end run uses this to hand the app a REAL fetch, so it talks
    // to Postgres instead of to a double.
    globals = {},
  } = opts;

  const document = createDocument();
  const localStorage = createLocalStorage(localStorageSeed);
  const timers = { timeouts: [], intervals: [] };
  const logs = { warn: [], error: [], log: [] };

  const sandbox = {
    document, localStorage,
    navigator: {
      onLine,
      serviceWorker: { getRegistrations: () => Promise.resolve([]) },
      clipboard: { writeText: () => Promise.resolve() },
    },
    location: { href: 'http://localhost/', reload() {}, origin: 'http://localhost' },
    caches: { keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) },
    setTimeout: (fn, ms) => { timers.timeouts.push({ fn, ms }); return timers.timeouts.length; },
    clearTimeout: () => {},
    setInterval: (fn, ms) => { timers.intervals.push({ fn, ms }); return timers.intervals.length; },
    clearInterval: () => {},
    requestAnimationFrame: (fn) => { timers.timeouts.push({ fn, ms: 0 }); return 0; },
    alert: (m) => { logs.log.push(['alert', m]); },
    confirm: () => true,
    prompt: () => null,
    fetch: () => Promise.reject(new Error('fetch not stubbed')),
    Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    Intl, Map, Set, URL, TextEncoder, TextDecoder,
    console: quiet
      ? { log: (...a) => logs.log.push(a), warn: (...a) => logs.warn.push(a),
          error: (...a) => logs.error.push(a), info: () => {}, debug: () => {} }
      : console,
    innerWidth: 1280, innerHeight: 800,
    addEventListener: () => {}, removeEventListener: () => {},
    open: () => ({ document: createDocument(), focus() {}, print() {}, close() {} }),
    print: () => {},
  };
  if (supabase !== undefined) sandbox.supabase = supabase;
  Object.assign(sandbox, globals);

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  const ctx = vm.createContext(sandbox);

  // index.html loads supabase-js as a classic script before the module entry.
  // The end-to-end run passes the real UMD build here.
  if (opts.preScript) vm.runInContext(opts.preScript, ctx, { filename: 'supabase-js.umd.js' });

  // Data layer first, exactly as index.html loads it.
  vm.runInContext(read('src/js/supabase-db.js'), ctx, { filename: 'supabase-db.js' });
  if (!opts.dbOnly) {
    vm.runInContext(bundleApp(), ctx, { filename: 'app-bundle.js' });
  }

  return { win: sandbox, ctx, document, localStorage, timers, logs };
}

/**
 * Load only src/js/supabase-db.js, with no application on top. Booting the app
 * calls initFirebase(), which inits FactoryDB and replays the offline outbox
 * before a test gets a look in; this gives the data layer to itself.
 */
export function bootDb(opts = {}) {
  return boot({ ...opts, dbOnly: true });
}

/** The live state object. */
export function getState(ctx) {
  return vm.runInContext('S', ctx);
}

/** Wipe the live state and install a controlled fixture. */
export function resetState(ctx, patch = {}) {
  const S = getState(ctx);
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, {
    sheetsUrl: '', rm: [], fg: [], lab: [], sessions: [], rawLog: [],
    workDate: '2026-08-19', ledger: [], orders: [], stock: [], purchases: [],
    fgStock: {}, fgTransfers: [], fgAdjustments: [], dispatches: [],
    salaryAdj: {}, bom: {}, unitTransfers: [], orderReservations: [],
  }, patch);
  return S;
}

/** Evaluate an expression against the booted app. */
export function call(ctx, expr) {
  return vm.runInContext(expr, ctx);
}
