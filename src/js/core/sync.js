// ==================================================================
//  CORE / SYNC — Cloud sync: push, pull, realtime and the persist seam
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

// ── screen state ──
let db = null;           // Supabase client; kept for legacy truthiness checks

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


// The Sheets screen offers these next to "Force Sync". They differ from a
// plain push in that they deal with the offline outbox and with pulling the
// cloud copy back, which is what an owner actually wants when a device has
// been off the network or has drifted.
async function emergencyPush(){
  if(!fbEnabled){ alert('Not connected to the cloud yet.'); return; }
  const pending=FactoryDB.pendingWrites();
  updateSyncDot('syncing');
  await FactoryDB.flushOutbox();   // queued writes first, or the push races them
  await pushToFirebase();
  const left=FactoryDB.pendingWrites();
  updateSyncDot(left?'err':'ok');
  alert(left ? `${left} change(s) still queued — check the connection.`
             : `Pushed. ${pending?pending+' queued change(s) replayed.':'Everything was already up to date.'}`);
}

async function restoreFromBackup(){
  if(!fbEnabled){ alert('Not connected to the cloud yet.'); return; }
  if(FactoryDB.pendingWrites()){
    // Pulling would overwrite work that never reached Postgres.
    alert('There are unsynced changes on this device. Push them first, then restore.');
    return;
  }
  if(!confirm('Replace the data on this device with the cloud copy? Local changes that were never synced will be lost.')) return;
  updateSyncDot('syncing');
  await pullFromFirebase();
  updateSyncDot('ok');
  try{ renderScreen('dashboard'); }catch(e){}
  alert('Restored from the cloud copy.');
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
  emergencyPush, restoreFromBackup,
  updateSyncDot,
  initFirebase,
  pushToFirebase,
  pullFromFirebase,
  pullSupervisorSessions,
  pullSupervisorData,
  startFirebaseSync,
  stopFirebaseSync,
  scheduleAutoBackup,
  runDailyBackup,
  pushAttendanceLive,
  persist,
});

// State the rest of the app reads. Re-published on each change by the
// functions above; mirrored here so the initial value is visible too.
window.db = db;
