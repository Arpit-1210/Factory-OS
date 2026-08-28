// ==================================================================
//  SCREEN / TRANSFERS — moving stock between Unit 1 and Unit 2
//
//  Markup: src/js/templates/screens/transfers.js
//
//  This screen's markup, filters and Export button have shipped since the
//  Supabase migration, but none of the five functions behind them was ever
//  written — `go('transfers')` threw ReferenceError and killed navigation, so
//  the whole screen was dead for the owner. The record shape below is not
//  invented: it is the one the Google Sheets Apps Script already writes
//  (Date, Direction, Type, Item, Qty, Unit, Note, Logged By — see
//  APPS_SCRIPT_CODE in core/config.js) plus the stage and value the form asks
//  for, and the `date` field the dashboard tile already counts.
//
//  A unit transfer is a MOVE, not consumption. It is deliberately kept out of
//  the daily P&L: buildPayload() excludes rawLog rows staged 'Unit2-Transfer'
//  for the same reason. Counting a move as a cost would understate profit and
//  charge for the same material twice.
//
//  Nothing here is published on `window`. The markup names actions
//  (data-click="saveUnitTransfer") and core/actions.js resolves them through
//  real imports. This file read `window.currentRole` on the strength of the
//  claim this comment used to make; it was always undefined, so every unit
//  transfer was logged as "owner" whoever recorded it.
// ==================================================================

import { APPS_SCRIPT_CODE } from '../core/config.js';
import { argsAttr, fmt, fmtN, spBadge, todayStr } from '../core/format.js';
import { currentRole } from '../core/session.js';
import { S, uid } from '../core/state.js';
import { persist } from '../core/sync.js';
import { checkXLSX, downloadXLSX } from '../core/xlsx.js';

const UT_DIRECTIONS = ['Unit1→Unit2', 'Unit2→Unit1'];

/**
 * Catalogue for the currently selected type, RM or FG.
 *
 * Straight off the master lists the rest of the app uses — S.rm is the Raw
 * Material catalogue from Setup, S.fg the Finished Goods one — so an item
 * added there is transferable immediately and a transfer can only ever name a
 * product that actually exists.
 */
function utCatalogue() {
  const type = (document.getElementById('ut-type') || {}).value || 'RM';
  return type === 'FG'
    ? (S.fg || []).map(f => ({ name: f.name, unit: 'pcs' }))
    : (S.rm || []).map(r => ({ name: r.name, unit: r.unit || '' }));
}

const UT_DD_LIMIT = 20;

/** Show or hide the item dropdown. */
function utDD(show) {
  const dd = document.getElementById('ut-item-dd');
  if (dd) dd.style.display = show ? 'block' : 'none';
  return dd;
}

// Close the list when the click lands outside it. Installed once, from
// renderUnitTransfers(), because the delegated action layer only fires for
// elements that NAME an action — a click on empty page space matches nothing
// and so could never close the dropdown.
let utOutsideBound = false;
function bindUTOutsideClose() {
  if (utOutsideBound || typeof document.addEventListener !== 'function') return;
  utOutsideBound = true;
  document.addEventListener('click', (ev) => {
    const dd = document.getElementById('ut-item-dd');
    if (!dd || dd.style.display === 'none') return;
    const wrap = dd.parentElement;
    const target = ev && ev.target;
    if (wrap && target && typeof wrap.contains === 'function' && wrap.contains(target)) return;
    dd.style.display = 'none';
  });
}

/**
 * Fill the item dropdown for the selected type, and show the stage picker only
 * for finished goods — raw material has no production stage.
 */
export function renderUTItemDD() {
  const type = (document.getElementById('ut-type') || {}).value || 'RM';
  const wrap = document.getElementById('ut-stage-wrap');
  if (wrap) wrap.style.display = type === 'FG' ? 'block' : 'none';

  // Switching type invalidates whatever was picked: an RM name is not an FG
  // name, and leaving it in place let a transfer be logged against the wrong
  // catalogue entirely.
  const search = document.getElementById('ut-item-search');
  if (search) search.value = '';
  const unitEl = document.getElementById('ut-unit');
  if (unitEl) unitEl.value = '';
  // Show the new catalogue straight away — the point of changing the type is
  // to pick from the other list.
  filterUTItems();
}

/** Narrow the dropdown as the user types. Empty query shows the first 20. */
export function filterUTItems() {
  // The dropdown is hidden in the markup and was never shown again: this
  // function filled it correctly from the catalogue and the container stayed
  // display:none, so the item picker looked empty no matter what was typed.
  const dd = utDD(true);
  if (!dd) return;
  const q = ((document.getElementById('ut-item-search') || {}).value || '').trim().toLowerCase();
  const all = utCatalogue().filter(i => i.name && (!q || i.name.toLowerCase().includes(q)));
  const matches = all.slice(0, UT_DD_LIMIT);

  if (!matches.length) {
    const type = (document.getElementById('ut-type') || {}).value || 'RM';
    const empty = utCatalogue().length === 0;
    dd.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:var(--text4)">' +
      (empty
        ? `No ${type === 'FG' ? 'finished goods' : 'raw materials'} in the catalogue yet — add them in Setup.`
        : 'No matching item.') +
      '</div>';
    return;
  }

  // Say so when the list is capped, rather than letting the user believe the
  // catalogue stops at twenty.
  const more = all.length > matches.length
    ? `<div style="padding:6px 10px;font-size:11px;color:var(--text4)">Showing ${matches.length} of ${all.length} — keep typing to narrow.</div>`
    : '';

  dd.innerHTML = matches.map(i =>
    `<div data-click="selectUTItem" ${argsAttr(i.name, i.unit)} ` +
    'style="padding:8px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border)">' +
    `${i.name}${i.unit ? ` <span style="color:var(--text4)">(${i.unit})</span>` : ''}</div>`
  ).join('') + more;
}

/** Chosen from the dropdown: fill the search box and default the unit. */
export function selectUTItem(name, unit) {
  const search = document.getElementById('ut-item-search');
  const unitEl = document.getElementById('ut-unit');
  if (search) search.value = name;
  if (unitEl && unit) unitEl.value = unit;
  const dd = utDD(false);
  if (dd) dd.innerHTML = '';
}

export function saveUnitTransfer() {
  const val = (id) => ((document.getElementById(id) || {}).value || '').trim();
  const item = val('ut-item-search');
  const qty = parseFloat(val('ut-qty')) || 0;

  if (!item) { alert('Pick an item to transfer.'); return; }
  if (qty <= 0) { alert('Enter a quantity greater than zero.'); return; }

  const type = val('ut-type') || 'RM';
  if (!S.unitTransfers) S.unitTransfers = [];
  S.unitTransfers.push({
    id: uid(),
    date: val('ut-date') || S.workDate || todayStr(),
    direction: val('ut-dir') || UT_DIRECTIONS[0],
    type,
    item,
    stage: type === 'FG' ? (val('ut-stage') || '') : '',
    qty,
    unit: val('ut-unit') || '',
    value: parseFloat(val('ut-value')) || 0,
    note: val('ut-note'),
    loggedBy: currentRole || 'owner',
  });

  ['ut-item-search', 'ut-qty', 'ut-value', 'ut-note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const dd = utDD(false);
  if (dd) dd.innerHTML = '';

  persist();
  renderUnitTransfers();
}

export function deleteUnitTransfer(id) {
  if (!confirm('Remove this transfer?')) return;
  S.unitTransfers = (S.unitTransfers || []).filter(t => t.id !== id);
  persist();
  renderUnitTransfers();
}

/** Rows matching the two filter dropdowns, newest first. */
function utFiltered() {
  const dir = ((document.getElementById('ut-filter-dir') || {}).value) || 'all';
  const type = ((document.getElementById('ut-filter-type') || {}).value) || 'all';
  return (S.unitTransfers || [])
    .filter(t => (dir === 'all' || t.direction === dir) && (type === 'all' || t.type === type))
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

export function renderUnitTransfers() {
  bindUTOutsideClose();

  // Default the date to the day being worked on. saveUnitTransfer() already
  // falls back to S.workDate, so a blank field was recording a date the user
  // could not see.
  const dateEl = document.getElementById('ut-date');
  if (dateEl && !dateEl.value) dateEl.value = S.workDate || todayStr();

  const rows = utFiltered();
  const today = todayStr();

  const metrics = document.getElementById('ut-metrics');
  if (metrics) {
    const out = rows.filter(t => t.direction === UT_DIRECTIONS[0]).length;
    const back = rows.filter(t => t.direction === UT_DIRECTIONS[1]).length;
    const value = rows.reduce((a, t) => a + (Number(t.value) || 0), 0);
    metrics.innerHTML =
      `<div class="mrow">
        <div class="met m-blue"><div class="ml">Transfers</div><div class="mv w">${fmtN(rows.length)}</div></div>
        <div class="met m-amber"><div class="ml">Today</div><div class="mv w">${fmtN(rows.filter(t => t.date === today).length)}</div></div>
        <div class="met m-green"><div class="ml">Unit 1 &rarr; 2</div><div class="mv g">${fmtN(out)}</div></div>
        <div class="met m-green"><div class="ml">Unit 2 &rarr; 1</div><div class="mv g">${fmtN(back)}</div></div>
        <div class="met m-blue"><div class="ml">Declared Value</div><div class="mv w">${fmt(value)}</div></div>
      </div>`;
  }

  const log = document.getElementById('ut-log');
  if (!log) return;
  if (!rows.length) {
    log.innerHTML = '<div style="color:#6B7280;font-size:12px">No transfers recorded yet.</div>';
    return;
  }
  log.innerHTML =
    `<table class="tbl"><thead><tr>
      <th>Date</th><th>Direction</th><th>Type</th><th>Item</th>
      <th class="num">Qty</th><th class="num">Value</th><th>Note</th><th></th>
    </tr></thead><tbody>${rows.map(t => `<tr>
      <td>${t.date || ''}</td>
      <td style="font-family:var(--mono);font-size:11px">${t.direction || ''}</td>
      <td>${t.type === 'FG' ? spBadge(t.stage || 'Packing') : '<span class="sp sp0">RM</span>'}</td>
      <td style="font-weight:500;color:#111827">${t.item || ''}</td>
      <td class="num">${fmtN(t.qty)} ${t.unit || ''}</td>
      <td class="num">${t.value ? fmt(t.value) : '—'}</td>
      <td style="font-size:11px;color:var(--text4)">${t.note || ''}</td>
      <td><button class="btn btn-ember btn-xs" data-click="deleteUnitTransfer" data-args="[${t.id}]">&#10005;</button></td>
    </tr>`).join('')}</tbody></table>`;
}

export function exportUnitTransfers() {
  if (!checkXLSX()) return;
  const rows = [['Date', 'Direction', 'Type', 'Stage', 'Item', 'Qty', 'Unit', 'Value', 'Note', 'Logged By']];
  utFiltered().forEach(t => rows.push([
    t.date || '', t.direction || '', t.type || '', t.stage || '', t.item || '',
    t.qty || 0, t.unit || '', t.value || 0, t.note || '', t.loggedBy || '',
  ]));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Unit Transfers');
  downloadXLSX(wb, `Unit_Transfers_${todayStr()}.xlsx`);
}

