// ==================================================================
//  CORE / ROUTER — Screen navigation and render dispatch
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

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
const SCREEN_RENDERERS = {
  setup:'renderSetup',        sheets:'renderSheets',    att:'renderAtt',
  sup:'renderSupLogin',       raw:'renderRaw',          day:'renderDay',
  month:'initMonthly',        orders:'renderOrders',    payments:'renderPayments',
  dispatch:'renderDispatch',  transfers:'renderUnitTransfers',
  salary:'renderSalary',      export:'renderExportPage', bom:'renderBOM',
  inventory:'renderInventory',stock:'renderStock',      rmpurchase:'renderRMPurchase',
  fgstock:'renderFGStock',    dashboard:'renderDashboard', docs:'renderDocs',
};

function go(name){
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
function renderScreen(name){
  const fnName = SCREEN_RENDERERS[name];
  if(!fnName) return;
  const fn = window[fnName];
  if(typeof fn !== 'function'){
    showScreenError(name, new Error(fnName+'() is not defined — this screen was never implemented'));
    return;
  }
  try{
    clearScreenError(name);
    fn();
  }catch(err){
    showScreenError(name, err);
  }
}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, {
  PAGE_TITLES, SCREEN_RENDERERS,
  go,
  renderScreen,
});
