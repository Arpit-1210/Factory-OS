// Factory OS v2.0 — All features, secrets from .env

// Inject screens HTML
// The app document is assembled from per-screen templates in
// src/js/templates/. It used to be a 1,069-line static template literal
// right here, a thousand lines above any of the code that drives it.
// main.js installs it on window before this file runs.
document.getElementById('app-root').innerHTML = window.appHtml();

// Firebase loader
function loadScript(src, cb){
  var s = document.createElement('script');
  s.src = src; s.onload = cb||function(){};
  s.onerror = function(){ console.error('Script failed to load: '+src); if(cb) cb(); };
  document.head.appendChild(s);
}

// ── ALL APP LOGIC ──

// ════ CONSTANTS ════
// Moved to core/config.js (LS_KEY, STAGES, FG_STAGES, SPC, MNAMES,
// SHEETS_URL, ROLE_ACCESS, ROLE_HOME) and core/format.js (spBadge).
// They reach this file as globals via the bridge in those modules; main.js
// imports them before app.js, so they exist before anything here runs.

// ════ APPS SCRIPT ════
// APPS_SCRIPT_CODE moved to core/config.js.

// ════ STATE ════

// ════ STATE ════
// defaultState / loadState / S / uid moved to core/state.js, and the seeded
// catalogues to core/seed-data.js. They reach this file as globals via the
// bridge in those modules; main.js imports them before app.js.


// ════ LOGIN ════
// currentRole lives in core/session.js; write it through setRole().

function togglePwd(){
  const i = document.getElementById('login-pwd');
  i.type = i.type==='password' ? 'text' : 'password';
}
// NOTE: the email-to-role map that was here is gone. It defaulted unknown
// addresses to 'supervisor' on the client, which meant the role was decided
// in the browser. Roles now live in app_users and are enforced by RLS.

// ── LOGIN ──
// Email + password only. The old role-card "master password" path is GONE:
// the passwords were empty strings (the .env values never substituted
// because there is no build step), so selecting a role and submitting a
// blank password granted full access to anyone with the URL.
//
// Role is now read from app_users and enforced by Postgres RLS. Editing
// `currentRole` in DevTools no longer grants anything.
async function doLogin(){
  const email = ((document.getElementById('login-email')||{}).value||'').trim();
  const pwd   = document.getElementById('login-pwd').value;
  const errEl = document.getElementById('login-error');
  const btn   = document.querySelector('.login-btn');
  errEl.style.display='none';

  if(!email || !email.includes('@')){
    errEl.textContent='❌ Enter your email address.';
    errEl.style.display='block';
    return;
  }
  if(!pwd){
    errEl.textContent='❌ Enter your password.';
    errEl.style.display='block';
    return;
  }

  if(!fbEnabled){
    const ok = await initFirebase();
    if(!ok){
      errEl.textContent='❌ Cannot reach the server. Check your internet connection.';
      errEl.style.display='block';
      return;
    }
  }

  const restore = btn ? btn.innerHTML : '';
  if(btn){ btn.textContent='Signing in...'; btn.disabled=true; }

  const res = await FactoryDB.signIn(email, pwd);

  if(btn){ btn.innerHTML=restore; btn.disabled=false; }

  if(!res.ok){
    errEl.textContent='❌ '+(/invalid login/i.test(res.message||'')
      ? 'Wrong email or password.'
      : (res.message||'Login failed.'));
    errEl.style.display='block';
    document.getElementById('login-pwd').value='';
    return;
  }

  setRole(res.role);
  window.currentRole = res.role;
  document.getElementById('login-pwd').value='';
  onLoginSuccess((res.user.user_metadata||{}).name || email.split('@')[0]);
}
function onLoginSuccess(displayName){
  // Check if user selected a past date
  const loginDate = document.getElementById('login-work-date')?.value;
  if(loginDate && loginDate !== todayStr()){
    // Mark today as cleared so Firebase listener doesn't overwrite past date work
    localStorage.setItem('_day_cleared_'+todayStr(), '1');
    // Load that day's data from ledger if exists
    const pastEntry = S.ledger.find(e=>e.date===loginDate);
    if(pastEntry){
      S.sessions = pastEntry.sessions ? JSON.parse(JSON.stringify(pastEntry.sessions)) : [];
      S.rawLog = pastEntry.rawLog ? [...pastEntry.rawLog] : [];
      S.lab.forEach(l=>{
        const att = (pastEntry.attendance||[]).find(a=>a.id===l.id);
        if(att){ l.present=att.present; l.doingOT=att.doingOT; l.otHours=att.otHours||0; }
        else { l.present=false; l.doingOT=false; l.otHours=0; }
      });
    } else {
      S.sessions=[]; S.rawLog=[];
      S.lab.forEach(l=>{l.present=false;l.doingOT=false;l.otHours=0;});
    }
    S.workDate = loginDate;
    const wd=document.getElementById('work-date');
    if(wd) wd.value=loginDate;
  }

  document.getElementById('login-page').style.display='none';
  document.getElementById('app-shell').style.display='flex';
  const tags={owner:'👨‍💼 Owner',supervisor:'👷 Supervisor',rm:'🧪 RM Supervisor'};
  const el=document.getElementById('role-tag');
  el.textContent=(displayName?displayName+' · ':'')+tags[currentRole];
  el.className='role-tag '+currentRole;
  if(!loginDate || loginDate===todayStr()) checkDayRollover();
  updateSidebarForRole();
  // Attach realtime subscriptions now that the role is known — init runs
  // before login with currentRole=null, so nothing was subscribed yet.
  if(fbEnabled){
    pullFromFirebase().then(function(){
      // Push once immediately after the first pull.
      //
      // This is what seeds an empty database: pull() deliberately keeps the
      // local catalogue when the remote one is empty (see the first-run
      // guard in supabase-db.js), and without this push those rows would
      // never reach Postgres — the owner would appear to be working while
      // nothing was saved.
      //
      // Safe to do unconditionally: pull() has just overwritten local state
      // with whatever the server had, so for an already-populated database
      // this writes back what it just read.
      return pushToFirebase();
    }).then(function(){
      startFirebaseSync();
      try{renderDashboard();}catch(e){}
      var _sid=(document.querySelector('.screen.active')||{}).id;
      if(_sid) try{go(_sid.replace('sc-',''));}catch(e){}
    }).catch(function(e){ console.error('initial sync:', e); });
  }
  renderDashboard();
  go(ROLE_HOME[currentRole]);
}
async function doLogout(){
  if(fbEnabled) await FactoryDB.signOut();
  setRole(null);
  window.currentRole=null;
  document.getElementById('app-shell').style.display='none';
  document.getElementById('login-page').style.display='flex';
  ['owner','supervisor','rm'].forEach(x=>{
    const el=document.getElementById('rc-'+x);
    if(el){el.style.borderColor='';el.style.background='';}
  });
  // Reset past date field
  const ldEl=document.getElementById('login-work-date');
  if(ldEl){ ldEl.value=''; ldEl.max=todayStr(); }
  document.getElementById('login-pwd').value='';
}
function updateSidebarForRole(){
  if(!currentRole) return;
  const allowed=ROLE_ACCESS[currentRole]||[];
  // Show/hide section cards based on role
  const ownerSections=['sec-owner'];
  const supSections=['sec-supervisor'];
  const invSections=['sec-inventory'];
  const setSections=['sec-settings'];
  if(currentRole==='supervisor'){
    document.getElementById('sec-owner').style.display='none';
    document.getElementById('sec-inventory').style.display='none';
    document.getElementById('sec-settings').style.display='none';
    // Auto-open supervisor section
    openSection('sec-supervisor');
  } else if(currentRole==='rm'){
    document.getElementById('sec-owner').style.display='none';
    document.getElementById('sec-supervisor').style.display='none';
    document.getElementById('sec-settings').style.display='none';
    openSection('sec-inventory');
  } else {
    // Owner sees everything - open all sections
    openSection('sec-supervisor');
    openSection('sec-owner');
    openSection('sec-inventory');
    openSection('sec-settings');
  }
}

// ════ SIDEBAR ════
function toggleSection(id){
  const el=document.getElementById(id);
  el.classList.toggle('open');
}
function openSection(id){
  document.getElementById(id).classList.add('open');
}
let _sidebarOpenTime = 0;
function openSidebar(){
  _sidebarOpenTime = Date.now();
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sb-overlay').style.display='block';
}
function closeSidebar(){
  if(Date.now()-_sidebarOpenTime < 400) return;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').style.display='none';
}

// ════ NAVIGATION ════
const PAGE_TITLES={
  docs:'Documents',
  dashboard:'Dashboard',setup:'Setup Catalogue',sheets:'Google Sheets',
  att:'Attendance',sup:'Supervisor Teams',raw:'Issue Raw Materials',
  day:'Day Sheet',month:'Monthly Report',orders:'Orders Pipeline',
  payments:'Payments',inventory:'Daily Inventory',
  stock:'RM Stock',rmpurchase:'RM Purchase',fgstock:'FG Stock'
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

function screenErrorEl(name){
  return document.getElementById('screen-error-'+name);
}

function clearScreenError(name){
  const el = screenErrorEl(name);
  if(el) el.remove();
}

// A banner is PREPENDED rather than replacing the screen: a renderer that
// throws half way through still leaves useful content on the page.
function showScreenError(name, err){
  console.error('[screen:'+name+']', err);
  const sc = document.getElementById('sc-'+name);
  if(!sc) return;
  clearScreenError(name);
  const box = document.createElement('div');
  box.id = 'screen-error-'+name;
  box.style.cssText =
    'margin:12px 0;padding:14px 16px;border-radius:10px;'+
    'border:1px solid #FCA5A5;background:#FEF2F2;color:#991B1B;'+
    'font-size:13px;line-height:1.5';
  box.innerHTML =
    '<div style="font-weight:700;margin-bottom:4px">⚠ This screen failed to load</div>'+
    '<div style="margin-bottom:6px">Your saved data is safe — this is a display fault, '+
    'not a sync problem. Please report it with the detail below.</div>'+
    '<code style="display:block;font-family:var(--mono);font-size:11px;'+
    'background:rgba(0,0,0,.05);padding:6px 8px;border-radius:6px;overflow-x:auto">'+
    String((err && err.message) || err)+'</code>';
  sc.insertBefore(box, sc.firstChild);
}

// ════ DASHBOARD ════




function orderStatusColor(s){return s==='pending'?'#92400E':s==='production'?'#1E40AF':s==='ready'?'#065F46':'#6B7280';}
function orderStatusBg(s){return s==='pending'?'var(--amber-l)':s==='production'?'var(--blue-l)':s==='ready'?'var(--jade-l)':'var(--surface2)';}

// ── FIREBASE ──
// ══════════════════════════════════════════════════════════════════
//  CLOUD SYNC — Supabase   (implementation: src/js/supabase-db.js)
//
//  The function NAMES below are unchanged from the old Firebase layer
//  on purpose: ~40 call sites across app.js keep working untouched.
//  Only the implementation moved.
//
//  Gone, and why:
//    _lastLocalWrite echo guard  — writes are row-level now, no echo
//    30s supervisor poll         — Postgres realtime replaces it
//    de-dup by supId             — sessions are rows, not an array
//    _currentSupDocId            — identity is the auth user, not a
//                                  random id in localStorage
// ══════════════════════════════════════════════════════════════════

// fbEnabled lives in core/session.js; write it through setFbEnabled().
let db = null;           // Supabase client; kept for legacy truthiness checks

// ── TAB VISIBILITY ──
// Background tabs drop the realtime socket. Don't flash "Offline" at the
// user for that — only a genuine network loss sets the error state.
document.addEventListener('visibilitychange', function(){
  if(document.hidden){
    const dot = document.getElementById('sync-status');
    const txt = document.getElementById('sync-text');
    if(dot && !dot.className.includes('err')){
      dot.className = 'sync-dot ok';
      if(txt) txt.textContent = 'Synced';
    }
  } else if(fbEnabled){
    updateSyncDot('syncing');
    FactoryDB.flushOutbox();
    setTimeout(function(){ pushToFirebase(); }, 800);
  }
});

function updateSyncDot(status){
  const dot = document.getElementById('sync-status');
  const txt = document.getElementById('sync-text');
  if(dot) dot.className = 'sync-dot ' + status;
  if(txt){
    const pending = (typeof FactoryDB!=='undefined') ? FactoryDB.pendingWrites() : 0;
    txt.textContent = status==='ok'      ? 'Synced'
                    : status==='syncing' ? 'Syncing...'
                    : pending            ? pending+' unsynced'
                                         : 'Offline';
  }
}

async function initFirebase(){
  if(typeof FactoryDB === 'undefined'){
    console.error('supabase-db.js not loaded');
    updateSyncDot('err');
    return false;
  }
  const ok = await FactoryDB.init();
  setFbEnabled(ok);
  db = ok ? FactoryDB.client() : null;
  window.db = db;

  if(!ok){ updateSyncDot('err'); return false; }

  console.log('Supabase connected');
  updateSyncDot('syncing');

  window.addEventListener('online',  function(){ updateSyncDot('syncing'); FactoryDB.flushOutbox(); });
  window.addEventListener('offline', function(){ updateSyncDot('err'); });

  // Replay anything queued while offline before pulling fresh state,
  // otherwise a pull would overwrite unsent local work.
  await FactoryDB.flushOutbox();

  if(currentRole){
    await pullFromFirebase();
    startFirebaseSync();
    try{ renderHome(); renderDashboard(); }catch(e){}
  }
  updateSyncDot('ok');
  return true;
}

async function pushToFirebase(){
  if(!fbEnabled || !currentRole) return;
  await FactoryDB.push(S, currentRole);
}

async function pullFromFirebase(){
  if(!fbEnabled) return;
  await FactoryDB.pull(S);
  window.S = S;
  try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){}
}

// The owner's view of supervisor sessions is now just a pull. The manual
// merge and de-duplication this used to do is gone — sessions are rows,
// and RLS stops one supervisor from touching another's.
async function pullSupervisorSessions(){ return pullFromFirebase(); }
async function pullSupervisorData(){ return pullFromFirebase(); }

function startFirebaseSync(){
  if(!fbEnabled || !currentRole) return;
  FactoryDB.startSync(S, currentRole, function(state){
    // Whole-state replacement goes through core/state.js so its exported
    // binding and the window bridge stay in step.
    setS(state);
    try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){}
    updateSyncDot('ok');
    try{ renderDashboard(); }catch(e){}
    // Never re-render the production ('sup') screen from a remote event:
    // it would reset the selected team and wipe inputs mid-entry.
    const sid = (document.querySelector('.screen.active')||{}).id;
    if(sid && sid !== 'sc-sup'){
      try{ go(sid.replace('sc-','')); }catch(e){}
    }else if(sid === 'sc-sup'){
      // The data HAS arrived and is already in S — only the paint is withheld.
      // Silently swallowing it is what made a phone entry look like it never
      // reached the laptop, so offer it instead of dropping it.
      try{ if(prodFingerprint() !== _prodSeen) showProdRefresh(); }catch(e){}
    }
  });
}

function stopFirebaseSync(){
  if(fbEnabled) FactoryDB.stopSync();
}

// ── "NEW DATA" BADGE FOR THE PRODUCTION SCREEN ──
// Everywhere else a remote change simply re-renders the screen. Production
// cannot: a repaint mid-entry resets the selected team and wipes half-typed
// inputs. So we compare what the screen last drew against what is now in
// state, and if they differ we show a badge that lets the user take the
// update at a moment that suits them.






// Daily backups are Postgres point-in-time recovery now. The old version
// wrote the ENTIRE app state into one document per day, which was on
// course to breach Firestore's 1 MiB limit as the ledger grew.
function scheduleAutoBackup(){ /* no-op — Supabase handles backups */ }

async function runDailyBackup(){
  if(!fbEnabled) return;
  await FactoryDB.saveDay(S.workDate||todayStr(), buildPayload());
  console.log('Day snapshot saved:', S.workDate);
}

// Attendance changes push immediately rather than waiting for the 2s
// persist() debounce, so the owner's marks reach supervisors live.
function pushAttendanceLive(){
  if(!fbEnabled) return;
  pushToFirebase();
}

function persist(){
  try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
  // A local edit always repaints, so whatever had arrived remotely is on
  // screen now — the "new data" badge has nothing left to offer.
  try{ markProdSeen(); }catch(e){}
  if(fbEnabled&&db){
    clearTimeout(persist._fbTimer);
    persist._fbTimer=setTimeout(pushToFirebase,2000);
  }
}

// ── ID GENERATION ──
// These ids are bigint PRIMARY KEYs in Postgres and the `onConflict` target
// for raw_log and fg_transfers, so a duplicate silently OVERWRITES another
// row instead of inserting.
//
// The old formula ADDED the random part to the clock
// (`Date.now() + random*99999`), which collapsed the whole id space into a
// ~100s band: an id minted now was indistinguishable from one minted up to
// 99,998 ms earlier with a different draw. A tight loop of 2,000 ids produced
// ~22 collisions.
//
// Shifting instead of adding gives the timestamp its own range, so ids from
// different milliseconds can never collide. 2048 stays inside
// Number.MAX_SAFE_INTEGER until the year 2109 (2^53 / 2048 ms since epoch);
// the multiplier cannot be raised much further without losing integer
// precision. Legacy ids (~1.7e12) sit far below the new range, so old and new
// ids cannot collide either.
//
// 11 bits of pure randomness would still collide inside a single millisecond
// (a bulk Excel import mints hundreds per ms), so the low bits are a counter,
// not a fresh draw:
//   · a new millisecond seeds the counter randomly in the lower half, so two
//     devices logging in the same millisecond start from different offsets;
//   · repeat calls within that millisecond increment, which is collision-free
//     on this device by construction;
//   · overflowing the 2048 slots borrows from the next millisecond rather
//     than wrapping onto an id already issued.
// Ids are therefore strictly increasing per device and never repeat.
// uid() moved to core/state.js.

// ── OVERTIME — single source of truth ──
// OT is paid per hour at (daily wage / 8). `otHours` is the ONLY field
// read here. The legacy `ot` field held a flat rupee-per-day amount and
// is no longer used in any money calculation anywhere in the app.

// fmt / fmtN / todayStr moved to core/format.js.

function sendGet(url, params){
  const fullUrl = url + '?' + params;
  // Script tag is the ONLY method that works 100% cross-origin on ALL browsers
  // including Safari, Edge, Chrome, Firefox, and mobile — no CORS issues ever
  const s = document.createElement('script');
  s.src = fullUrl;
  s.onload = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  s.onerror = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  document.head.appendChild(s);
}

function sendViaImage(url, payload){
  // Split into small chunks — each well under URL limit

  // Chunk 1: Summary row (always tiny)
  const summary = {
    action:'summary',
    date: payload.date,
    workers: payload.workersPresent,
    goods: payload.goodsValue,
    labour: payload.labourCost,
    ot: payload.overtimeCost||0,
    rm: payload.rmCost,
    net: payload.netProfit,
    margin: payload.margin||0
  };
  sendGet(url, 'action=summary&payload=' + encodeURIComponent(JSON.stringify(summary)));

  // Chunk 2: Production log (one request per item)
  (payload.productLog||[]).forEach(function(p, i){
    setTimeout(function(){
      const prod = {action:'prod', date:payload.date, sup:p.supName||'', stage:p.stage||'', name:p.name, qty:p.qty, uv:p.unitVal, val:p.value};
      sendGet(url, 'action=prod&payload=' + encodeURIComponent(JSON.stringify(prod)));
    }, i * 300);
  });

  // Chunk 3: Raw materials (one per item)
  (payload.rawLog||[]).forEach(function(r, i){
    setTimeout(function(){
      const rm = {action:'rm', date:payload.date, stage:r.stage, name:r.name, qty:r.qty, unit:r.unit, up:r.unitPrice, cost:r.cost};
      sendGet(url, 'action=rm&payload=' + encodeURIComponent(JSON.stringify(rm)));
    }, i * 300 + 500);
  });

  // Attendance: NOT synced daily — monthly salary export syncs to Sheets instead

  return Promise.resolve(true);
}



function setSyncStatus(s,t){
  // Called during init before DOM may be ready — guard silently
  try{ updateSyncDot(s==='ok'?'ok':s==='err'?'err':'syncing'); }catch(e){}
}

function updateSyncStatus(){ S.sheetsUrl?setSyncStatus('ok','Connected'):setSyncStatus('','Not connected'); }

























// ── SESSION SHAPE — read every session through these ──
// Sessions have carried teams[] since the multi-team rework. enterSup()
// migrates a legacy single-team session when it is OPENED, but screens also
// render sessions nobody has opened — one logged on another device, most
// importantly. Reading ss.team / ss.production directly therefore throws on
// every current-shape session. That killed the active-session list on the
// Production screen and the whole Raw Material screen, both of which looked
// like "the sync is broken" rather than a render crash.




































// ── ORDER ITEM PICKER ──









































// NOTE: a second calcOT() used to live here. It read the legacy `worker.ot`
// field and, being the later declaration, silently overrode the real one —
// so every OT figure resolved to 0. The single implementation now lives with
// the other money helpers near uid(). Do not redeclare it here.


// ════════════════════════════════════
// DOCUMENTS — QUOTATION / INVOICE / CHALLAN
// ════════════════════════════════════

// ════ SALARY MANAGEMENT ════

// ── MONTHLY SALARY — single source of truth ──
// Both the Salary screen and the Excel/Sheets export read from here, so
// the two can never disagree again. They previously used different OT
// formulas and produced different payroll figures for the same month.








// ════ BILL OF MATERIALS ════














function checkXLSX(){
  if(typeof XLSX==='undefined'){alert('Excel export unavailable — check internet connection.');return false;}
  return true;
}

function downloadXLSX(wb, filename){
  try{
    const wbout=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    const blob=new Blob([wbout],{type:'application/octet-stream'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
  }catch(e){ XLSX.writeFile(wb,filename); }
}


















// ── INIT ──
// loadState() and the S binding moved to core/state.js.


try{
  S.sheetsUrl=SHEETS_URL;
  const today = todayStr();
  // Respect the date loadState() decided on — it already handles the
  // date-changed and day-was-saved cases. Assigning unconditionally here
  // discarded that decision.
  if(!S.workDate) S.workDate = today;
  persist();
  if(!S.stock||!S.stock.length){S.stock=S.rm.map(r=>({id:r.id,name:r.name,unit:r.unit,opening:0,reorder:100,openingDate:todayStr()}));}
  if(!S.orders) S.orders=[];
  if(!S.purchases) S.purchases=[];
  const wd=document.getElementById('work-date');
  if(wd){ wd.value=today; }
  if(!S.fgTransfers) S.fgTransfers=[];
  if(!S.fgAdjustments) S.fgAdjustments=[];
  if(!S.fgStock) S.fgStock={};
  if(!S.unitTransfers) S.unitTransfers=[];
  if(!S.dispatches) S.dispatches=[];
  if(!S.salaryAdj) S.salaryAdj={};
  if(!S.bom) S.bom={};
  persist();
  updateSyncStatus();
  const rq=document.getElementById('raw-qty');if(rq)rq.addEventListener('input',rawFill);
  const rm=document.getElementById('raw-mat');if(rm)rm.addEventListener('change',rawFill);
  document.getElementById('work-date').addEventListener('change',function(){S.workDate=this.value;persist();});
  const ac=document.getElementById('apps-script-code');if(ac)ac.value=APPS_SCRIPT_CODE;

  // Firebase initializes after login (see doLogin)

  // ── AUTO DATE REFRESH ──
  // Check every minute if date has changed (handles midnight + timezone)
  setInterval(()=>{
    const newToday = todayStr();
    if(S.workDate && S.workDate !== newToday){
      // Date has changed — clear sessions and update
      S.sessions = [];
      S.rawLog = [];
      S.lab.forEach(l=>{ l.present=false; l.doingOT=false; l.otHours=0; });
      S.workDate = newToday;
      const wdEl = document.getElementById('work-date');
      if(wdEl) wdEl.value = newToday;
      persist();
      console.log('Date auto-updated to', newToday);
    }
  }, 60000); // check every 60 seconds

}catch(e){
  console.error('Init error:', e.message, e.stack);
  // App still works — show login
  try{ document.getElementById('login-page').style.display='flex'; }catch(e2){}
}



// ── WINDOW EXPORTS (needed for inline onclick handlers) ──
// ── IMMEDIATE WINDOW EXPORTS (run before any onclick fires) ──
(function(){
  if(typeof spBadge === "function") window.spBadge = spBadge;
  if(typeof defaultState === "function") window.defaultState = defaultState;
  if(typeof togglePwd === "function") window.togglePwd = togglePwd;
  if(typeof doLogin === "function") window.doLogin = doLogin;
  if(typeof onLoginSuccess === "function") window.onLoginSuccess = onLoginSuccess;
  if(typeof doLogout === "function") window.doLogout = doLogout;
  if(typeof updateSidebarForRole === "function") window.updateSidebarForRole = updateSidebarForRole;
  if(typeof toggleSection === "function") window.toggleSection = toggleSection;
  if(typeof openSection === "function") window.openSection = openSection;
  if(typeof openSidebar === "function") window.openSidebar = openSidebar;
  if(typeof closeSidebar === "function") window.closeSidebar = closeSidebar;
  if(typeof go === "function") window.go = go;
  if(typeof switchDashTab === "function") window.switchDashTab = switchDashTab;
  if(typeof renderDashboard === "function") window.renderDashboard = renderDashboard;
  if(typeof renderTaskBoard === "function") window.renderTaskBoard = renderTaskBoard;
  if(typeof isOverdue === "function") window.isOverdue = isOverdue;
  if(typeof orderStatusColor === "function") window.orderStatusColor = orderStatusColor;
  if(typeof orderStatusBg === "function") window.orderStatusBg = orderStatusBg;
  if(typeof initFirebase === "function") window.initFirebase = initFirebase;
  if(typeof scheduleAutoBackup === "function") window.scheduleAutoBackup = scheduleAutoBackup;
  if(typeof updateSyncDot === "function") window.updateSyncDot = updateSyncDot;
  if(typeof startFirebaseSync === "function") window.startFirebaseSync = startFirebaseSync;
  // Both are `async function`, which the original export sweep missed. They are
  // called from inline markup handlers, and once this file becomes an ES module
  // its top-level declarations stop being global — only these assignments keep
  // those buttons alive.
  if(typeof pushToFirebase === "function") window.pushToFirebase = pushToFirebase;
  if(typeof runDailyBackup === "function") window.runDailyBackup = runDailyBackup;
  if(typeof renderScreen === "function") window.renderScreen = renderScreen;
  if(typeof showScreenError === "function") window.showScreenError = showScreenError;
  if(typeof clearScreenError === "function") window.clearScreenError = clearScreenError;
  // applyProdRefresh is reached from the badge's inline onclick, so it has to
  // be on window like every other handler in this file.
  if(typeof applyProdRefresh === "function") window.applyProdRefresh = applyProdRefresh;
  if(typeof prodFingerprint === "function") window.prodFingerprint = prodFingerprint;
  if(typeof markProdSeen === "function") window.markProdSeen = markProdSeen;
  if(typeof showProdRefresh === "function") window.showProdRefresh = showProdRefresh;
  if(typeof persist === "function") window.persist = persist;
  if(typeof uid === "function") window.uid = uid;
  if(typeof fmt === "function") window.fmt = fmt;
  if(typeof fmtN === "function") window.fmtN = fmtN;
  if(typeof todayStr === "function") window.todayStr = todayStr;
  if(typeof sendGet === "function") window.sendGet = sendGet;
  if(typeof sendViaImage === "function") window.sendViaImage = sendViaImage;
  if(typeof setSyncStatus === "function") window.setSyncStatus = setSyncStatus;
  if(typeof updateSyncStatus === "function") window.updateSyncStatus = updateSyncStatus;
  if(typeof uploadRM === "function") window.uploadRM = uploadRM;
  if(typeof uploadLab === "function") window.uploadLab = uploadLab;
  if(typeof dlSampleRM === "function") window.dlSampleRM = dlSampleRM;
  if(typeof dlSampleLab === "function") window.dlSampleLab = dlSampleLab;
  if(typeof renderSetup === "function") window.renderSetup = renderSetup;
  if(typeof addRM === "function") window.addRM = addRM;
  if(typeof delRM === "function") window.delRM = delRM;
  if(typeof addFG === "function") window.addFG = addFG;
  if(typeof delFG === "function") window.delFG = delFG;
  if(typeof addLab === "function") window.addLab = addLab;
  if(typeof delLab === "function") window.delLab = delLab;
  if(typeof renderSheets === "function") window.renderSheets = renderSheets;
  if(typeof saveUrl === "function") window.saveUrl = saveUrl;
  if(typeof testConnection === "function") window.testConnection = testConnection;
  if(typeof copyScript === "function") window.copyScript = copyScript;
  if(typeof switchAttTab === "function") window.switchAttTab = switchAttTab;
  if(typeof renderAtt === "function") window.renderAtt = renderAtt;
  if(typeof renderOTTab === "function") window.renderOTTab = renderOTTab;
  if(typeof setOTHours === "function") window.setOTHours = setOTHours;
  if(typeof togAtt === "function") window.togAtt = togAtt;
  if(typeof togOT === "function") window.togOT = togOT;
  if(typeof markAll === "function") window.markAll = markAll;
  if(typeof updAttMet === "function") window.updAttMet = updAttMet;
  if(typeof renderSupLogin === "function") window.renderSupLogin = renderSupLogin;
  if(typeof delSess === "function") window.delSess = delSess;
  if(typeof enterSup === "function") window.enterSup = enterSup;
  if(typeof renderSupWork === "function") window.renderSupWork = renderSupWork;
  if(typeof renderSupTeamOverview === "function") window.renderSupTeamOverview = renderSupTeamOverview;
  if(typeof addNewTeam === "function") window.addNewTeam = addNewTeam;
  if(typeof selectTeam === "function") window.selectTeam = selectTeam;
  if(typeof deleteTeam === "function") window.deleteTeam = deleteTeam;
  if(typeof renderSupTeamWork === "function") window.renderSupTeamWork = renderSupTeamWork;
  if(typeof swStage === "function") window.swStage = swStage;
  if(typeof swTogTeam === "function") window.swTogTeam = swTogTeam;
  if(typeof swFill === "function") window.swFill = swFill;
  if(typeof logProd === "function") window.logProd = logProd;
  if(typeof delProd === "function") window.delProd = delProd;
  if(typeof saveSup === "function") window.saveSup = saveSup;
  if(typeof exitSup === "function") window.exitSup = exitSup;
  if(typeof updateColorFieldVisibility === "function") window.updateColorFieldVisibility = updateColorFieldVisibility;
  if(typeof renderRaw === "function") window.renderRaw = renderRaw;
  if(typeof rawFill === "function") window.rawFill = rawFill;
  if(typeof issueRaw === "function") window.issueRaw = issueRaw;
  if(typeof delRaw === "function") window.delRaw = delRaw;
  if(typeof renderRawLog === "function") window.renderRawLog = renderRawLog;
  if(typeof renderRawPnL === "function") window.renderRawPnL = renderRawPnL;
  if(typeof renderDay === "function") window.renderDay = renderDay;
  if(typeof buildPayload === "function") window.buildPayload = buildPayload;
  if(typeof syncToSheets === "function") window.syncToSheets = syncToSheets;
  if(typeof saveDay === "function") window.saveDay = saveDay;
  if(typeof initMonthly === "function") window.initMonthly = initMonthly;
  if(typeof prevMonth === "function") window.prevMonth = prevMonth;
  if(typeof nextMonth === "function") window.nextMonth = nextMonth;
  if(typeof showMonthDay === "function") window.showMonthDay = showMonthDay;
  if(typeof renderMonthly === "function") window.renderMonthly = renderMonthly;
  if(typeof renderOrders === "function") window.renderOrders = renderOrders;
  if(typeof filterOrders === "function") window.filterOrders = filterOrders;
  if(typeof openNewOrder === "function") window.openNewOrder = openNewOrder;
  if(typeof closeOrderForm === "function") window.closeOrderForm = closeOrderForm;
  if(typeof filterOrderProducts === "function") window.filterOrderProducts = filterOrderProducts;
  if(typeof selectOrderProduct === "function") window.selectOrderProduct = selectOrderProduct;
  if(typeof addOrderItem === "function") window.addOrderItem = addOrderItem;
  if(typeof changeOrderItemQty === "function") window.changeOrderItemQty = changeOrderItemQty;
  if(typeof removeOrderItem === "function") window.removeOrderItem = removeOrderItem;
  if(typeof renderOrderItemsList === "function") window.renderOrderItemsList = renderOrderItemsList;
  if(typeof updateOrderTotal === "function") window.updateOrderTotal = updateOrderTotal;
  if(typeof importOrdersFromSheets === "function") window.importOrdersFromSheets = importOrdersFromSheets;
  if(typeof saveOrder === "function") window.saveOrder = saveOrder;
  if(typeof updateOrderStatus === "function") window.updateOrderStatus = updateOrderStatus;
  if(typeof recordPayment === "function") window.recordPayment = recordPayment;
  if(typeof deleteOrder === "function") window.deleteOrder = deleteOrder;
  if(typeof renderPayments === "function") window.renderPayments = renderPayments;
  if(typeof renderStock === "function") window.renderStock = renderStock;
  if(typeof openStockUpdate === "function") window.openStockUpdate = openStockUpdate;
  if(typeof closeStockForm === "function") window.closeStockForm = closeStockForm;
  if(typeof saveStock === "function") window.saveStock = saveStock;
  if(typeof openPurchase === "function") window.openPurchase = openPurchase;
  if(typeof closePurchase === "function") window.closePurchase = closePurchase;
  if(typeof savePurchase === "function") window.savePurchase = savePurchase;
  if(typeof openRMPurchaseForm === "function") window.openRMPurchaseForm = openRMPurchaseForm;
  if(typeof closeRMPurchaseForm === "function") window.closeRMPurchaseForm = closeRMPurchaseForm;
  if(typeof saveRMPurchase === "function") window.saveRMPurchase = saveRMPurchase;
  if(typeof renderRMPurchase === "function") window.renderRMPurchase = renderRMPurchase;
  if(typeof initFGStock === "function") window.initFGStock = initFGStock;
  if(typeof getFGBalance === "function") window.getFGBalance = getFGBalance;
  if(typeof switchFGStage === "function") window.switchFGStage = switchFGStage;
  if(typeof renderFGStock === "function") window.renderFGStock = renderFGStock;
  if(typeof quickTransfer === "function") window.quickTransfer = quickTransfer;
  if(typeof openFGTransfer === "function") window.openFGTransfer = openFGTransfer;
  if(typeof closeFGTransfer === "function") window.closeFGTransfer = closeFGTransfer;
  if(typeof updateFGTransferTo === "function") window.updateFGTransferTo = updateFGTransferTo;
  if(typeof saveFGTransfer === "function") window.saveFGTransfer = saveFGTransfer;
  if(typeof openFGAdjust === "function") window.openFGAdjust = openFGAdjust;
  if(typeof closeFGAdjust === "function") window.closeFGAdjust = closeFGAdjust;
  if(typeof saveFGAdjust === "function") window.saveFGAdjust = saveFGAdjust;
  if(typeof getAllFGProducts === "function") window.getAllFGProducts = getAllFGProducts;
  if(typeof renderInventory === "function") window.renderInventory = renderInventory;
  if(typeof calcOT === "function") window.calcOT = calcOT;
  if(typeof otAmt === "function") window.otAmt = otAmt;
  if(typeof renderSalary === "function") window.renderSalary = renderSalary;
  if(typeof openSalModal === "function") window.openSalModal = openSalModal;
  if(typeof closeSalModal === "function") window.closeSalModal = closeSalModal;
  if(typeof saveSalAdj === "function") window.saveSalAdj = saveSalAdj;
  if(typeof exportSalaryExcel === "function") window.exportSalaryExcel = exportSalaryExcel;
  if(typeof renderDispatch === "function") window.renderDispatch = renderDispatch;
  if(typeof doDispatch === "function") window.doDispatch = doDispatch;
  if(typeof renderBOM === "function") window.renderBOM = renderBOM;
  if(typeof addBOMRow === "function") window.addBOMRow = addBOMRow;
  if(typeof editBOM === "function") window.editBOM = editBOM;
  if(typeof deleteBOM === "function") window.deleteBOM = deleteBOM;
  if(typeof closeBOMForm === "function") window.closeBOMForm = closeBOMForm;
  if(typeof filterBOMProducts === "function") window.filterBOMProducts = filterBOMProducts;
  if(typeof selectBOMProd === "function") window.selectBOMProd = selectBOMProd;
  if(typeof addBOMRM === "function") window.addBOMRM = addBOMRM;
  if(typeof renderBOMRMRows === "function") window.renderBOMRMRows = renderBOMRMRows;
  if(typeof saveBOM === "function") window.saveBOM = saveBOM;
  if(typeof renderExportPage === "function") window.renderExportPage = renderExportPage;
  if(typeof setExpRange === "function") window.setExpRange = setExpRange;
  if(typeof getExpDates === "function") window.getExpDates = getExpDates;
  if(typeof inRange === "function") window.inRange = inRange;
  if(typeof checkXLSX === "function") window.checkXLSX = checkXLSX;
  if(typeof downloadXLSX === "function") window.downloadXLSX = downloadXLSX;
  if(typeof exportAttendance === "function") window.exportAttendance = exportAttendance;
  if(typeof exportProduction === "function") window.exportProduction = exportProduction;
  if(typeof exportOrders === "function") window.exportOrders = exportOrders;
  if(typeof exportPnL === "function") window.exportPnL = exportPnL;
  if(typeof saveDocAsOrder === "function") window.saveDocAsOrder = saveDocAsOrder;
  if(typeof renderDocs === "function") window.renderDocs = renderDocs;
  if(typeof updateDocType === "function") window.updateDocType = updateDocType;
  if(typeof fillFromOrder === "function") window.fillFromOrder = fillFromOrder;
  if(typeof docItemFill === "function") window.docItemFill = docItemFill;
  if(typeof addDocItem === "function") window.addDocItem = addDocItem;
  if(typeof removeDocItem === "function") window.removeDocItem = removeDocItem;
  if(typeof renderDocItems === "function") window.renderDocItems = renderDocItems;
  if(typeof updateDocPreview === "function") window.updateDocPreview = updateDocPreview;
  if(typeof buildDocHTML === "function") window.buildDocHTML = buildDocHTML;
  if(typeof printDoc === "function") window.printDoc = printDoc;
  if(typeof clearDoc === "function") window.clearDoc = clearDoc;
  if(typeof loadState === "function") window.loadState = loadState;
  console.log('Factory OS ready');
})();

// ── BOOT CLOUD SYNC ──
// supabase-js and supabase-db.js are loaded by index.html before this
// file, so the SDK is already present. No runtime CDN fetch needed.
initFirebase();


// ══════════════════════════════════════════════
// ── FACTORY OS FIXES & ENHANCEMENTS ──
// ══════════════════════════════════════════════

// NOTE: pushAttendanceLive() and pullSupervisorData() now live in the
// cloud-sync section above. The versions that were here merged and
// de-duplicated supervisor documents by hand and polled every 10s.
// Postgres realtime replaces all of it.

// ── Session backup every 5 min ──
setInterval(function(){
  if(S&&S.sessions&&S.sessions.length>0){
    try{localStorage.setItem('_sessions_backup_',JSON.stringify({
      sessions:S.sessions,date:todayStr(),savedAt:Date.now()
    }));}catch(e){}
  }
}, 5*60*1000);

// ── Restore sessions on load if missing ──
(function(){
  try{
    var bk=localStorage.getItem('_sessions_backup_');
    if(!bk) return;
    var b=JSON.parse(bk);
    var td=new Date();
    var today=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
    if(b.date===today&&(Date.now()-b.savedAt)<12*3600000){
      if(S&&(!S.sessions||S.sessions.length===0)&&b.sessions.length>0){
        S.sessions=b.sessions;
        try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
      }
    }
  }catch(e){}
})();

// ── CLEANUP: unregister stale PWA service worker from old build ──
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(function(regs){
    regs.forEach(function(r){ r.unregister(); });
    if(regs.length && window.caches){
      caches.keys().then(function(keys){ keys.forEach(function(k){ caches.delete(k); }); });
    }
  }).catch(function(){});
}


// ── DAY ROLLOVER ──
// Adopt a new work date: clear day-specific data, reset attendance
function isDaySaved(d){
  if(d && S.workDate && d===S.workDate){
    // current working day can never be "already saved" — clean any stale flag from testing
    if(localStorage.getItem('_day_cleared_'+d)) localStorage.removeItem('_day_cleared_'+d);
    return false;
  }
  return !!(d && ((S.ledger||[]).some(function(e){return e.date===d;}) || localStorage.getItem('_day_cleared_'+d)));
}
function adoptWorkDate(newDate, savedDate){
  if(savedDate) localStorage.setItem('_day_cleared_'+savedDate,'1');
  // Move to the new date BEFORE filtering. isDaySaved() treats S.workDate as
  // "the open day, never saved" and clears its _day_cleared_ flag as a side
  // effect — so filtering first made every row still carrying the OLD date
  // look unsaved, erased the flag marking that day closed, and carried
  // already-saved production forward into the new day, where getFGBalance()
  // counted it a second time on top of the ledger.
  S.workDate=newDate;
  // Drop only sessions from days already saved; carry unsaved in-progress work to the new date
  S.sessions=(S.sessions||[]).filter(function(s){return !isDaySaved(s.date);});
  S.sessions.forEach(function(s){s.date=newDate;});
  S.rawLog=(S.rawLog||[]).filter(function(r){return !isDaySaved(r.date);});
  S.rawLog.forEach(function(r){r.date=newDate;});
  (S.lab||[]).forEach(function(l){l.present=false;l.doingOT=false;l.otHours=0;});
  var wd=document.getElementById('work-date'); if(wd) wd.value=newDate;
  try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
  try{renderDashboard();}catch(e){}
  var sid=(document.querySelector('.screen.active')||{}).id;
  if(sid) try{go(sid.replace('sc-',''));}catch(e){}
}
// Auto-advance if our workDate is in the past AND that day was already saved
function checkDayRollover(){
  if(!S||!S.workDate) return;
  // Prune leftover sessions/rawLog from days already saved (safe: they live in the ledger)
  var pruned=false;
  var isDone=function(d){return d && d!==S.workDate && isDaySaved(d);};
  if((S.sessions||[]).some(function(s){return isDone(s.date);})){ S.sessions=S.sessions.filter(function(s){return !isDone(s.date);}); pruned=true; }
  if((S.rawLog||[]).some(function(r){return isDone(r.date);})){ S.rawLog=S.rawLog.filter(function(r){return !isDone(r.date);}); pruned=true; }
  if(pruned){
    try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
    try{renderDashboard();}catch(e){}
    var _sid=(document.querySelector('.screen.active')||{}).id;
    if(_sid) try{go(_sid.replace('sc-',''));}catch(e){}
  }
  var today=todayStr();
  if(S.workDate>=today) return;
  var wasSaved=(S.ledger||[]).some(function(e){return e.date===S.workDate;})
    || localStorage.getItem('_day_cleared_'+S.workDate);
  if(wasSaved) adoptWorkDate(today);
  // If not saved: leave data alone — the day still needs to be saved manually
}
// Check every 60s so cleanup and overnight rollover happen without user action
setInterval(checkDayRollover, 60*1000);
