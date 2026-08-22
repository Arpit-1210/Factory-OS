// ==================================================================
//  CORE / AUTH — Sign in, sign out, and what happens after
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { updateSidebarForRole } from '../components/sidebar.js';
import { ROLE_HOME } from './config.js';
import { checkDayRollover } from './day-rollover.js';
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

