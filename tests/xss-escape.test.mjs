import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/js/core/format.js', import.meta.url), 'utf8');
const m = src.match(/export function esc\(([\s\S]*?)\n\}/);
const esc = new Function('return function esc(' + m[1] + '\n}')();

test('esc neutralises markup and attribute breakouts', () => {
  const out = esc('<img src=x onerror=alert(1)>"\'&');
  assert.ok(!/[<>"']/.test(out));
  assert.equal(esc(null), '');
  assert.equal(esc(5), '5');
});

test('screens escape names and imported ids', () => {
  const orders = readFileSync(new URL('../src/js/screens/orders.js', import.meta.url), 'utf8');
  assert.match(orders, /esc\(o\.customer/);
  assert.match(orders, /safeId\(row\.id\)/);
});
