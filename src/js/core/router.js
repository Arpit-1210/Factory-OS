// ==================================================================
//  CORE / ROUTER — Screen navigation and render dispatch
//
//  Nothing here is published on `window`. The markup names actions
//  (data-click="saveDay") and core/actions.js resolves them through real
//  imports, so a screen reaches another screen by importing it — never
//  through the global object.
//
//  This comment used to claim the opposite, and that claim outlived the
//  refactor that made it false. It is why nineteen missing imports read as
//  deliberate on a code review: `persist()` with no import line looked like
//  the documented global, and was in fact a ReferenceError that aborted Save
//  Day before it could write. tests/free-identifiers.test.mjs now fails the
//  build on any such name.
// ==================================================================

import { clearScreenError, showScreenError } from '../components/screen-error.js';
import { closeSidebar } from '../components/sidebar.js';
import { ROLE_ACCESS } from './config.js';
import { currentRole } from './session.js';
import { markProdSeen } from '../screens/production.js';
import { renderSetup } from '../screens/setup.js';
import { renderSheets } from '../screens/sheets.js';
import { renderAtt } from '../screens/att.js';
import { renderSupLogin } from '../screens/production.js';
import { renderRaw } from '../screens/raw.js';
import { renderDay } from '../screens/day.js';
import { initMonthly } from '../screens/month.js';
import { renderOrders } from '../screens/orders.js';
import { renderPayments } from '../screens/payments.js';
import { renderDispatch } from '../screens/dispatch.js';
import { renderUnitTransfers } from '../screens/transfers.js';
import { renderSalary } from '../screens/salary.js';
import { renderExportPage } from '../screens/exports.js';
import { renderBOM } from '../screens/bom.js';
import { renderInventory } from '../screens/inventory.js';
import { renderStock } from '../screens/stock.js';
import { renderRMPurchase } from '../screens/rmpurchase.js';
import { renderFGStock } from '../screens/fgstock.js';
import { renderDashboard } from '../screens/dashboard.js';
import { renderDocs } from '../screens/docs.js';

// ════ NAVIGATION ════
const PAGE_TITLES={
  docs:'Documents',
  dashboard:'Dashboard',setup:'Setup Catalogue',sheets:'Google Sheets',
  att:'Attendance',sup:'Supervisor Teams',raw:'Issue Raw Materials',
  day:'Day Sheet',month:'Monthly Report',orders:'Orders Pipeline',
  payments:'Payments',inventory:'Daily Inventory',
  stock:'RM Stock',rmpurchase:'RM Purchase',fgstock:'FG Stock'
};
// ── SCREEN RENDER DISPATCH + ERROR BOUNDARY ──
// Every screen renders through here so that a render failure is VISIBLE.
//
// This used to be twenty bare `if(name==='x') renderX();` lines. One throw
// killed the rest of go() and left the screen blank, with nothing in the UI
// to say why. Three real bugs hid behind that: renderSupLogin and
// renderRawPnL crashed on the current session shape, and renderUnitTransfers
// has never existed at all. The Raw Material blank screen was reported as
// "production sync is not connected to the backend" — the wrong subsystem
// entirely, because a dead screen and a dead sync look identical.
//
// Renderers are referenced lazily by name rather than captured in a map, so a
// missing one surfaces here as a caught error instead of a ReferenceError at
// load time.
// Direct function references, not names looked up on `window`.
//
// The string-and-window version was a relic of the inline-handler era: it
// could only fail at runtime, which is how renderUnitTransfers stayed missing
// for so long. A renderer that does not exist is now an import error at build
// time. The error boundary below still catches a renderer that THROWS, which
// is the failure that can actually reach a user.
const SCREEN_RENDERERS = {
  setup: renderSetup,        sheets: renderSheets,      att: renderAtt,
  sup: renderSupLogin,       raw: renderRaw,            day: renderDay,
  month: initMonthly,        orders: renderOrders,      payments: renderPayments,
  dispatch: renderDispatch,  transfers: renderUnitTransfers,
  salary: renderSalary,      export: renderExportPage,  bom: renderBOM,
  inventory: renderInventory,stock: renderStock,        rmpurchase: renderRMPurchase,
  fgstock: renderFGStock,    dashboard: renderDashboard, docs: renderDocs,
};

export function go(name){
  if(!currentRole){return;}
  const allowed=ROLE_ACCESS[currentRole]||[];
  if(!allowed.includes(name)){alert('Access denied.');return;}
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  // Show target
  const sc=document.getElementById('sc-'+name);
  if(sc) sc.classList.add('active');
  // Update page title
  document.getElementById('page-title').textContent=PAGE_TITLES[name]||name;
  // Update sidebar active states
  document.querySelectorAll('.sb-item,.sb-standalone').forEach(el=>{
    const id=el.id.replace('sn-','');
    el.classList.toggle('active',id===name);
  });
  // Close mobile sidebar
  closeSidebar();
  if(window.innerWidth<=768) closeSidebar();

  // Render the screen through the error boundary — see renderScreen().
  renderScreen(name);

  // Navigating repaints the target screen, and leaving the production screen
  // makes a pending-update badge meaningless — either way it is now seen.
  try{ markProdSeen(); }catch(e){}
}
export function renderScreen(name){
  const fn = SCREEN_RENDERERS[name];
  if(typeof fn !== 'function') return;
  try{
    clearScreenError(name);
    fn();
  }catch(err){
    showScreenError(name, err);
  }
}

