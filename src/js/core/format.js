// ══════════════════════════════════════════════════════════════════
//  CORE / FORMAT — money, numbers, dates, stage badges
//
//  Pure functions. No state, no DOM reads. See config.js for why these are
//  also published on `window` during the split.
// ══════════════════════════════════════════════════════════════════

import { STAGES } from './config.js';

/**
 * Make text safe to place inside HTML — element content AND quoted attributes.
 *
 * Markup in this app is built as template strings and assigned to innerHTML,
 * and names (workers, products, customers), notes and imported rows are
 * interpolated straight into it. Unescaped, a customer called
 * `<img src=x onerror=...>` — typed by hand, or arriving in a row of the
 * Google Sheet the Orders screen imports — runs as code in the owner's session.
 * Anything that did not come from a literal in this source goes through here.
 */
export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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
  return `<span class="sp sp${i < 0 ? 0 : i}">${esc(s)}</span>`;
}


/**
 * Build a data-args attribute for the delegated action layer.
 *
 * Values are JSON, and the attribute is delimited by double quotes, so both
 * quote characters have to be entity-escaped. Product names in this catalogue
 * genuinely contain apostrophes, and the old markup dealt with that by
 * hand-escaping for a JS string literal; this does it once, correctly.
 */
export function argsAttr(...args) {
  const json = JSON.stringify(args).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return `data-args="${json}"`;
}

