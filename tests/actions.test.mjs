// ── ACTION DELEGATION ──
// Replaces the old inline-handler audit, whose premise was the opposite: it
// checked that every `onclick="foo()"` had a matching `window.foo`.
//
// The markup now names actions — `data-click="saveOrder"` — and
// core/actions.js resolves them through real imports. Two things can break
// that and neither is visible at boot:
//
//   * markup naming an action nobody exports (a dead button), and
//   * an inline handler creeping back, which would silently need a global
//     again and reopen the whole class of bug this replaced.
//
// Both are checked by reading the source, plus a runtime check that the
// delegated dispatch actually reaches a handler.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boot, resetState, call } from './harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function allSources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? allSources(path.join(dir, e.name))
    : e.name.endsWith('.js') ? [[path.join(dir, e.name), fs.readFileSync(path.join(dir, e.name), 'utf8')]] : []);
}

const SOURCES = allSources(path.join(ROOT, 'src/js'));
const ALL = SOURCES.map(([, s]) => s).join('\n');

/** Action names referenced from markup via data-click / data-change / … */
function referencedActions() {
  const found = new Set();
  for (const m of ALL.matchAll(/\bdata-(?:click|change|input|keydown)\s*=\s*"([A-Za-z_$][\w$]*)"/g))
    found.add(m[1]);
  return [...found].sort();
}

const { win, ctx, document: doc } = boot();

describe('no inline event handler remains', () => {
  // The browser evaluates these against `window`, which is the only reason the
  // app ever needed a global surface. One creeping back would quietly require
  // a bridge again.
  const INLINE = /\bon(?:click|change|input|submit|keyup|keydown|focus|blur|mouseover|mouseout|touchend)\s*=\s*["']/g;

  test('not in any module or template', () => {
    const offenders = SOURCES
      .filter(([f, s]) => {
        // Ignore prose: comment lines that merely describe the old style.
        const code = s.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
        return INLINE.test(code) && (INLINE.lastIndex = 0, true);
      })
      .map(([f]) => path.relative(ROOT, f));
    assert.deepEqual(offenders, []);
  });

  test('and the markup does use the replacement (guards this test itself)', () => {
    // If a future change moved away from data-* attributes, the suite below
    // would pass vacuously on an empty set. Fail loudly instead.
    assert.ok(referencedActions().length > 80,
      `expected many actions in markup, found ${referencedActions().length}`);
  });
});

describe('every action named in markup is registered', () => {
  test('no dead buttons', () => {
    const missing = referencedActions().filter(name => !call(ctx, `hasAction(${JSON.stringify(name)})`));
    assert.deepEqual(missing, [],
      'named in markup but not exported by any module: ' + missing.join(', '));
  });

  test('the registry is populated from the real module graph', () => {
    const names = call(ctx, 'actionNames()');
    assert.ok(names.length > 180, `registry looks short: ${names.length} actions`);
    for (const expected of ['saveOrder', 'renderDashboard', 'enterSup', 'clearTeamSelection',
                            'saveUnitTransfer', 'openAssignModal', 'doLogin', 'closeSidebar']) {
      assert.ok(names.includes(expected), `missing from registry: ${expected}`);
    }
  });
});

describe('dispatch', () => {
  test('runs the named action with decoded arguments', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.rm = [{ id: 1, name: 'FRP Resin', unit: 'kg', price: 220 }];
    S.rawLog = [{ id: 77, stage: 'Moulding', name: 'FRP Resin', unit: 'kg', qty: 2, unitPrice: 220, cost: 440 }];

    // exactly what the delegated click does for
    //   <button data-click="delRaw" data-args="[77]">
    call(ctx, 'runAction("delRaw", [77])');
    assert.deepEqual(S.rawLog, [], 'the row was removed');
  });

  test('passes string arguments through unmangled', () => {
    // Product names in this catalogue contain apostrophes, which is why the
    // old markup hand-escaped them for a JS string literal. data-args is JSON
    // in an HTML attribute instead, and argsAttr() does the escaping once.
    const attr = call(ctx, `argsAttr("Chair A", 5)`);
    assert.match(attr, /^data-args="/);
    const json = attr.slice('data-args="'.length, -1).replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    assert.deepEqual(JSON.parse(json), ['Chair A', 5]);

    const tricky = call(ctx, `argsAttr("Ram's Chair \\"XL\\"")`);
    const decoded = tricky.slice('data-args="'.length, -1).replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    assert.deepEqual(JSON.parse(decoded), ['Ram\'s Chair "XL"']);
  });

  test('an unknown action is reported rather than silently ignored', () => {
    const h = boot();
    h.win.runAction('noSuchThing', []);
    assert.ok(h.logs.error.some(e => String(e[0]).includes('no such action')),
      'a renamed handler must be loud, not a dead button');
  });
});

describe('the bug this replaced', () => {
  test('clearing the team selection actually clears it', () => {
    // Was `onclick="activeTeamId=null;renderSupWork()"`. Under module scope
    // that wrote a stale window mirror, never the module's own activeTeamId,
    // so the "← All Teams" button did nothing at all. It is a real function in
    // the owning module now, so it can reach the variable.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [{ id: 9, name: 'Karan', role: 'Supervisor', wage: 800, isSup: true, present: true, doingOT: false, otHours: 0 }];
    S.sessions = [];
    call(ctx, 'enterSup(9)');
    call(ctx, 'addNewTeam()');
    const teamId = S.sessions[0].teams[0].teamId;
    call(ctx, `selectTeam(${teamId})`);

    call(ctx, 'clearTeamSelection()');

    // renderSupWork() routes to the overview when no team is selected, and
    // the overview writes into #sw-overview.
    const overview = doc.getElementById('sw-overview').innerHTML;
    assert.ok(overview.length > 0, 'the team overview was rendered');
    assert.match(overview, /team/i, 'and it is the overview, not the entry form');
  });
});
