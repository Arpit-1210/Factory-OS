// ── MAIN ENTRY POINT ──
// Wires all modules together

import { loadState, persist, uid }       from './state.js';
import { renderLoginForm, doLogout, currentRole } from './auth.js';
import { initRouter, go, updateState }   from './router.js';
import { pushToFirebase, clearSupervisorDoc, runDailyBackup } from './firebase.js';
import { todayStr }                      from './utils.js';
import { renderSidebar }                 from './sidebar.js';

// ── Load Firebase SDK dynamically ──
function loadScript(src, cb) {
  const s = document.createElement('script');
  s.src = src;
  s.onload = cb || function(){};
  s.onerror = () => { console.warn('Failed to load:', src); if (cb) cb(); };
  document.head.appendChild(s);
}

// ── SCREENS (lazy loaded) ──
// Each screen is a module with a render() function
import * as DashboardScreen   from '../screens/dashboard.js';
import * as AttendanceScreen  from '../screens/attendance.js';
import * as ProductionScreen  from '../screens/production.js';
import * as OrdersScreen      from '../screens/orders.js';
import * as InventoryScreen   from '../screens/inventory.js';
import * as SalaryScreen      from '../screens/salary.js';
import * as MonthlyScreen     from '../screens/monthly.js';
import * as ExportScreen      from '../screens/export.js';
import * as DocsScreen        from '../screens/docs.js';
import * as SheetsScreen      from '../screens/sheets.js';

const SCREENS = {
  dashboard:  DashboardScreen,
  att:        AttendanceScreen,
  sup:        ProductionScreen,
  orders:     OrdersScreen,
  inventory:  InventoryScreen,
  salary:     SalaryScreen,
  month:      MonthlyScreen,
  export:     ExportScreen,
  docs:       DocsScreen,
  sheets:     SheetsScreen,
};

// ── INIT ──
let S = loadState();

// Persist helper (debounced Firebase push)
let _fbPushTimer = null;
window.persistAndSync = function() {
  persist(S);
  clearTimeout(_fbPushTimer);
  _fbPushTimer = setTimeout(() => {
    const role = window._currentRole;
    if (role) pushToFirebase(S, role);
  }, 2000);
};

// Load Firebase then start app
loadScript('https://cdn.jsdelivr.net/npm/firebase@10.7.1/firebase-app-compat.min.js', () => {
  loadScript('https://cdn.jsdelivr.net/npm/firebase@10.7.1/firebase-firestore-compat.min.js', () => {
    loadScript('https://cdn.jsdelivr.net/npm/firebase@10.7.1/firebase-auth-compat.min.js', () => {
      startApp();
    });
  });
});

function startApp() {
  // Render login
  renderLoginForm(S, onLoginSuccess);

  // Sidebar menu button
  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sb-overlay').style.display = 'block';
  });
  document.getElementById('sb-overlay').addEventListener('click', () => {
    if (Date.now() - _sidebarOpenTime < 400) return;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sb-overlay').style.display = 'none';
  });
}

let _sidebarOpenTime = 0;
document.getElementById('menu-btn')?.addEventListener('mousedown', () => {
  _sidebarOpenTime = Date.now();
});

function onLoginSuccess(state, role, screensToUpdate) {
  S = state;
  window._currentRole = role;
  persist(S);

  // Update date display
  const dateEl = document.getElementById('work-date-display');
  if (dateEl) {
    const d = new Date(S.workDate + 'T00:00:00');
    dateEl.textContent = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  }

  // Role tag
  const roleEl = document.getElementById('role-tag');
  if (roleEl) {
    const tags = { owner:'👨‍💼 Owner', supervisor:'👷 Supervisor', rm:'🧪 RM Supervisor' };
    roleEl.textContent = tags[role];
    roleEl.className = 'role-tag ' + role;
  }

  // Render sidebar
  renderSidebar(role, go, doLogoutHandler);

  // Init router
  initRouter(S, role, SCREENS);

  // Navigate to home
  const homes = { owner:'dashboard', supervisor:'att', rm:'raw' };
  go(homes[role] || 'dashboard');

  // Schedule daily backup
  scheduleAutoBackup();
}

function doLogoutHandler() {
  doLogout();
  renderLoginForm(S, onLoginSuccess);
}

// Auto backup at midnight
let _backupTimer = null;
function scheduleAutoBackup() {
  if (_backupTimer) clearTimeout(_backupTimer);
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ms = midnight - now;
  _backupTimer = setTimeout(() => {
    runDailyBackup(S);
    const role = window._currentRole;
    if (role === 'supervisor') {
      clearSupervisorDoc(todayStr());
      localStorage.setItem('_day_cleared_' + S.workDate, '1');
    }
    setInterval(() => runDailyBackup(S), 24 * 60 * 60 * 1000);
  }, ms);
}

// Export S for screens to use
export { S };
