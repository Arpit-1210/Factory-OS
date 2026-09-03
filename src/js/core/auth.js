// ==================================================================
//  CORE / AUTH — Sign in, sign out, and what happens after
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

import { updateSidebarForRole } from '../components/sidebar.js';
import { ROLE_HOME } from './config.js';
import { checkDayRollover, nextOpenDate, noteUnclosedDay, openWorkDate } from './day-rollover.js';
import { todayStr } from './format.js';
import { go } from './router.js';
import { currentRole, fbEnabled, setRole } from './session.js';
import { S } from './state.js';
import { initFirebase, pullFromFirebase, pushToFirebase, startFirebaseSync } from './sync.js';
import { renderDashboard } from '../screens/dashboard.js';

export function togglePwd(){
  const i = document.getElementById('login-pwd');
  i.type = i.type==='password' ? 'text' : 'password';
}
// ── LOGIN ──
// Email + password only. The old role-card "master password" path is GONE:
// the passwords were empty strings (the .env values never substituted
// because there is no build step), so selecting a role and submitting a
// blank password granted full access to anyone with the URL.
//
// Role is now read from app_users and enforced by Postgres RLS. Editing
// `currentRole` in DevTools no longer grants anything.
export async function doLogin(){
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
  // The header date picker rejects future dates (app.js) but this field did
  // not, and `max` was set only in doLogout() — so on a fresh load nothing
  // stopped a login onto next week, which would then record real work under a
  // day that has not happened.
  const wantDate = document.getElementById('login-work-date')?.value;
  if(wantDate && wantDate > todayStr()){
    errEl.textContent='❌ That date is in the future. Work can only be recorded up to today.';
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
  document.getElementById('login-pwd').value='';
  onLoginSuccess((res.user.user_metadata||{}).name || email.split('@')[0]);
}
export function onLoginSuccess(displayName){
  // Which day is this session working on? Blank, or today's date, means today.
  const loginDate = document.getElementById('login-work-date')?.value;
  const pastDate = (loginDate && loginDate <= todayStr() && loginDate !== todayStr())
    ? loginDate : null;

  document.getElementById('login-page').style.display='none';
  document.getElementById('app-shell').style.display='flex';
  const tags={owner:'👨‍💼 Owner',supervisor:'👷 Supervisor',rm:'🧪 RM Supervisor'};
  const el=document.getElementById('role-tag');
  el.textContent=(displayName?displayName+' · ':'')+tags[currentRole];
  el.className='role-tag '+currentRole;
  updateSidebarForRole();

  // ── OPENING THE DAY THE USER ASKED FOR ──
  //
  // Through openWorkDate(), which is the only function allowed to move
  // S.workDate (see core/day-rollover.js). This used to assign S.workDate
  // directly and null S.reopenDate, and so skipped every part of the machinery
  // that makes a chosen day actually hold:
  //
  //   · S.reopenDate stayed null, so isReopened() was false and the 60-second
  //     checkDayRollover interval in app.js moved the user straight back to
  //     today. That interval's first guard exists precisely to stop this —
  //     "any date worth opening is by definition in the ledger" — and the
  //     login path was the one caller that never armed it.
  //   · A closed day was not read from its ledger entry, so it opened EMPTY
  //     and invited the user to re-enter a day that was already recorded.
  //     Saving then replaced the real ledger entry with the re-entered one.
  //   · repaint() never ran, so the amber "you are editing closed history"
  //     banner never appeared and nothing was written to localStorage — a
  //     reload landed in loadState()'s third branch and snapped back to today.
  //
  // `reopen:true` is correct whether or not the day is closed: the user named
  // this specific day, which is exactly the deliberate act the flag denotes.
  // For an open day openWorkDate() clears the slots and leaves reopenDate null.
  //
  // `pull:false` because the login chain below pulls anyway — and it must be
  // that pull, not openWorkDate's, since only pullFromFirebase() reports
  // success back to the push decision. Ordering still matters: S.workDate is
  // set here, synchronously, so the pull fetches this day's rows and not
  // today's.
  //
  // Whether the day is REALLY closed is settled afterwards by
  // reconcileOpenDay(), once the pull has brought the true ledger — S.ledger
  // is only this device's cache until then, so it cannot be decided here.
  if(pastDate){
    openWorkDate(pastDate, {reopen:true, pull:false});
  }else{
    // ── NO DATE CHOSEN MEANS TODAY ──
    //
    // It used to mean "whatever day this device happened to be left on".
    // S.workDate is restored from localStorage, and loadState() deliberately
    // keeps an unclosed past day open, so signing in with an empty field could
    // land on a day from last week — and a shift then got recorded against it
    // without anyone choosing that.
    //
    // checkDayRollover() alone did not fix this: it returns early for an
    // unsaved past day, which is exactly the case that strands you.
    //
    // nextOpenDate() rather than today flat, so a today that is already closed
    // moves on instead of reopening history — the same rule the rollover uses.
    //
    // The day being left behind is NOT abandoned. Every operational table is
    // keyed by work_date, so an unclosed day's rows stay in Postgres and
    // opening it again brings them back. What must not happen is that going
    // unmentioned, which is how a day previously vanished from the app: absent
    // from Monthly, with its rows stranded where no query asks for them.
    // noteUnclosedDay() records it and the banner offers to go and finish it.
    noteUnclosedDay(S.workDate);
    openWorkDate(nextOpenDate(todayStr()), {pull:false});
    checkDayRollover();
  }
  // Attach realtime subscriptions now that the role is known — init runs
  // before login with currentRole=null, so nothing was subscribed yet.
  if(fbEnabled){
    pullFromFirebase().then(function(ok){
      // Push once immediately after the first pull.
      //
      // This is what seeds an empty database: pull() deliberately keeps the
      // local catalogue when the remote one is empty (see the first-run
      // guard in supabase-db.js), and without this push those rows would
      // never reach Postgres — the owner would appear to be working while
      // nothing was saved.
      //
      // ONLY when the pull actually succeeded, though. It used to be
      // unconditional, on the reasoning that "pull() has just overwritten
      // local state with whatever the server had". That holds only if the
      // pull worked — and pull() swallowed its own failures, returning S
      // untouched. So a login on a flaky connection pushed the device's local
      // state, which loadState() may well have just cleared for a date
      // rollover, straight over the day's real rows: everyone marked absent,
      // for everyone, from one bad login.
      if(!ok){
        console.warn('initial pull failed — not pushing local state over the server');
        return;
      }
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
export async function doLogout(){
  if(fbEnabled) await FactoryDB.signOut();
  setRole(null);
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

// Enter-to-advance on the login form. These were inline
// `if(event.key==='Enter') ...` expressions in the markup.
export function emailKeydown(ev){
  if (ev && ev.key === 'Enter') {
    const pwd = document.getElementById('login-pwd');
    if (pwd) pwd.focus();
  }
}
export function passwordKeydown(ev){ if (ev && ev.key === 'Enter') doLogin(); }

/**
 * Restore an already-signed-in user on page load.
 *
 * Supabase keeps the session in localStorage (persistSession: true) and
 * FactoryDB.init() reads it back and resolves the role. The app never asked,
 * though: initFirebase() checked its OWN `currentRole`, which is null on a
 * fresh load, so a reload always dropped the user at the login screen even
 * though the session was perfectly valid.
 *
 * That is what made a refresh feel like a logout — and since a refresh was the
 * only way to see another device's changes while realtime was off, everyone
 * was signing in again several times a day.
 *
 * Returns true if a session was restored.
 */
export async function restoreSession(){
  if(typeof FactoryDB === 'undefined' || !FactoryDB.isReady()) return false;
  const role = FactoryDB.role();
  if(!role) return false;

  setRole(role);
  const user = FactoryDB.user();
  const name = user && user.email ? user.email.split('@')[0] : '';
  onLoginSuccess(name);
  return true;
}
