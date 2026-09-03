// Login page, sidebar, header and the screen container.
//
// The __SCREEN__<name> markers are replaced by index.js with each screen
// template, so the assembled document is byte-identical to the single blob
// this was carved out of.

export default `<!-- ── LOGIN ── -->
<div id="login-page" style="display:flex">
  <div class="login-wrap">

    <!-- Left panel — branding (hidden on mobile) -->
    <div class="login-brand">
      <div class="lb-logo">Factory <span>OS</span></div>
      <div class="lb-tag">Manufacturing Intelligence</div>
      <div class="lb-divider"></div>
      <div class="lb-features">
        <div class="lb-feat"><span class="lb-dot"></span>Real-time production tracking</div>
        <div class="lb-feat"><span class="lb-dot"></span>Multi-team supervisor management</div>
        <div class="lb-feat"><span class="lb-dot"></span>Orders, payments & inventory</div>
        <div class="lb-feat"><span class="lb-dot"></span>Google Sheets sync & backup</div>
      </div>
      <div class="lb-company">Propskart &amp; Urban Pebbles · Ranchi</div>
    </div>

    <!-- Right panel — login form -->
    <div class="login-right">
      <div class="login-card">
        <div class="login-logo">
          <div class="lt">Factory <span>OS</span></div>
          <div class="ls">PROPSKART & URBAN PEBBLES · RANCHI</div>
        </div>

        <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.12em;text-align:center;margin-bottom:14px">Sign in to your account</div>

        <div class="fld" style="margin-bottom:10px">
          <label>Email</label>
          <input class="login-input" type="email" id="login-email" placeholder="you@example.com" data-keydown="emailKeydown" style="margin-bottom:0">
        </div>

        <div style="position:relative;margin-bottom:14px">
          <label style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:5px;font-weight:600">Password</label>
          <input class="login-input" type="password" id="login-pwd" placeholder="Enter password" data-keydown="passwordKeydown" style="margin-bottom:0;padding-right:44px">
          <span style="position:absolute;right:14px;bottom:10px;color:var(--text4);font-size:16px;cursor:pointer" data-click="togglePwd">👁</span>
        </div>

        <button class="login-btn" data-click="doLogin">
          <span>Sign In</span>
          <span style="margin-left:6px">→</span>
        </button>
        <div class="login-error" id="login-error">❌ Wrong email or password.</div>
        <div style="text-align:center;margin-top:8px;font-family:var(--mono);font-size:9px;color:var(--text4)">v2.10.0</div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text4);margin-bottom:8px;text-align:center">ENTERING DATA FOR A PAST DATE?</div>
          <div class="fld" style="margin-bottom:8px">
            <label>Work Date (leave blank for today)</label>
            <input type="date" id="login-work-date" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r);color:var(--text);padding:9px 12px;font-size:13px;width:100%;outline:none">
          </div>
          <div style="font-size:10px;color:var(--text4);font-family:var(--mono)">Set a past date to add missed production/attendance data</div>
        </div>

        <!-- The master-password role cards that were here have been removed.
             They authenticated against empty strings, so clicking a role and
             submitting a blank password granted full access. Sign-in is now
             email + password with the role held server-side. -->

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);text-align:center">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text4)">Factory OS v3.0 · Built for Propskart</div>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- ── APP ── -->
<div class="app" id="app-shell" style="display:none">

  <!-- SIDEBAR -->
  <div class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-title">Factory <span>OS</span></div>
      <div class="logo-sub">PROPSKART & URBAN PEBBLES</div>
    </div>

    <!-- Dashboard (standalone) -->
    <div class="sb-standalone active" id="sn-dashboard" data-click="go" data-args="[&quot;dashboard&quot;]">
      <span class="si">🏠</span><span>Dashboard</span>
    </div>

    <!-- SUPERVISOR SECTION -->
    <div class="sb-section-card" id="sec-supervisor">
      <div class="sb-section-header" data-click="toggleSection" data-args="[&quot;sec-supervisor&quot;]">
        <span class="icon">👷</span>
        <span>Supervisor</span>
        <span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-att" data-click="go" data-args="[&quot;att&quot;]"><span class="si">✅</span><span class="sl">Attendance</span></div>
        <div class="sb-item" id="sn-sup" data-click="go" data-args="[&quot;sup&quot;]"><span class="si">👷</span><span class="sl">Teams & Production</span></div>
        <div class="sb-item" id="sn-raw" data-click="go" data-args="[&quot;raw&quot;]"><span class="si">🧪</span><span class="sl">Issue RM</span></div>
        <div class="sb-item" id="sn-day" data-click="go" data-args="[&quot;day&quot;]"><span class="si">📋</span><span class="sl">Day Sheet</span></div>
      </div>
    </div>

    <!-- OWNER SECTION -->
    <div class="sb-section-card" id="sec-owner">
      <div class="sb-section-header" data-click="toggleSection" data-args="[&quot;sec-owner&quot;]">
        <span class="icon">👨‍💼</span>
        <span>Owner</span>
        <span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-orders" data-click="go" data-args="[&quot;orders&quot;]"><span class="si">📋</span><span class="sl">Orders</span></div>
        <div class="sb-item" id="sn-payments" data-click="go" data-args="[&quot;payments&quot;]"><span class="si">💰</span><span class="sl">Payments</span></div>
        <div class="sb-item" id="sn-day" data-click="go" data-args="[&quot;day&quot;]"><span class="si">📋</span><span class="sl">Day Sheet</span></div>
        <div class="sb-item" id="sn-dispatch" data-click="go" data-args="[&quot;dispatch&quot;]"><span class="si">🚚</span><span class="sl">Dispatch</span></div>
        <div class="sb-item" id="sn-transfers" data-click="go" data-args="[&quot;transfers&quot;]"><span class="si">🔄</span><span class="sl">Unit 2 Transfers</span></div>
        <div class="sb-item" id="sn-salary" data-click="go" data-args="[&quot;salary&quot;]"><span class="si">💼</span><span class="sl">Salary</span></div>
        <div class="sb-item" id="sn-month" data-click="go" data-args="[&quot;month&quot;]"><span class="si">📅</span><span class="sl">Monthly Report</span></div>
        <div class="sb-item" id="sn-docs" data-click="go" data-args="[&quot;docs&quot;]"><span class="si">📄</span><span class="sl">Quotation / Invoice</span></div>
        <div class="sb-item" id="sn-export" data-click="go" data-args="[&quot;export&quot;]"><span class="si">📊</span><span class="sl">Excel Export</span></div>
      </div>
    </div>

    <!-- INVENTORY SECTION -->
    <div class="sb-section-card" id="sec-inventory">
      <div class="sb-section-header" data-click="toggleSection" data-args="[&quot;sec-inventory&quot;]">
        <span class="icon">📦</span>
        <span>Inventory</span>
        <span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-inventory" data-click="go" data-args="[&quot;inventory&quot;]"><span class="si">📊</span><span class="sl">Daily Snapshot</span></div>
        <div class="sb-item" id="sn-stock" data-click="go" data-args="[&quot;stock&quot;]"><span class="si">🧪</span><span class="sl">RM Stock</span></div>
        <div class="sb-item" id="sn-rmpurchase" data-click="go" data-args="[&quot;rmpurchase&quot;]"><span class="si">🛒</span><span class="sl">RM Purchase</span></div>
        <div class="sb-item" id="sn-fgstock" data-click="go" data-args="[&quot;fgstock&quot;]"><span class="si">📦</span><span class="sl">FG Stock</span></div>
        <div class="sb-item" id="sn-bom" data-click="go" data-args="[&quot;bom&quot;]"><span class="si">📐</span><span class="sl">Bill of Materials</span></div>
      </div>
    </div>

    <!-- SETTINGS SECTION -->
    <div class="sb-section-card" id="sec-settings">
      <div class="sb-section-header" data-click="toggleSection" data-args="[&quot;sec-settings&quot;]">
        <span class="icon">⚙️</span>
        <span>Settings</span>
        <span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-setup" data-click="go" data-args="[&quot;setup&quot;]"><span class="si">⚙</span><span class="sl">Setup Catalogue</span></div>
        <div class="sb-item" id="sn-sheets" data-click="go" data-args="[&quot;sheets&quot;]"><span class="si">🔗</span><span class="sl">Google Sheets</span></div>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div class="sync-pill">
        <div class="sync-dot syncing" id="sync-status"></div>
        <span id="sync-text">Connecting...</span>
      </div>
      <button class="logout-btn" data-click="doLogout">⏻ Logout</button>
    </div>
  </div>

  <!-- OVERLAY -->
  <div class="sidebar-overlay" id="sb-overlay" data-click="closeSidebar"></div>

  <!-- MAIN -->
  <div class="main">
    <div class="topbar">
      <button class="menu-btn" data-click="openSidebar">☰</button>
      <div class="page-title" id="page-title">Dashboard</div>
      <div class="topbar-r">
        <span class="role-tag" id="role-tag"></span>
        <input type="date" id="work-date" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:5px 10px;font-size:12px;color:var(--text);outline:none">
      </div>
    </div>

    <!-- Shown only while a CLOSED day is open for editing. Without it the app
         looks identical whether you are recording today's work or editing a
         day that is already counted in Monthly Data. -->
    <!-- Shown when the device clock disagrees with the server about the date.
         Every work_date comes from the device clock, so a wrong one files a
         real shift under the wrong day with nothing to show for it. -->
    <div id="clock-banner" style="display:none;align-items:center;gap:12px;padding:8px 16px;background:rgba(239,68,68,.12);border-bottom:1px solid var(--red);font-size:12px;color:var(--red)">
      <span id="clock-banner-text" style="flex:1"></span>
    </div>

    <div id="reopen-banner" style="display:none;align-items:center;gap:12px;padding:8px 16px;background:rgba(245,158,11,.12);border-bottom:1px solid var(--amber);font-size:12px;color:var(--amber)">
      <span id="reopen-banner-text" style="flex:1"></span>
      <button class="btn" data-click="returnToToday" style="padding:4px 12px;font-size:11px">Back to today</button>
    </div>

    <!-- A past day that was left open and never closed. Signing in with no date
         goes to today, so without this the day would simply go unmentioned —
         absent from Monthly and payroll, its rows stranded under a date nothing
         asks about. -->
    <div id="unclosed-banner" style="display:none;align-items:center;gap:12px;padding:8px 16px;background:rgba(59,130,246,.12);border-bottom:1px solid var(--blue,#3B82F6);font-size:12px;color:var(--blue,#3B82F6)">
      <span id="unclosed-banner-text" style="flex:1"></span>
      <button class="btn" id="unclosed-banner-open" data-click="openUnclosedDay" data-args="[]" style="padding:4px 12px;font-size:11px">Open that day</button>
      <button class="btn" data-click="dismissUnclosedDay" style="padding:4px 10px;font-size:11px">Dismiss</button>
    </div>

    <div class="screens">

      <!-- ══ DASHBOARD ══ -->
__SCREEN__dashboard

      <!-- ══ SETUP ══ -->
__SCREEN__setup

      <!-- ══ SHEETS ══ -->
__SCREEN__sheets

      <!-- ══ ATTENDANCE ══ -->
__SCREEN__att

      <!-- ══ SUPERVISOR ══ -->
__SCREEN__sup

      <!-- ══ RAW MATERIALS ══ -->
__SCREEN__raw

      <!-- ══ DAY SHEET ══ -->
__SCREEN__day

      <!-- ══ MONTHLY ══ -->
__SCREEN__month

      <!-- ══ ORDERS ══ -->
__SCREEN__orders

      <!-- ══ PAYMENTS ══ -->
__SCREEN__payments

      <!-- ══ INVENTORY ══ -->
__SCREEN__inventory

      <!-- ══ RM STOCK ══ -->
__SCREEN__stock

      <!-- ══ RM PURCHASE ══ -->
__SCREEN__rmpurchase

      <!-- ══ FG STOCK ══ -->
__SCREEN__fgstock

    

<!-- ══ SALARY ══ -->
__SCREEN__salary

<!-- ══ DISPATCH ══ -->
__SCREEN__dispatch

<!-- ══ BOM ══ -->
__SCREEN__bom

<!-- ══ EXPORT ══ -->
__SCREEN__export

<!-- ══ ASSIGN TO ORDER MODAL ══ -->
<div id="assign-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;align-items:center;justify-content:center;padding:20px">
  <div class="card" style="max-width:520px;width:100%;margin:0;max-height:85vh;overflow-y:auto">
    <div class="ch">
      <div>
        <div class="ct">Assign to Order</div>
        <div id="assign-product-label" style="font-size:14px;font-weight:600;color:var(--text);margin-top:4px"></div>
      </div>
      <button class="btn btn-sm" data-click="closeAssignModal">✕ Close</button>
    </div>
    <div id="assign-stock-info" style="font-family:var(--mono);font-size:11px;color:var(--text4);margin-bottom:12px"></div>
    <div id="assign-order-list"></div>
  </div>
</div>


__SCREEN__transfers

<!-- ══ DOCUMENTS ══ -->
__SCREEN__docs
</div><!-- /screens -->
  </div><!-- /main -->
</div><!-- /app -->`;
