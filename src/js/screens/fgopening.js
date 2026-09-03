// ==================================================================
//  SCREEN / FG OPENING STOCK — the go-live declaration
//
//  Markup: the #fgo-panel block in templates/screens/fgstock.js
//
//  WHAT THIS IS
//  What the factory physically held, per product per stage, on the day it
//  started using this system. Everything after it is derived:
//
//      balance = opening + produced + transferred in − transferred out ± adjustments
//
//  So the opening figure is the fixed point the whole stock model is measured
//  from. Getting it wrong is not a small error that washes out — it is a
//  constant offset on every balance, every valuation and every reorder alarm,
//  for ever.
//
//  WHY IT LOCKS
//  Because of that. Once production has been logged against these numbers,
//  changing them silently restates history. Locking makes the restatement a
//  deliberate act by an owner rather than a stray keystroke — and the lock is
//  enforced by Postgres (migration 0008), not here. A check in the browser is
//  a courtesy; a trigger is a rule.
//
//  WHY THE DATE MATTERS
//  An opening balance with no date counts on every day, including days before
//  it was true. With one, asking "what did we hold on the 12th" no longer adds
//  stock that was not declared until the 1st of the following month.
// ==================================================================

import { FG_STAGES } from '../core/config.js';
import { fmtN, todayStr } from '../core/format.js';
import { currentRole } from '../core/session.js';
import { S } from '../core/state.js';
import { persist } from '../core/sync.js';
import { downloadXLSX } from '../core/xlsx.js';

/** Working copy while the panel is open: {stage: {product: qty}}. */
let draft = null;

// ── FINDING A PRODUCT IN A REAL CATALOGUE ──
// This factory's catalogue is ~380 products. Rendering every one gave 1,520
// inputs, 480KB of markup and 15,000px of scrolling in a 420px window — about
// 36 screens to reach one product, with no way to search. A table that lists
// everything is only reasonable for a short list.
let filterText = '';
let onlyFilled = false;

const stages = () => (FG_STAGES && FG_STAGES.length ? FG_STAGES
  : ['Moulding', 'Finishing', 'Painting', 'Packing']);

function meta(){
  return S.fgOpening || (S.fgOpening = { asOfDate: null, locked: false });
}

/** Every product the declaration can mention: the catalogue, in order. */
function products(){
  return (S.fg || []).map(f => f.name);
}

/** The subset currently on screen. Row identity still comes from the FULL
 *  catalogue index (see cellId), so filtering never renumbers a cell. */
function visibleProducts(){
  const q = filterText.trim().toLowerCase();
  return products().filter(p => {
    if (q && !p.toLowerCase().includes(q)) return false;
    if (onlyFilled && !stages().some(st => (draft && draft[st] && draft[st][p]) > 0)) return false;
    return true;
  });
}

/** Narrow the table. Values already typed are kept — harvest() reads them from
 *  the draft when a row is not on screen, so filtering never loses an entry. */
export function filterOpeningStock(){
  harvest();
  filterText = (document.getElementById('fgo-search') || {}).value || '';
  renderOpeningStock();
}

/** Show only the products that have something in them — the review pass. */
export function toggleOpeningFilled(){
  harvest();
  const el = document.getElementById('fgo-only-filled');
  onlyFilled = !!(el && el.checked);
  renderOpeningStock();
}

function blankDraft(){
  const d = {};
  stages().forEach(st => { d[st] = {}; });
  return d;
}

/** Copy the saved declaration into an editable draft. */
function draftFromState(){
  const d = blankDraft();
  stages().forEach(st => {
    const row = (S.fgStock && S.fgStock[st]) || {};
    Object.keys(row).forEach(p => { if (row[p] > 0) d[st][p] = Number(row[p]) || 0; });
  });
  return d;
}

export function openOpeningStock(){
  draft = draftFromState();
  filterText = '';
  onlyFilled = false;
  const searchEl = document.getElementById('fgo-search');
  if (searchEl) searchEl.value = '';
  const filledEl = document.getElementById('fgo-only-filled');
  if (filledEl) filledEl.checked = false;
  const panel = document.getElementById('fgo-panel');
  if (panel) panel.style.display = 'block';
  const dateEl = document.getElementById('fgo-date');
  if (dateEl) {
    dateEl.value = meta().asOfDate || todayStr();
    dateEl.max = todayStr();
  }
  renderOpeningStock();
  if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth' });
}

export function closeOpeningStock(){
  draft = null;
  const panel = document.getElementById('fgo-panel');
  if (panel) panel.style.display = 'none';
}

/** Read a cell back out of the table. Blank means zero — that is the point. */
function cellQty(stage, product){
  const el = document.getElementById(cellId(stage, product));
  if (!el) return (draft && draft[stage] && draft[stage][product]) || 0;
  const n = parseFloat(el.value);
  return isNaN(n) || n < 0 ? 0 : n;
}

function cellId(stage, product){
  // Product names carry spaces, em dashes and apostrophes, none of which are
  // safe in an id. Index into the catalogue instead of trying to escape them.
  return 'fgo-c-' + stage + '-' + products().indexOf(product);
}

/** Pull every visible cell into the draft, so a re-render does not lose typing. */
function harvest(){
  if (!draft) draft = blankDraft();
  stages().forEach(st => {
    products().forEach(p => {
      const q = cellQty(st, p);
      if (q > 0) draft[st][p] = q; else delete draft[st][p];
    });
  });
  return draft;
}

export function renderOpeningStock(){
  const body = document.getElementById('fgo-body');
  if (!body) return;
  if (!draft) draft = draftFromState();

  const locked = !!meta().locked;
  const list = visibleProducts();

  body.innerHTML = list.length ? list.map(p => {
    const cells = stages().map(st => {
      const v = (draft[st] && draft[st][p]) || 0;
      return `<td class="num"><input type="number" min="0" step="1"
        id="${cellId(st, p)}" value="${v || ''}" placeholder="0"
        ${locked ? 'disabled' : ''} data-input="onOpeningCell"
        style="width:80px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;
               font-size:12px;text-align:right;background:${locked ? 'var(--surface2)' : 'var(--surface)'}"></td>`;
    }).join('');
    const total = stages().reduce((a, st) => a + ((draft[st] && draft[st][p]) || 0), 0);
    return `<tr><td style="font-weight:500">${p}</td>${cells}
      <td class="num" style="font-weight:700;color:${total > 0 ? 'var(--jade,#065F46)' : 'var(--text4)'}">${total > 0 ? fmtN(total) : '—'}</td></tr>`;
  }).join('')
    : `<tr><td colspan="6" style="color:var(--text4);font-size:12px">
         ${products().length
           ? 'No product matches that search.'
           : 'No products in the catalogue yet. Add them under Settings → Setup first.'}</td></tr>`;

  paintCount(list.length);
  paintLockBar();
  paintButtons();
}

/** How much of the catalogue is on screen, and how much is entered. */
function paintCount(shown){
  const el = document.getElementById('fgo-count');
  if (!el) return;
  const total = products().length;
  let filled = 0;
  products().forEach(p => {
    if (stages().some(st => (draft && draft[st] && draft[st][p]) > 0)) filled++;
  });
  el.textContent = 'Showing ' + shown + ' of ' + total + ' products · ' +
                   filled + ' with a quantity';
}

/** Keep the running total honest as the owner types. */
export function onOpeningCell(){
  harvest();
  // The VISIBLE list, because that is what the rows correspond to. Indexing
  // into the full catalogue would write each total onto the wrong row as soon
  // as a filter is applied.
  const list = visibleProducts();
  // Repaint totals only — re-rendering the inputs would steal focus mid-typing.
  const body = document.getElementById('fgo-body');
  if (!body || !body.children) return;
  paintCount(list.length);
  list.forEach((p, i) => {
    const row = body.children[i];
    if (!row || !row.children) return;
    const cell = row.children[stages().length + 1];
    if (!cell) return;
    const total = stages().reduce((a, st) => a + ((draft[st] && draft[st][p]) || 0), 0);
    cell.textContent = total > 0 ? fmtN(total) : '—';
  });
}

function paintLockBar(){
  const bar = document.getElementById('fgo-lockbar');
  if (!bar) return;
  const m = meta();
  if (!m.locked) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
  const when = m.lockedAt ? String(m.lockedAt).slice(0, 10) : '';
  bar.innerHTML = `<div class="gbox">🔒 Confirmed and locked${m.asOfDate ? ' as of <b>' + m.asOfDate + '</b>' : ''}${when ? ' on ' + when : ''}.
    Every stock balance is calculated from these figures.
    ${currentRole === 'owner' ? 'Unlock below to correct them.' : 'Only the owner can change them.'}</div>`;
  bar.style.display = 'block';
}

function paintButtons(){
  const locked = !!meta().locked;
  const owner = currentRole === 'owner';
  const set = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; };
  set('fgo-confirm', !locked && owner);
  set('fgo-clear',   !locked && owner);
  set('fgo-unlock',  locked && owner);
}

// ── THE STANDING NOTICE ─────────────────────────────────────────
// Shown on the FG Stock screen itself. A factory with no declaration is
// treated as opening zero, which is a perfectly valid answer and also what you
// get by never having done this — the two need telling apart.
export function renderOpeningNotice(){
  const el = document.getElementById('fgo-notice');
  if (!el) return;
  const m = meta();
  const any = stages().some(st => Object.keys((S.fgStock && S.fgStock[st]) || {}).length > 0);

  if (m.locked) { el.style.display = 'none'; el.innerHTML = ''; return; }

  el.innerHTML = any
    ? `<div class="wbox">📥 Opening stock has been entered but not confirmed. Balances are using it,
         but it can still be changed by accident.
         ${currentRole === 'owner' ? '<b>Review and lock it</b> from the Opening Stock button above.' : ''}</div>`
    : `<div class="wbox">📥 No opening stock has been declared, so every balance starts from zero and
         counts only what this system has recorded.
         ${currentRole === 'owner' ? 'Use <b>Opening Stock</b> above to enter what was on the floor on your go-live date.' : ''}</div>`;
  el.style.display = 'block';
}

// ── SAVING ──────────────────────────────────────────────────────

function statusMsg(html, kind){
  const el = document.getElementById('fgo-status');
  if (el) el.innerHTML = html ? `<div class="${kind || 'gbox'}" style="margin-bottom:10px">${html}</div>` : '';
}

export async function confirmOpeningStock(){
  if (currentRole !== 'owner') { alert('Only the owner can confirm opening stock.'); return false; }
  if (meta().locked) { alert('Opening stock is already locked. Unlock it first.'); return false; }

  const asOf = (document.getElementById('fgo-date') || {}).value || '';
  if (!asOf) { alert('Pick the date this stock was counted — the go-live date.'); return false; }
  if (asOf > todayStr()) { alert('The go-live date cannot be in the future.'); return false; }

  harvest();
  const lines = [];
  stages().forEach(st => Object.keys(draft[st] || {}).forEach(p => {
    if (draft[st][p] > 0) lines.push(`${p} · ${st}: ${fmtN(draft[st][p])}`);
  }));

  const summary = lines.length
    ? lines.slice(0, 12).join('\n') + (lines.length > 12 ? `\n…and ${lines.length - 12} more` : '')
    : '(nothing — every product opens at zero)';
  if (!confirm(
    'Lock opening stock as of ' + asOf + '?\n\n' + summary +
    '\n\nEvery stock balance from here on is calculated from these figures. ' +
    'They cannot be changed afterwards without an owner unlocking them.')) return false;

  const ok = await writeOpening(asOf, true);
  if (!ok) return false;
  statusMsg('✓ Opening stock confirmed and locked as of ' + asOf + '.', 'gbox');
  renderOpeningStock();
  renderOpeningNotice();
  return true;
}

export async function unlockOpeningStock(){
  if (currentRole !== 'owner') { alert('Only the owner can unlock opening stock.'); return false; }
  if (!confirm(
    'Unlock opening stock for editing?\n\n' +
    'These figures are the starting point for every stock balance in the system. ' +
    'Changing them restates the stock position on every day since ' +
    (meta().asOfDate || 'go-live') + '.')) return false;

  if (typeof FactoryDB !== 'undefined' && FactoryDB.isReady()) {
    const ok = await FactoryDB.setOpeningLock(false);
    if (!ok) {
      alert('Could not unlock — the server refused.\n\n' +
            'Closing and unlocking opening stock is an owner action; ' +
            'check you are signed in as the owner.');
      return false;
    }
  }
  meta().locked = false;
  persist();
  draft = draftFromState();
  renderOpeningStock();
  renderOpeningNotice();
  statusMsg('🔓 Unlocked. Correct the figures, then confirm again.', 'wbox');
  return true;
}

export function clearOpeningStock(){
  if (meta().locked) return;
  if (!confirm('Clear every quantity in this table?')) return;
  draft = blankDraft();
  renderOpeningStock();
}

/** Push the draft to Postgres and mirror it locally. */
async function writeOpening(asOf, lock){
  const snapshot = JSON.parse(JSON.stringify(draft || blankDraft()));

  if (typeof FactoryDB !== 'undefined' && FactoryDB.isReady()) {
    const ok = await FactoryDB.saveOpeningStock(snapshot, asOf, !!lock);
    if (!ok) {
      alert('Could not save opening stock — the server refused the write.\n\n' +
            'Nothing has been changed. Opening stock is an owner action; ' +
            'check you are signed in as the owner and try again.');
      return false;
    }
  }

  // Only mirror locally once the write has actually landed, so a refused save
  // does not leave the screen showing figures Postgres never accepted.
  S.fgStock = snapshot;
  S.fgOpening = { asOfDate: asOf, locked: !!lock,
                  lockedBy: (S.fgOpening || {}).lockedBy || null,
                  lockedAt: lock ? new Date().toISOString() : null };
  persist();
  return true;
}

// ── IMPORT FROM A SHEET ─────────────────────────────────────────
// Same shape as the RM and Labour importers in setup.js: first row is
// headings, first column is the product, then one column per stage.

export function dlSampleOpening(){
  const head = ['Product'].concat(stages());
  const rows = (products().length ? products() : ['Chair A', 'Table B'])
    .slice(0, 20)
    .map(p => [p].concat(stages().map(() => 0)));
  const ws = XLSX.utils.aoa_to_sheet([head].concat(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Opening Stock');
  downloadXLSX(wb, 'opening_stock_template.xlsx');
}

/**
 * Open the file dialog.
 *
 * The stylesheet hides every file input (`input[type=file]{display:none}`), so
 * one placed in the markup is present, wired, and completely unclickable — the
 * import looked available and could never be reached. The Setup screen's
 * importers have always gone through a visible button for this reason.
 */
export function pickOpeningFile(){
  const el = document.getElementById('fgo-file');
  if (el) el.click();
}

export function uploadOpeningStock(evt){
  const file = evt && evt.target && evt.target.files && evt.target.files[0];
  if (!file) return;
  if (meta().locked) { statusMsg('Opening stock is locked — unlock it before importing.', 'wbox'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      if (!rows.length) { statusMsg('That sheet is empty.', 'wbox'); return; }

      // Match columns by heading rather than position, so a sheet with the
      // stages in a different order still imports correctly.
      const head = (rows[0] || []).map(h => String(h || '').trim().toLowerCase());
      const colFor = {};
      stages().forEach(st => { colFor[st] = head.indexOf(st.toLowerCase()); });

      const known = products().map(p => p.toLowerCase());
      const next = blankDraft();
      let filled = 0, unknown = [];

      rows.forEach((row, i) => {
        if (i === 0 || !row || !row[0]) return;
        const name = String(row[0]).trim();
        const idx = known.indexOf(name.toLowerCase());
        if (idx < 0) { unknown.push(name); return; }
        const product = products()[idx];
        stages().forEach(st => {
          const c = colFor[st];
          if (c < 0) return;
          const q = parseFloat(row[c]);
          if (!isNaN(q) && q > 0) { next[st][product] = q; filled++; }
        });
      });

      draft = next;
      renderOpeningStock();

      const missing = stages().filter(st => colFor[st] < 0);
      let msg = `✓ Imported ${filled} quantit${filled === 1 ? 'y' : 'ies'}.`;
      if (missing.length) msg += ` No column found for: ${missing.join(', ')}.`;
      // Naming a product the catalogue does not have is the common import
      // mistake, and silently dropping those rows is how half a sheet goes
      // missing unnoticed.
      if (unknown.length) {
        msg += ` ${unknown.length} row(s) skipped — not in the product catalogue: ` +
               unknown.slice(0, 5).join(', ') + (unknown.length > 5 ? '…' : '') + '.';
      }
      statusMsg(msg, unknown.length || missing.length ? 'wbox' : 'gbox');
    } catch (err) {
      statusMsg('Could not read that file. Use the template as a guide.', 'wbox');
    }
    if (evt.target) evt.target.value = '';
  };
  reader.readAsBinaryString(file);
}
