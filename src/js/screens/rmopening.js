// ==================================================================
//  SCREEN / RM OPENING STOCK — the go-live declaration for raw materials
//
//  Markup: the #rmo-panel block in templates/screens/stock.js
//
//  The finished-goods twin of this lives in screens/fgopening.js. Same idea,
//  one column instead of four: a raw material has a quantity, not a position
//  in a production line.
//
//      balance = opening + purchases ± adjustments − issues
//
//  WHY IT IS ITS OWN TABLE NOW
//  The opening quantity has always existed, as `opening` inside the rm_stock
//  document, but nothing protected it: that blob is rewritten wholesale on
//  every owner push. And `openingDate` was stored and never read, so the
//  opening quantity counted on every day in history — including days before
//  the material was declared. Migration 0010 moves it to rm_stock_opening,
//  where a trigger can enforce the lock and the date actually means something.
// ==================================================================

import { getRMBalance } from '../core/calc.js';
import { fmtN, todayStr } from '../core/format.js';
import { currentRole } from '../core/session.js';
import { S } from '../core/state.js';
import { persist } from '../core/sync.js';
import { downloadXLSX } from '../core/xlsx.js';

/** Working copy while the panel is open: {material: qty}. */
let draft = null;
let filterText = '';
let onlyFilled = false;

function meta(){
  return S.rmOpening || (S.rmOpening = { asOfDate: null, locked: false });
}

/** Every material the declaration can mention: the catalogue, in order. */
function materials(){
  return (S.rm || []).map(r => r.name);
}

function unitFor(name){
  const r = (S.rm || []).find(x => x.name === name);
  return (r && r.unit) || '';
}

/**
 * Start from the saved declaration, falling back to the old per-material
 * `opening` for anything not migrated yet — otherwise the first save after an
 * upgrade would silently zero every material the new table has not seen.
 */
function draftFromState(){
  const d = {};
  const declared = S.rmOpeningQty || {};
  materials().forEach(m => {
    if (declared[m] !== undefined) { if (declared[m] > 0) d[m] = Number(declared[m]); return; }
    const legacy = (S.stock || []).find(s => s.name === m);
    if (legacy && legacy.opening > 0) d[m] = Number(legacy.opening);
  });
  return d;
}

const cellId = (material) => 'rmo-c-' + materials().indexOf(material);

function cellQty(material){
  const el = document.getElementById(cellId(material));
  if (!el) return (draft && draft[material]) || 0;   // filtered off screen
  const n = parseFloat(el.value);
  return isNaN(n) || n < 0 ? 0 : n;
}

/** Pull every visible cell into the draft, so a re-render does not lose typing. */
function harvest(){
  if (!draft) draft = {};
  materials().forEach(m => {
    const q = cellQty(m);
    if (q > 0) draft[m] = q; else delete draft[m];
  });
  return draft;
}

function visibleMaterials(){
  const q = filterText.trim().toLowerCase();
  return materials().filter(m => {
    if (q && !m.toLowerCase().includes(q)) return false;
    if (onlyFilled && !((draft && draft[m]) > 0)) return false;
    return true;
  });
}

export function openRMOpeningStock(){
  draft = draftFromState();
  filterText = '';
  onlyFilled = false;
  const searchEl = document.getElementById('rmo-search');
  if (searchEl) searchEl.value = '';
  const filledEl = document.getElementById('rmo-only-filled');
  if (filledEl) filledEl.checked = false;

  const panel = document.getElementById('rmo-panel');
  if (panel) panel.style.display = 'block';
  const dateEl = document.getElementById('rmo-date');
  if (dateEl) {
    // Default to the finished-goods go-live date when there is one: the same
    // stock-take almost certainly counted both halves of the inventory.
    dateEl.value = meta().asOfDate || (S.fgOpening && S.fgOpening.asOfDate) || todayStr();
    dateEl.max = todayStr();
  }
  renderRMOpeningStock();
  if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth' });
}

export function closeRMOpeningStock(){
  draft = null;
  const panel = document.getElementById('rmo-panel');
  if (panel) panel.style.display = 'none';
}

export function filterRMOpeningStock(){
  harvest();
  filterText = (document.getElementById('rmo-search') || {}).value || '';
  renderRMOpeningStock();
}

export function toggleRMOpeningFilled(){
  harvest();
  const el = document.getElementById('rmo-only-filled');
  onlyFilled = !!(el && el.checked);
  renderRMOpeningStock();
}

export function renderRMOpeningStock(){
  const body = document.getElementById('rmo-body');
  if (!body) return;
  if (!draft) draft = draftFromState();

  const locked = !!meta().locked;
  const list = visibleMaterials();

  body.innerHTML = list.length ? list.map(m => {
    const v = draft[m] || 0;
    return `<tr>
      <td style="font-weight:500">${m}</td>
      <td class="num"><input type="number" min="0" step="0.01"
        id="${cellId(m)}" value="${v || ''}" placeholder="0"
        ${locked ? 'disabled' : ''} data-input="onRMOpeningCell"
        style="width:110px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;
               font-size:12px;text-align:right;background:${locked ? 'var(--surface2)' : 'var(--surface)'}"></td>
      <td style="color:var(--text4);font-size:11px">${unitFor(m)}</td>
    </tr>`;
  }).join('')
    : `<tr><td colspan="3" style="color:var(--text4);font-size:12px">
         ${materials().length
           ? 'No material matches that search.'
           : 'No raw materials in the catalogue yet. Add them under Settings → Setup first.'}</td></tr>`;

  paintCount(list.length);
  paintLockBar();
  paintButtons();
}

/** Totals repainted in place — re-rendering would steal focus mid-typing. */
export function onRMOpeningCell(){
  harvest();
  paintCount(visibleMaterials().length);
}

function paintCount(shown){
  const el = document.getElementById('rmo-count');
  if (!el) return;
  const total = materials().length;
  const filled = materials().filter(m => (draft && draft[m]) > 0).length;
  el.textContent = 'Showing ' + shown + ' of ' + total + ' materials · ' +
                   filled + ' with a quantity';
}

function paintLockBar(){
  const bar = document.getElementById('rmo-lockbar');
  if (!bar) return;
  const m = meta();
  if (!m.locked) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
  const when = m.lockedAt ? String(m.lockedAt).slice(0, 10) : '';
  bar.innerHTML = `<div class="gbox">🔒 Confirmed and locked${m.asOfDate ? ' as of <b>' + m.asOfDate + '</b>' : ''}${when ? ' on ' + when : ''}.
    Every raw-material balance is calculated from these figures.
    ${currentRole === 'owner' ? 'Unlock below to correct them.' : 'Only the owner can change them.'}</div>`;
  bar.style.display = 'block';
}

function paintButtons(){
  const locked = !!meta().locked;
  const owner = currentRole === 'owner';
  const set = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; };
  set('rmo-confirm', !locked && owner);
  set('rmo-clear',   !locked && owner);
  set('rmo-unlock',  locked && owner);
}

/** The standing notice on the Stock screen. */
export function renderRMOpeningNotice(){
  const el = document.getElementById('rmo-notice');
  if (!el) return;
  const m = meta();
  const any = Object.keys(S.rmOpeningQty || {}).length > 0 ||
              (S.stock || []).some(s => s.opening > 0);

  if (m.locked) { el.style.display = 'none'; el.innerHTML = ''; return; }

  el.innerHTML = any
    ? `<div class="wbox">📥 Raw-material opening stock has been entered but not confirmed.
         Balances are using it, but it can still be changed by accident.
         ${currentRole === 'owner' ? '<b>Review and lock it</b> from the Opening Stock button above.' : ''}</div>`
    : `<div class="wbox">📥 No raw-material opening stock has been declared, so every balance
         counts only what this system has recorded.
         ${currentRole === 'owner' ? 'Use <b>Opening Stock</b> above to enter what was in the store on your go-live date.' : ''}</div>`;
  el.style.display = 'block';
}

// ── SAVING ──────────────────────────────────────────────────────

function statusMsg(html, kind){
  const el = document.getElementById('rmo-status');
  if (el) el.innerHTML = html ? `<div class="${kind || 'gbox'}" style="margin-bottom:10px">${html}</div>` : '';
}

async function writeOpening(asOf, lock){
  const snapshot = JSON.parse(JSON.stringify(draft || {}));
  if (typeof FactoryDB !== 'undefined' && FactoryDB.isReady()) {
    const ok = await FactoryDB.saveRMOpeningStock(snapshot, asOf, !!lock);
    if (!ok) {
      alert('Could not save opening stock — the server refused the write.\n\n' +
            'Nothing has been changed. Opening stock is an owner action; ' +
            'check you are signed in as the owner and try again.');
      return false;
    }
  }
  S.rmOpeningQty = snapshot;
  S.rmOpening = { asOfDate: asOf, locked: !!lock,
                  lockedBy: (S.rmOpening || {}).lockedBy || null,
                  lockedAt: lock ? new Date().toISOString() : null };

  // Keep the legacy per-material figure in step. getRMBalance() prefers the
  // declaration, but the Stock screen still shows `opening` in its own column
  // and the two disagreeing on screen would read as a bug.
  (S.stock || []).forEach(s => { s.opening = snapshot[s.name] || 0; });
  persist();
  return true;
}

export async function confirmRMOpeningStock(){
  if (currentRole !== 'owner') { alert('Only the owner can confirm opening stock.'); return false; }
  if (meta().locked) { alert('Opening stock is already locked. Unlock it first.'); return false; }

  const asOf = (document.getElementById('rmo-date') || {}).value || '';
  if (!asOf) { alert('Pick the date this stock was counted — the go-live date.'); return false; }
  if (asOf > todayStr()) { alert('The go-live date cannot be in the future.'); return false; }

  harvest();
  const lines = Object.keys(draft).map(m => `${m}: ${fmtN(draft[m])} ${unitFor(m)}`);
  const summary = lines.length
    ? lines.slice(0, 12).join('\n') + (lines.length > 12 ? `\n…and ${lines.length - 12} more` : '')
    : '(nothing — every material opens at zero)';
  if (!confirm(
    'Lock raw-material opening stock as of ' + asOf + '?\n\n' + summary +
    '\n\nEvery raw-material balance from here on is calculated from these ' +
    'figures. They cannot be changed afterwards without an owner unlocking them.')) return false;

  if (!await writeOpening(asOf, true)) return false;
  statusMsg('✓ Opening stock confirmed and locked as of ' + asOf + '.', 'gbox');
  renderRMOpeningStock();
  renderRMOpeningNotice();
  return true;
}

export async function unlockRMOpeningStock(){
  if (currentRole !== 'owner') { alert('Only the owner can unlock opening stock.'); return false; }
  if (!confirm(
    'Unlock raw-material opening stock for editing?\n\n' +
    'These figures are the starting point for every raw-material balance. ' +
    'Changing them restates the stock position on every day since ' +
    (meta().asOfDate || 'go-live') + '.')) return false;

  if (typeof FactoryDB !== 'undefined' && FactoryDB.isReady()) {
    const ok = await FactoryDB.setRMOpeningLock(false);
    if (!ok) {
      alert('Could not unlock — the server refused.\n\n' +
            'Unlocking opening stock is an owner action; check you are signed in as the owner.');
      return false;
    }
  }
  meta().locked = false;
  persist();
  draft = draftFromState();
  renderRMOpeningStock();
  renderRMOpeningNotice();
  statusMsg('🔓 Unlocked. Correct the figures, then confirm again.', 'wbox');
  return true;
}

export function clearRMOpeningStock(){
  if (meta().locked) return;
  if (!confirm('Clear every quantity in this table?')) return;
  draft = {};
  renderRMOpeningStock();
}

// ── IMPORT FROM A SHEET ─────────────────────────────────────────

export function dlSampleRMOpening(){
  const rows = (materials().length ? materials() : ['FRP Resin', 'Hardener'])
    .slice(0, 200)
    .map(m => [m, 0, unitFor(m)]);
  const ws = XLSX.utils.aoa_to_sheet([['Material', 'Opening Qty', 'Unit']].concat(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'RM Opening Stock');
  downloadXLSX(wb, 'rm_opening_stock_template.xlsx');
}

export function pickRMOpeningFile(){
  const el = document.getElementById('rmo-file');
  if (el) el.click();
}

export function uploadRMOpeningStock(evt){
  const file = evt && evt.target && evt.target.files && evt.target.files[0];
  if (!file) return;
  if (meta().locked) { statusMsg('Opening stock is locked — unlock it before importing.', 'wbox'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      if (!rows.length) { statusMsg('That sheet is empty.', 'wbox'); return; }

      const known = materials().map(m => m.toLowerCase());
      const next = {};
      let filled = 0; const unknown = [];

      rows.forEach((row, i) => {
        if (i === 0 || !row || !row[0]) return;
        const name = String(row[0]).trim();
        const idx = known.indexOf(name.toLowerCase());
        if (idx < 0) { unknown.push(name); return; }
        const q = parseFloat(row[1]);
        if (!isNaN(q) && q > 0) { next[materials()[idx]] = q; filled++; }
      });

      draft = next;
      renderRMOpeningStock();

      let msg = `✓ Imported ${filled} quantit${filled === 1 ? 'y' : 'ies'}.`;
      // Naming a material the catalogue does not have is the common import
      // mistake; dropping those rows quietly is how half a sheet goes missing.
      if (unknown.length) {
        msg += ` ${unknown.length} row(s) skipped — not in the material catalogue: ` +
               unknown.slice(0, 5).join(', ') + (unknown.length > 5 ? '…' : '') + '.';
      }
      statusMsg(msg, unknown.length ? 'wbox' : 'gbox');
    } catch (err) {
      statusMsg('Could not read that file. Use the template as a guide.', 'wbox');
    }
    if (evt.target) evt.target.value = '';
  };
  reader.readAsBinaryString(file);
}

/** Exported for tests: the balance a material opens at, per the declaration. */
export function rmOpeningFor(material){
  return getRMBalance(material).opening;
}
