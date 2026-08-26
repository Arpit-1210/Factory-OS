// ==================================================================
//  CORE / SYNC — Cloud sync: push, pull, realtime and the persist seam
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

import { LS_KEY } from './config.js';
import { todayStr } from './format.js';
import { go, renderScreen } from './router.js';
import { currentRole, fbEnabled, setFbEnabled } from './session.js';
import { restoreSession } from './auth.js';
import { S, setS } from './state.js';
import { renderDashboard } from '../screens/dashboard.js';
import { buildPayload } from '../screens/day.js';
import { lastSeenFingerprint, markProdSeen, prodFingerprint, showProdRefresh } from '../screens/production.js';

// ── screen state ──
let db = null;           // Supabase client; kept for legacy truthiness checks

export function updateSyncDot(status){
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
export async function initFirebase(){
  if(typeof FactoryDB === 'undefined'){
    console.error('supabase-db.js not loaded');
    updateSyncDot('err');
    return false;
  }
  const ok = await FactoryDB.init();
  setFbEnabled(ok);
  db = ok ? FactoryDB.client() : null;

  if(!ok){ updateSyncDot('err'); return false; }

  console.log('Supabase connected');
  updateSyncDot('syncing');

  window.addEventListener('online',  function(){ updateSyncDot('syncing'); FactoryDB.flushOutbox(); });
  window.addEventListener('offline', function(){ updateSyncDot('err'); });

  // Replay anything queued while offline before pulling fresh state,
  // otherwise a pull would overwrite unsent local work.
  await FactoryDB.flushOutbox();

  // A reload arrives here with the app's currentRole still null, even when
  // Supabase has a valid persisted session. Ask FactoryDB, which recovered it
  // during init(), and put the user back where they were instead of showing
  // the login page again. restoreSession() runs the normal post-login path,
  // so it pulls and subscribes exactly as a fresh sign-in would.
  if(!currentRole){
    const restored = await restoreSession();
    if(restored){ updateSyncDot('ok'); return true; }
  } else {
    await pullFromFirebase();
    startFirebaseSync();
    try{ renderDashboard(); }catch(e){}
  }
  updateSyncDot('ok');
  return true;
}
export async function pushToFirebase(){
  if(!fbEnabled || !currentRole) return;
  await FactoryDB.push(S, currentRole);
}
// Returns true only when every query came back clean. Callers that are about
// to PUSH must check it: pushing after a failed pull broadcasts whatever stale
// or half-wiped state this device happens to hold over good rows on the server.
export async function pullFromFirebase(){
  if(!fbEnabled) return false;
  await FactoryDB.pull(S);
  try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){}
  return FactoryDB.lastPullOk();
}
// The owner's view of supervisor sessions is now just a pull. The manual
// merge and de-duplication this used to do is gone — sessions are rows,
// and RLS stops one supervisor from touching another's.
export async function pullSupervisorSessions(){ return pullFromFirebase(); }
export async function pullSupervisorData(){ return pullFromFirebase(); }
export function startFirebaseSync(){
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
      try{ if(prodFingerprint() !== lastSeenFingerprint()) showProdRefresh(); }catch(e){}
    }
  });
}
export function stopFirebaseSync(){
  if(fbEnabled) FactoryDB.stopSync();
}
// Daily backups are Postgres point-in-time recovery now. The old version
// wrote the ENTIRE app state into one document per day, which was on
// course to breach Firestore's 1 MiB limit as the ledger grew.
export function scheduleAutoBackup(){ /* no-op — Supabase handles backups */ }
export async function runDailyBackup(){
  if(!fbEnabled) return;
  await FactoryDB.saveDay(S.workDate||todayStr(), buildPayload());
  console.log('Day snapshot saved:', S.workDate);
}
// Attendance changes push immediately rather than waiting for the 2s
// persist() debounce, so the owner's marks reach supervisors live.
export function pushAttendanceLive(){
  if(!fbEnabled) return;
  pushToFirebase();
}
export function persist(){
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
export async function emergencyPush(){
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

export async function restoreFromBackup(){
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

