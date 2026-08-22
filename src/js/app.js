// Factory OS v2.0 — All features, secrets from .env

// app.js is a module like everything else now: it imports what it uses
// instead of reading it off the global object.
import { doLogin } from './core/auth.js';
import { calcOT } from './core/calc.js';
import { APPS_SCRIPT_CODE, LS_KEY, SHEETS_URL } from './core/config.js';
import { checkDayRollover } from './core/day-rollover.js';
import { updateSyncStatus } from './core/sheets-sync.js';
import { rawFill } from './screens/raw.js';
import { todayStr } from './core/format.js';
import { currentRole, fbEnabled } from './core/session.js';
import { S, uid } from './core/state.js';
import { initFirebase, persist, pushToFirebase, updateSyncDot } from './core/sync.js';
import { appHtml } from './templates/index.js';
import './core/actions.js';   // installs the delegated event listeners

// Inject screens HTML
// The app document is assembled from per-screen templates in
// src/js/templates/. It used to be a 1,069-line static template literal
// right here, a thousand lines above any of the code that drives it.
// main.js installs it on window before this file runs.
document.getElementById('app-root').innerHTML = appHtml();

// loadScript() removed — it fetched the Firebase SDK, which Supabase
// replaced. No caller remained anywhere in src/.

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

// NOTE: the email-to-role map that was here is gone. It defaulted unknown
// addresses to 'supervisor' on the client, which meant the role was decided
// in the browser. Roles now live in app_users and are enforced by RLS.

// ════ DASHBOARD ════




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

// ── "NEW DATA" BADGE FOR THE PRODUCTION SCREEN ──
// Everywhere else a remote change simply re-renders the screen. Production
// cannot: a repaint mid-entry resets the selected team and wipes half-typed
// inputs. So we compare what the screen last drew against what is now in
// state, and if they differ we show a badge that lets the user take the
// update at a moment that suits them.

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

// The window-export block that lived here is gone.
//
// It published ~180 functions onto the global object for one reason: the
// markup wired its buttons with inline onclick=, and the browser evaluates
// those against `window`. The markup now names actions instead
// (data-click="saveOrder"), and core/actions.js resolves them through real
// imports, so nothing needs to be global any more.
//
// Worth remembering: this block was written `});` instead of `})();` and so
// never actually ran. It was invisible while app.js was a classic script,
// because top-level declarations were global anyway.

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

// Check every 60s so cleanup and overnight rollover happen without user action
setInterval(checkDayRollover, 60*1000);
