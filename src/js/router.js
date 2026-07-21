// ── ROUTER ──
// Handles screen navigation and rendering

import { ROLE_ACCESS } from './config.js';

const PAGE_TITLES = {
  dashboard: 'Dashboard', att: 'Attendance', sup: 'Teams & Production',
  raw: 'Issue RM', day: 'Day Sheet', month: 'Monthly Report',
  orders: 'Orders', payments: 'Payments', dispatch: 'Dispatch',
  transfers: 'Unit 2 Transfers', salary: 'Salary', inventory: 'Inventory',
  stock: 'RM Stock', rmpurchase: 'RM Purchase', fgstock: 'FG Stock',
  docs: 'Documents', bom: 'Bill of Materials', export: 'Excel Export',
  sheets: 'Cloud Sync', setup: 'Setup',
};

let _currentScreen = null;
let _screens = {};
let _state = null;
let _role = null;

export function initRouter(state, role, screens) {
  _state = state;
  _role  = role;
  _screens = screens;
}

export function updateState(state) {
  _state = state;
}

export function go(name) {
  const allowed = ROLE_ACCESS[_role] || [];
  if (!allowed.includes(name)) {
    console.warn('Access denied:', name, 'for role:', _role);
    return;
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sb-overlay').style.display = 'none';
  }

  // Update page title
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[name] || name;

  // Update sidebar active state
  document.querySelectorAll('.sb-item, .sb-standalone').forEach(el => {
    el.classList.remove('active');
  });
  const activeNav = document.getElementById('sn-' + name);
  if (activeNav) activeNav.classList.add('active');

  // Render the screen
  const container = document.getElementById('screens-container');
  if (!container) return;

  _currentScreen = name;

  if (_screens[name]) {
    _screens[name].render(container, _state, _role);
  } else {
    container.innerHTML = `<div class="page-hero"><h1>${PAGE_TITLES[name] || name}</h1><p>Screen coming soon.</p></div>`;
  }
}

export function getCurrentScreen() {
  return _currentScreen;
}
