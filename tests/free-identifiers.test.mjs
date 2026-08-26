// ══════════════════════════════════════════════════════════════════
//  FREE IDENTIFIERS — the guard for the bug class the harness hides
//
//  Every file under src/js/ is an ES module. There is no `window` bridge any
//  more: the block in app.js that published ~180 functions onto the global
//  object was deleted when the markup moved to data-click= and core/actions.js
//  started resolving those names through real imports.
//
//  So a bare identifier that a module never imports or declares is not a
//  loose end — it is a ReferenceError the moment that line runs in a browser.
//
//  WHY EVERY OTHER TEST MISSES THIS
//  tests/harness.mjs bundles the app and then appends a live getter on
//  `window` for EVERY exported binding of EVERY module (see bundleApp()).
//  That surface is what lets tests reach module internals — and it also means
//  a missing import silently resolves through the global scope chain inside
//  the vm. Under the harness the code works; in the browser it throws. Six
//  real defects lived in that blind spot at once:
//
//    · screens/day.js       saveDay() called persist(), pushToFirebase() and
//                           go() with none imported, so it threw BEFORE
//                           FactoryDB.saveDay() — the closed day never
//                           reached day_ledger and the Monthly screen lost it
//                           on the next login.
//    · core/sync.js         compared prodFingerprint() against a bare
//                           `_prodSeen`, a module variable of production.js.
//    · screens/orders.js    called renderHome(), a name that no longer exists
//                           anywhere (it is renderDashboard now), in 6 places.
//    · orders/transfers     used argsAttr() without importing it, killing the
//                           product and item search dropdowns.
//    · 4 screens            used orderStatusBg/orderStatusColor, which are
//                           exported by screens/orders.js, without importing.
//
//  This test parses each module on its own and resolves every identifier
//  against its real lexical scope chain, with no bundle and no window. That
//  is the browser's rule, so it is the rule worth enforcing.
// ══════════════════════════════════════════════════════════════════

import test from 'node:test';
import assert from 'node:assert/strict';
import * as acorn from 'acorn';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src', 'js');

// Names the browser really does provide, plus the two scripts index.html loads
// as classic globals before the module entry: the XLSX CDN bundle and
// supabase-js. FactoryDB is the one deliberate global the app itself installs
// (src/js/supabase-db.js assigns it on `global`).
const AMBIENT = new Set([
  'globalThis', 'window', 'document', 'console', 'localStorage', 'sessionStorage',
  'navigator', 'location', 'history', 'performance', 'crypto',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask',
  'alert', 'confirm', 'prompt', 'fetch', 'caches', 'AbortController',
  'Blob', 'URL', 'URLSearchParams', 'FileReader', 'File', 'FormData',
  'Image', 'Event', 'CustomEvent', 'Node', 'HTMLElement',
  'MutationObserver', 'IntersectionObserver', 'XMLHttpRequest', 'WebSocket',
  'JSON', 'Math', 'Date', 'Object', 'Array', 'Number', 'String', 'Boolean',
  'Symbol', 'BigInt', 'RegExp', 'Function', 'Promise', 'Proxy', 'Reflect',
  'Set', 'Map', 'WeakSet', 'WeakMap', 'Error', 'TypeError', 'RangeError',
  'SyntaxError', 'ReferenceError', 'Infinity', 'NaN', 'undefined', 'arguments',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'escape', 'unescape', 'atob', 'btoa', 'structuredClone',
  'Intl', 'TextEncoder', 'TextDecoder',
  'XLSX', 'supabase', 'FactoryDB',
]);

const FN = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const SCOPE = new Set([
  ...FN, 'Program', 'BlockStatement', 'SwitchStatement',
  'ForStatement', 'ForInStatement', 'ForOfStatement',
  'CatchClause', 'ClassDeclaration', 'ClassExpression',
]);

function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) if (child && typeof child.type === 'string') walk(child, visit, node);
    } else if (value && typeof value.type === 'string') {
      walk(value, visit, node);
    }
  }
}

/** Every name a binding pattern introduces: `{a, b: {c}}`, `[d, ...e]`, `f = 1`. */
function patternNames(pattern, out) {
  if (!pattern) return;
  switch (pattern.type) {
    case 'Identifier': out.push(pattern.name); break;
    case 'ObjectPattern':
      pattern.properties.forEach(p => patternNames(p.type === 'RestElement' ? p.argument : p.value, out));
      break;
    case 'ArrayPattern': pattern.elements.forEach(e => patternNames(e, out)); break;
    case 'AssignmentPattern': patternNames(pattern.left, out); break;
    case 'RestElement': patternNames(pattern.argument, out); break;
  }
}

function freeIdentifiers(code) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  const declared = new Map();   // scope node -> Set(names)
  const parentOf = new Map();

  walk(ast, (node, parent) => {
    parentOf.set(node, parent);
    if (SCOPE.has(node.type)) declared.set(node, new Set());
  });

  const enclosingScope = (node) => {
    let cursor = parentOf.get(node);
    while (cursor && !declared.has(cursor)) cursor = parentOf.get(cursor);
    return cursor;
  };
  // `var` hoists past blocks to the nearest function or module scope.
  const hoistTarget = (node) => {
    let cursor = node;
    while (cursor && !(FN.has(cursor.type) || cursor.type === 'Program')) cursor = parentOf.get(cursor);
    return cursor;
  };

  walk(ast, (node) => {
    if (node.type === 'VariableDeclaration') {
      const names = [];
      node.declarations.forEach(d => patternNames(d.id, names));
      const bag = declared.get(node.kind === 'var' ? hoistTarget(node) : enclosingScope(node));
      if (bag) names.forEach(n => bag.add(n));
      return;
    }
    if ((node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') && node.id) {
      declared.get(enclosingScope(node))?.add(node.id.name);
    }
    if (FN.has(node.type)) {
      const bag = declared.get(node);
      node.params.forEach(p => { const names = []; patternNames(p, names); names.forEach(n => bag.add(n)); });
      if (node.id) bag.add(node.id.name);        // named function expression
    }
    if (node.type === 'ClassExpression' && node.id) declared.get(node)?.add(node.id.name);
    if (node.type === 'CatchClause' && node.param) {
      const names = []; patternNames(node.param, names);
      names.forEach(n => declared.get(node).add(n));
    }
    if (node.type === 'ImportDeclaration') {
      node.specifiers.forEach(s => declared.get(ast).add(s.local.name));
    }
  });

  // An Identifier node is a *reference* only when it is not a property key, an
  // import/export specifier, a label, or the binding half of a pattern.
  const inObjectPattern = (node) => {
    const grandparent = parentOf.get(parentOf.get(node));
    return grandparent && grandparent.type === 'ObjectPattern';
  };

  const references = [];
  walk(ast, (node, parent) => {
    if (node.type !== 'Identifier' || !parent) return;
    if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;
    if (parent.type === 'Property' && parent.key === node && !parent.computed && parent.value !== node) return;
    if (parent.type === 'Property' && parent.shorthand && parent.value === node && inObjectPattern(node)) return;
    if ((parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition')
        && parent.key === node && !parent.computed) return;
    if (['ImportSpecifier', 'ImportDefaultSpecifier', 'ImportNamespaceSpecifier', 'ExportSpecifier'].includes(parent.type)) return;
    if (['LabeledStatement', 'BreakStatement', 'ContinueStatement'].includes(parent.type)) return;
    if (FN.has(parent.type) && parent.params.includes(node)) return;
    if (parent.id === node && ['FunctionDeclaration', 'FunctionExpression', 'ClassDeclaration', 'ClassExpression', 'VariableDeclarator'].includes(parent.type)) return;
    if (parent.type === 'AssignmentPattern' && parent.left === node) return;
    if (parent.type === 'RestElement' && parent.argument === node) return;
    if (parent.type === 'ArrayPattern' || parent.type === 'ObjectPattern') return;
    if (parent.type === 'CatchClause' && parent.param === node) return;
    references.push(node);
  });

  const unresolved = [];
  for (const ref of references) {
    if (AMBIENT.has(ref.name)) continue;
    let scope = enclosingScope(ref), found = false;
    while (scope) {
      if (declared.get(scope)?.has(ref.name)) { found = true; break; }
      scope = enclosingScope(scope);
    }
    if (!found) unresolved.push({ name: ref.name, line: ref.loc.start.line });
  }
  return unresolved;
}

function sourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

test('free identifiers', async (t) => {
  const files = sourceFiles(SRC);

  await t.test('there is something to check', () => {
    assert.ok(files.length > 30, `expected the whole src/js tree, saw ${files.length} files`);
  });

  await t.test('the detector itself catches a missing import', () => {
    // A module that uses `persist` without importing it — src/js/screens/day.js
    // shipped exactly this and no other test noticed.
    const found = freeIdentifiers('export function saveDay(){ persist(); }');
    assert.deepEqual(found.map(f => f.name), ['persist']);
  });

  await t.test('the detector does not flag a name that IS imported', () => {
    const found = freeIdentifiers("import { persist } from './sync.js';\nexport function saveDay(){ persist(); }");
    assert.deepEqual(found, []);
  });

  await t.test('every module resolves every name it uses', () => {
    const offenders = [];
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      for (const { name, line } of freeIdentifiers(fs.readFileSync(file, 'utf8'))) {
        offenders.push(`${rel}:${line} — ${name}`);
      }
    }
    assert.deepEqual(offenders, [], 'undefined at runtime in a browser:\n  ' + offenders.join('\n  '));
  });
});
