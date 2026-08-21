// ── INLINE HANDLER COVERAGE ──
// index.html loads the app as type="module". Under module scope a top-level
// `function foo(){}` is NOT global, so the ~114 inline onclick/onchange
// handlers in the markup resolve against `window` and nothing else. They stay
// alive only because app.js explicitly assigns each one to window.
//
// This is the guard for that. It reads the source rather than the runtime,
// because the test harness evaluates app.js as a classic script (where every
// declaration IS global) — so a missing export would pass every other test in
// this suite and still produce a dead button in the browser.
//
// Two real gaps were found this way: pushToFirebase and runDailyBackup, both
// `async function`, both called from markup, neither exported.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boot } from './harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = fs.readFileSync(path.join(ROOT, 'src/js/app.js'), 'utf8');

// Markup now lives in two places: the static per-screen templates, and the
// render functions in app.js that build rows and cards as strings. Both carry
// inline handlers, so both must be scanned — when the static blob moved into
// templates/, scanning app.js alone found zero handlers and this suite caught
// it rather than silently passing on an empty set.
const TEMPLATE_DIR = path.join(ROOT, 'src/js/templates');
function templateSources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? templateSources(path.join(dir, e.name))
    : e.name.endsWith('.js') ? [fs.readFileSync(path.join(dir, e.name), 'utf8')] : []);
}
const MARKUP = [APP, ...templateSources(TEMPLATE_DIR)].join('\n');
const SRC = APP;   // definitions and window exports still live in app.js

/** Function names invoked from an inline handler attribute in the markup. */
function handlersInMarkup(src) {
  const found = new Set();
  const attr = /\b(onclick|onchange|oninput|onsubmit|onkeyup|onkeydown|onfocus|onblur)\s*=\s*(["'])([\s\S]*?)\2/g;
  let m;
  while ((m = attr.exec(src)) !== null) {
    // Bare calls only — `foo(` counts, `el.focus(` does not.
    for (const c of m[3].matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) found.add(c[2]);
  }
  return found;
}

function definedInSource(src) {
  const found = new Set();
  const patterns = [
    /^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/gm,
  ];
  for (const re of patterns) for (const m of src.matchAll(re)) found.add(m[1]);
  return found;
}

function exportedToWindow(src) {
  const found = new Set();
  for (const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) found.add(m[1]);
  return found;
}

// Language keywords and globals that look like calls inside handler strings.
const NOT_APP_CODE = new Set([
  'if', 'var', 'for', 'while', 'return', 'typeof', 'switch', 'catch', 'function',
  'confirm', 'alert', 'print', 'open', 'parseInt', 'parseFloat',
  'Number', 'String', 'Boolean', 'Array', 'Object', 'Math', 'JSON', 'Date',
]);

const HANDLERS = [...handlersInMarkup(MARKUP)].filter(h => !NOT_APP_CODE.has(h));
const DEFINED = definedInSource(SRC);
const EXPORTED = exportedToWindow(SRC);

describe('every inline handler survives module scope', () => {
  test('the markup actually uses inline handlers (guards this test itself)', () => {
    // If a future refactor moves to addEventListener, this drops to 0 and the
    // suite below would pass vacuously. Fail loudly instead so the guard is
    // retired deliberately rather than by accident.
    assert.ok(HANDLERS.length > 50,
      `expected many inline handlers, found ${HANDLERS.length} — has the markup changed?`);
  });

  test('every handler that exists is assigned to window in the source', () => {
    const missing = HANDLERS.filter(h => DEFINED.has(h) && !EXPORTED.has(h));
    assert.deepEqual(missing, [],
      'these are called from markup but never reach window, so they are dead ' +
      'buttons once app.js is loaded as a module: ' + missing.join(', '));
  });

  test('and those assignments actually RUN', () => {
    // Source presence is not enough. The whole export block was wrapped in an
    // IIFE that was never invoked — written `});` instead of `})();` — so
    // every `window.X = X` line existed but none of them executed. As classic
    // scripts that was invisible, because top-level declarations were global
    // anyway. Under type="module" it would have killed all 114 handlers at
    // once. Assert the runtime, not the text.
    const { win } = boot();
    const dead = HANDLERS.filter(h => DEFINED.has(h) && typeof win[h] !== 'function');
    assert.deepEqual(dead, [],
      'defined and exported in source, but not on window at runtime: ' + dead.join(', '));
  });

  test('the app reports a completed boot', () => {
    // The last line of the export block. If this is silent, the block did not
    // finish — which is exactly the failure above.
    const { logs } = boot();
    assert.ok(logs.log.some(l => String(l[0]).includes('Factory OS ready')),
      'the window-export block did not run to completion');
  });
});

describe('handlers wired to markup but never implemented', () => {
  // These are real dead controls in the shipped app, found by this audit.
  // The screen error boundary now reports the Transfers one on navigation;
  // the rest fail on click. Listed explicitly so the count cannot grow
  // unnoticed, and so fixing one is a visible change to this test.
  const KNOWN_MISSING = [
    'closeAssignModal',
    'emergencyPush',
    'exportInventory',
    'exportUnitTransfers',
    'filterUTItems',
    'openAssignModal',
    'renderUTItemDD',
    'renderUnitTransfers',
    'restoreFromBackup',
    'saveUnitTransfer',
  ];

  test('no NEW undefined handler has been introduced', () => {
    const undef = HANDLERS.filter(h => !DEFINED.has(h)).sort();
    const added = undef.filter(h => !KNOWN_MISSING.includes(h));
    assert.deepEqual(added, [], 'new dead button(s) wired to markup: ' + added.join(', '));
  });

  test('the known-missing list has not silently grown stale', () => {
    // When one is implemented, remove it from KNOWN_MISSING — this catches the
    // list drifting out of sync with reality in either direction.
    const undef = HANDLERS.filter(h => !DEFINED.has(h));
    const fixed = KNOWN_MISSING.filter(h => !undef.includes(h));
    assert.deepEqual(fixed, [],
      'these are now implemented — remove them from KNOWN_MISSING: ' + fixed.join(', '));
  });
});
