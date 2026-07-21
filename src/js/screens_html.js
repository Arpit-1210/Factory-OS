// ── SCREENS HTML ──
// All screen HTML extracted from factory-v2.html

export const SCREENS_HTML = `


<!-- ── LOGIN ── -->
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
          <input class="login-input" type="email" id="login-email" placeholder="you@example.com" onkeydown="if(event.key==='Enter')document.getElementById('login-pwd').focus()" style="margin-bottom:0">
        </div>

        <div style="position:relative;margin-bottom:14px">
          <label style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:5px;font-weight:600">Password</label>
          <input class="login-input" type="password" id="login-pwd" placeholder="Enter password" onkeydown="if(event.key==='Enter')doLogin()" style="margin-bottom:0;padding-right:44px">
          <span style="position:absolute;right:14px;bottom:10px;color:var(--text4);font-size:16px;cursor:pointer" onclick="togglePwd()">👁</span>
        </div>

        <button class="login-btn" onclick="doLogin()">
          <span>Sign In</span>
          <span style="margin-left:6px">→</span>
        </button>
        <div class="login-error" id="login-error">❌ Wrong email or password.</div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text4);margin-bottom:8px;text-align:center">ENTERING DATA FOR A PAST DATE?</div>
          <div class="fld" style="margin-bottom:8px">
            <label>Work Date (leave blank for today)</label>
            <input type="date" id="login-work-date" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r);color:var(--text);padding:9px 12px;font-size:13px;width:100%;outline:none">
          </div>
          <div style="font-size:10px;color:var(--text4);font-family:var(--mono)">Set a past date to add missed production/attendance data</div>
        </div>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-align:center;margin-bottom:8px">OR USE MASTER PASSWORD</div>
          <div class="role-grid">
            <div class="role-card" id="rc-owner" onclick="selectRole('owner')">
              <div class="ri">👨‍💼</div><div class="rn">Owner</div>
            </div>
            <div class="role-card" id="rc-supervisor" onclick="selectRole('supervisor')">
              <div class="ri">👷</div><div class="rn">Supervisor</div>
            </div>
            <div class="role-card" id="rc-rm" onclick="selectRole('rm')">
              <div class="ri">🧪</div><div class="rn">RM Super</div>
            </div>
          </div>
        </div>

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);text-align:center">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text4)">Factory OS v2.0 · Built for Propskart</div>
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
    <div class="sb-standalone active" id="sn-dashboard" onclick="go('dashboard')">
      <span class="si">🏠</span><span>Dashboard</span>
    </div>

    <!-- SUPERVISOR SECTION -->
    <div class="sb-section-card" id="sec-supervisor">
      <div class="sb-section-header" onclick="toggleSection('sec-supervisor')">
        <span class="icon">👷</span>
        <span>Supervisor</span>
        <span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-att" onclick="go('att')"><span class="si">✅</span><span class="sl">Attendance</span></div>
        <div class="sb-item" id="sn-sup" onclick="go('sup')"><span class="si">👷</span><span class="sl">Teams & Production</span></div>
        <div class="sb-item" id="sn-raw" onclick="go('raw')"><span class="si">🧪</span><span class="sl">Issue RM</span></div>
        <div class="sb-item" id="sn-day" onclick="go('day')"><span class="si">📋</span><span class="sl">Day Sheet</span></div>
      </div>
    </div>

    <!-- OWNER SECTION -->
    <div class="sb-section-card" id="sec-owner">
      <div class="sb-section-header" onclick="toggleSection('sec-owner')">
        <span class="icon">👨‍💼</span>
        <span>Owner</span>
        <span class="chevron">›</span>
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
    </div>

    <!-- INVENTORY SECTION -->
    <div class="sb-section-card" id="sec-inventory">
      <div class="sb-section-header" onclick="toggleSection('sec-inventory')">
        <span class="icon">📦</span>
        <span>Inventory</span>
        <span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-inventory" onclick="go('inventory')"><span class="si">📊</span><span class="sl">Daily Snapshot</span></div>
        <div class="sb-item" id="sn-stock" onclick="go('stock')"><span class="si">🧪</span><span class="sl">RM Stock</span></div>
        <div class="sb-item" id="sn-rmpurchase" onclick="go('rmpurchase')"><span class="si">🛒</span><span class="sl">RM Purchase</span></div>
        <div class="sb-item" id="sn-fgstock" onclick="go('fgstock')"><span class="si">📦</span><span class="sl">FG Stock</span></div>
        <div class="sb-item" id="sn-bom" onclick="go('bom')"><span class="si">📐</span><span class="sl">Bill of Materials</span></div>
      </div>
    </div>

    <!-- SETTINGS SECTION -->
    <div class="sb-section-card" id="sec-settings">
      <div class="sb-section-header" onclick="toggleSection('sec-settings')">
        <span class="icon">⚙️</span>
        <span>Settings</span>
        <span class="chevron">›</span>
      </div>
      <div class="sb-items">
        <div class="sb-item" id="sn-setup" onclick="go('setup')"><span class="si">⚙</span><span class="sl">Setup Catalogue</span></div>
        <div class="sb-item" id="sn-sheets" onclick="go('sheets')"><span class="si">🔗</span><span class="sl">Google Sheets</span></div>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div class="sync-pill">
        <div class="sync-dot syncing" id="sync-status"></div>
        <span id="sync-text">Connecting...</span>
      </div>
      <button class="logout-btn" onclick="doLogout()">⏻ Logout</button>
    </div>
  </div>

  <!-- OVERLAY -->
  <div class="sidebar-overlay" id="sb-overlay" onclick="closeSidebar()" ontouchend="closeSidebar()"></div>

  <!-- MAIN -->
  <div class="main">
    <div class="topbar">
      <button class="menu-btn" onclick="openSidebar()">☰</button>
      <div class="page-title" id="page-title">Dashboard</div>
      <div class="topbar-r">
        <span class="role-tag" id="role-tag"></span>
        <input type="date" id="work-date" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:5px 10px;font-size:12px;color:var(--text);outline:none">
      </div>
    </div>

    <div class="screens">

      <!-- ══ DASHBOARD ══ -->
      <div class="screen active" id="sc-dashboard">
        <!-- Dashboard Tab Bar -->
        <div class="tabs" id="dash-tabs" style="margin-bottom:16px">
          <div class="tab active" id="dashtab-overview" onclick="switchDashTab('overview')">📊 Overview</div>
          <div class="tab" id="dashtab-factory" onclick="switchDashTab('factory')">🏭 Factory</div>
          <div class="tab dash-money-tab" id="dashtab-money" onclick="switchDashTab('money')">💰 Money</div>
        </div>

        <!-- Alerts row — always visible -->
        <div id="dash-alerts" style="margin-bottom:8px"></div>

        <!-- TAB 1: OVERVIEW -->
        <div id="dash-tab-overview">
          <!-- KPI cards row -->
          <div class="dash-grid" id="dash-overview-cards"></div>
          <!-- Production Task Board -->
          <div class="card" style="margin-top:16px">
            <div class="ch">
              <div class="ct">📋 Production Task Board</div>
              <button class="btn btn-sm" onclick="go('orders')">All Orders →</button>
            </div>
            <div id="dash-task-list"></div>
          </div>
        </div>

        <!-- TAB 2: FACTORY -->
        <div id="dash-tab-factory" style="display:none">
          <div class="dash-grid" id="dash-factory-cards"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px" class="g2-dash">
            <div class="card">
              <div class="ch"><div class="ct">🏗️ Active Teams Today</div></div>
              <div id="dash-teams"></div>
            </div>
            <div class="card">
              <div class="ch"><div class="ct">📦 Stage Flow — Today</div></div>
              <div id="dash-stage-flow"></div>
            </div>
          </div>
        </div>

        <!-- TAB 3: MONEY (Owner only) -->
        <div id="dash-tab-money" style="display:none">
          <div class="dash-grid" id="dash-money-cards"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px" class="g2-dash">
            <div class="card">
              <div class="ch"><div class="ct">📋 Recent Orders</div><button class="btn btn-sm" onclick="go('orders')">View all →</button></div>
              <div id="dash-recent-orders"></div>
            </div>
            <div class="card">
              <div class="ch"><div class="ct">💸 Today's P&amp;L</div></div>
              <div id="dash-pnl"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ SETUP ══ -->
      <div class="screen" id="sc-setup">
        <div class="page-hero"><h1>Setup <span style="color:var(--amber)">Catalogue</span></h1><p>Raw materials, finished goods & labour register</p></div>
        <div class="g2">
          <div>
            <div class="card">
              <div class="ch"><div class="ct">Raw Materials <span class="badge b-amber">Upload Excel</span></div></div>
              <div class="ibox" style="font-size:11px">A: Material Name &nbsp;|&nbsp; B: Unit &nbsp;|&nbsp; C: ₹/unit &nbsp;&nbsp;<a href="#" onclick="dlSampleRM()" style="color:var(--amber)">⬇ Sample</a></div>
              <div class="upz" onclick="document.getElementById('f-rm').click()"><div class="ui">📊</div><div class="ut">Upload Raw Materials Excel</div><div class="uh">.xlsx only</div></div>
              <input type="file" id="f-rm" accept=".xlsx" onchange="uploadRM(event)">
              <div id="rm-st"></div>
              <div class="div"></div>
              <div class="fg fg3">
                <div class="fld"><label>Material</label><input id="rm-n" placeholder="e.g. FRP Resin"></div>
                <div class="fld"><label>Unit</label><select id="rm-u"><option>kg</option><option>litre</option><option>gram</option><option>metre</option><option>piece</option><option>roll</option><option>bucket</option></select></div>
                <div class="fld"><label>₹/unit</label><input id="rm-p" type="number" placeholder="0"></div>
              </div>
              <button class="btn btn-amber btn-sm" onclick="addRM()">+ Add Material</button>
              <div style="max-height:200px;overflow-y:auto;margin-top:12px">
                <table class="tbl"><thead><tr><th>#</th><th>Material</th><th>Unit</th><th class="num">₹/unit</th><th></th></tr></thead><tbody id="tb-rm"></tbody></table>
              </div>
            </div>
            <div class="card">
              <div class="ch"><div class="ct">Finished Goods Catalogue</div></div>
              <input type="text" id="fg-search" placeholder="🔍 Search 380 products..." oninput="renderSetup()" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);color:var(--text);padding:8px 12px;font-size:12px;outline:none;margin-bottom:10px">
              <div class="fg fg3">
                <div class="fld"><label>Product Name</label><input id="fg-n" placeholder="New product"></div>
                <div class="fld"><label>Selling ₹/unit</label><input id="fg-p" type="number" placeholder="0"></div>
                <div class="fld" style="display:flex;align-items:flex-end"><button class="btn btn-amber" style="width:100%" onclick="addFG()">+ Add</button></div>
              </div>
              <div style="max-height:220px;overflow-y:auto">
                <table class="tbl"><thead><tr><th>#</th><th>Product</th><th class="num">S.No</th><th class="num">₹/unit</th><th></th></tr></thead><tbody id="tb-fg"></tbody></table>
              </div>
            </div>
          </div>
          <div>
            <div class="card">
              <div class="ch"><div class="ct">Labour Register <span class="badge b-amber">Upload Excel</span></div></div>
              <div class="ibox" style="font-size:11px">A: Name &nbsp;|&nbsp; B: Role &nbsp;|&nbsp; C: Wage ₹ &nbsp;|&nbsp; D: Supervisor? &nbsp;&nbsp;<a href="#" onclick="dlSampleLab()" style="color:var(--amber)">⬇ Sample</a></div>
              <div class="upz" onclick="document.getElementById('f-lab').click()"><div class="ui">👷</div><div class="ut">Upload Labour Excel</div><div class="uh">.xlsx only</div></div>
              <input type="file" id="f-lab" accept=".xlsx" onchange="uploadLab(event)">
              <div id="lab-st"></div>
              <div class="div"></div>
              <div class="fg fg5">
                <div class="fld"><label>Name</label><input id="lab-n" placeholder="Worker name"></div>
                <div class="fld"><label>Role</label><select id="lab-r"><option>Floor worker</option><option>Senior worker</option><option>Supervisor</option></select></div>
                <div class="fld"><label>Wage ₹/day</label><input id="lab-w" type="number" placeholder="0"></div>
                <div class="fld"><label>OT Hours</label><input id="lab-ot" type="number" placeholder="e.g. 2"></div>
                <div class="fld"><label>Supervisor?</label><select id="lab-s"><option value="0">No</option><option value="1">Yes</option></select></div>
              </div>
              <button class="btn btn-amber btn-sm" onclick="addLab()">+ Add Person</button>
              <div style="max-height:380px;overflow-y:auto;margin-top:12px">
                <table class="tbl"><thead><tr><th>#</th><th>Name</th><th>Role</th><th class="num">Wage ₹</th><th class="num">OT hrs</th><th>Sup</th><th></th></tr></thead><tbody id="tb-lab"></tbody></table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ SHEETS ══ -->
      <div class="screen" id="sc-sheets">
        <div class="page-hero"><h1>Cloud <span>Sync</span></h1><p>Firebase real-time sync + Google Sheets backup</p></div>

        <!-- Firebase Status -->
        <div class="card" style="max-width:640px;margin-bottom:16px">
          <div class="ch">
            <div class="ct">🔥 Firebase Real-Time Sync</div>
            <div id="fb-status-badge" style="font-family:var(--mono);font-size:10px;padding:3px 10px;border-radius:20px;background:var(--jade-l);color:var(--jade);border:1px solid var(--jade-b)">✓ Connected</div>
          </div>
          <div class="mrow">
            <div class="met m-green"><div class="ml">Status</div><div class="mv g" style="font-size:14px">Live ✓</div></div>
            <div class="met m-blue"><div class="ml">Project</div><div class="mv b" style="font-size:12px">frp-factory-3e933</div></div>
            <div class="met m-green"><div class="ml">Offline Mode</div><div class="mv g" style="font-size:14px">✓ On</div></div>
            <div class="met m-blue"><div class="ml">Auto Backup</div><div class="mv b" style="font-size:14px">Daily ✓</div></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn btn-jade" onclick="runDailyBackup().then(()=>alert('✓ Backup saved'))">💾 Backup Now</button>
            <button class="btn btn-blue" onclick="restoreFromBackup()">📂 Restore from Backup</button>
            <button class="btn" onclick="pushToFirebase().then(()=>alert('✓ Synced'))">↑ Force Sync</button>
            <button class="btn btn-amber" onclick="emergencyPush()">🚨 Push Local Data to Firebase</button>
          </div>
          <div id="backup-list" style="margin-top:12px"></div>
        </div>

        <!-- Google Sheets -->
        <div class="card" style="max-width:640px">
          <div class="ch"><div class="ct">📊 Google Sheets Sync</div></div>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">1</div>
              <div style="flex:1"><div style="font-weight:600;margin-bottom:4px">Paste Apps Script</div>
                <div style="font-size:12px;color:var(--text3);margin-bottom:8px">Open your Google Sheet → Extensions → Apps Script → Delete all → Paste this → Save → Deploy as Web App</div>
                <textarea id="apps-script-code" readonly onclick="this.select()" style="width:100%;height:160px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:10px;font-family:var(--mono);font-size:10px;color:var(--text3);resize:vertical;outline:none"></textarea>
                <button class="btn btn-sm btn-blue" style="margin-top:6px" onclick="copyScript()">Copy Script</button>
                <span id="copy-confirm" style="font-family:var(--mono);font-size:10px;color:var(--jade);margin-left:8px;display:none">✓ Copied!</span>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">2</div>
              <div style="flex:1">
                <div style="font-weight:600;margin-bottom:8px">Paste Web App URL</div>
                <div class="fld"><label>Web App URL</label><input id="sheets-url" placeholder="https://script.google.com/macros/s/..." oninput="saveUrl()"></div>
                <button class="btn btn-sm btn-blue" style="margin-top:8px" onclick="testConnection()">🔗 Test Connection</button>
                <div id="conn-result" style="margin-top:10px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ ATTENDANCE ══ -->
      <div class="screen" id="sc-att">
        <div class="page-hero"><h1>Morning <span>Attendance</span></h1></div>
        <div class="mrow">
          <div class="met m-blue"><div class="ml">Total</div><div class="mv w" id="a-tot">0</div></div>
          <div class="met m-green"><div class="ml">Present</div><div class="mv g" id="a-pres">0</div></div>
          <div class="met m-red"><div class="ml">Absent</div><div class="mv r" id="a-abs">0</div></div>
          <div class="met m-amber"><div class="ml">Base Wage</div><div class="mv a" id="a-wage">₹0</div></div>
          <div class="met m-amber"><div class="ml">OT Cost</div><div class="mv a" id="a-ot">₹0</div></div>
          <div class="met m-red"><div class="ml">Total Labour</div><div class="mv r" id="a-total-lab">₹0</div></div>
        </div>

        <div class="tabs" id="att-tabs" style="margin-bottom:16px">
          <div class="tab active" onclick="switchAttTab('attendance')">✅ Attendance</div>
          <div class="tab" onclick="switchAttTab('ot')">⏰ Overtime</div>
        </div>

        <!-- ATTENDANCE TAB -->
        <div id="att-tab-attendance">
          <div class="card">
            <div class="ch">
              <div class="ct">Tap to mark Present / Absent · ⭐ Supervisor</div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-jade btn-sm" onclick="markAll(1)">✓ All Present</button>
                <button class="btn btn-ember btn-sm" onclick="markAll(0)">✗ All Absent</button>
              </div>
            </div>
            <div class="wg" id="att-grid"></div>
          </div>
        </div>

        <!-- OT TAB -->
        <div id="att-tab-ot" style="display:none">
          <div class="ibox">Only present workers shown. Enter OT hours for each worker. OT Pay = Wage ÷ 8 × Hours.</div>
          <div class="card">
            <div class="ch">
              <div class="ct">Overtime — Present Workers Only</div>
              <div style="font-size:11px;color:var(--text4);font-family:var(--mono)" id="ot-total-display">Total OT: ₹0</div>
            </div>
            <div id="ot-grid"></div>
          </div>
        </div>

        <button class="btn btn-blue" onclick="go('sup')" style="margin-top:8px">→ Supervisor Teams</button>
      </div>

      <!-- ══ SUPERVISOR ══ -->
      <div class="screen" id="sc-sup">
        <div id="sup-login">
          <div class="page-hero"><h1>Supervisor <span style="color:var(--amber)">Teams</span></h1><p>Tap your name to start your session</p></div>
          <!-- Orders to produce — visible to supervisors -->
          <div id="sup-orders-banner"></div>
          <div class="sg" id="sup-cards"></div>
          <div class="div"></div>
          <div class="ct" style="margin-bottom:12px">Active Sessions Today</div>
          <div id="sup-sess-list"></div>
        </div>
        <div id="sup-work" style="display:none">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-family:var(--display);font-size:20px;font-weight:800;color:var(--text)" id="sw-name"></div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text4);margin-top:2px" id="sw-meta"></div>
            </div>
            <div style="display:flex;gap:7px">
              <button class="btn btn-sm" onclick="exitSup()">← Back</button>
              <button class="btn btn-jade btn-sm" onclick="saveSup()">💾 Save & Exit</button>
            </div>
          </div>
          <div id="sw-overview"></div>
          <div id="sw-teamwork" style="display:none">
            <div class="card">
              <div class="ch"><div class="ct">① Stage</div><button class="btn btn-sm" onclick="activeTeamId=null;renderSupWork()">← All Teams</button></div>
              <div class="tabs" id="sw-stages"></div>
            </div>
            <div class="card">
              <div class="ch"><div class="ct">② Team Members</div><div style="font-family:var(--mono);font-size:10px;color:#92400E" id="sw-lab-cost"></div></div>
              <div id="sw-team" style="margin-bottom:12px"></div>
              <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;margin-bottom:8px">Tap to add workers</div>
              <div class="wg" id="sw-pool"></div>
            </div>
            <div class="card">
              <div class="ch"><div class="ct">③ Log Production</div></div>
              <div class="fg fg5" style="margin-bottom:10px">
                <div class="fld">
                  <label>Product</label>
                  <select id="sw-prod" onchange="swFill()"><option value="">— select —</option></select>
                </div>
                <div class="fld"><label>Quantity</label><input type="number" id="sw-qty" placeholder="0" min="0"></div>
                <div class="fld"><label>₹/unit (auto)</label><input type="number" id="sw-price" placeholder="0"><div class="hint" id="sw-ph"></div></div>
                <div class="fld"><label>Weight/pc kg (opt)</label><input type="number" id="sw-weight" placeholder="0.0" step="0.1" min="0"></div>
                <div class="fld" id="sw-color-field" style="display:none"><label>🎨 Colour</label><input type="text" id="sw-color-val" placeholder="e.g. Orange..."></div>
                <div class="fld" style="display:flex;align-items:flex-end"><button class="btn btn-amber" style="width:100%" onclick="logProd()">+ Log</button></div>
              </div>
              <div id="sw-transfer-badge"></div>
              <div id="sw-prod-tbl"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ RAW MATERIALS ══ -->
      <div class="screen" id="sc-raw">
        <div class="page-hero"><h1>Issue Raw <span style="color:var(--amber)">Materials</span></h1><p>Issue RM to each stage — deducted from running stock</p></div>
        <div class="card">
          <div class="ch"><div class="ct">Issue Raw Material</div></div>
          <div class="fg fg4">
            <div class="fld"><label>Stage</label><select id="raw-stg"><option>Moulding</option><option>Finishing</option><option>Painting</option><option>Packing</option><option>Dispatch</option></select></div>
            <div class="fld"><label>Material</label><select id="raw-mat" onchange="rawFill()"><option value="">— select —</option></select></div>
            <div class="fld"><label>Quantity</label><input type="number" id="raw-qty" placeholder="0" oninput="rawFill()"></div>
            <div class="fld"><label>Total Cost ₹ (auto)</label><input type="number" id="raw-cost" placeholder="0"><div class="hint" id="raw-hint"></div></div>
          </div>
          <button class="btn btn-amber btn-sm" onclick="issueRaw()">+ Issue</button>
        </div>
        <div class="card"><div class="ch"><div class="ct">Issued Today</div></div><div id="raw-log"></div></div>
        <div class="card"><div class="ch"><div class="ct">RM P&L Preview</div></div><div id="raw-pnl"></div></div>
        <button class="btn btn-amber" onclick="go('day')">→ Day Sheet</button>
      </div>

      <!-- ══ DAY SHEET ══ -->
      <div class="screen" id="sc-day">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px">
          <div class="page-hero" style="margin-bottom:0"><h1 id="day-title">Day <span style="color:var(--amber)">Sheet</span></h1></div>
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            <button class="btn btn-jade btn-sm" onclick="syncToSheets()">☁ Sync to Sheets</button>
            <button class="btn btn-amber" onclick="saveDay()">💾 Save Day & Start Next</button>
          </div>
        </div>
        <div class="mrow" id="day-met"></div>
        <div class="card"><div class="ch"><div class="ct">Team-wise Performance</div></div><div id="day-team-cards"></div><div class="div"></div><div class="ct" style="margin-bottom:10px">Summary Table</div>
          <div class="tw"><table class="tbl"><thead><tr><th>Supervisor</th><th>Stage</th><th>Team Members</th><th class="num">Size</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">OT ₹</th><th class="num">RM ₹</th><th class="num">Net ₹</th><th class="num">₹/Worker</th></tr></thead><tbody id="day-teams"></tbody></table></div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Stage-wise Inventory</div></div><div id="day-inv"></div></div>
        <!-- Attendance removed from Day Sheet -->
        <div class="card"><div class="ch"><div class="ct">RM P&L</div></div><div id="day-rm-pnl"></div></div>
      </div>

      <!-- ══ MONTHLY ══ -->
      <div class="screen" id="sc-month">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>Monthly <span>Report</span></h1></div>
          <div style="display:flex;gap:7px;align-items:center">
            <button class="btn btn-sm" onclick="prevMonth()">← Prev</button>
            <select id="m-mon" onchange="renderMonthly()" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:var(--r);font-family:var(--body)"></select>
            <select id="m-yr" onchange="renderMonthly()" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:var(--r);font-family:var(--body)"></select>
            <button class="btn btn-sm" onclick="nextMonth()">Next →</button>
          </div>
        </div>
        <div class="mrow" id="m-met"></div>
        <div class="card"><div class="ch"><div class="ct">Daily Profit Calendar</div></div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px">
            <div class="cdow">Sun</div><div class="cdow">Mon</div><div class="cdow">Tue</div><div class="cdow">Wed</div><div class="cdow">Thu</div><div class="cdow">Fri</div><div class="cdow">Sat</div>
          </div>
          <div class="cal-wrap" id="m-cal"></div>
          <div style="margin-top:8px;font-size:11px;color:var(--text4);font-family:var(--mono)">Click any day to see details</div>
        </div>
        <!-- Day drill-down -->
        <div id="m-day-detail" style="display:none">
          <div class="card" style="border-left:3px solid var(--blue)">
            <div class="ch">
              <div>
                <div class="ct">Day Detail</div>
                <div id="m-day-title" style="font-size:16px;font-weight:700;color:var(--text);margin-top:4px"></div>
              </div>
              <button class="btn btn-sm" onclick="document.getElementById('m-day-detail').style.display='none'">✕</button>
            </div>
            <div id="m-day-metrics" class="mrow" style="margin-bottom:16px"></div>
            <div id="m-day-prod"></div>
          </div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Day-by-Day Ledger</div></div>
          <div class="tw"><table class="tbl" style="min-width:700px"><thead><tr><th>Date</th><th>Workers</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">OT ₹</th><th class="num">RM ₹</th><th class="num">Net Profit ₹</th><th class="num">Margin %</th></tr></thead><tbody id="m-ledger"></tbody></table></div>
        </div>
        <div class="g2">
          <div class="card"><div class="ch"><div class="ct">Product-wise Production</div></div><div id="m-prods"></div></div>
          <div class="card"><div class="ch"><div class="ct">Stage-wise P&L</div></div><table class="tbl"><thead><tr><th>Stage</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">OT ₹</th><th class="num">RM ₹</th><th class="num">Net ₹</th></tr></thead><tbody id="m-stages"></tbody></table></div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Supervisor Performance</div></div>
          <table class="tbl"><thead><tr><th>Supervisor</th><th>Stages</th><th class="num">Days</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">Avg Team</th><th class="num">₹/Worker/Day</th><th class="num">Net ₹</th></tr></thead><tbody id="m-sups"></tbody></table>
        </div>
        <div class="card"><div class="ch"><div class="ct">Top Performing Days</div></div><div id="m-top-days"></div></div>
      </div>

      <!-- ══ ORDERS ══ -->
      <div class="screen" id="sc-orders">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>Orders <span style="color:var(--blue)">Pipeline</span></h1></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-sm btn-jade" onclick="importOrdersFromSheets()">📥 Import from Sheets</button>
            <span id="import-status" style="font-size:11px;color:var(--text4);font-family:var(--mono)"></span>
            <button class="btn btn-amber" onclick="openNewOrder()">+ New Order</button>
          </div>
        </div>
        <div class="tabs" id="order-tabs">
          <div class="tab active" onclick="filterOrders('all')">All</div>
          <div class="tab" onclick="filterOrders('pending')">⏳ Pending</div>
          <div class="tab" onclick="filterOrders('production')">🏗️ In Production</div>
          <div class="tab" onclick="filterOrders('ready')">✅ Ready</div>
          <div class="tab" onclick="filterOrders('dispatched')">🚚 Dispatched</div>
        </div>
        <div class="mrow" id="order-metrics"></div>
        <div id="order-list"></div>
<div id="order-form-wrap" style="display:none">
  <div class="card" style="max-width:780px">
    <div class="ch"><div class="ct">New Customer Order</div><button class="btn btn-sm" onclick="closeOrderForm()">✕ Cancel</button></div>

    <!-- Customer details -->
    <div class="fg fg2">
      <div class="fld"><label>Customer Name</label><input id="ord-customer" placeholder="e.g. Shubham Decorators"></div>
      <div class="fld"><label>Phone</label><input id="ord-phone" placeholder="9XXXXXXXXX" type="tel"></div>
    </div>
    <div class="fg fg3">
      <div class="fld"><label>City</label><input id="ord-city" placeholder="e.g. Mumbai"></div>
      <div class="fld"><label>Required By</label><input id="ord-date" type="date"></div>
      <div class="fld"><label>Priority</label><select id="ord-priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent 🚨</option></select></div>
    </div>
    <div class="fld" style="margin-bottom:14px"><label>Advance Paid ₹</label><input id="ord-advance" type="number" placeholder="0" style="max-width:200px"></div>

    <!-- Divider -->
    <div style="height:1px;background:var(--border);margin-bottom:14px"></div>

    <!-- Cart header -->
    <div style="font-family:var(--mono);font-size:9px;font-weight:600;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">🛒 Order Items</div>

    <!-- Search bar to add products -->
    <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap">
      <div style="position:relative;flex:1;min-width:220px">
        <input id="ord-item-search" placeholder="Search product from catalogue..." oninput="filterOrderProducts()" autocomplete="off" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);font-size:12px;color:var(--text);outline:none" onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'">
        <div id="ord-item-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);max-height:220px;overflow-y:auto;z-index:999;box-shadow:var(--shadow-lg)"></div>
      </div>
      <input id="ord-item-qty" type="number" placeholder="Qty" min="1" value="1" style="width:72px;padding:9px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);font-size:12px;color:var(--text);outline:none" onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'">
      <input id="ord-item-price" type="number" placeholder="₹/pc" style="width:90px;padding:9px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);font-size:12px;color:var(--text);outline:none" onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'">
      <button class="btn btn-blue btn-sm" onclick="addOrderItem()" style="padding:9px 16px;font-size:12px">+ Add</button>
    </div>

    <!-- Cart items table -->
    <div id="ord-items-list" style="margin-bottom:14px"></div>

    <!-- Total row -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--surface2);border-radius:var(--r);margin-bottom:14px;border:1px solid var(--border)">
      <div>
        <div style="font-size:11px;color:var(--text4);font-family:var(--mono)">TOTAL AMOUNT</div>
        <div id="ord-items-count" style="font-size:11px;color:var(--text4);margin-top:2px"></div>
      </div>
      <span id="ord-total-display" style="font-family:var(--mono);font-size:22px;font-weight:700;color:var(--blue)">₹0</span>
      <input type="hidden" id="ord-amount">
    </div>

    <button class="btn btn-blue btn-full" onclick="saveOrder()" style="font-size:14px;padding:13px">✓ Create Order</button>
  </div>
</div>

      </div>

      <!-- ══ PAYMENTS ══ -->
      <div class="screen" id="sc-payments">
        <div class="page-hero"><h1>Payments <span style="color:var(--amber)">Tracker</span></h1><p>Advance, balance due and overdue payments</p></div>
        <div class="mrow" id="pay-metrics"></div>
        <div class="card"><div class="ch"><div class="ct">Balance Due — All Orders</div></div><div id="pay-list"></div></div>
      </div>

      <!-- ══ INVENTORY ══ -->
      <div class="screen" id="sc-inventory">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>Inventory <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)" id="inv-date-label">All-time cumulative stock</p></div>
          <div style="display:flex;gap:8px"><button class="btn btn-sm" onclick="window.print()">🖨️ Print</button><button class="btn btn-amber btn-sm" onclick="renderInventory()">↻ Refresh</button></div>
        </div>
        <div style="margin-bottom:16px">
          <input type="text" id="inv-search" placeholder="🔍 Search any product or material..." oninput="renderInventory()"
            style="width:100%;max-width:480px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);color:var(--text);padding:10px 14px;font-family:var(--body);font-size:13px;outline:none;transition:all .2s"
            onfocus="this.style.borderColor='var(--amber)'" onblur="this.style.borderColor='var(--border)'">
        </div>
        <div class="mrow" id="inv-health"></div>
        <div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">🧪</span><span style="font-family:var(--display);font-size:16px;font-weight:700">Raw Material Stock</span></div><div id="inv-rm"></div></div>
        <div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">🔄</span><span style="font-family:var(--display);font-size:16px;font-weight:700">Stage Transitions</span></div><div id="inv-transitions"></div></div>
        <div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">📦</span><span style="font-family:var(--display);font-size:16px;font-weight:700">Finished Goods — Stage-wise</span></div><div id="inv-fg"></div></div>
        <div id="inv-alerts"></div>
      </div>

      <!-- ══ RM STOCK ══ -->
      <div class="screen" id="sc-stock">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>RM <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)">Running balance — opening + purchases − usage</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-amber" onclick="openPurchase()">+ Purchase</button>
            <button class="btn btn-sm" onclick="openStockUpdate()">⚙ Set Opening</button>
          </div>
        </div>
        <div id="stock-alerts"></div>
        <div class="card"><div class="ch"><div class="ct">Current Stock Levels</div></div><div id="stock-list"></div></div>
        <div id="purchase-form" style="display:none">
          <div class="card" style="max-width:540px">
            <div class="ch"><div class="ct">Add Purchase</div><button class="btn btn-sm" onclick="closePurchase()">✕</button></div>
            <div class="fg fg4">
              <div class="fld"><label>Material</label><select id="pur-mat"></select></div>
              <div class="fld"><label>Quantity</label><input id="pur-qty" type="number" placeholder="0"></div>
              <div class="fld"><label>Unit Cost ₹</label><input id="pur-cost" type="number" placeholder="0"></div>
              <div class="fld"><label>Supplier</label><input id="pur-note" placeholder="e.g. Ravi Traders"></div>
            </div>
            <button class="btn btn-amber" onclick="savePurchase()">✓ Add to Stock</button>
          </div>
        </div>
        <div id="stock-form" style="display:none">
          <div class="card" style="max-width:500px">
            <div class="ch"><div class="ct">Set Opening Stock</div><button class="btn btn-sm" onclick="closeStockForm()">✕</button></div>
            <div class="fg fg3">
              <div class="fld"><label>Material</label><select id="stk-mat"></select></div>
              <div class="fld"><label>Current Stock</label><input id="stk-qty" type="number" placeholder="0"></div>
              <div class="fld"><label>Reorder Level</label><input id="stk-reorder" type="number" placeholder="100"></div>
            </div>
            <button class="btn btn-amber btn-sm" onclick="saveStock()">✓ Set Stock</button>
          </div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Movement History</div></div><div id="stock-history"></div></div>
      </div>

      <!-- ══ RM PURCHASE ══ -->
      <div class="screen" id="sc-rmpurchase">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>RM <span style="color:var(--amber)">Purchase</span></h1><p style="color:var(--text4);font-family:var(--mono)">Opening stock, procurement & adjustments</p></div>
          <button class="btn btn-amber" onclick="openRMPurchaseForm()">+ Add Entry</button>
        </div>
        <div id="rmp-form" style="display:none">
          <div class="card" style="max-width:580px">
            <div class="ch"><div class="ct">New Stock Entry</div><button class="btn btn-sm" onclick="closeRMPurchaseForm()">✕</button></div>
            <div class="fg fg2">
              <div class="fld"><label>Entry Type</label><select id="rmp-type"><option value="opening">Opening Stock</option><option value="purchase">Purchase</option><option value="return">Return (+)</option><option value="wastage">Wastage (-)</option></select></div>
              <div class="fld"><label>Date</label><input id="rmp-date" type="date"></div>
            </div>
            <div class="fg fg4">
              <div class="fld"><label>Material</label><select id="rmp-mat"></select></div>
              <div class="fld"><label>Quantity</label><input id="rmp-qty" type="number" placeholder="0" step="0.1"></div>
              <div class="fld"><label>Unit Cost ₹</label><input id="rmp-cost" type="number" placeholder="0"></div>
              <div class="fld"><label>Reorder Level</label><input id="rmp-reorder" type="number" placeholder="100"></div>
            </div>
            <div class="fld" style="margin-bottom:10px"><label>Supplier / Note</label><input id="rmp-note" placeholder="e.g. Ravi Traders, Ranchi"></div>
            <button class="btn btn-amber" onclick="saveRMPurchase()">✓ Save Entry</button>
          </div>
        </div>
        <div class="mrow" id="rmp-metrics"></div>
        <div class="card"><div class="ch"><div class="ct">Material-wise Summary</div></div><div id="rmp-summary"></div></div>
        <div class="card">
          <div class="ch">
            <div class="ct">All Entries</div>
            <select id="rmp-filter" onchange="renderRMPurchase()" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px;color:var(--text2)"><option value="all">All Materials</option></select>
          </div>
          <div id="rmp-history"></div>
        </div>
      </div>

      <!-- ══ FG STOCK ══ -->
      <div class="screen" id="sc-fgstock">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>FG <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)">Moulding → Finishing → Painting → Packing</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-amber" onclick="openFGTransfer()">↔ Transfer</button>
            <button class="btn btn-sm" onclick="openFGAdjust()">✏️ Adjust</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:16px;overflow-x:auto">
          <div style="text-align:center"><div class="sp sp0" style="padding:6px 14px">MOULDING</div><div style="font-size:9px;color:var(--text4);margin-top:3px">Raw → Shape</div></div>
          <div style="color:var(--text4);font-size:18px">→</div>
          <div style="text-align:center"><div class="sp sp1" style="padding:6px 14px">FINISHING</div><div style="font-size:9px;color:var(--text4);margin-top:3px">Shape → Smooth</div></div>
          <div style="color:var(--text4);font-size:18px">→</div>
          <div style="text-align:center"><div class="sp sp2" style="padding:6px 14px">PAINTING</div><div style="font-size:9px;color:var(--text4);margin-top:3px">Smooth → Colour</div></div>
          <div style="color:var(--text4);font-size:18px">→</div>
          <div style="text-align:center"><div class="sp sp3" style="padding:6px 14px">PACKING</div><div style="font-size:9px;color:var(--text4);margin-top:3px">Final — Ready</div></div>
        </div>
        <div class="tabs" id="fg-stage-tabs">
          <div class="tab active" onclick="switchFGStage('all')">All Stages</div>
          <div class="tab" onclick="switchFGStage('Moulding')">🔵 Moulding</div>
          <div class="tab" onclick="switchFGStage('Finishing')">🟡 Finishing</div>
          <div class="tab" onclick="switchFGStage('Painting')">🟢 Painting</div>
          <div class="tab" onclick="switchFGStage('Packing')">🟣 Packing</div>
        </div>
        <div id="fg-stock-content"></div>
        <div id="fg-transfer-form" style="display:none">
          <div class="card" style="max-width:540px">
            <div class="ch"><div class="ct">↔ Transfer Goods</div><button class="btn btn-sm" onclick="closeFGTransfer()">✕</button></div>
            <div class="ibox">Goods deducted from source stage and added to destination automatically.</div>
            <div class="fg fg2">
              <div class="fld"><label>From Stage</label><select id="fgt-from" onchange="updateFGTransferTo()"><option>Moulding</option><option>Finishing</option><option>Painting</option><option>Packing</option></select></div>
              <div class="fld"><label>To Stage</label><select id="fgt-to"><option>Finishing</option><option>Painting</option><option>Packing</option><option>Dispatch</option></select></div>
            </div>
            <div class="fg fg3">
              <div class="fld"><label>Product</label><select id="fgt-prod"></select></div>
              <div class="fld"><label>Quantity</label><input id="fgt-qty" type="number" placeholder="0"></div>
              <div class="fld"><label>Date</label><input id="fgt-date" type="date"></div>
            </div>
            <div class="fld" style="margin-bottom:10px"><label>Note</label><input id="fgt-note" placeholder="e.g. Moved to finishing team"></div>
            <button class="btn btn-amber" onclick="saveFGTransfer()">✓ Transfer</button>
          </div>
        </div>
        <div id="fg-adjust-form" style="display:none">
          <div class="card" style="max-width:500px">
            <div class="ch"><div class="ct">✏️ Manual Adjustment</div><button class="btn btn-sm" onclick="closeFGAdjust()">✕</button></div>
            <div class="fg fg4">
              <div class="fld"><label>Stage</label><select id="fga-stage"><option>Moulding</option><option>Finishing</option><option>Painting</option><option>Packing</option></select></div>
              <div class="fld"><label>Product</label><select id="fga-prod"></select></div>
              <div class="fld"><label>Qty (+/-)</label><input id="fga-qty" type="number" placeholder="e.g. -2"></div>
              <div class="fld"><label>Reason</label><input id="fga-note" placeholder="Damage, recount..."></div>
            </div>
            <button class="btn btn-amber btn-sm" onclick="saveFGAdjust()">✓ Adjust</button>
          </div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Movement History</div></div><div id="fg-history"></div></div>
      </div>

    

<!-- ══ SALARY ══ -->
<div class="screen" id="sc-salary">
  <div class="page-hero"><h1>Salary <span>Management</span></h1><p>Monthly payroll, advances and deductions</p></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
    <div class="fld" style="margin:0"><label>Month</label><input type="month" id="sal-month" style="width:160px"></div>
    <button class="btn btn-blue" onclick="renderSalary()" style="margin-top:18px">Load</button>
    <button class="btn btn-amber" onclick="exportSalaryExcel()" style="margin-top:18px">📊 Export Excel</button>
  </div>
  <div id="sal-metrics" class="mrow"></div>
  <div class="card">
    <div class="ch"><div class="ct">Worker Payroll</div><div style="font-size:11px;color:var(--text4);font-family:var(--mono)">Click worker to add advance/deduction</div></div>
    <div class="tw"><table class="tbl" id="sal-table">
      <thead><tr>
        <th>#</th><th>Worker</th><th>Role</th><th class="num">Daily Wage</th>
        <th class="num">Days Present</th><th class="num">OT Hours</th><th class="num">OT Amount</th>
        <th class="num">Gross</th><th class="num">Advance</th><th class="num">Deduction</th><th class="num">Net Pay</th><th>Action</th>
      </tr></thead>
      <tbody id="sal-tbody"></tbody>
      <tfoot><tr class="tr-total" id="sal-tfoot"></tr></tfoot>
    </table></div>
  </div>
  <!-- Advance/Deduction modal -->
  <div id="sal-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:none;align-items:center;justify-content:center">
    <div class="card" style="max-width:400px;width:90%;margin:0">
      <div class="ch"><div class="ct" id="sal-modal-name">Worker</div><button class="btn btn-sm" onclick="closeSalModal()">✕</button></div>
      <div class="fg fg2">
        <div class="fld"><label>Advance Paid ₹</label><input type="number" id="sal-advance" placeholder="0"></div>
        <div class="fld"><label>Deduction ₹</label><input type="number" id="sal-deduction" placeholder="0"></div>
      </div>
      <div class="fld"><label>Note</label><input id="sal-note" placeholder="e.g. Advance taken 15th July"></div>
      <button class="btn btn-amber btn-full" onclick="saveSalAdj()" style="margin-top:10px">Save</button>
    </div>
  </div>
</div>

<!-- ══ DISPATCH ══ -->
<div class="screen" id="sc-dispatch">
  <div class="page-hero"><h1>Dispatch <span>Manager</span></h1><p>Link dispatches to orders and deduct from stock</p></div>
  <div id="dispatch-pending-orders"></div>
  <div class="card" style="margin-top:16px">
    <div class="ch"><div class="ct">Dispatch History</div></div>
    <div id="dispatch-history"></div>
  </div>
</div>

<!-- ══ BOM ══ -->
<div class="screen" id="sc-bom">
  <div class="page-hero"><h1>Bill of <span>Materials</span></h1><p>Define RM consumed per product — auto-deduct on production</p></div>
  <div class="card">
    <div class="ch"><div class="ct">Product BOM</div><button class="btn btn-sm btn-blue" onclick="addBOMRow()">+ Add Product BOM</button></div>
    <div id="bom-list"></div>
  </div>
  <div class="card" id="bom-form-wrap" style="display:none;max-width:560px">
    <div class="ch"><div class="ct" id="bom-form-title">Add BOM</div><button class="btn btn-sm" onclick="closeBOMForm()">✕</button></div>
    <div class="fld" style="margin-bottom:10px">
      <label>Product</label>
      <div style="position:relative">
        <input id="bom-prod-search" placeholder="Search product..." oninput="filterBOMProducts()" autocomplete="off">
        <div id="bom-prod-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);max-height:180px;overflow-y:auto;z-index:99;box-shadow:var(--shadow)"></div>
      </div>
    </div>
    <div id="bom-rm-rows"></div>
    <button class="btn btn-sm btn-blue" onclick="addBOMRM()" style="margin-bottom:12px">+ Add RM</button>
    <button class="btn btn-amber btn-full" onclick="saveBOM()">Save BOM</button>
  </div>
</div>

<!-- ══ EXPORT ══ -->
<div class="screen" id="sc-export">
  <div class="page-hero"><h1>Excel <span>Export</span></h1><p>Download reports as .xlsx files — choose date range</p></div>

  <!-- Date range selector -->
  <div class="card" style="max-width:500px;margin-bottom:20px">
    <div class="ch"><div class="ct">Date Range for Export</div></div>
    <div class="fg fg2">
      <div class="fld"><label>From Date</label><input type="date" id="exp-from"></div>
      <div class="fld"><label>To Date</label><input type="date" id="exp-to"></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <button class="btn btn-sm" onclick="setExpRange('today')">Today</button>
      <button class="btn btn-sm" onclick="setExpRange('week')">This Week</button>
      <button class="btn btn-sm" onclick="setExpRange('month')">This Month</button>
      <button class="btn btn-sm" onclick="setExpRange('all')">All Time</button>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">👷</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Attendance Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Workers present/absent with wages</div>
      <button class="btn btn-blue btn-full" onclick="exportAttendance()">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">🏭</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Production Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Production by stage, product, supervisor</div>
      <button class="btn btn-blue btn-full" onclick="exportProduction()">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">📋</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Orders Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">All orders with status, amount, balance</div>
      <button class="btn btn-blue btn-full" onclick="exportOrders()">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">💼</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Salary Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Monthly payroll for all workers</div>
      <div class="fld" style="margin-bottom:10px;text-align:left"><label>Month</label><input type="month" id="export-sal-month"></div>
      <button class="btn btn-blue btn-full" onclick="exportSalaryExcel()">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">📦</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Inventory Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">RM stock + FG stock across all stages</div>
      <button class="btn btn-blue btn-full" onclick="exportInventory()">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">💰</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">P&amp;L Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Daily profit/loss ledger history</div>
      <button class="btn btn-blue btn-full" onclick="exportPnL()">📊 Download</button>
    </div>
  </div>
</div>

<!-- ══ ASSIGN TO ORDER MODAL ══ -->
<div id="assign-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;align-items:center;justify-content:center;padding:20px">
  <div class="card" style="max-width:520px;width:100%;margin:0;max-height:85vh;overflow-y:auto">
    <div class="ch">
      <div>
        <div class="ct">Assign to Order</div>
        <div id="assign-product-label" style="font-size:14px;font-weight:600;color:var(--text);margin-top:4px"></div>
      </div>
      <button class="btn btn-sm" onclick="closeAssignModal()">✕ Close</button>
    </div>
    <div id="assign-stock-info" style="font-family:var(--mono);font-size:11px;color:var(--text4);margin-bottom:12px"></div>
    <div id="assign-order-list"></div>
  </div>
</div>


<div class="screen" id="sc-transfers">
  <div class="page-hero"><h1>Unit 2 <span>Transfers</span></h1><p>Log RM and FG movements between Unit 1 (Propskart) and Unit 2</p></div>
  <div class="card" style="max-width:680px;margin-bottom:20px">
    <div class="ch"><div class="ct">New Transfer Entry</div></div>
    <div class="fg fg2">
      <div class="fld"><label>Date</label><input type="date" id="ut-date"></div>
      <div class="fld"><label>Direction</label>
        <select id="ut-dir">
          <option value="Unit1→Unit2">Unit 1 → Unit 2</option>
          <option value="Unit2→Unit1">Unit 2 → Unit 1</option>
        </select>
      </div>
    </div>
    <div class="fg fg2">
      <div class="fld"><label>Type</label>
        <select id="ut-type" onchange="renderUTItemDD()">
          <option value="RM">Raw Material (RM)</option>
          <option value="FG">Finished Goods (FG)</option>
        </select>
      </div>
      <div class="fld" id="ut-stage-wrap" style="display:none"><label>From Stage (FG only)</label>
        <select id="ut-stage">
          <option value="Moulding">Moulding</option>
          <option value="Finishing">Finishing</option>
          <option value="Painting">Painting</option>
          <option value="Packing">Packing</option>
        </select>
      </div>
    </div>
    <div class="fg fg2">
      <div class="fld"><label>Item</label>
        <div style="position:relative">
          <input id="ut-item-search" placeholder="Search item..." oninput="filterUTItems()" autocomplete="off">
          <div id="ut-item-dd" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);max-height:180px;overflow-y:auto;z-index:99;box-shadow:var(--shadow)"></div>
        </div>
      </div>
      <div class="fld"><label>Unit</label><input id="ut-unit" placeholder="kg / pcs / rolls"></div>
    </div>
    <div class="fg fg2">
      <div class="fld"><label>Quantity</label><input type="number" id="ut-qty" placeholder="0" min="0" step="0.01"></div>
      <div class="fld"><label>Value ₹ (optional)</label><input type="number" id="ut-value" placeholder="0"></div>
    </div>
    <div class="fld" style="margin-bottom:12px"><label>Note</label><input id="ut-note" placeholder="e.g. For urgent order, painting batch"></div>
    <button class="btn btn-amber btn-full" onclick="saveUnitTransfer()">✓ Log Transfer</button>
  </div>

  <!-- Metrics -->
  <div id="ut-metrics" class="mrow"></div>

  <!-- Table -->
  <div class="card">
    <div class="ch">
      <div class="ct">Transfer Log</div>
      <div style="display:flex;gap:8px">
        <select id="ut-filter-dir" onchange="renderUnitTransfers()" style="font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text2)">
          <option value="all">All Directions</option>
          <option value="Unit1→Unit2">Unit 1 → Unit 2</option>
          <option value="Unit2→Unit1">Unit 2 → Unit 1</option>
        </select>
        <select id="ut-filter-type" onchange="renderUnitTransfers()" style="font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text2)">
          <option value="all">All Types</option>
          <option value="RM">RM Only</option>
          <option value="FG">FG Only</option>
        </select>
        <button class="btn btn-sm" onclick="exportUnitTransfers()">📊 Export</button>
      </div>
    </div>
    <div id="ut-log"></div>
  </div>
</div>

<!-- ══ DOCUMENTS ══ -->
<div class="screen" id="sc-docs">
  <div class="page-hero">
    <h1>Documents <span style="color:var(--amber)">Generator</span></h1>
    <p style="color:var(--text4);font-family:var(--mono)">Generate Quotation, Invoice or Delivery Challan — print or save as PDF</p>
  </div>

  <div class="g2">
    <!-- LEFT: Form -->
    <div>
      <div class="card">
        <div class="ch"><div class="ct">Document Details</div></div>

        <div class="fg fg2">
          <div class="fld">
            <label>Document Type</label>
            <select id="doc-type" onchange="updateDocType()">
              <option value="quotation">📋 Quotation</option>
              <option value="invoice">🧾 Invoice</option>
              <option value="challan">🚚 Delivery Challan</option>
            </select>
          </div>
          <div class="fld">
            <label>Document Number</label>
            <input id="doc-number" placeholder="e.g. Q-2026-001">
          </div>
        </div>

        <div class="fg fg2">
          <div class="fld">
            <label>Date</label>
            <input id="doc-date" type="date">
          </div>
          <div class="fld" id="doc-valid-wrap">
            <label>Valid Until</label>
            <input id="doc-valid" type="date">
          </div>
        </div>

        <div class="div"></div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Customer Details</div>

        <!-- Fill from existing order -->
        <div class="fld" style="margin-bottom:10px">
          <label>Fill from existing order (optional)</label>
          <select id="doc-from-order" onchange="fillFromOrder()">
            <option value="">— select order —</option>
          </select>
        </div>

        <div class="fg fg2">
          <div class="fld"><label>Customer Name</label><input id="doc-cust" placeholder="e.g. Shubham Decorators"></div>
          <div class="fld"><label>Phone</label><input id="doc-phone" placeholder="9XXXXXXXXX"></div>
        </div>
        <div class="fg fg2">
          <div class="fld"><label>City</label><input id="doc-city" placeholder="e.g. Mumbai"></div>
          <div class="fld"><label>Address (optional)</label><input id="doc-addr" placeholder="Street, Area..."></div>
        </div>

        <div class="div"></div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Items</div>

        <div id="doc-items-list"></div>

        <div class="fg fg4" style="margin-bottom:8px">
          <div class="fld">
            <label>Product</label>
            <select id="doc-item-prod" onchange="docItemFill()"><option value="">— select —</option></select>
          </div>
          <div class="fld"><label>Qty</label><input id="doc-item-qty" type="number" placeholder="1" min="1" value="1"></div>
          <div class="fld"><label>Rate ₹</label><input id="doc-item-rate" type="number" placeholder="0"></div>
          <div class="fld" style="display:flex;align-items:flex-end">
            <button class="btn btn-amber" style="width:100%" onclick="addDocItem()">+ Add</button>
          </div>
        </div>

        <div class="fg fg2">
          <div class="fld"><label>Discount ₹ (optional)</label><input id="doc-discount" type="number" placeholder="0" oninput="updateDocPreview()"></div>
          <div class="fld"><label>Advance Paid ₹ (optional)</label><input id="doc-advance" type="number" placeholder="0" oninput="updateDocPreview()"></div>
        </div>

        <div class="fld"><label>Notes / Terms</label><input id="doc-notes" placeholder="e.g. Delivery within 15 days, 50% advance required"></div>

        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <button class="btn btn-blue" onclick="saveDocAsOrder()" style="flex:1;justify-content:center;padding:12px;font-size:14px">📋 Save as Order</button>
          <button class="btn btn-amber" onclick="printDoc()" style="flex:1;justify-content:center;padding:12px;font-size:14px">🖨️ Print / PDF</button>
          <button class="btn" onclick="clearDoc()">✕ Clear</button>
        </div>
      </div>
    </div>

    <!-- RIGHT: Live Preview -->
    <div>
      <div class="card" style="padding:0;overflow:hidden">
        <div style="background:var(--surface2);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;justify-content:space-between">
          <div class="ct">Live Preview</div>
          <button class="btn btn-sm" onclick="printDoc()">🖨️ Print</button>
        </div>
        <div id="doc-preview" style="padding:24px;min-height:400px;font-family:'Inter',sans-serif;font-size:13px;color:#111827"></div>
      </div>
    </div>
  </div>
</div>
</div><!-- /screens -->
  </div><!-- /main -->
</div><!-- /app -->


`;
