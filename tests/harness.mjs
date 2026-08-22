// ── APP HARNESS ──
// Boots src/js/supabase-db.js + src/js/app.js inside a vm context, in the same
// order index.html loads them, and hands back the resulting window. Timers are
// captured rather than scheduled so tests stay deterministic and the process
// can exit (app.js installs a 60s rollover interval at load).

import vm from 'node:vm';
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDocument, createElement, createLocalStorage } from './dom-stub.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// STRICT=1 evaluates the app under strict mode, which is what ES modules
// would impose. Used to prove the codebase is ready for a module split before
// committing to one.
const read = (p) => {
  const src = fs.readFileSync(path.join(ROOT, p), 'utf8');
  return process.env.STRICT ? '"use strict";\n' + src : src;
};

// Shared-logic modules, in the order main.js imports them.
const CORE_MODULES = [
  'src/js/core/config.js',
  'src/js/core/format.js',
  'src/js/core/state.js',
  'src/js/core/calc.js',
  'src/js/core/session.js',
  'src/js/core/sheets-sync.js',
  'src/js/core/xlsx.js',
  'src/js/core/sync.js',
  'src/js/core/router.js',
  'src/js/core/auth.js',
  'src/js/core/day-rollover.js',
  'src/js/templates/index.js',
  'src/js/components/screen-error.js',
  'src/js/components/sidebar.js',
  'src/js/screens/att.js',
  'src/js/screens/bom.js',
  'src/js/screens/dashboard.js',
  'src/js/screens/day.js',
  'src/js/screens/dispatch.js',
  'src/js/screens/docs.js',
  'src/js/screens/exports.js',
  'src/js/screens/fgstock.js',
  'src/js/screens/inventory.js',
  'src/js/screens/month.js',
  'src/js/screens/orders.js',
  'src/js/screens/payments.js',
  'src/js/screens/production.js',
  'src/js/screens/raw.js',
  'src/js/screens/rmpurchase.js',
  'src/js/screens/salary.js',
  'src/js/screens/setup.js',
  'src/js/screens/sheets.js',
  'src/js/screens/stock.js',
];

/**
 * Bundle the whole core graph as ONE unit, exactly as Vite does for the
 * browser.
 *
 * Bundling each module separately looks equivalent and is not: esbuild inlines
 * each entry's dependencies, so calc.js would carry its own private copy of
 * state.js — a second `S`, a second seeded catalogue, and two window bridges
 * racing to publish. Tests still passed, because the last bridge write won and
 * everything happened to funnel through that instance. That is precisely the
 * kind of test/production divergence worth refusing: the browser has one
 * instance of each module and the tests must too.
 *
 * Memoised — 150+ tests each call boot(), and re-bundling per call would
 * dominate the run.
 */
let _coreBundle = null;
function bundleCore() {
  if (_coreBundle === null) {
    const entry = CORE_MODULES.map(m => `import ${JSON.stringify('./' + m)};`).join('\n');
    const out = esbuild.buildSync({
      stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
      bundle: true, format: 'iife', write: false,
      platform: 'browser', target: 'es2020',
    });
    _coreBundle = out.outputFiles[0].text;
    if (process.env.STRICT) _coreBundle = '"use strict";\n' + _coreBundle;
  }
  return _coreBundle;
}

export function boot(opts = {}) {
  const {
    localStorageSeed = {},
    supabase = undefined,   // inject a fake supabase-js global
    onLine = true,
    quiet = true,
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
    requestAnimationFrame: (fn) => { timers.timeouts.push({ fn, ms: 0 }); return 0 },
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

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  const ctx = vm.createContext(sandbox);

  // Same order as index.html: data layer first, app second.
  vm.runInContext(read('src/js/supabase-db.js'), ctx, { filename: 'supabase-db.js' });
  if (!opts.dbOnly) {
    // Same graph as main.js. Core modules are ES modules, which a vm Script
    // cannot evaluate, so esbuild bundles them into one classic script first —
    // which is what the browser runs anyway. app.js reads them through the
    // window bridge those modules install.
    vm.runInContext(bundleCore(), ctx, { filename: 'core-bundle.js' });
    vm.runInContext(read('src/js/app.js'), ctx, { filename: 'app.js' });
  }

  return { win: sandbox, ctx, document, localStorage, timers, logs };
}

/**
 * Load only src/js/supabase-db.js. app.js calls initFirebase() at load
 * (app.js:5009), which inits FactoryDB and replays the outbox before a test
 * gets a look in — this gives the data layer to itself, un-driven.
 */
export function bootDb(opts = {}) {
  return boot({ ...opts, dbOnly: true });
}

/** Replace the app's live state object wholesale. */
export function setState(win, patch) {
  const S = win.defaultState();
  Object.assign(S, patch);
  win.S = S;
  // app.js closes over a module-level `S`; window.S is the same binding only if
  // we push it through the setter the app installed. It uses `var S` at top
  // level of the script, so assigning window.S rebinds it in the vm context.
  return win.S;
}

/**
 * app.js holds its state in a top-level `let S`, which is a lexical binding in
 * the vm context rather than a property of window — so it can be read back but
 * not reassigned from outside. We mutate the live object in place instead.
 */
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

/** Call an app function by name with the live lexical scope intact. */
export function call(ctx, expr) {
  return vm.runInContext(expr, ctx);
}
