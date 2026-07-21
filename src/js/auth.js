// ── AUTH MODULE ──
// Firebase Auth handles login — roles stored in Firestore
// Master password as fallback ONLY (stored in env, not code)

import { ROLE_ACCESS, ROLE_HOME } from './config.js';
import { initFirebase, pullFromFirebase, startFirebaseSync,
         getUserRole, getRoleFromFirestore, pushToFirebase,
         updateSyncDot } from './firebase.js';
import { todayStr } from './utils.js';

const MASTER_PASSWORDS = {
  owner:      import.meta.env.VITE_OWNER_PASSWORD      || '',
  supervisor: import.meta.env.VITE_SUPERVISOR_PASSWORD || '',
  rm:         import.meta.env.VITE_RM_PASSWORD         || '',
};

export let currentRole = null;
export let currentUser = null;
let selectedRole = null;
let _state = null;
let _onLogin = null;

// ── RENDER LOGIN FORM ──
export function renderLoginForm(state, onLoginSuccess) {
  _state = state;
  _onLogin = onLoginSuccess;

  const container = document.getElementById('login-form-container');
  container.innerHTML = `
    <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.12em;text-align:center;margin-bottom:14px">Sign in to your account</div>

    <div class="fld" style="margin-bottom:10px">
      <label>Email</label>
      <input class="login-input" type="email" id="login-email" placeholder="you@propskart.com"
        onkeydown="if(event.key==='Enter')document.getElementById('login-pwd').focus()">
    </div>

    <div style="position:relative;margin-bottom:14px">
      <label style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:5px;font-weight:600">Password</label>
      <input class="login-input" type="password" id="login-pwd" placeholder="Enter password"
        onkeydown="if(event.key==='Enter')window._doLogin()" style="margin-bottom:0;padding-right:44px">
      <span style="position:absolute;right:14px;bottom:10px;color:var(--text4);font-size:16px;cursor:pointer"
        onclick="const i=document.getElementById('login-pwd');i.type=i.type==='password'?'text':'password'">👁</span>
    </div>

    <button class="login-btn" onclick="window._doLogin()">
      <span>Sign In</span><span style="margin-left:6px">→</span>
    </button>
    <div class="login-error" id="login-error" style="display:none">❌ Wrong email or password.</div>

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-align:center;margin-bottom:8px">OR USE MASTER LOGIN</div>
      <div class="role-grid">
        <div class="role-card" id="rc-owner" onclick="window._selectRole('owner')">
          <div class="ri">👨‍💼</div><div class="rn">Owner</div>
        </div>
        <div class="role-card" id="rc-supervisor" onclick="window._selectRole('supervisor')">
          <div class="ri">👷</div><div class="rn">Supervisor</div>
        </div>
        <div class="role-card" id="rc-rm" onclick="window._selectRole('rm')">
          <div class="ri">🧪</div><div class="rn">RM Super</div>
        </div>
      </div>
    </div>

    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:9px;color:var(--text4);margin-bottom:6px;text-align:center">ENTERING DATA FOR A PAST DATE?</div>
      <div class="fld">
        <label>Work Date (leave blank for today)</label>
        <input type="date" id="login-work-date" max="${todayStr()}"
          style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r);color:var(--text);padding:9px 12px;font-size:13px;width:100%;outline:none">
      </div>
    </div>

    <div style="margin-top:16px;text-align:center">
      <div style="font-family:var(--mono);font-size:9px;color:var(--text4)">Factory OS v2.0 · Built for Propskart</div>
    </div>
  `;

  // Expose to window for inline handlers
  window._doLogin    = doLogin;
  window._selectRole = selectRole;
}

function selectRole(role) {
  selectedRole = role;
  ['owner','supervisor','rm'].forEach(r => {
    const el = document.getElementById('rc-'+r);
    if (el) el.classList.toggle('selected', r === role);
  });
}

async function doLogin() {
  const email   = document.getElementById('login-email')?.value?.trim();
  const pwd     = document.getElementById('login-pwd')?.value;
  const errEl   = document.getElementById('login-error');
  errEl.style.display = 'none';

  // ── FIREBASE EMAIL LOGIN (preferred — role from Firestore, can't be faked) ──
  if (email && email.includes('@')) {
    const btn = document.querySelector('.login-btn');
    if (btn) btn.textContent = 'Signing in...';
    try {
      const { auth } = await import('./firebase.js');
      const cred = await firebase.auth().signInWithEmailAndPassword(email, pwd);
      const user = cred.user;
      // Get role from Firestore (server-side, DevTools can't override)
      let role = await getRoleFromFirestore(user.uid);
      if (!role) {
        // Fallback: map by email
        const emailRoles = {
          'owner@propskart.com':      'owner',
          'arpit@propskart.com':      'owner',
          'rm@propskart.com':         'rm',
        };
        role = emailRoles[email.toLowerCase()] || 'supervisor';
      }
      currentRole = role;
      currentUser = user;
      if (btn) btn.innerHTML = '<span>Sign In</span><span style="margin-left:6px">→</span>';
      await onLoginSuccess();
    } catch (err) {
      if (btn) btn.innerHTML = '<span>Sign In</span><span style="margin-left:6px">→</span>';
      // Fallback to master password
      if (selectedRole && pwd === MASTER_PASSWORDS[selectedRole]) {
        currentRole = selectedRole;
        await onLoginSuccess();
      } else {
        errEl.textContent = '❌ ' + (
          err.code === 'auth/user-not-found'  ? 'No account with this email.' :
          err.code === 'auth/wrong-password'  ? 'Wrong password.' :
          err.code === 'auth/invalid-email'   ? 'Invalid email.' :
          'Login failed. Try master login below.'
        );
        errEl.style.display = 'block';
      }
    }
    return;
  }

  // ── MASTER PASSWORD LOGIN ──
  if (!selectedRole) {
    errEl.textContent = '❌ Select a role or enter your email above.';
    errEl.style.display = 'block';
    return;
  }
  if (pwd === MASTER_PASSWORDS[selectedRole]) {
    currentRole = selectedRole;
    currentUser = null;
    document.getElementById('login-pwd').value = '';
    await onLoginSuccess();
  } else {
    errEl.textContent = '❌ Wrong password.';
    errEl.style.display = 'block';
    document.getElementById('login-pwd').value = '';
  }
}

async function onLoginSuccess() {
  // Handle past date
  const loginDate = document.getElementById('login-work-date')?.value;
  if (loginDate && loginDate !== todayStr()) {
    localStorage.setItem('_day_cleared_' + todayStr(), '1');
    const pastEntry = _state.ledger.find(e => e.date === loginDate);
    if (pastEntry) {
      _state.sessions = pastEntry.sessions ? JSON.parse(JSON.stringify(pastEntry.sessions)) : [];
      _state.rawLog   = pastEntry.rawLog   ? [...pastEntry.rawLog]   : [];
      _state.lab.forEach(l => {
        const att = (pastEntry.attendance || []).find(a => a.id === l.id);
        if (att) { l.present = att.present; l.doingOT = att.doingOT; l.otHours = att.otHours || 0; }
        else     { l.present = false; l.doingOT = false; l.otHours = 0; }
      });
    } else {
      _state.sessions = []; _state.rawLog = [];
      _state.lab.forEach(l => { l.present = false; l.doingOT = false; l.otHours = 0; });
    }
    _state.workDate = loginDate;
  }

  // Show app
  document.getElementById('login-page').style.display   = 'none';
  document.getElementById('app-shell').style.display    = 'flex';

  // Init Firebase after login (DOM is ready)
  await initFirebase();

  // Pull data from Firebase
  _state = await pullFromFirebase(_state, currentRole);

  // Start sync
  startFirebaseSync(_state, currentRole, (updatedState, screens) => {
    _state = updatedState;
    if (_onLogin) _onLogin(_state, currentRole, screens);
  });

  // Immediately push supervisor/rm data
  if (currentRole === 'supervisor' || currentRole === 'rm') {
    setTimeout(() => pushToFirebase(_state, currentRole), 1500);
  }

  if (_onLogin) _onLogin(_state, currentRole, null);
}

export function doLogout() {
  currentRole = null;
  currentUser = null;
  selectedRole = null;

  if (firebase.auth().currentUser) {
    firebase.auth().signOut().catch(() => {});
  }

  const { stopFirebaseSync } = require('./firebase.js');
  stopFirebaseSync();

  document.getElementById('app-shell').style.display  = 'none';
  document.getElementById('login-page').style.display = 'flex';

  // Reset form
  const ldEl = document.getElementById('login-work-date');
  if (ldEl) { ldEl.value = ''; ldEl.max = todayStr(); }
  const pwdEl = document.getElementById('login-pwd');
  if (pwdEl) pwdEl.value = '';
}
