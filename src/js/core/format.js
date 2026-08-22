// ══════════════════════════════════════════════════════════════════
//  CORE / FORMAT — money, numbers, dates, stage badges
//
//  Pure functions. No state, no DOM reads. See config.js for why these are
//  also published on `window` during the split.
// ══════════════════════════════════════════════════════════════════

import { STAGES } from './config.js';

/** Rupees, Indian digit grouping: 100000 -> ₹1,00,000 (not ₹100,000). */
export function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

export function fmtN(n) {
  return Math.round(n).toLocaleString('en-IN');
}

/**
 * Local calendar date as YYYY-MM-DD.
 *
 * Deliberately NOT `new Date().toISOString().slice(0,10)`, which is UTC: in
 * IST (+5:30) every entry made before 05:30 would be stamped with yesterday's
 * date, putting production and attendance in the wrong day.
 */
export function todayStr() {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

/** Coloured stage pill. Unknown stages fall back to the first colour. */
export function spBadge(s) {
  const i = STAGES.indexOf(s);
  return `<span class="sp sp${i < 0 ? 0 : i}">${s}</span>`;
}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, { fmt, fmtN, todayStr, spBadge });
