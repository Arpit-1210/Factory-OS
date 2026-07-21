// ── SIDEBAR MODULE ──

import { ROLE_ACCESS } from './config.js';
import { todayStr } from './utils.js';

export function renderSidebar(role, goFn, logoutFn) {
  const container = document.getElementById('sidebar-content');
  if (!container) return;

  container.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-title">Factory <span>OS</span></div>
      <div class="logo-sub">PROPSKART · RANCHI</div>
    </div>

    <!-- Dashboard -->
    <div class="sb-standalone active" id="sn-dashboard" onclick="go('dashboard')">
      <span class="si">🏠</span><span class="sl">Dashboard</span>
    </div>

    ${role === 'supervisor' || role === 'owner' ? `
    <!-- Supervisor Section -->
    <div class="sb-section">Supervisor</div>
    <div class="sb-section-card open" id="sec-sup">
      <div class="sb-section-header" onclick="toggleSection('sec-sup')">
        <span class="icon">👷</span><span>Supervisor</span><span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-att" onclick="go('att')"><span class="si">✅</span><span class="sl">Attendance</span></div>
        <div class="sb-item" id="sn-sup" onclick="go('sup')"><span class="si">👥</span><span class="sl">Teams & Production</span></div>
        <div class="sb-item" id="sn-raw" onclick="go('raw')"><span class="si">🧪</span><span class="sl">Issue RM</span></div>
        <div class="sb-item" id="sn-day" onclick="go('day')"><span class="si">📋</span><span class="sl">Day Sheet</span></div>
      </div>
    </div>` : ''}

    ${role === 'owner' ? `
    <!-- Owner Section -->
    <div class="sb-section">Owner</div>
    <div class="sb-section-card open" id="sec-owner">
      <div class="sb-section-header" onclick="toggleSection('sec-owner')">
        <span class="icon">👨‍💼</span><span>Owner</span><span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-orders" onclick="go('orders')"><span class="si">📋</span><span class="sl">Orders</span></div>
        <div class="sb-item" id="sn-payments" onclick="go('payments')"><span class="si">💰</span><span class="sl">Payments</span></div>
        <div class="sb-item" id="sn-day" onclick="go('day')"><span class="si">📋</span><span class="sl">Day Sheet</span></div>
        <div class="sb-item" id="sn-dispatch" onclick="go('dispatch')"><span class="si">🚚</span><span class="sl">Dispatch</span></div>
        <div class="sb-item" id="sn-transfers" onclick="go('transfers')"><span class="si">🔄</span><span class="sl">Unit 2 Transfers</span></div>
        <div class="sb-item" id="sn-salary" onclick="go('salary')"><span class="si">💼</span><span class="sl">Salary</span></div>
        <div class="sb-item" id="sn-month" onclick="go('month')"><span class="si">📅</span><span class="sl">Monthly Report</span></div>
        <div class="sb-item" id="sn-docs" onclick="go('docs')"><span class="si">📄</span><span class="sl">Quotation / Invoice</span></div>
        <div class="sb-item" id="sn-export" onclick="go('export')"><span class="si">📊</span><span class="sl">Excel Export</span></div>
      </div>
    </div>` : ''}

    <!-- Inventory Section -->
    ${role === 'owner' || role === 'rm' ? `
    <div class="sb-section">Inventory</div>
    <div class="sb-section-card open" id="sec-inv">
      <div class="sb-section-header" onclick="toggleSection('sec-inv')">
        <span class="icon">📦</span><span>Inventory</span><span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-inventory" onclick="go('inventory')"><span class="si">🔍</span><span class="sl">Daily Snapshot</span></div>
        <div class="sb-item" id="sn-stock" onclick="go('stock')"><span class="si">🧪</span><span class="sl">RM Stock</span></div>
        <div class="sb-item" id="sn-rmpurchase" onclick="go('rmpurchase')"><span class="si">🛒</span><span class="sl">RM Purchase</span></div>
        <div class="sb-item" id="sn-fgstock" onclick="go('fgstock')"><span class="si">📦</span><span class="sl">FG Stock</span></div>
        ${role === 'owner' ? `<div class="sb-item" id="sn-bom" onclick="go('bom')"><span class="si">📐</span><span class="sl">Bill of Materials</span></div>` : ''}
      </div>
    </div>` : ''}

    <!-- Settings -->
    ${role === 'owner' ? `
    <div class="sb-section">Settings</div>
    <div class="sb-section-card" id="sec-settings">
      <div class="sb-section-header" onclick="toggleSection('sec-settings')">
        <span class="icon">⚙️</span><span>Settings</span><span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-setup" onclick="go('setup')"><span class="si">🔧</span><span class="sl">Setup Catalogue</span></div>
        <div class="sb-item" id="sn-sheets" onclick="go('sheets')"><span class="si">☁️</span><span class="sl">Cloud Sync</span></div>
      </div>
    </div>` : ''}

    <!-- Bottom -->
    <div class="sidebar-bottom">
      <div class="sync-pill">
        <div class="sync-dot syncing" id="sync-status"></div>
        <span id="sync-text">Connecting...</span>
      </div>
      <button class="logout-btn" onclick="window._doLogout()">⏻ Logout</button>
    </div>
  `;

  // Wire go and toggleSection to window
  window.go = goFn;
  window._doLogout = logoutFn;
  window.toggleSection = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
  };
}
