// Factory OS v2.0 — All features, secrets from .env

// Inject screens HTML
document.getElementById('app-root').innerHTML = `<!-- ── LOGIN ── -->
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
</div><!-- /app -->`;

// Firebase loader
function loadScript(src, cb){
  var s = document.createElement('script');
  s.src = src; s.onload = cb||function(){};
  s.onerror = function(){ console.error('Script failed to load: '+src); if(cb) cb(); };
  document.head.appendChild(s);
}

// ── ALL APP LOGIC ──

// ════ CONSTANTS ════
// Moved to core/config.js (LS_KEY, STAGES, FG_STAGES, SPC, MNAMES,
// SHEETS_URL, ROLE_ACCESS, ROLE_HOME) and core/format.js (spBadge).
// They reach this file as globals via the bridge in those modules; main.js
// imports them before app.js, so they exist before anything here runs.

// ════ APPS SCRIPT ════
const APPS_SCRIPT_CODE=`function doGet(e){try{var sheet=SpreadsheetApp.getActiveSpreadsheet();var action=e.parameter.action||'';var cb=e.parameter.callback||'';var data=e.parameter.payload?JSON.parse(decodeURIComponent(e.parameter.payload)):{};if(action==='summary'){var ledger=sheet.getSheetByName('Daily Ledger')||sheet.insertSheet('Daily Ledger');if(ledger.getLastRow()===0)ledger.appendRow(['Date','Supervisor','Stage','Workers','Goods','Labour','OT','RM','Net Profit','Margin %']);ledger.appendRow([data.date,data.sup||'',data.stage||'',data.workers,data.goods,data.labour,data.ot||0,data.rm,data.net,data.margin||0]);}else if(action==='prod'){var prod=sheet.getSheetByName('Production')||sheet.insertSheet('Production');if(prod.getLastRow()===0)prod.appendRow(['Date','Supervisor','Stage','Product','Qty','Unit Value','Total']);prod.appendRow([data.date,data.sup||'',data.stage||'',data.name,data.qty,data.uv,data.val]);}else if(action==='rm'){var rm=sheet.getSheetByName('Raw Materials')||sheet.insertSheet('Raw Materials');if(rm.getLastRow()===0)rm.appendRow(['Date','Stage','Material','Qty','Unit','Unit Price','Total Cost']);rm.appendRow([data.date,data.stage,data.name,data.qty,data.unit,data.up,data.cost]);}else if(action==='monthlySalary'){var sal=sheet.getSheetByName('Monthly Salary')||sheet.insertSheet('Monthly Salary');if(sal.getLastRow()===0){sal.appendRow(['Month','Worker','Role','Days Present','OT Days','Daily Wage','Gross Pay','Advance','Deduction','Net Pay']);var sh=sal.getRange(1,1,1,10);sh.setFontWeight('bold');sh.setBackground('#1967D2');sh.setFontColor('#ffffff');}(data.workers||[]).forEach(function(w){sal.appendRow([data.month,w.name,w.role,w.days,w.otDays,w.wage,w.gross,w.advance,w.deduction,w.net]);});}else if(action==='unitTransfer'){var ut=sheet.getSheetByName('Unit Transfers')||sheet.insertSheet('Unit Transfers');if(ut.getLastRow()===0){ut.appendRow(['Date','Direction','Type','Item','Qty','Unit','Note','Logged By']);var uh=ut.getRange(1,1,1,8);uh.setFontWeight('bold');uh.setBackground('#059669');uh.setFontColor('#ffffff');}ut.appendRow([data.date,data.direction,data.type,data.item,data.qty,data.unit,data.note||'',data.loggedBy||'Owner']);}else if(action==='order'){var orders=sheet.getSheetByName('Orders')||sheet.insertSheet('Orders');if(orders.getLastRow()===0){orders.appendRow(['Date','Order ID','Customer','Phone','City','Required By','Priority','Items','Amount','Advance','Balance','Status']);var h=orders.getRange(1,1,1,12);h.setFontWeight('bold');h.setBackground('#1967D2');h.setFontColor('#ffffff');}var lastRow=orders.getLastRow();var found=false;if(lastRow>1){var ids=orders.getRange(2,2,lastRow-1,1).getValues();for(var i=0;i<ids.length;i++){if(ids[i][0]===data.id){orders.getRange(i+2,11).setValue(data.balance);orders.getRange(i+2,12).setValue(data.status);found=true;break;}}}if(!found){orders.appendRow([data.date,data.id,data.customer,data.phone||'',data.city||'',data.requiredBy||'',data.priority,data.items||'',data.amount,data.advance,data.balance,data.status]);}}else if(action==='getOrders'){var ordSheet=sheet.getSheetByName('Orders');if(!ordSheet||ordSheet.getLastRow()<2){var out=JSON.stringify({orders:[]});return ContentService.createTextOutput(cb?cb+'('+out+')':out).setMimeType(cb?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);}var rows=ordSheet.getRange(2,1,ordSheet.getLastRow()-1,12).getValues();var result=rows.filter(function(r){return r[2];}).map(function(r){return{date:r[0]?new Date(r[0]).toISOString().slice(0,10):'',id:r[1]||'',customer:r[2]||'',phone:r[3]||'',city:r[4]||'',requiredBy:r[5]?new Date(r[5]).toISOString().slice(0,10):'',priority:r[6]||'normal',items:r[7]||'',amount:parseFloat(r[8])||0,advance:parseFloat(r[9])||0,balance:parseFloat(r[10])||0,status:r[11]||'pending'};});var out2=JSON.stringify({orders:result});return ContentService.createTextOutput(cb?cb+'('+out2+')':out2).setMimeType(cb?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);}return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);}catch(err){return ContentService.createTextOutput(JSON.stringify({status:'error',message:err.toString()})).setMimeType(ContentService.MimeType.JSON);}}`;

// ════ STATE ════

// ════ STATE ════
// defaultState / loadState / S / uid moved to core/state.js, and the seeded
// catalogues to core/seed-data.js. They reach this file as globals via the
// bridge in those modules; main.js imports them before app.js.


// ════ LOGIN ════
let currentRole = null;

function togglePwd(){
  const i = document.getElementById('login-pwd');
  i.type = i.type==='password' ? 'text' : 'password';
}
// NOTE: the email-to-role map that was here is gone. It defaulted unknown
// addresses to 'supervisor' on the client, which meant the role was decided
// in the browser. Roles now live in app_users and are enforced by RLS.

// ── LOGIN ──
// Email + password only. The old role-card "master password" path is GONE:
// the passwords were empty strings (the .env values never substituted
// because there is no build step), so selecting a role and submitting a
// blank password granted full access to anyone with the URL.
//
// Role is now read from app_users and enforced by Postgres RLS. Editing
// `currentRole` in DevTools no longer grants anything.
async function doLogin(){
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

  currentRole = res.role;
  window.currentRole = res.role;
  document.getElementById('login-pwd').value='';
  onLoginSuccess((res.user.user_metadata||{}).name || email.split('@')[0]);
}
function onLoginSuccess(displayName){
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
async function doLogout(){
  if(fbEnabled) await FactoryDB.signOut();
  currentRole=null;
  window.currentRole=null;
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
function updateSidebarForRole(){
  if(!currentRole) return;
  const allowed=ROLE_ACCESS[currentRole]||[];
  // Show/hide section cards based on role
  const ownerSections=['sec-owner'];
  const supSections=['sec-supervisor'];
  const invSections=['sec-inventory'];
  const setSections=['sec-settings'];
  if(currentRole==='supervisor'){
    document.getElementById('sec-owner').style.display='none';
    document.getElementById('sec-inventory').style.display='none';
    document.getElementById('sec-settings').style.display='none';
    // Auto-open supervisor section
    openSection('sec-supervisor');
  } else if(currentRole==='rm'){
    document.getElementById('sec-owner').style.display='none';
    document.getElementById('sec-supervisor').style.display='none';
    document.getElementById('sec-settings').style.display='none';
    openSection('sec-inventory');
  } else {
    // Owner sees everything - open all sections
    openSection('sec-supervisor');
    openSection('sec-owner');
    openSection('sec-inventory');
    openSection('sec-settings');
  }
}

// ════ SIDEBAR ════
function toggleSection(id){
  const el=document.getElementById(id);
  el.classList.toggle('open');
}
function openSection(id){
  document.getElementById(id).classList.add('open');
}
let _sidebarOpenTime = 0;
function openSidebar(){
  _sidebarOpenTime = Date.now();
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sb-overlay').style.display='block';
}
function closeSidebar(){
  if(Date.now()-_sidebarOpenTime < 400) return;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').style.display='none';
}

// ════ NAVIGATION ════
const PAGE_TITLES={
  docs:'Documents',
  dashboard:'Dashboard',setup:'Setup Catalogue',sheets:'Google Sheets',
  att:'Attendance',sup:'Supervisor Teams',raw:'Issue Raw Materials',
  day:'Day Sheet',month:'Monthly Report',orders:'Orders Pipeline',
  payments:'Payments',inventory:'Daily Inventory',
  stock:'RM Stock',rmpurchase:'RM Purchase',fgstock:'FG Stock'
};
function go(name){
  if(!currentRole){return;}
  const allowed=ROLE_ACCESS[currentRole]||[];
  if(!allowed.includes(name)){alert('Access denied.');return;}
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  // Show target
  const sc=document.getElementById('sc-'+name);
  if(sc) sc.classList.add('active');
  // Update page title
  document.getElementById('page-title').textContent=PAGE_TITLES[name]||name;
  // Update sidebar active states
  document.querySelectorAll('.sb-item,.sb-standalone').forEach(el=>{
    const id=el.id.replace('sn-','');
    el.classList.toggle('active',id===name);
  });
  // Close mobile sidebar
  closeSidebar();
  if(window.innerWidth<=768) closeSidebar();

  // Render the screen through the error boundary — see renderScreen().
  renderScreen(name);

  // Navigating repaints the target screen, and leaving the production screen
  // makes a pending-update badge meaningless — either way it is now seen.
  try{ markProdSeen(); }catch(e){}
}

// ── SCREEN RENDER DISPATCH + ERROR BOUNDARY ──
// Every screen renders through here so that a render failure is VISIBLE.
//
// This used to be twenty bare `if(name==='x') renderX();` lines. One throw
// killed the rest of go() and left the screen blank, with nothing in the UI
// to say why. Three real bugs hid behind that: renderSupLogin and
// renderRawPnL crashed on the current session shape, and renderUnitTransfers
// has never existed at all. The Raw Material blank screen was reported as
// "production sync is not connected to the backend" — the wrong subsystem
// entirely, because a dead screen and a dead sync look identical.
//
// Renderers are referenced lazily by name rather than captured in a map, so a
// missing one surfaces here as a caught error instead of a ReferenceError at
// load time.
const SCREEN_RENDERERS = {
  setup:'renderSetup',        sheets:'renderSheets',    att:'renderAtt',
  sup:'renderSupLogin',       raw:'renderRaw',          day:'renderDay',
  month:'initMonthly',        orders:'renderOrders',    payments:'renderPayments',
  dispatch:'renderDispatch',  transfers:'renderUnitTransfers',
  salary:'renderSalary',      export:'renderExportPage', bom:'renderBOM',
  inventory:'renderInventory',stock:'renderStock',      rmpurchase:'renderRMPurchase',
  fgstock:'renderFGStock',    dashboard:'renderDashboard', docs:'renderDocs',
};

function renderScreen(name){
  const fnName = SCREEN_RENDERERS[name];
  if(!fnName) return;
  const fn = window[fnName];
  if(typeof fn !== 'function'){
    showScreenError(name, new Error(fnName+'() is not defined — this screen was never implemented'));
    return;
  }
  try{
    clearScreenError(name);
    fn();
  }catch(err){
    showScreenError(name, err);
  }
}

function screenErrorEl(name){
  return document.getElementById('screen-error-'+name);
}

function clearScreenError(name){
  const el = screenErrorEl(name);
  if(el) el.remove();
}

// A banner is PREPENDED rather than replacing the screen: a renderer that
// throws half way through still leaves useful content on the page.
function showScreenError(name, err){
  console.error('[screen:'+name+']', err);
  const sc = document.getElementById('sc-'+name);
  if(!sc) return;
  clearScreenError(name);
  const box = document.createElement('div');
  box.id = 'screen-error-'+name;
  box.style.cssText =
    'margin:12px 0;padding:14px 16px;border-radius:10px;'+
    'border:1px solid #FCA5A5;background:#FEF2F2;color:#991B1B;'+
    'font-size:13px;line-height:1.5';
  box.innerHTML =
    '<div style="font-weight:700;margin-bottom:4px">⚠ This screen failed to load</div>'+
    '<div style="margin-bottom:6px">Your saved data is safe — this is a display fault, '+
    'not a sync problem. Please report it with the detail below.</div>'+
    '<code style="display:block;font-family:var(--mono);font-size:11px;'+
    'background:rgba(0,0,0,.05);padding:6px 8px;border-radius:6px;overflow-x:auto">'+
    String((err && err.message) || err)+'</code>';
  sc.insertBefore(box, sc.firstChild);
}

// ════ DASHBOARD ════
let activeDashTab = 'overview';

function switchDashTab(tab){
  activeDashTab = tab;
  ['overview','factory','money'].forEach(t=>{
    document.getElementById('dash-tab-'+t).style.display = t===tab?'block':'none';
    document.getElementById('dashtab-'+t).classList.toggle('active', t===tab);
  });
}

function renderDashboard(){
  if(!S||!S.lab) return;

  // Hide money tab for non-owners
  const moneyTab = document.getElementById('dashtab-money');
  if(moneyTab) moneyTab.style.display = currentRole==='owner'?'':'none';
  if(currentRole!=='owner' && activeDashTab==='money'){ activeDashTab='overview'; switchDashTab('overview'); }

  const present = S.lab.filter(l=>l.present);
  const activeTeams = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).length,0);
  const totalGoods = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  const totalUnits = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.qty,0),0),0);
  const totalRM = S.rawLog.reduce((a,r)=>a+r.cost,0);
  const bw = present.reduce((a,l)=>a+l.wage,0);
  const ot = present.reduce((a,l)=>a+calcOT(l),0);
  const totalLab = bw+ot;
  const net = totalGoods-totalLab-totalRM;
  const packingItems = getAllFGProducts ? getAllFGProducts().filter(p=>getFGBalance(p,'Packing')>0).length : 0;
  const activeOrders = S.orders.filter(o=>o.status!=='dispatched').length;
  const balanceDue = S.orders.filter(o=>o.status!=='dispatched').reduce((a,o)=>a+(o.amount-o.advance),0);
  const overdueOrds = S.orders.filter(o=>isOverdue(o));
  const inProd = S.orders.filter(o=>o.status==='production');
  const now = new Date();
  const monthEntries = S.ledger.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const monthProfit = monthEntries.reduce((a,e)=>a+e.netProfit,0);
  let rmLow=0;
  S.stock.forEach(st=>{
    if(st.reorder<=0)return;
    const purchased=(S.purchases||[]).filter(p=>p.name===st.name&&p.qty>0).reduce((a,p)=>a+p.qty,0);
    const usedH=S.ledger.reduce((a,d)=>a+(d.rawLog||[]).filter(r=>r.name===st.name).reduce((b,r)=>b+r.qty,0),0);
    const usedT=S.rawLog.filter(r=>r.name===st.name).reduce((a,r)=>a+r.qty,0);
    const bal=st.opening+purchased-usedH-usedT;
    if(bal<=st.reorder)rmLow++;
  });

  // ── ALERTS (always visible) ──
  let alerts='';
  if(overdueOrds.length) alerts+=`<div class="alert-banner danger">🚨 ${overdueOrds.length} order${overdueOrds.length>1?'s':''} overdue<span class="ab-action" onclick="go('orders')">View →</span></div>`;
  if(rmLow>0) alerts+=`<div class="alert-banner warn">📦 ${rmLow} RM material${rmLow>1?'s':''} low on stock<span class="ab-action" onclick="go('stock')">Reorder →</span></div>`;
  if(inProd.length) alerts+=`<div class="alert-banner ok">🏗️ ${inProd.length} order${inProd.length>1?'s':''} in production<span class="ab-action" onclick="go('orders')">View →</span></div>`;
  document.getElementById('dash-alerts').innerHTML=alerts?`<div class="alert-row">${alerts}</div>`:'';

  // ── TAB 1: OVERVIEW ──
  const overviewCards = currentRole==='owner' ? `
    <div class="dash-card c-jade" onclick="go('day')">
      <span class="dc-icon">🏭</span><div class="dc-label">Goods Value Today</div>
      <div class="dc-value green" style="font-size:20px">${fmt(totalGoods)}</div><div class="dc-sub">${totalUnits} units made</div>
    </div>
    <div class="dash-card c-amber" onclick="go('payments')">
      <span class="dc-icon">💸</span><div class="dc-label">Balance Due</div>
      <div class="dc-value amber" style="font-size:20px">${fmt(balanceDue)}</div><div class="dc-sub">${activeOrders} active orders</div>
    </div>
    <div class="dash-card c-blue" onclick="go('att')">
      <span class="dc-icon">👷</span><div class="dc-label">Workers Present</div>
      <div class="dc-value">${present.length}</div><div class="dc-sub">of ${S.lab.length} total</div>
    </div>
    <div class="dash-card c-purple" onclick="go('fgstock')">
      <span class="dc-icon">📦</span><div class="dc-label">Ready to Dispatch</div>
      <div class="dc-value ${packingItems>0?'green':''}">${packingItems}</div><div class="dc-sub">in packing stage</div>
    </div>
    <div class="dash-card c-blue" onclick="go('transfers')">
      <span class="dc-icon">🔄</span><div class="dc-label">Unit 2 Transfers</div>
      <div class="dc-value">${(S.unitTransfers||[]).filter(t=>t.date===todayStr()).length}</div><div class="dc-sub">today · ${(S.unitTransfers||[]).length} total</div>
    </div>` : `
    <div class="dash-card c-blue" onclick="go('att')">
      <span class="dc-icon">👷</span><div class="dc-label">Workers Present</div>
      <div class="dc-value">${present.length}</div><div class="dc-sub">of ${S.lab.length} total</div>
    </div>
    <div class="dash-card c-amber" onclick="go('sup')">
      <span class="dc-icon">🏗️</span><div class="dc-label">Active Teams</div>
      <div class="dc-value">${activeTeams}</div><div class="dc-sub">${S.sessions.length} supervisor${S.sessions.length!==1?'s':''}</div>
    </div>
    <div class="dash-card c-jade" onclick="go('day')">
      <span class="dc-icon">📦</span><div class="dc-label">Units Produced</div>
      <div class="dc-value">${totalUnits}</div><div class="dc-sub">today so far</div>
    </div>
    <div class="dash-card c-purple" onclick="go('fgstock')">
      <span class="dc-icon">✅</span><div class="dc-label">Ready to Dispatch</div>
      <div class="dc-value ${packingItems>0?'green':''}">${packingItems}</div><div class="dc-sub">in packing stage</div>
    </div>`;
  document.getElementById('dash-overview-cards').innerHTML=overviewCards;

  // ── TAB 2: FACTORY ──
  document.getElementById('dash-factory-cards').innerHTML=`
    <div class="dash-card c-amber" onclick="go('sup')">
      <span class="dc-icon">🏗️</span><div class="dc-label">Active Teams</div>
      <div class="dc-value">${activeTeams}</div><div class="dc-sub">${S.sessions.length} supervisor${S.sessions.length!==1?'s':''}</div>
    </div>
    <div class="dash-card c-blue" onclick="go('att')">
      <span class="dc-icon">👷</span><div class="dc-label">Present Today</div>
      <div class="dc-value">${present.length}</div><div class="dc-sub">Labour: ${fmt(totalLab)}</div>
    </div>
    <div class="dash-card c-jade" onclick="go('day')">
      <span class="dc-icon">📦</span><div class="dc-label">Units Produced</div>
      <div class="dc-value">${totalUnits}</div><div class="dc-sub">Value: ${fmt(totalGoods)}</div>
    </div>
    <div class="dash-card c-ember" onclick="go('stock')">
      <span class="dc-icon">🧪</span><div class="dc-label">RM Low Stock</div>
      <div class="dc-value ${rmLow>0?'red':''}">${rmLow}</div><div class="dc-sub">${rmLow>0?'needs reorder':'all OK'}</div>
    </div>
    <div class="dash-card c-purple" onclick="go('fgstock')">
      <span class="dc-icon">📦</span><div class="dc-label">In Packing</div>
      <div class="dc-value ${packingItems>0?'green':''}">${packingItems}</div><div class="dc-sub">ready to dispatch</div>
    </div>
    <div class="dash-card c-amber" onclick="go('raw')">
      <span class="dc-icon">🧪</span><div class="dc-label">RM Issued Today</div>
      <div class="dc-value">${S.rawLog.length}</div><div class="dc-sub">Cost: ${fmt(totalRM)}</div>
    </div>`;

  // Stage flow
  const stageUnits = {};
  STAGES.forEach(s=>{stageUnits[s]=0;});
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>{stageUnits[t.stage]=(stageUnits[t.stage]||0)+p.qty;})));
  document.getElementById('dash-teams').innerHTML = (() => {
    const allTeams = S.sessions.flatMap(ss=>(ss.teams||[]).map(t=>({...t,supName:ss.supName})));
    return allTeams.length ? allTeams.map(t=>{
      const gv=t.production.reduce((a,p)=>a+p.value,0);
      return`<div class="tp">
        <div class="tph">
          <div><span class="tpn">${t.supName}</span>&nbsp;<span class="sp sp${STAGES.indexOf(t.stage)}">${t.stage}</span></div>
          <span style="font-family:var(--mono);font-size:11px;color:var(--jade);font-weight:700">${fmt(gv)}</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:${t.production.length?'5px':'0'}">${t.team.map(m=>m.name).join(', ')||'No workers yet'}</div>
        ${t.production.length?`<div style="font-size:10px;color:var(--jade);font-family:var(--mono)">${t.production.map(p=>p.qty+'× '+p.name).join(' | ')}</div>`:''}
      </div>`;}).join('')
    : '<div style="color:var(--text4);font-size:12px;padding:8px 0">No active teams yet.</div>';
  })();
  document.getElementById('dash-stage-flow').innerHTML = STAGES.map(s=>{
    const u = stageUnits[s]||0;
    return`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px"><span class="sp sp${STAGES.indexOf(s)}">${s}</span></div>
      <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:${u>0?'var(--jade)':'var(--text4)'}">${u} units</div>
    </div>`;}).join('');

  // ── TAB 3: MONEY (Owner only) ──
  if(currentRole==='owner'){
    document.getElementById('dash-money-cards').innerHTML=`
      <div class="dash-card c-jade" onclick="go('day')">
        <span class="dc-icon">💰</span><div class="dc-label">Net Profit Today</div>
        <div class="dc-value ${net>=0?'green':'red'}" style="font-size:20px">${fmt(net)}</div>
        <div class="dc-sub">${totalGoods>0?Math.round(net/totalGoods*100)+'% margin':'no production'}</div>
      </div>
      <div class="dash-card c-blue" onclick="go('month')">
        <span class="dc-icon">📅</span><div class="dc-label">Month Profit</div>
        <div class="dc-value ${monthProfit>=0?'green':'red'}" style="font-size:20px">${fmt(monthProfit)}</div>
        <div class="dc-sub">${monthEntries.length} days this month</div>
      </div>
      <div class="dash-card c-jade" onclick="go('day')">
        <span class="dc-icon">🏭</span><div class="dc-label">Goods Value Today</div>
        <div class="dc-value green" style="font-size:20px">${fmt(totalGoods)}</div>
        <div class="dc-sub">${totalUnits} units</div>
      </div>
      <div class="dash-card c-ember" onclick="go('day')">
        <span class="dc-icon">💸</span><div class="dc-label">Total Cost Today</div>
        <div class="dc-value red" style="font-size:20px">${fmt(totalLab+totalRM)}</div>
        <div class="dc-sub">Labour + RM</div>
      </div>
      <div class="dash-card c-amber" onclick="go('payments')">
        <span class="dc-icon">💳</span><div class="dc-label">Balance Due</div>
        <div class="dc-value amber" style="font-size:20px">${fmt(balanceDue)}</div>
        <div class="dc-sub">${activeOrders} active orders</div>
      </div>
      <div class="dash-card c-blue" onclick="go('att')">
        <span class="dc-icon">👷</span><div class="dc-label">Labour Cost</div>
        <div class="dc-value" style="font-size:20px">${fmt(totalLab)}</div>
        <div class="dc-sub">${present.length} workers present</div>
      </div>`;

    // Recent orders
    const recent=S.orders.slice(0,6);
    document.getElementById('dash-recent-orders').innerHTML=recent.length
      ?recent.map(o=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);gap:8px">
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.customer}${isOverdue(o)?' 🚨':''}</div>
            <div style="font-size:10px;color:var(--text4);font-family:var(--mono)">${o.id} · ${o.status.toUpperCase()}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:12px;font-weight:700;color:var(--text);font-family:var(--mono)">${fmt(o.amount)}</div>
            <div style="font-size:10px;color:var(--ember);font-family:var(--mono)">Bal: ${fmt(o.amount-o.advance)}</div>
          </div>
        </div>`).join('')
      :'<div style="color:var(--text4);font-size:12px;padding:12px 0">No orders yet.</div>';

    // P&L breakdown
    document.getElementById('dash-pnl').innerHTML=`
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--jade-l);border:1px solid var(--jade-b);border-radius:var(--r)">
          <span style="font-size:12px;color:var(--jade)">🏭 Goods Value</span>
          <span style="font-family:var(--mono);font-weight:700;color:var(--jade)">${fmt(totalGoods)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--ember-l);border:1px solid var(--ember-b);border-radius:var(--r)">
          <span style="font-size:12px;color:var(--ember)">👷 Labour Cost</span>
          <span style="font-family:var(--mono);font-weight:700;color:var(--ember)">−${fmt(totalLab)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--ember-l);border:1px solid var(--ember-b);border-radius:var(--r)">
          <span style="font-size:12px;color:var(--ember)">🧪 RM Cost</span>
          <span style="font-family:var(--mono);font-weight:700;color:var(--ember)">−${fmt(totalRM)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:${net>=0?'var(--jade-l)':'var(--ember-l)'};border:1px solid ${net>=0?'var(--jade-b)':'var(--ember-b)'};border-radius:var(--r)">
          <span style="font-size:13px;font-weight:700;color:${net>=0?'var(--jade)':'var(--ember)'}">💰 Net Profit</span>
          <span style="font-family:var(--mono);font-size:16px;font-weight:800;color:${net>=0?'var(--jade)':'var(--ember)'}">${fmt(net)}</span>
        </div>
      </div>`;
  }

  renderTaskBoard();
}
function renderTaskBoard(){
  const el = document.getElementById('dash-task-list');
  if(!el) return;

  const activeOrders = (S.orders||[]).filter(o=>o.status==='pending'||o.status==='production'||o.status==='ready');
  if(!activeOrders.length){
    el.innerHTML='<div style="color:var(--text4);font-size:12px;padding:8px 0">No active orders. Create an order to see tasks here.</div>';
    return;
  }

  // Only count Packing stage production
  const producedToday = {};
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>{
    if(t.stage!=='Packing') return;
    t.production.forEach(p=>{
      const key=(p.baseName||p.name).toLowerCase().trim();
      producedToday[key]=(producedToday[key]||0)+p.qty;
    });
  }));
  S.ledger.forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>{
    if(t.stage!=='Packing') return;
    (t.production||[]).forEach(p=>{
      const key=(p.baseName||p.name).toLowerCase().trim();
      producedToday[key]=(producedToday[key]||0)+p.qty;
    });
  })));
  // Also include existing Packing FG stock
  const packingStock = (S.fgStock&&S.fgStock['Packing'])||{};
  Object.keys(packingStock).forEach(name=>{
    const key=name.toLowerCase().trim();
    producedToday[key]=(producedToday[key]||0)+(packingStock[name]||0);
  });

  el.innerHTML = activeOrders.map(o=>{
    const od = isOverdue(o);
    const dueLabel = o.requiredBy ? new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
    const daysLeft = o.requiredBy ? Math.ceil((new Date(o.requiredBy+'T00:00:00')-new Date())/(1000*60*60*24)) : null;
    const dueColor = od?'var(--ember)':daysLeft!==null&&daysLeft<=3?'#D97706':'var(--text3)';
    // Use fgItems (structured) if available, else parse items string
    const parsedItems = o.fgItems && o.fgItems.length
      ? o.fgItems.map(i=>({name:i.name, qty:i.qty}))
      : (o.items||'').split(/[,\n]/).map(s=>s.trim()).filter(Boolean).map(line=>{
          const m1=line.match(/^(.+?)\s*[xX×]\s*(\d+)\s*$/);
          const m2=line.match(/^(\d+)\s*[xX×]\s*(.+)$/);
          if(m1) return{name:m1[1].trim(),qty:parseInt(m1[2])};
          if(m2) return{name:m2[2].trim(),qty:parseInt(m2[1])};
          return{name:line,qty:null};
        });
    const statusColor=o.status==='ready'?'var(--jade)':o.status==='production'?'var(--blue)':'var(--amber)';
    return`<div style="border:1px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:10px;border-left:3px solid ${statusColor}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text)">${o.customer} <span style="font-family:var(--mono);font-size:9px;color:var(--text4)">${o.id}</span></div>
          <div style="font-size:11px;color:${dueColor};margin-top:2px">📅 Due: ${dueLabel} ${daysLeft!==null?'('+( od?'OVERDUE':(daysLeft===0?'Today':daysLeft+' days left'))+')':''}</div>
        </div>
        <span style="font-size:10px;padding:2px 10px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-family:var(--mono);font-weight:700">${o.status==='ready'?'✅ Ready':o.status==='production'?'🏗️ In Production':'⏳ Pending'}</span>
      </div>
      ${parsedItems.length?`<div style="display:flex;flex-direction:column;gap:4px">${parsedItems.map(item=>{
        const key=item.name.toLowerCase().trim();
        const made=producedToday[key]||0;
        const needed=item.qty||1;
        const done=made>=needed;
        const pct=item.qty?Math.min(100,Math.round((made/needed)*100)):(made>0?100:0);
        return`<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:${done?'var(--jade-l)':'var(--surface2)'}">
          <span style="font-size:16px">${done?'✅':'⬜'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:${done?'600':'400'};color:${done?'var(--jade)':'var(--text)'}">${item.name}</div>
            ${item.qty?`<div style="margin-top:3px;background:var(--border);border-radius:4px;height:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${done?'var(--jade)':'var(--amber)'}"></div></div>`:''}
          </div>
          <div style="font-family:var(--mono);font-size:11px;color:${done?'var(--jade)':'var(--text3)'}">${item.qty?`${made}/${needed}`:(made>0?made+' made':'—')}</div>
        </div>`;
      }).join('')}</div>`:`<div style="font-size:12px;color:var(--text4)">${o.items||'No items'}</div>`}
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        ${o.status==='pending'?`<button class="btn btn-sm" style="background:var(--blue-l);color:var(--blue);border-color:var(--blue-b)" onclick="updateOrderStatus('${o.id}','production')">→ Start Production</button>`:''}
        ${o.status==='production'?`<button class="btn btn-sm" style="background:var(--jade-l);color:var(--jade);border-color:var(--jade-b)" onclick="updateOrderStatus('${o.id}','ready')">→ Mark Ready</button>`:''}
        ${o.status==='ready'?`<button class="btn btn-sm" style="background:var(--surface2);color:var(--text2);border-color:var(--border)" onclick="updateOrderStatus('${o.id}','dispatched')">🚚 Dispatch</button>`:''}
      </div>
    </div>`;
  }).join('');
}


function orderStatusColor(s){return s==='pending'?'#92400E':s==='production'?'#1E40AF':s==='ready'?'#065F46':'#6B7280';}
function orderStatusBg(s){return s==='pending'?'var(--amber-l)':s==='production'?'var(--blue-l)':s==='ready'?'var(--jade-l)':'var(--surface2)';}

// ── FIREBASE ──
// ══════════════════════════════════════════════════════════════════
//  CLOUD SYNC — Supabase   (implementation: src/js/supabase-db.js)
//
//  The function NAMES below are unchanged from the old Firebase layer
//  on purpose: ~40 call sites across app.js keep working untouched.
//  Only the implementation moved.
//
//  Gone, and why:
//    _lastLocalWrite echo guard  — writes are row-level now, no echo
//    30s supervisor poll         — Postgres realtime replaces it
//    de-dup by supId             — sessions are rows, not an array
//    _currentSupDocId            — identity is the auth user, not a
//                                  random id in localStorage
// ══════════════════════════════════════════════════════════════════

let fbEnabled = false;   // true once FactoryDB has initialised
let db = null;           // Supabase client; kept for legacy truthiness checks

// ── TAB VISIBILITY ──
// Background tabs drop the realtime socket. Don't flash "Offline" at the
// user for that — only a genuine network loss sets the error state.
document.addEventListener('visibilitychange', function(){
  if(document.hidden){
    const dot = document.getElementById('sync-status');
    const txt = document.getElementById('sync-text');
    if(dot && !dot.className.includes('err')){
      dot.className = 'sync-dot ok';
      if(txt) txt.textContent = 'Synced';
    }
  } else if(fbEnabled){
    updateSyncDot('syncing');
    FactoryDB.flushOutbox();
    setTimeout(function(){ pushToFirebase(); }, 800);
  }
});

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
  fbEnabled = ok;
  db = ok ? FactoryDB.client() : null;
  window.db = db;
  window.fbEnabled = fbEnabled;
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

// ── "NEW DATA" BADGE FOR THE PRODUCTION SCREEN ──
// Everywhere else a remote change simply re-renders the screen. Production
// cannot: a repaint mid-entry resets the selected team and wipes half-typed
// inputs. So we compare what the screen last drew against what is now in
// state, and if they differ we show a badge that lets the user take the
// update at a moment that suits them.

// Identity of the production data as far as the user can see it. Sessions and
// teams are sorted because the rows come back from Postgres in no guaranteed
// order, and an order change alone must not look like new data.
function prodFingerprint(){
  try{
    return JSON.stringify(
      (S.sessions||[]).slice()
        .sort(function(a,b){ return (a.supId||0)-(b.supId||0); })
        .map(function(ss){
          return [ss.supId, (ss.teams||[]).slice()
            .sort(function(a,b){ return (a.teamId||0)-(b.teamId||0); })
            .map(function(t){
              return [t.teamId, t.stage, (t.team||[]).length,
                      (t.production||[]).map(function(p){
                        return [p.name, p.qty, p.value];
                      })];
            })];
        }));
  }catch(e){ return ''; }
}

var _prodSeen = null;

// Call wherever the user has just been shown the current production state.
// persist() covers every local edit, and go() covers every navigation, so a
// badge can only survive when the change genuinely came from another device.
function markProdSeen(){
  _prodSeen = prodFingerprint();
  var b = document.getElementById('prod-refresh');
  if(b) b.style.display = 'none';
}

function showProdRefresh(){
  var b = document.getElementById('prod-refresh');
  if(!b){
    b = document.createElement('div');
    b.id = 'prod-refresh';
    b.setAttribute('onclick','applyProdRefresh()');
    b.style.cssText =
      'position:fixed;left:50%;transform:translateX(-50%);'+
      'bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:9999;'+
      'display:flex;align-items:center;gap:8px;cursor:pointer;'+
      'padding:10px 16px;border-radius:999px;border:none;'+
      'background:var(--jade,#059669);color:#fff;font-size:13px;font-weight:600;'+
      'box-shadow:0 6px 20px rgba(0,0,0,.22)';
    b.innerHTML = '<span>🔄</span><span>New production data — tap to refresh</span>';
    document.body.appendChild(b);
  }
  b.style.display = 'flex';
}

// Repaint the production screen WITHOUT kicking the user back to the
// supervisor picker, unless the session they were in has gone away remotely.
function applyProdRefresh(){
  var sess = activeSupId !== null &&
             (S.sessions||[]).find(function(ss){ return ss.supId === activeSupId; });
  if(sess) renderSupWork(); else exitSup();
  markProdSeen();
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

// ── ID GENERATION ──
// These ids are bigint PRIMARY KEYs in Postgres and the `onConflict` target
// for raw_log and fg_transfers, so a duplicate silently OVERWRITES another
// row instead of inserting.
//
// The old formula ADDED the random part to the clock
// (`Date.now() + random*99999`), which collapsed the whole id space into a
// ~100s band: an id minted now was indistinguishable from one minted up to
// 99,998 ms earlier with a different draw. A tight loop of 2,000 ids produced
// ~22 collisions.
//
// Shifting instead of adding gives the timestamp its own range, so ids from
// different milliseconds can never collide. 2048 stays inside
// Number.MAX_SAFE_INTEGER until the year 2109 (2^53 / 2048 ms since epoch);
// the multiplier cannot be raised much further without losing integer
// precision. Legacy ids (~1.7e12) sit far below the new range, so old and new
// ids cannot collide either.
//
// 11 bits of pure randomness would still collide inside a single millisecond
// (a bulk Excel import mints hundreds per ms), so the low bits are a counter,
// not a fresh draw:
//   · a new millisecond seeds the counter randomly in the lower half, so two
//     devices logging in the same millisecond start from different offsets;
//   · repeat calls within that millisecond increment, which is collision-free
//     on this device by construction;
//   · overflowing the 2048 slots borrows from the next millisecond rather
//     than wrapping onto an id already issued.
// Ids are therefore strictly increasing per device and never repeat.
// uid() moved to core/state.js.

// ── OVERTIME — single source of truth ──
// OT is paid per hour at (daily wage / 8). `otHours` is the ONLY field
// read here. The legacy `ot` field held a flat rupee-per-day amount and
// is no longer used in any money calculation anywhere in the app.

// fmt / fmtN / todayStr moved to core/format.js.

function sendGet(url, params){
  const fullUrl = url + '?' + params;
  // Script tag is the ONLY method that works 100% cross-origin on ALL browsers
  // including Safari, Edge, Chrome, Firefox, and mobile — no CORS issues ever
  const s = document.createElement('script');
  s.src = fullUrl;
  s.onload = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  s.onerror = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  document.head.appendChild(s);
}

function sendViaImage(url, payload){
  // Split into small chunks — each well under URL limit

  // Chunk 1: Summary row (always tiny)
  const summary = {
    action:'summary',
    date: payload.date,
    workers: payload.workersPresent,
    goods: payload.goodsValue,
    labour: payload.labourCost,
    ot: payload.overtimeCost||0,
    rm: payload.rmCost,
    net: payload.netProfit,
    margin: payload.margin||0
  };
  sendGet(url, 'action=summary&payload=' + encodeURIComponent(JSON.stringify(summary)));

  // Chunk 2: Production log (one request per item)
  (payload.productLog||[]).forEach(function(p, i){
    setTimeout(function(){
      const prod = {action:'prod', date:payload.date, sup:p.supName||'', stage:p.stage||'', name:p.name, qty:p.qty, uv:p.unitVal, val:p.value};
      sendGet(url, 'action=prod&payload=' + encodeURIComponent(JSON.stringify(prod)));
    }, i * 300);
  });

  // Chunk 3: Raw materials (one per item)
  (payload.rawLog||[]).forEach(function(r, i){
    setTimeout(function(){
      const rm = {action:'rm', date:payload.date, stage:r.stage, name:r.name, qty:r.qty, unit:r.unit, up:r.unitPrice, cost:r.cost};
      sendGet(url, 'action=rm&payload=' + encodeURIComponent(JSON.stringify(rm)));
    }, i * 300 + 500);
  });

  // Attendance: NOT synced daily — monthly salary export syncs to Sheets instead

  return Promise.resolve(true);
}



function setSyncStatus(s,t){
  // Called during init before DOM may be ready — guard silently
  try{ updateSyncDot(s==='ok'?'ok':s==='err'?'err':'syncing'); }catch(e){}
}

function updateSyncStatus(){ S.sheetsUrl?setSyncStatus('ok','Connected'):setSyncStatus('','Not connected'); }

function uploadRM(evt){ const f=evt.target.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'binary'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});let n=0;rows.forEach((row,i)=>{if(i===0||!row[0])return;S.rm.push({id:uid(),name:String(row[0]).trim(),unit:String(row[1]||'kg').trim(),price:parseFloat(row[2])||0});n++;});persist();document.getElementById('rm-st').innerHTML=`<div class="gbox">✓ Imported ${n} materials</div>`;renderSetup();}catch(e){document.getElementById('rm-st').innerHTML=`<div class="wbox">Error reading file</div>`;}};r.readAsBinaryString(f);}

function uploadLab(evt){ const f=evt.target.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'binary'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});let n=0;rows.forEach((row,i)=>{if(i===0||!row[0])return;const isSup=String(row[3]||'').toLowerCase().includes('yes');S.lab.push({id:uid(),name:String(row[0]).trim(),role:String(row[1]||'Floor worker').trim(),wage:parseFloat(row[2])||0,isSup,present:false,doingOT:false,otHours:0});n++;});persist();document.getElementById('lab-st').innerHTML=`<div class="gbox">✓ Imported ${n} workers</div>`;renderSetup();}catch(e){document.getElementById('lab-st').innerHTML=`<div class="wbox">Error reading file</div>`;}};r.readAsBinaryString(f);}

function dlSampleRM(){const ws=XLSX.utils.aoa_to_sheet([['Material Name','Unit','Price per Unit (Rs)'],['FRP Resin','kg',220],['Hardener','kg',180],['Gelcoat','kg',310]]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Sheet1');downloadXLSX(wb,'sample_raw_materials.xlsx');}

// No OT column: overtime is paid per hour at (daily wage / 8) and entered
// on the Attendance screen each day, not stored per worker.
function dlSampleLab(){const ws=XLSX.utils.aoa_to_sheet([['Name','Role','Daily Wage (Rs)','Supervisor? (Yes/No)'],['Ramesh Kumar','Floor worker',600,'No'],['Karan Patel','Supervisor',900,'Yes']]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Sheet1');downloadXLSX(wb,'sample_labour.xlsx');}

function renderSetup(){
  const q=(document.getElementById('fg-search')?.value||'').toLowerCase();
  document.getElementById('tb-rm').innerHTML=S.rm.map((r,i)=>`<tr><td style="color:var(--fog)">${i+1}</td><td style="font-weight:500;color:#111827">${r.name}</td><td style="color:var(--dust)">${r.unit}</td><td class="num">${fmtN(r.price)}</td><td><button class="btn btn-ember btn-xs" onclick="delRM(${r.id})">✕</button></td></tr>`).join('');
  document.getElementById('tb-fg').innerHTML=S.fg.filter(f=>!q||f.name.toLowerCase().includes(q)).map((f,i)=>`<tr><td style="color:var(--fog)">${i+1}</td><td style="font-weight:500;color:#111827">${f.name}</td><td class="num" style="color:var(--fog)">${f.id}</td><td class="num">${fmtN(f.price)}</td><td><button class="btn btn-ember btn-xs" onclick="delFG(${f.id})">✕</button></td></tr>`).join('');
  document.getElementById('tb-lab').innerHTML=S.lab.map((l,i)=>`<tr><td style="color:var(--fog)">${i+1}</td><td style="font-weight:500;color:#111827">${l.name}</td><td style="color:var(--dust)">${l.role}</td><td class="num">${fmtN(l.wage)}</td><td class="num">${l.otHours?l.otHours+'h':'—'}</td><td>${l.isSup?'<span class="badge b-sup">SUP</span>':''}</td><td><button class="btn btn-ember btn-xs" onclick="delLab(${l.id})">✕</button></td></tr>`).join('');
}

function addRM(){const n=document.getElementById('rm-n').value.trim();const u=document.getElementById('rm-u').value;const p=parseFloat(document.getElementById('rm-p').value)||0;if(!n||!p){alert('Enter name and price.');return;}S.rm.push({id:uid(),name:n,unit:u,price:p});document.getElementById('rm-n').value='';document.getElementById('rm-p').value='';persist();renderSetup();}

function delRM(id){S.rm=S.rm.filter(r=>r.id!==id);persist();renderSetup();}

function addFG(){const n=document.getElementById('fg-n').value.trim();const p=parseFloat(document.getElementById('fg-p').value)||0;if(!n||!p){alert('Enter product name and price.');return;}S.fg.push({id:uid(),name:n,price:p});document.getElementById('fg-n').value='';document.getElementById('fg-p').value='';persist();renderSetup();}

function delFG(id){S.fg=S.fg.filter(f=>f.id!==id);persist();renderSetup();}

function addLab(){const n=document.getElementById('lab-n').value.trim();const r=document.getElementById('lab-r').value;const w=parseFloat(document.getElementById('lab-w').value)||0;const ot=parseFloat(document.getElementById('lab-ot').value)||0;const s=document.getElementById('lab-s').value==='1';if(!n||!w){alert('Enter name and wage.');return;}S.lab.push({id:uid(),name:n,role:r,wage:w,isSup:s,present:false,doingOT:false,otHours:0});document.getElementById('lab-n').value='';document.getElementById('lab-w').value='';document.getElementById('lab-ot').value='';persist();renderSetup();}

function delLab(id){S.lab=S.lab.filter(l=>l.id!==id);persist();renderSetup();}

function renderSheets(){
  const urlEl=document.getElementById('sheets-url');
  if(urlEl) urlEl.value=S.sheetsUrl||'';
  const codeEl=document.getElementById('apps-script-code');
  if(codeEl) codeEl.value=APPS_SCRIPT_CODE;
  updateSyncStatus();
  const badge=document.getElementById('fb-status-badge');
  if(badge){
    if(fbEnabled){badge.textContent='✓ Connected';badge.style.background='var(--jade-l)';badge.style.color='var(--jade)';badge.style.borderColor='var(--jade-b)';}
    else{badge.textContent='Not connected';badge.style.background='var(--surface2)';badge.style.color='var(--text4)';}
  }
}

function saveUrl(){S.sheetsUrl=document.getElementById('sheets-url').value.trim();persist();updateSyncStatus();}

function testConnection(){
  const url=S.sheetsUrl;
  if(!url){document.getElementById('conn-result').innerHTML=`<div class="wbox">Paste Web App URL first.</div>`;return;}
  if(!url.includes('script.google.com/macros/s/')){document.getElementById('conn-result').innerHTML=`<div class="wbox">⚠ Wrong URL — must contain script.google.com/macros/s/</div>`;return;}
  setSyncStatus('syncing','Sending...');
  document.getElementById('conn-result').innerHTML=`<div class="ibox">⏳ Sending test row...</div>`;
  // Send a tiny test summary — guaranteed to fit in URL
  const testSummary = {action:'summary',date:'TEST-'+todayStr(),workers:1,goods:999,labour:111,ot:0,rm:222,net:666,margin:66};
  sendGet(url, 'action=summary&payload='+encodeURIComponent(JSON.stringify(testSummary)));
  setSyncStatus('ok','Connected ✓');
  document.getElementById('conn-result').innerHTML=`<div class="gbox"><b>✓ Test sent!</b><br><br>Check your Google Sheet — look for a row with date <b>TEST-${todayStr()}</b> in the Daily Ledger tab.<br>If it appears → <b>fully connected!</b></div>`;
}

function copyScript(){
  const ta=document.getElementById('apps-script-code');ta.select();document.execCommand('copy');
  const c=document.getElementById('copy-confirm');c.style.display='inline';
  setTimeout(()=>c.style.display='none',2000);
}

let activeAttTab = 'attendance';

function switchAttTab(tab){
  activeAttTab = tab;
  document.getElementById('att-tab-attendance').style.display = tab==='attendance' ? 'block' : 'none';
  document.getElementById('att-tab-ot').style.display = tab==='ot' ? 'block' : 'none';
  document.querySelectorAll('#att-tabs .tab').forEach((t,i)=>{
    t.classList.toggle('active', (i===0&&tab==='attendance')||(i===1&&tab==='ot'));
  });
  if(tab==='ot') renderOTTab();
}

function renderAtt(){
  const d=document.getElementById('work-date');
  // DISPLAY the working date — do not overwrite it. This used to assign
  // todayStr() on every render, which silently undid Save Day: saveDay()
  // advances workDate to the next day and then navigates here, and this
  // line reset it to the calendar date. Overnight rollover is handled by
  // checkDayRollover(), which correctly leaves unsaved days alone.
  d.value=S.workDate||todayStr();
  if(!S.lab.length){
    document.getElementById('att-grid').innerHTML='<div style="color:var(--text4)">No workers. Add in Setup.</div>';
    updAttMet();return;
  }
  document.getElementById('att-grid').innerHTML=S.lab.map(l=>`
    <div class="wc ${l.present?'present':'absent'}" onclick="togAtt(${l.id})">
      <div>
        <div class="wn">${l.name}${l.isSup?' ⭐':''}</div>
        <div class="ws">${l.role} · ₹${l.wage}/day</div>
      </div>
      <div style="font-size:16px;font-weight:700;color:${l.present?'var(--jade)':'var(--ember)'}">${l.present?'✓':'✗'}</div>
    </div>`).join('');
  updAttMet();
  if(activeAttTab==='ot') renderOTTab();
}

function renderOTTab(){
  const present = S.lab.filter(l=>l.present);
  const otEl = document.getElementById('ot-grid');
  if(!otEl) return;
  if(!present.length){
    otEl.innerHTML='<div style="color:var(--text4);font-size:12px;padding:12px 0">No present workers. Mark attendance first.</div>';
    return;
  }
  let totalOT = 0;
  present.forEach(l=>{ totalOT += calcOT(l); });
  const otDisp = document.getElementById('ot-total-display');
  if(otDisp) otDisp.textContent = 'Total OT: ₹'+totalOT.toLocaleString('en-IN');

  otEl.innerHTML = `<table class="tbl" style="width:100%">
    <thead><tr>
      <th>Worker</th><th>Role</th><th class="num">Daily Wage</th>
      <th class="num">OT Hours</th><th class="num">OT Pay</th><th>Mark OT</th>
    </tr></thead>
    <tbody>${present.map(l=>{
      const hrs = l.otHours||0;
      const otPay = calcOT(l);
      return`<tr style="${l.doingOT?'background:var(--amber-l)':''}">
        <td style="font-weight:600">${l.name}${l.isSup?' ⭐':''}</td>
        <td style="color:var(--text3);font-size:11px">${l.role}</td>
        <td class="num">₹${l.wage}</td>
        <td class="num">
          <input type="number" value="${hrs}" min="0" max="12" step="0.5"
            onchange="setOTHours(${l.id},this.value)"
            style="width:60px;padding:4px 7px;border:1px solid var(--border);border-radius:5px;text-align:right;font-size:12px;background:var(--surface2)">
          hrs
        </td>
        <td class="num" style="font-weight:700;color:${otPay>0?'var(--amber)':'var(--text4)'}">
          ${otPay>0?'₹'+otPay.toLocaleString('en-IN'):'—'}
        </td>
        <td>
          <button class="btn btn-sm ${l.doingOT?'btn-amber':'btn-jade'}" onclick="togOT(${l.id})">
            ${l.doingOT?'✓ OT':'Mark OT'}
          </button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

function setOTHours(id, val){
  const l = S.lab.find(x=>x.id===id);
  if(!l) return;
  l.otHours = parseFloat(val)||0;
  if(l.otHours > 0) l.doingOT = true;
  else l.doingOT = false;
  persist();
  renderOTTab();
  updAttMet();
}

function togAtt(id){const l=S.lab.find(l=>l.id===id);l.present^=1;if(!l.present){l.doingOT=false;l.otHours=0;}persist();renderAtt();if(typeof pushAttendanceLive==="function")pushAttendanceLive();}

function togOT(id){
  const l=S.lab.find(l=>l.id===id);
  if(!l) return;
  l.doingOT^=1;
  if(!l.doingOT) l.otHours=0;
  persist();
  renderOTTab();
  updAttMet();
}

function markAll(v){S.lab.forEach(l=>{l.present=!!v;if(!v){l.doingOT=false;l.otHours=0;}});persist();renderAtt();if(typeof pushAttendanceLive==="function")pushAttendanceLive();}

function updAttMet(){
  const p=S.lab.filter(l=>l.present);
  const bw=p.reduce((a,l)=>a+l.wage,0);
  const ot=p.reduce((a,l)=>a+calcOT(l),0);
  document.getElementById('a-tot').textContent=S.lab.length;
  document.getElementById('a-pres').textContent=p.length;
  document.getElementById('a-abs').textContent=S.lab.length-p.length;
  document.getElementById('a-wage').textContent=fmt(bw);
  document.getElementById('a-ot').textContent=fmt(ot);
  document.getElementById('a-total-lab').textContent=fmt(bw+ot);
}

// ── SESSION SHAPE — read every session through these ──
// Sessions have carried teams[] since the multi-team rework. enterSup()
// migrates a legacy single-team session when it is OPENED, but screens also
// render sessions nobody has opened — one logged on another device, most
// importantly. Reading ss.team / ss.production directly therefore throws on
// every current-shape session. That killed the active-session list on the
// Production screen and the whole Raw Material screen, both of which looked
// like "the sync is broken" rather than a render crash.

function renderSupLogin(){
  // Show pending/in-production orders as task list for supervisors
  const ob = document.getElementById('sup-orders-banner');
  if(ob){
    const activeOrds = (S.orders||[]).filter(o=>o.status==='pending'||o.status==='production');
    if(activeOrds.length){
      ob.innerHTML=`<div class="card" style="border-left:3px solid var(--amber);margin-bottom:16px">
        <div class="ch"><div class="ct">📋 Orders to Produce (${activeOrds.length})</div></div>
        ${activeOrds.map(o=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:6px">
          <div>
            <div style="font-weight:600;font-size:13px">${o.customer} <span style="font-family:var(--mono);font-size:9px;color:var(--text4)">${o.id}</span></div>
            <div style="font-size:12px;color:var(--text3)">${o.items||'—'} ${o.requiredBy?' · Due: '+new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</div>
          </div>
          <span style="font-size:10px;padding:2px 10px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${o.status==='production'?'var(--blue-l)':'var(--amber-l)'};color:${o.status==='production'?'#1E40AF':'#92400E'}">${o.status==='production'?'IN PRODUCTION':'PENDING'}</span>
        </div>`).join('')}
      </div>`;
    } else {
      ob.innerHTML='';
    }
  }
  const sups=S.lab.filter(l=>l.isSup&&l.present);
  const g=document.getElementById('sup-cards');
  if(!sups.length){g.innerHTML='<div class="wbox">No supervisors marked present. Go to Attendance first.</div>';document.getElementById('sup-sess-list').innerHTML='';return;}
  g.innerHTML=sups.map(s=>{const h=!!S.sessions.find(ss=>ss.supId===s.id);return`<div class="sc ${h?'has-s':''}" onclick="enterSup(${s.id})"><div class="sc-ic">👷</div><div class="sc-nm">${s.name}</div><div class="sc-rl">${s.role} · ${fmt(s.wage)}/day</div><div class="sc-st" style="color:${h?'var(--jade)':'var(--fog)'}">${h?'✓ Session active':'Tap to start'}</div></div>`;}).join('');
  const sl=document.getElementById('sup-sess-list');
  if(!S.sessions.length){sl.innerHTML='<div style="color:#6B7280;font-size:12px">No active sessions yet.</div>';return;}
  sl.innerHTML=S.sessions.map(ss=>{
    const teams   = sessionTeams(ss);
    const members = sessionMembers(ss);
    const prod    = sessionProduction(ss);
    const lc      = members.reduce((a,m)=>a+(m.wage||0),0)+(ss.supWage||0);
    const gv      = prod.reduce((a,p)=>a+(p.value||0),0);
    const stages  = [...new Set(teams.map(t=>t.stage).filter(Boolean))];
    return`<div class="tp"><div class="tph"><div><span class="tpn">${ss.supName}</span>&nbsp;${stages.map(spBadge).join(' ')}</div><div style="display:flex;gap:6px;align-items:center"><span style="font-family:var(--mono);font-size:10px;color:var(--dust)">${members.length} workers · ${fmt(lc)}/day</span><button class="btn btn-ember btn-xs" onclick="delSess(${ss.supId})">✕</button></div></div><div style="font-size:11px;color:var(--dust)">Team: ${members.map(m=>m.name).join(', ')||'—'}</div>${prod.length?`<div style="font-size:11px;color:var(--jade);margin-top:4px;font-family:var(--mono)">Produced: ${prod.map(p=>`${p.qty}× ${p.name}`).join(' | ')} = ${fmt(gv)}</div>`:'<div style="font-size:11px;color:var(--fog);margin-top:4px">No production logged yet</div>'}</div>`;}).join('');
}

function delSess(id){
  if(!confirm('Remove this supervisor session?')) return;
  S.sessions=S.sessions.filter(ss=>ss.supId!==id);
  persist();renderSupLogin();
}

function enterSup(supId){
  const sup=S.lab.find(l=>l.id===supId);activeSupId=supId;
  let sess=S.sessions.find(ss=>ss.supId===supId);
  if(!sess){
    sess={supId,supName:sup.name,supWage:sup.wage,supOT:calcOT(sup),teams:[]};
    S.sessions.push(sess);
  }
  // Migrate old format sessions
  if(sess.team!==undefined&&sess.teams===undefined){
    sess.teams=[{teamId:1,stage:sess.stage||'Moulding',team:sess.team||[],production:sess.production||[]}];
    delete sess.team; delete sess.stage; delete sess.production;
  }
  document.getElementById('sup-login').style.display='none';
  document.getElementById('sup-work').style.display='block';
  document.getElementById('sw-name').textContent=sup.name;
  document.getElementById('sw-meta').textContent=sup.role+' · '+fmt(sup.wage)+'/day'+(sup.doingOT?` + ${fmt(calcOT(sup))} OT`:'');
  activeTeamId=null;
  renderSupWork();
}

function renderSupWork(){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess) return;
  if(!sess.teams) sess.teams=[];

  // If no team selected yet, show team overview
  if(activeTeamId===null){
    renderSupTeamOverview(sess);
    return;
  }

  // Show specific team work screen
  const team=sess.teams.find(t=>t.teamId===activeTeamId);
  if(!team){ activeTeamId=null; renderSupWork(); return; }
  renderSupTeamWork(sess, team);
}

function renderSupTeamOverview(sess){
  const totalGoods=sess.teams.reduce((a,t)=>a+t.production.reduce((b,p)=>b+p.value,0),0);
  const totalMembers=sess.teams.reduce((a,t)=>a+t.team.length,0);

  document.getElementById('sw-name').textContent=sess.supName;

  // Build overview HTML
  let html2=`<div style="margin-bottom:14px">
    <div class="mrow">
      <div class="met m-blue"><div class="ml">Teams</div><div class="mv w">${sess.teams.length}</div></div>
      <div class="met m-blue"><div class="ml">Workers</div><div class="mv w">${totalMembers}</div></div>
      <div class="met m-green"><div class="ml">Total Goods</div><div class="mv g">${fmt(totalGoods)}</div></div>
    </div>
  </div>`;

  if(sess.teams.length===0){
    html2+=`<div class="ibox">No teams yet. Click <b>+ Add New Team</b> to create your first team.</div>`;
  } else {
    html2+=sess.teams.map(t=>{
      const gv=t.production.reduce((a,p)=>a+p.value,0);
      const lc=t.team.reduce((a,m)=>a+m.wage,0);
      return`<div class="card" style="border-left:3px solid #F59E0B;cursor:pointer" onclick="selectTeam(${t.teamId})">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-family:var(--display);font-size:15px;font-weight:700;color:#111827">Team ${t.teamId}</span>
              <span class="sp ${SPC[STAGES.indexOf(t.stage)]}">${t.stage}</span>
            </div>
            <div style="font-size:12px;color:#6B7280">${t.team.length} workers: ${t.team.map(m=>m.name).join(', ')||'No workers yet'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:#065F46">${fmt(gv)}</div>
            <div style="font-size:10px;color:#9CA3AF">${t.production.length} item${t.production.length!==1?'s':''} logged</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-amber btn-sm" onclick="event.stopPropagation();selectTeam(${t.teamId})">✏️ Edit Team ${t.teamId}</button>
          <button class="btn btn-ember btn-xs" onclick="event.stopPropagation();deleteTeam(${t.teamId})">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  html2+=`<div style="margin-top:12px"><button class="btn btn-amber" onclick="addNewTeam()">+ Add New Team</button></div>`;

  document.getElementById('sw-overview').innerHTML=html2;
  document.getElementById('sw-overview').style.display='block';
  document.getElementById('sw-teamwork').style.display='none';
}

function addNewTeam(){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess) return;
  const newId=(sess.teams.length>0?Math.max(...sess.teams.map(t=>t.teamId)):0)+1;
  sess.teams.push({teamId:newId, stage:'Moulding', team:[], production:[]});
  persist();
  activeTeamId=newId;
  renderSupWork();
}

function selectTeam(teamId){
  activeTeamId=teamId;
  renderSupWork();
}

function deleteTeam(teamId){
  if(!confirm('Delete Team '+teamId+'? All production logged by this team will be lost.')) return;
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(sess) sess.teams=sess.teams.filter(t=>t.teamId!==teamId);
  persist();
  activeTeamId=null;
  renderSupWork();
}

function renderSupTeamWork(sess, team){
  document.getElementById('sw-overview').style.display='none';
  document.getElementById('sw-teamwork').style.display='block';
  // Show stage tabs
  document.getElementById('sw-stages').innerHTML=STAGES.map(s=>
    `<div class="tab ${team.stage===s?'active':''}" onclick="swStage('${s}')">${s}</div>`).join('');
  // Show colour field only for Painting stage
  const cfld=document.getElementById('sw-color-field');
  if(cfld){
    cfld.style.display=(team.stage==='Painting')?'block':'none';
    if(team.stage!=='Painting'){const cv=document.getElementById('sw-color-val');if(cv)cv.value='';}
  }

  // Labour cost
  const lc=team.team.reduce((a,m)=>a+m.wage,0)+(team.team.reduce((a,m)=>a+calcOT(m),0));
  document.getElementById('sw-lab-cost').textContent=team.team.length?`Team ${team.teamId} Labour: ${fmt(lc)}/day`:'';

  // Back button in team section
  const myTeam=new Set(team.team.map(m=>m.id));
  const otherAssigned=new Set(S.sessions.flatMap(ss=>ss.teams.flatMap(t=>t.teamId!==team.teamId||ss.supId!==activeSupId?t.team.map(m=>m.id):[])));
  const pool=S.lab.filter(l=>l.present&&!l.isSup&&!otherAssigned.has(l.id));

  document.getElementById('sw-team').innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <button class="btn btn-sm" onclick="activeTeamId=null;renderSupWork()">← All Teams</button>
      <span style="font-family:var(--display);font-size:14px;font-weight:700;color:#111827">Team ${team.teamId}</span>
      <span class="sp ${SPC[STAGES.indexOf(team.stage)]}">${team.stage}</span>
    </div>
    ${team.team.length?`<div style="display:flex;flex-wrap:wrap;gap:6px">${team.team.map(m=>`
      <div class="wc inteam" onclick="swTogTeam(${m.id})" style="cursor:pointer">
        <div><div class="wn">${m.name}</div><div class="ws">${fmt(m.wage)}/day${m.doingOT?' ⏰':''}</div></div>
        <div style="color:#EF4444;font-size:13px">−</div>
      </div>`).join('')}</div>`:'<div style="font-size:12px;color:#9CA3AF">Tap workers below to add to Team '+team.teamId+'.</div>'}`;

  document.getElementById('sw-pool').innerHTML=pool.length
    ?pool.map(l=>`<div class="wc ${myTeam.has(l.id)?'inteam':'present'}" onclick="swTogTeam(${l.id})">
      <div><div class="wn">${l.name}</div><div class="ws">${l.role} · ${fmt(l.wage)}${l.doingOT?' ⏰':''}</div></div>
      <div style="font-size:13px">${myTeam.has(l.id)?'−':'+'}</div>
    </div>`).join('')
    :'<div style="font-size:12px;color:#9CA3AF">No available workers.</div>';

  // Show prod form
  const prodForm=document.querySelector('.fg.fg5');
  if(prodForm) prodForm.style.display='grid';

  // Product dropdown - populate with ALL products sorted by name
  const sel=document.getElementById('sw-prod');
  const cur=sel.value;
  const q=document.getElementById('fg-search')?.value?.toLowerCase()||'';
  sel.innerHTML='<option value="">— select product —</option>'+
    S.fg.map(f=>`<option value="${f.id}" data-price="${f.price}">[#${f.id}] ${f.name} — ${fmt(f.price)}</option>`).join('');
  if(cur) sel.value=cur;

  // Add live search for product dropdown
  const prodCard=document.getElementById('sw-prod')?.closest('.card');
  if(prodCard&&!prodCard.querySelector('#sw-prod-search')){
    const searchInput=document.createElement('input');
    searchInput.id='sw-prod-search';
    searchInput.type='text';
    searchInput.placeholder='🔍 Search products...';
    searchInput.style.cssText='width:100%;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;color:#111827;padding:7px 10px;font-family:var(--body);font-size:12px;margin-bottom:8px;outline:none';
    searchInput.oninput=function(){
      const q=this.value.toLowerCase();
      const sel=document.getElementById('sw-prod');
      sel.innerHTML='<option value="">— select product —</option>'+
        S.fg.filter(f=>!q||f.name.toLowerCase().includes(q)).map(f=>`<option value="${f.id}" data-price="${f.price}">[#${f.id}] ${f.name} — ${fmt(f.price)}</option>`).join('');
    };
    sel.parentNode.insertBefore(searchInput, sel);
  }

  // Production table
  const pt=document.getElementById('sw-prod-tbl');
  if(!team.production.length){pt.innerHTML='';return;}
  const tv=team.production.reduce((a,p)=>a+p.value,0);
  const lc2=team.team.reduce((a,m)=>a+m.wage,0)+team.team.reduce((a,m)=>a+calcOT(m),0);
  pt.innerHTML=`<table class="tbl"><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Wt/pc</th><th class="num">Total Wt</th><th class="num">₹/kg</th><th class="num">₹/unit</th><th class="num">Total</th><th></th></tr></thead>
  <tbody>${team.production.map((p,i)=>{const wt=p.weightPerPc||0;const tw=p.totalWeight||0;const rpkg=wt>0?Math.round(p.unitVal/wt):0;
    return`<tr><td style="font-weight:500;color:#111827">${p.name}</td><td class="num">${p.qty}</td><td class="num">${wt||'—'}</td><td class="num">${tw?fmtN(tw)+' kg':'—'}</td><td class="num" style="color:#B45309">${rpkg?fmt(rpkg):'—'}</td><td class="num">${fmtN(p.unitVal)}</td><td class="num">${fmtN(p.value)}</td><td><button class="btn btn-ember btn-xs" onclick="delProd(${i})">✕</button></td></tr>`;}).join('')}
  </tbody></table>
  <div style="display:flex;justify-content:flex-end;gap:16px;font-family:var(--mono);font-size:11px;margin-top:9px;padding-top:9px;border-top:1px solid #F3F4F6">
    <span>Goods: <span style="color:#065F46">${fmt(tv)}</span></span>
    <span>Labour: <span style="color:#B91C1C">${fmt(lc2)}</span></span>
    <span>Net: <span style="color:${tv-lc2>=0?'#065F46':'#B91C1C'}">${fmt(tv-lc2)}</span></span>
  </div>`;
}

function swStage(s){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(sess&&activeTeamId!==null){
    const team=sess.teams.find(t=>t.teamId===activeTeamId);
    if(team){team.stage=s;persist();}
  }
  renderSupWork();
}

function swTogTeam(id){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess||activeTeamId===null) return;
  const team=sess.teams.find(t=>t.teamId===activeTeamId);
  if(!team) return;
  const idx=team.team.findIndex(m=>m.id===id);
  if(idx>=0) team.team.splice(idx,1);
  else team.team.push(S.lab.find(l=>l.id===id));
  persist();renderSupWork();
}

function swFill(){const sel=document.getElementById('sw-prod');const opt=sel.options[sel.selectedIndex];const p=opt?.dataset?.price||'';document.getElementById('sw-price').value=p;document.getElementById('sw-ph').textContent=p?`Catalogue: ${fmt(parseFloat(p))}/unit`:''}

function logProd(){
  let sess=S.sessions.find(ss=>ss.supId===activeSupId);
  // Self-heal: if a background sync wiped the session while this screen was open, rebuild it
  if(!sess && activeSupId){
    const sup=S.lab.find(l=>l.id===activeSupId);
    sess={supId:activeSupId,supName:sup?sup.name:'',date:S.workDate||todayStr(),teams:[]};
    S.sessions.push(sess);
  }
  if(!sess){alert('Please select a team first.');return;}
  if(!sess.teams) sess.teams=[];
  let team=(activeTeamId!==null)?sess.teams.find(t=>t.teamId===activeTeamId):null;
  // If the selected team vanished but exactly one team exists, use it; if none exist, rebuild from the on-screen UI state
  if(!team && sess.teams.length===1){team=sess.teams[0];activeTeamId=team.teamId;}
  if(!team){
    team={teamId:(sess.teams.reduce((m,t)=>Math.max(m,t.teamId||0),0)+1),stage:'Moulding',team:[],production:[]};
    sess.teams.push(team);activeTeamId=team.teamId;
  }
  const sel=document.getElementById('sw-prod');
  const fg=S.fg.find(f=>f.id===parseInt(sel.value));
  const qty=parseFloat(document.getElementById('sw-qty').value)||0;
  const uv=parseFloat(document.getElementById('sw-price').value)||0;
  const wt=parseFloat(document.getElementById('sw-weight')?.value)||0;
  if(!fg||!qty||!uv){alert('Select a product and enter quantity.');return;}

  const currentStage = team.stage||'Moulding';

  // Colour — optional text field shown only for Painting stage
  let colour = '';
  if(currentStage==='Painting'){
    colour = (document.getElementById('sw-color-val')?.value||'').trim();
  }

  // Product name: "Garden Pot L — Orange" for Painting, normal for others
  const prodName = (currentStage==='Painting' && colour) ? fg.name+' — '+colour : fg.name;

  // Auto-transfer from previous stage
  const PREV_STAGE = {Finishing:'Moulding',Painting:'Finishing',Packing:'Painting'};
  const prevStage = PREV_STAGE[currentStage];

  if(prevStage){
    if(!S.fgTransfers) S.fgTransfers=[];
    // For Painting, check against the base product name (without colour) in Finishing
    const checkName = currentStage==='Painting' ? fg.name : prodName;
    const available = getFGBalance(checkName, prevStage);
    if(available < qty){
      const proceed = confirm('Only '+available+' in '+prevStage+'. Produce '+qty+' in '+currentStage+'?');
      if(!proceed) return;
    }
    S.fgTransfers.push({
      id:uid(), date:S.workDate||todayStr(),
      from:prevStage, to:currentStage,
      product:checkName,
      productOut: checkName,
      productIn: prodName,
      qty:qty,
      note:'Auto — '+sess.supName+' (Team '+team.teamId+')'+(colour?' → '+colour:''),
      auto:true, colour:colour
    });
    const badge=document.getElementById('sw-transfer-badge');
    if(badge){
      badge.textContent='✓ Auto-transferred: −'+qty+' '+checkName+' from '+prevStage+' → +'+qty+' '+prodName+' in '+currentStage;
      badge.style.display='block';
      setTimeout(()=>badge.style.display='none',5000);
    }
  }

  team.production.push({
    name:prodName, baseName:fg.name, colour:colour,
    qty,unitVal:uv,value:qty*uv,weightPerPc:wt,totalWeight:wt*qty
  });

  // If Packing stage — offer to assign to order
  if(currentStage==='Packing'){
    const packingQty = qty;
    const packingProd = prodName;
    setTimeout(()=>{
      if(confirm(`✓ Logged ${qty}× ${prodName} in Packing.\n\nAssign to a customer order now?`)){
        openAssignModal(packingProd, getFGBalance(packingProd,'Packing'), 'sup');
      }
    }, 300);
  }

  // Reset fields
  document.getElementById('sw-qty').value='';
  if(document.getElementById('sw-weight')) document.getElementById('sw-weight').value='';
  if(document.getElementById('sw-color-val')) document.getElementById('sw-color-val').value='';
  persist();
  renderSupWork();
}

function delProd(i){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess||activeTeamId===null) return;
  const team=sess.teams.find(t=>t.teamId===activeTeamId);
  if(team){team.production.splice(i,1);persist();renderSupWork();}
}

function saveSup(){
  activeTeamId=null;
  persist();
  alert('All teams saved ✓');
  exitSup();
}

function exitSup(){
  activeSupId=null;
  activeTeamId=null;
  document.getElementById('sup-login').style.display='block';
  document.getElementById('sup-work').style.display='none';
  renderSupLogin();
}

function updateColorFieldVisibility(){
  const sess = S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess) return;
  const team = sess.teams ? sess.teams.find(t=>t.teamId===activeTeamId) : null;
  const stage = team ? team.stage : (sess.stage||'Moulding');
  const colorField = document.getElementById('sw-color-field');
  if(colorField){
    colorField.style.display = stage==='Painting' ? 'block' : 'none';
    if(stage!=='Painting'){
      const cv = document.getElementById('sw-color-val');
      if(cv) cv.value='';
    }
  }
}

function renderRaw(){
  const ms=document.getElementById('raw-mat');ms.innerHTML='<option value="">— select —</option>'+S.rm.map(r=>`<option value="${r.id}" data-price="${r.price}" data-unit="${r.unit}">${r.name} (${r.unit})</option>`).join('');
  renderRawLog();renderRawPnL();
}

function rawFill(){const ms=document.getElementById('raw-mat');const opt=ms.options[ms.selectedIndex];if(!opt||!opt.value)return;const price=parseFloat(opt.dataset.price)||0;const unit=opt.dataset.unit||'';const qty=parseFloat(document.getElementById('raw-qty').value)||1;document.getElementById('raw-cost').value=Math.round(price*qty);document.getElementById('raw-hint').textContent=`₹${fmtN(price)}/${unit}`;}

function issueRaw(){const stg=document.getElementById('raw-stg').value;const ms=document.getElementById('raw-mat');const opt=ms.options[ms.selectedIndex];if(!opt||!opt.value){alert('Select a material.');return;}const rm=S.rm.find(r=>r.id===parseInt(opt.value));const qty=parseFloat(document.getElementById('raw-qty').value)||0;const cost=parseFloat(document.getElementById('raw-cost').value)||0;if(!qty||!cost){alert('Enter quantity.');return;}S.rawLog.push({id:uid(),stage:stg,name:rm.name,unit:rm.unit,qty,unitPrice:rm.price,cost});document.getElementById('raw-qty').value='';document.getElementById('raw-cost').value='';persist();renderRawLog();renderRawPnL();}

function delRaw(id){S.rawLog=S.rawLog.filter(r=>r.id!==id);persist();renderRawLog();renderRawPnL();}

function renderRawLog(){const el=document.getElementById('raw-log');if(!S.rawLog.length){el.innerHTML='<div style="color:#6B7280;font-size:12px">Nothing issued yet.</div>';return;}el.innerHTML=`<table class="tbl"><thead><tr><th>Stage</th><th>Material</th><th class="num">Qty</th><th class="num">₹/unit</th><th class="num">Total</th><th></th></tr></thead><tbody>${S.rawLog.map(r=>`<tr><td>${spBadge(r.stage)}</td><td style="font-weight:500;color:#111827">${r.name}</td><td class="num">${r.qty} ${r.unit}</td><td class="num">${fmtN(r.unitPrice)}</td><td class="num">${fmtN(r.cost)}</td><td><button class="btn btn-ember btn-xs" onclick="delRaw(${r.id})">✕</button></td></tr>`).join('')}</tbody></table>`;}

function renderRawPnL(){const t=S.rawLog.reduce((a,r)=>a+r.cost,0);const g=S.sessions.reduce((a,ss)=>a+sessionProduction(ss).reduce((b,p)=>b+(p.value||0),0),0);const profit=g-t;document.getElementById('raw-pnl').innerHTML=`<div class="mrow"><div class="met m-blue"><div class="ml">All Goods</div><div class="mv w">${fmt(g)}</div></div><div class="met m-red"><div class="ml">RM Cost</div><div class="mv r">${fmt(t)}</div></div><div class="met ${profit>=0?'m-green':'m-red'}"><div class="ml">RM Supervisor Net</div><div class="mv ${profit>=0?'g':'r'}">${fmt(profit)}</div></div></div>`;}

function renderDay(){
  const d=new Date(S.workDate+'T00:00:00');
  document.getElementById('day-title').innerHTML=d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}).replace(/,/,',')+'&nbsp;<span style="color:var(--amber)">'+d.getFullYear()+'</span>';
  const present=S.lab.filter(l=>l.present);
  const bw=present.reduce((a,l)=>a+l.wage,0);
  const ot=present.reduce((a,l)=>a+calcOT(l),0);
  const totalLab=bw+ot;
  const totalGoods=S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  const totalRM=S.rawLog.reduce((a,r)=>a+r.cost,0);const net=totalGoods-totalLab-totalRM;const margin=totalGoods?Math.round(net/totalGoods*100):0;
  document.getElementById('day-met').innerHTML=`<div class="met m-blue"><div class="ml">Present</div><div class="mv w">${present.length}</div></div><div class="met m-green"><div class="ml">Goods Value</div><div class="mv g">${fmt(totalGoods)}</div></div><div class="met m-red"><div class="ml">Labour</div><div class="mv r">${fmt(bw)}</div></div><div class="met m-amber"><div class="ml">Overtime</div><div class="mv a">${fmt(ot)}</div></div><div class="met m-amber"><div class="ml">RM Cost</div><div class="mv a">${fmt(totalRM)}</div></div><div class="met ${net>=0?'m-green':'m-red'}"><div class="ml">Net Profit</div><div class="mv ${net>=0?'g':'r'}">${fmt(net)}</div></div><div class="met ${net>=0?'m-green':'m-red'}"><div class="ml">Margin</div><div class="mv ${net>=0?'g':'r'}">${margin}%</div></div>`;
  let invHTML='';
  STAGES.forEach((stage,si)=>{
    const pm={};
    S.sessions.forEach(ss=>(ss.teams||[]).filter(t=>t.stage===stage).forEach(t=>t.production.forEach(p=>{
      if(!pm[p.name])pm[p.name]={...p,qty:0,value:0};pm[p.name].qty+=p.qty;pm[p.name].value+=p.value;
    })));
    if(!Object.keys(pm).length)return;
    const ns=STAGES[si+1];const mn={};
    if(ns)S.sessions.forEach(ss=>(ss.teams||[]).filter(t=>t.stage===ns).forEach(t=>t.production.forEach(p=>mn[p.name]=(mn[p.name]||0)+p.qty)));
    invHTML+=`<div style="margin-bottom:16px"><div style="margin-bottom:8px"><span class="sp sp${si}">${stage}</span></div><table class="tbl"><thead><tr><th>Product</th><th class="num">Produced</th><th class="num">Moved to ${ns||'Customer'}</th><th class="num">Remaining</th><th class="num">₹/unit</th><th class="num">Stock Value</th></tr></thead><tbody>${Object.values(pm).map(p=>{const mv=mn[p.name]||0;const rem=p.qty-mv;return`<tr><td style="font-weight:500">${p.name}</td><td class="num">${p.qty}</td><td class="num" style="color:${mv?'var(--amber)':'var(--text4)'}">${mv?'→'+mv:'—'}</td><td class="num">${rem}</td><td class="num">${fmtN(p.unitVal)}</td><td class="num">${fmtN(rem*p.unitVal)}</td></tr>`;}).join('')}</tbody></table></div>`;
  });
  document.getElementById('day-inv').innerHTML=invHTML||'<div style="color:var(--text4);font-size:12px">No production logged today.</div>';
  let rows='';let gG=0,gL=0,gOT=0,gR=0;
  S.sessions.forEach(ss=>{
    (ss.teams||[]).forEach(t=>{
      const supW=S.lab.find(l=>l.id===ss.supId);
      const supOT=calcOT(supW);
      const teamOT=t.team.reduce((a,m)=>a+calcOT(m),0);
      const lc=t.team.reduce((a,m)=>a+m.wage,0)+(t.teamId===1?ss.supWage:0);
      const otc=(t.teamId===1?supOT:0)+teamOT;
      const gv=t.production.reduce((a,p)=>a+p.value,0);
      const sRM=S.rawLog.filter(r=>r.stage===t.stage).reduce((a,r)=>a+r.cost,0)/Math.max(1,S.sessions.reduce((a,s2)=>a+(s2.teams||[]).filter(t2=>t2.stage===t.stage).length,0));
      const net2=gv-lc-otc-sRM;gG+=gv;gL+=lc;gOT+=otc;gR+=sRM;
      rows+=`<tr><td style="font-weight:500">${ss.supName}</td><td><span class="sp sp${STAGES.indexOf(t.stage)}">${t.stage}</span></td><td style="font-size:11px;color:var(--text3)">${t.team.map(m=>m.name).join(', ')||'—'}</td><td class="num">${fmtN(gv)}</td><td class="num">${fmtN(lc)}</td><td class="num">${otc?fmtN(otc):'—'}</td><td class="num">${fmtN(sRM)}</td><td class="num ${net2>=0?'pv':'lv'}">${fmt(net2)}</td></tr>`;
    });
  });
  if(!S.sessions.length)rows=`<tr><td colspan="8" style="color:var(--text4);text-align:center;padding:20px">No sessions yet.</td></tr>`;
  const gNet=gG-gL-gOT-gR;
  rows+=`<tr class="tr-total"><td colspan="3">TOTAL</td><td class="num">${fmtN(gG)}</td><td class="num">${fmtN(gL)}</td><td class="num">${fmtN(gOT)}</td><td class="num">${fmtN(gR)}</td><td class="num ${gNet>=0?'pv':'lv'}">${fmt(gNet)}</td></tr>`;
  document.getElementById('day-teams').innerHTML=rows;
  // Attendance removed from Day Sheet — see Attendance screen
  const rmTotal=S.rawLog.reduce((a,r)=>a+r.cost,0);const rmProfit=totalGoods-rmTotal;
  document.getElementById('day-rm-pnl').innerHTML=`<div class="mrow"><div class="met m-blue"><div class="ml">Total Goods</div><div class="mv w">${fmt(totalGoods)}</div></div><div class="met m-red"><div class="ml">RM Issued</div><div class="mv r">${fmt(rmTotal)}</div></div><div class="met ${rmProfit>=0?'m-green':'m-red'}"><div class="ml">RM Supervisor Net</div><div class="mv ${rmProfit>=0?'g':'r'}">${fmt(rmProfit)}</div></div></div>`;
}

function buildPayload(){
  const present=S.lab.filter(l=>l.present);
  const bw=present.reduce((a,l)=>a+l.wage,0);
  const ot=present.reduce((a,l)=>a+calcOT(l),0);
  const totalLab=bw+ot;
  const totalGoods=S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  // Only count actual RM issues — exclude Unit2 transfers
  const totalRM=S.rawLog.filter(r=>r.stage!=='Unit2-Transfer').reduce((a,r)=>a+r.cost,0);
  const net=totalGoods-totalLab-totalRM;
  const stageRM={},stageLab={},stageOT={};
  S.rawLog.filter(r=>r.stage!=='Unit2-Transfer').forEach(r=>stageRM[r.stage]=(stageRM[r.stage]||0)+r.cost);
  S.sessions.forEach(ss=>{
    const sup=S.lab.find(l=>l.id===ss.supId);
    const supOT=calcOT(sup);
    (ss.teams||[]).forEach(t=>{
      const teamLab=t.team.reduce((a,m)=>a+m.wage,0);
      const teamOT=t.team.reduce((a,m)=>a+calcOT(m),0);
      stageLab[t.stage]=(stageLab[t.stage]||0)+teamLab+(t.teamId===1?ss.supWage:0);
      stageOT[t.stage]=(stageOT[t.stage]||0)+teamOT+(t.teamId===1?supOT:0);
    });
  });
  const productLog=[];
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>productLog.push({...p,stage:t.stage,supName:ss.supName,teamId:t.teamId}))));
  const attendance=S.lab.map(l=>({id:l.id,name:l.name,role:l.role,wage:l.wage,present:l.present,doingOT:l.doingOT,otHours:l.otHours||0,ot:l.otHours||0}));
  return{
    date:S.workDate,
    workersPresent:present.length,
    goodsValue:totalGoods,
    labourCost:bw,
    overtimeCost:ot,
    rmCost:totalRM,
    netProfit:net,
    margin:totalGoods?Math.round(net/totalGoods*100):0,
    productLog,
    rawLog:S.rawLog.filter(r=>r.stage!=='Unit2-Transfer'),
    attendance,
    stageRM,stageLab,stageOT,
    sessions:JSON.parse(JSON.stringify(S.sessions))
  };
}

function syncToSheets(){
  if(!S.sheetsUrl){alert('Google Sheets not connected. Go to Sheets tab.');return;}
  setSyncStatus('syncing','Syncing...');
  sendViaImage(S.sheetsUrl,buildPayload());
  setSyncStatus('ok','Synced ✓');
  setTimeout(()=>setSyncStatus('ok','Connected'),3000);
}

function saveDay(){
  const payload = buildPayload();
  const entry = {...payload, date:S.workDate, rawLog:S.rawLog.map(r=>({...r}))};
  const ei = S.ledger.findIndex(e=>e.date===S.workDate);
  if(ei>=0) S.ledger[ei]=entry; else S.ledger.push(entry);
  S.ledger.sort((a,b)=>a.date.localeCompare(b.date));

  if(S.sheetsUrl){ sendViaImage(S.sheetsUrl, payload); }

  const savedDate = S.workDate;
  const next = new Date(savedDate+'T00:00:00');
  next.setDate(next.getDate()+1);
  const nextStr = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
  const nextLabel = next.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'});

  const btn = document.querySelector('[onclick="saveDay()"]');
  if(btn){ btn.textContent='⏳ Saving...'; btn.disabled=true; }

  // ── PERMANENTLY MARK THIS DATE AS DONE ──
  // Multiple flags to ensure sessions never come back
  localStorage.setItem('_day_cleared_'+savedDate, '1');
  localStorage.setItem('_last_saved_date', savedDate);
  localStorage.removeItem('_day_cleared_'+nextStr); // clear tomorrow's flag

  // Clear sessions and rawLog immediately
  S.sessions = [];
  S.rawLog = [];
  S.lab.forEach(l=>{ l.present=false; l.doingOT=false; l.otHours=0; });
  S.workDate = nextStr;
  const wdEl = document.getElementById('work-date');
  if(wdEl) wdEl.value = nextStr;
  persist();

  // Persist the closed day as one row in `day_ledger`.
  //
  // Nothing needs "clearing" any more. Every operational table is keyed
  // by work_date, so the next day simply has no rows yet — which is what
  // made the old _dayCleared flags, the supervisor doc wipes, and the
  // rollover broadcast unnecessary. Those three mechanisms are the source
  // of most of the day-rollover bugs in the git history.
  if(fbEnabled){
    FactoryDB.saveDay(savedDate, payload)
      .then(function(){ return pushToFirebase(); })
      .catch(function(e){ console.warn('saveDay:', e); });
  }

  setTimeout(()=>{
    if(btn){ btn.textContent='💾 Save Day & Start Next'; btn.disabled=false; }
    alert('✓ Day saved!\nNext: '+nextLabel);
    go('att');
  }, 3000);
}



function initMonthly(){
  const now=new Date();
  const ms=document.getElementById('m-mon');
  const ys=document.getElementById('m-yr');
  if(!ms.innerHTML){
    ms.innerHTML=MNAMES.map((m,i)=>`<option value="${i}" ${i===now.getMonth()?'selected':''}>${m}</option>`).join('');
    const curYr=now.getFullYear();
    ys.innerHTML=[curYr-2,curYr-1,curYr,curYr+1].map(y=>`<option value="${y}" ${y===curYr?'selected':''}>${y}</option>`).join('');
  }
  renderMonthly();
}

function prevMonth(){
  const ms=document.getElementById('m-mon');const ys=document.getElementById('m-yr');
  let m=parseInt(ms.value),y=parseInt(ys.value);
  m--;if(m<0){m=11;y--;}
  ms.value=m;ys.value=y;renderMonthly();
}
function nextMonth(){
  const ms=document.getElementById('m-mon');const ys=document.getElementById('m-yr');
  let m=parseInt(ms.value),y=parseInt(ys.value);
  m++;if(m>11){m=0;y++;}
  ms.value=m;ys.value=y;renderMonthly();
}

function showMonthDay(dateStr){
  const e = S.ledger.find(x=>x.date===dateStr);
  const detail = document.getElementById('m-day-detail');
  if(!e){ detail.style.display='none'; return; }

  const d = new Date(dateStr+'T00:00:00');
  document.getElementById('m-day-title').textContent =
    d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const mg = e.goodsValue>0?Math.round(e.netProfit/e.goodsValue*100):0;
  document.getElementById('m-day-metrics').innerHTML=`
    <div class="met m-blue"><div class="ml">Workers</div><div class="mv w">${e.workersPresent||0}</div></div>
    <div class="met m-green"><div class="ml">Goods Value</div><div class="mv g">${fmt(e.goodsValue||0)}</div></div>
    <div class="met m-red"><div class="ml">Labour</div><div class="mv r">${fmt(e.labourCost||0)}</div></div>
    <div class="met m-amber"><div class="ml">RM Cost</div><div class="mv a">${fmt(e.rmCost||0)}</div></div>
    <div class="met ${e.netProfit>=0?'m-green':'m-red'}"><div class="ml">Net Profit</div><div class="mv ${e.netProfit>=0?'g':'r'}">${fmt(e.netProfit||0)}</div></div>
    <div class="met ${mg>=0?'m-green':'m-red'}"><div class="ml">Margin</div><div class="mv ${mg>=0?'g':'r'}">${mg}%</div></div>`;

  // Production log
  const prodEl = document.getElementById('m-day-prod');
  const prods = e.productLog||[];
  if(prods.length){
    prodEl.innerHTML=`<div class="ct" style="margin-bottom:8px">Production</div>
    <div class="tw"><table class="tbl">
      <thead><tr><th>Supervisor</th><th>Stage</th><th>Product</th><th class="num">Qty</th><th class="num">Value ₹</th></tr></thead>
      <tbody>${prods.map(p=>`<tr>
        <td style="font-size:12px">${p.supName||'—'}</td>
        <td><span class="sp sp${STAGES.indexOf(p.stage)}">${p.stage}</span></td>
        <td style="font-weight:500">${p.name}</td>
        <td class="num">${p.qty}</td>
        <td class="num pv">${fmtN(p.value||0)}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } else {
    prodEl.innerHTML='<div style="color:var(--text4);font-size:12px">No production log for this day.</div>';
  }

  detail.style.display='block';
  detail.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function renderMonthly(){
  const month=parseInt(document.getElementById('m-mon').value);const year=parseInt(document.getElementById('m-yr').value);
  const entries=S.ledger.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getMonth()===month&&d.getFullYear()===year;});
  const tG=entries.reduce((a,e)=>a+e.goodsValue,0);const tL=entries.reduce((a,e)=>a+e.labourCost,0);const tOT=entries.reduce((a,e)=>a+(e.overtimeCost||0),0);const tR=entries.reduce((a,e)=>a+e.rmCost,0);const tN=entries.reduce((a,e)=>a+e.netProfit,0);const pd=entries.length;const best=pd?entries.reduce((a,e)=>e.netProfit>a?e.netProfit:a,-Infinity):0;const avg=pd?Math.round(tN/pd):0;
  document.getElementById('m-met').innerHTML=`<div class="met m-blue"><div class="ml">Production Days</div><div class="mv w">${pd}</div></div><div class="met m-green"><div class="ml">Total Goods</div><div class="mv g">${fmt(tG)}</div></div><div class="met m-red"><div class="ml">Total Labour</div><div class="mv r">${fmt(tL)}</div></div><div class="met m-amber"><div class="ml">Total OT</div><div class="mv a">${fmt(tOT)}</div></div><div class="met m-amber"><div class="ml">Total RM</div><div class="mv a">${fmt(tR)}</div></div><div class="met ${tN>=0?'m-green':'m-red'}"><div class="ml">Monthly Profit</div><div class="mv ${tN>=0?'g':'r'}">${fmt(tN)}</div></div><div class="met ${avg>=0?'m-green':'m-red'}"><div class="ml">Avg Daily</div><div class="mv ${avg>=0?'g':'r'}">${fmt(avg)}</div></div><div class="met m-green"><div class="ml">Best Day</div><div class="mv g">${pd?fmt(best):'—'}</div></div>`;
  const fd=new Date(year,month,1).getDay();const dim=new Date(year,month+1,0).getDate();const now=new Date();const emap={};entries.forEach(e=>emap[e.date]=e);
  let cal='';for(let i=0;i<fd;i++)cal+=`<div class="cc empty"></div>`;
  for(let d=1;d<=dim;d++){const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const e=emap[ds];const isT=now.getDate()===d&&now.getMonth()===month&&now.getFullYear()===year;cal+=`<div class="cc ${e?(e.netProfit>=0?'pd':'ld'):''} ${isT?'td':''}" onclick="showMonthDay('${ds}')" style="cursor:${e?'pointer':'default'}">`+`<div class="ccn">${d}</div>${e?`<div class="ccv ${e.netProfit>=0?'g':'r'}">${e.netProfit>=0?'+':''}${Math.round(e.netProfit/1000)}k</div>`:''}</div>`;}
  document.getElementById('m-cal').innerHTML=cal;
  let lr='';
  if(!entries.length)lr=`<tr><td colspan="8" style="text-align:center;color:var(--fog);padding:24px">No data for this month yet.</td></tr>`;
  else{entries.forEach(e=>{const d=new Date(e.date+'T00:00:00');const mg=e.goodsValue?Math.round(e.netProfit/e.goodsValue*100):0;lr+=`<tr class="${e.netProfit>0?'tr-p':e.netProfit<0?'tr-l':''}"><td style="font-weight:500;color:#111827">${d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</td><td class="num">${e.workersPresent}</td><td class="num">${fmtN(e.goodsValue)}</td><td class="num">${fmtN(e.labourCost)}</td><td class="num">${fmtN(e.overtimeCost||0)}</td><td class="num">${fmtN(e.rmCost)}</td><td class="num ${e.netProfit>=0?'pv':'lv'}">${fmt(e.netProfit)}</td><td class="num ${mg>=0?'pv':'lv'}">${mg}%</td></tr>`;});lr+=`<tr class="tr-total"><td>TOTAL</td><td class="num">—</td><td class="num">${fmtN(tG)}</td><td class="num">${fmtN(tL)}</td><td class="num">${fmtN(tOT)}</td><td class="num">${fmtN(tR)}</td><td class="num ${tN>=0?'pv':'lv'}">${fmt(tN)}</td><td class="num ${tN>=0?'pv':'lv'}">${tG?Math.round(tN/tG*100):0}%</td></tr>`;}
  document.getElementById('m-ledger').innerHTML=lr;
  const pm={};entries.forEach(e=>(e.productLog||[]).forEach(p=>{if(!pm[p.name])pm[p.name]={name:p.name,qty:0,value:0};pm[p.name].qty+=p.qty;pm[p.name].value+=p.qty*(p.unitVal||0);}));const prods=Object.values(pm).sort((a,b)=>b.value-a.value);const maxV=prods[0]?.value||1;
  document.getElementById('m-prods').innerHTML=prods.length?`<table class="tbl"><thead><tr><th>Product</th><th class="num">Units</th><th class="num">Value ₹</th><th style="width:80px">Share</th></tr></thead><tbody>${prods.map(p=>`<tr><td style="font-weight:500;color:#111827">${p.name}</td><td class="num">${p.qty}</td><td class="num">${fmtN(p.value)}</td><td><div class="prog"><div class="pf" style="width:${Math.round(p.value/maxV*100)}%"></div></div></td></tr>`).join('')}</tbody></table>`:'<div style="color:#6B7280;font-size:12px">No data.</div>';
  const stT={};STAGES.forEach(s=>stT[s]={g:0,l:0,ot:0,r:0});
  entries.forEach(e=>{
    (e.sessions||[]).forEach(ss=>{
      (ss.teams||[]).forEach(t=>{
        const s=t.stage;
        if(!stT[s]) return;
        stT[s].g+=t.production.reduce((a,p)=>a+p.value,0);
        stT[s].l+=(e.stageLab&&e.stageLab[s])||0;
        stT[s].ot+=(e.stageOT&&e.stageOT[s])||0;
        stT[s].r+=(e.stageRM&&e.stageRM[s])||0;
      });
    });
  });
  document.getElementById('m-stages').innerHTML=STAGES.map((s,si)=>{const t=stT[s];const n=t.g-t.l-t.ot-t.r;return`<tr><td><span class="sp sp${si}">${s}</span></td><td class="num">${fmtN(t.g)}</td><td class="num">${fmtN(t.l)}</td><td class="num">${fmtN(t.ot)}</td><td class="num">${fmtN(t.r)}</td><td class="num ${n>=0?'pv':'lv'}">${fmt(n)}</td></tr>`;}).join('');
  const supM={};entries.forEach(e=>(e.sessions||[]).forEach(ss=>{if(!supM[ss.supName])supM[ss.supName]={name:ss.supName,stages:new Set(),days:0,goods:0,lab:0};(ss.teams||[]).forEach(t=>{supM[ss.supName].stages.add(t.stage);supM[ss.supName].goods+=t.production.reduce((a,p)=>a+p.value,0);supM[ss.supName].lab+=t.team.reduce((a,m)=>a+m.wage,0);});supM[ss.supName].days++;supM[ss.supName].lab+=(ss.supWage||0);}));
  document.getElementById('m-sups').innerHTML=Object.values(supM).sort((a,b)=>b.goods-a.goods).map(s=>{const n=s.goods-s.lab;return`<tr><td style="font-weight:600">${s.name}</td><td>${[...s.stages].map(st=>spBadge(st)).join(' ')}</td><td class="num">${s.days}</td><td class="num">${fmtN(s.goods)}</td><td class="num">${fmtN(s.lab)}</td><td class="num ${n>=0?'pv':'lv'}">${fmt(n)}</td></tr>`;}).join('')||`<tr><td colspan="6" style="color:var(--text4);text-align:center">No supervisor data.</td></tr>`;
}

function renderOrders(){
  const orders = orderFilter==='all' ? S.orders : S.orders.filter(o=>o.status===orderFilter);

  // Tab active state
  document.querySelectorAll('#order-tabs .tab').forEach(t=>{
    const f = t.onclick?.toString().match(/'(\w+)'/)?.[1];
    t.classList.toggle('active', f===orderFilter);
  });

  // Metrics
  const total=S.orders.length;
  const pending=S.orders.filter(o=>o.status==='pending').length;
  const production=S.orders.filter(o=>o.status==='production').length;
  const ready=S.orders.filter(o=>o.status==='ready').length;
  const totalAmount=S.orders.reduce((a,o)=>a+o.amount,0);
  const balanceDue=S.orders.filter(o=>o.status!=='dispatched').reduce((a,o)=>a+(o.amount-o.advance),0);
  const overdue=S.orders.filter(o=>isOverdue(o)).length;
  document.getElementById('order-metrics').innerHTML=`
    <div class="met m-blue"><div class="ml">Total Orders</div><div class="mv w">${total}</div></div>
    <div class="met m-amber"><div class="ml">Pending</div><div class="mv a">${pending}</div></div>
    <div class="met m-blue"><div class="ml">In Production</div><div class="mv b">${production}</div></div>
    <div class="met m-green"><div class="ml">Ready</div><div class="mv g">${ready}</div></div>
    <div class="met m-amber"><div class="ml">Balance Due</div><div class="mv a">${fmt(balanceDue)}</div></div>
    ${overdue?`<div class="met m-red"><div class="ml">Overdue 🚨</div><div class="mv r">${overdue}</div></div>`:''}`;

  if(!orders.length){
    document.getElementById('order-list').innerHTML=`<div class="card" style="text-align:center;padding:32px;color:#9CA3AF">No orders yet. Click <b>+ New Order</b> to create one.</div>`;
    return;
  }

  document.getElementById('order-list').innerHTML = orders.map(o=>{
    const balance = o.amount - o.advance;
    const od = isOverdue(o);
    const priorityColor = o.priority==='urgent'?'#B91C1C':o.priority==='high'?'#92400E':'#6B7280';
    return`<div class="card" style="border-left:3px solid ${od?'#EF4444':orderStatusBg(o.status)};margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-weight:600;font-size:14px;color:#111827">${o.customer}</span>
            <span style="font-family:var(--mono);font-size:9px;color:#9CA3AF">${o.id}</span>
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-weight:600;font-family:var(--mono)">${o.status.toUpperCase()}</span>
            ${od?'<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:#FEF2F2;color:#B91C1C;font-weight:600;font-family:var(--mono)">OVERDUE</span>':''}
            ${o.priority!=='normal'?`<span style="font-size:10px;color:${priorityColor};font-weight:600">${o.priority==='urgent'?'🚨 URGENT':'⚡ HIGH'}</span>`:''}
          </div>
          <div style="font-size:12px;color:#6B7280">${o.city}${o.phone?' · '+o.phone:''} ${o.requiredBy?' · Required by '+new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</div>
          ${o.items?`<div style="font-size:12px;color:#374151;margin-top:3px">${o.items}</div>`:''}
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:#111827">${fmt(o.amount)}</div>
          <div style="font-size:11px;color:#6B7280">Advance: ${fmt(o.advance)}</div>
          <div style="font-size:12px;font-weight:600;color:${balance>0?'#B91C1C':'#065F46'}">Balance: ${fmt(balance)}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
        ${o.status==='pending'?`<button class="btn btn-sm" onclick="updateOrderStatus('${o.id}','production')" style="background:#EFF6FF;color:#1E40AF;border-color:#BFDBFE">→ Start Production</button>`:''}
        ${o.status==='production'?`<button class="btn btn-sm" onclick="updateOrderStatus('${o.id}','ready')" style="background:#ECFDF5;color:#065F46;border-color:#A7F3D0">→ Mark Ready</button>`:''}
        ${o.status==='ready'?`<button class="btn btn-sm" onclick="updateOrderStatus('${o.id}','dispatched')" style="background:#F9FAFB;color:#374151;border-color:#E5E7EB">🚚 Dispatch</button>`:''}
        ${balance>0 && o.status!=='dispatched'?`<button class="btn btn-sm" onclick="recordPayment('${o.id}')" style="background:#FFFBEB;color:#92400E;border-color:#FDE68A">💰 Record Payment</button>`:''}
        <button class="btn btn-sm btn-ember btn-xs" onclick="deleteOrder('${o.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

function filterOrders(f){ orderFilter=f; renderOrders(); }

// ── ORDER ITEM PICKER ──
let orderItems = []; // [{name, qty, price}]

function openNewOrder(){
  orderItems = [];
  renderOrderItemsList();
  document.getElementById('ord-item-search').value='';
  document.getElementById('ord-item-qty').value='1';
  document.getElementById('ord-item-price').value='';
  document.getElementById('ord-customer').value='';
  document.getElementById('ord-phone').value='';
  document.getElementById('ord-city').value='';
  document.getElementById('ord-advance').value='';
  document.getElementById('ord-amount').value='';
  document.getElementById('ord-total-display').textContent='₹0';
  const today = new Date(); today.setDate(today.getDate()+7);
  document.getElementById('ord-date').value = today.toISOString().slice(0,10);
  document.getElementById('order-form-wrap').style.display='block';
  document.getElementById('order-form-wrap').scrollIntoView({behavior:'smooth'});
}

function closeOrderForm(){
  document.getElementById('order-form-wrap').style.display='none';
  document.getElementById('ord-item-dropdown').style.display='none';
}

function filterOrderProducts(){
  const q = document.getElementById('ord-item-search').value.trim().toLowerCase();
  const dd = document.getElementById('ord-item-dropdown');
  if(!q){dd.style.display='none';return;}
  const matches = S.fg.filter(p=>p.name.toLowerCase().includes(q)).slice(0,25);
  if(!matches.length){dd.style.display='none';return;}
  dd.innerHTML = matches.map(p=>`<div onclick="selectOrderProduct('${p.name.replace(/'/g,"\\'")}',${p.price||0})"
    style="padding:9px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"
    onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
    <span style="font-weight:500;color:var(--text)">${p.name}</span>
    <span style="font-family:var(--mono);font-size:11px;color:var(--text4);margin-left:12px;flex-shrink:0">₹${p.price||0}</span>
  </div>`).join('');
  dd.style.display='block';
}

function selectOrderProduct(name, price){
  document.getElementById('ord-item-search').value=name;
  document.getElementById('ord-item-price').value=price||'';
  document.getElementById('ord-item-dropdown').style.display='none';
}

function addOrderItem(){
  const name = document.getElementById('ord-item-search').value.trim();
  const qty = parseInt(document.getElementById('ord-item-qty').value)||1;
  const price = parseFloat(document.getElementById('ord-item-price').value)||0;
  if(!name){alert('Select a product first.');return;}
  // Check if already added — update qty
  const existing = orderItems.find(i=>i.name===name);
  if(existing){ existing.qty+=qty; existing.price=price||existing.price; }
  else orderItems.push({name,qty,price});
  document.getElementById('ord-item-search').value='';
  document.getElementById('ord-item-qty').value='1';
  document.getElementById('ord-item-price').value='';
  renderOrderItemsList();
}

function changeOrderItemQty(idx, delta){
  orderItems[idx].qty = Math.max(1, (orderItems[idx].qty||1)+delta);
  renderOrderItemsList();
}

function removeOrderItem(idx){
  orderItems.splice(idx,1);
  renderOrderItemsList();
}

function renderOrderItemsList(){
  const el = document.getElementById('ord-items-list');
  const countEl = document.getElementById('ord-items-count');
  if(!orderItems.length){
    el.innerHTML='<div style="color:var(--text4);font-size:12px;padding:12px 0;text-align:center;border:1px dashed var(--border);border-radius:var(--r)">No items added yet — search and add products above</div>';
    if(countEl) countEl.textContent='';
    updateOrderTotal();
    return;
  }
  el.innerHTML=`<div style="border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:var(--surface2)">
          <th style="padding:8px 12px;text-align:left;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">#</th>
          <th style="padding:8px 12px;text-align:left;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Product</th>
          <th style="padding:8px 12px;text-align:right;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">₹/pc</th>
          <th style="padding:8px 12px;text-align:right;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Total</th>
          <th style="padding:8px 12px"></th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map((item,i)=>`
          <tr style="border-top:1px solid var(--border);${i%2===0?'background:var(--surface)':'background:var(--bg2)'}">
            <td style="padding:10px 12px;color:var(--text4);font-family:var(--mono);font-size:11px">${i+1}</td>
            <td style="padding:10px 12px;font-weight:500;color:var(--text)">${item.name}</td>
            <td style="padding:10px 12px;text-align:right">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                <button onclick="changeOrderItemQty(${i},-1)" style="width:22px;height:22px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--text2)">−</button>
                <span style="font-family:var(--mono);font-weight:600;min-width:28px;text-align:center">${item.qty}</span>
                <button onclick="changeOrderItemQty(${i},1)" style="width:22px;height:22px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--text2)">+</button>
              </div>
            </td>
            <td style="padding:10px 12px;text-align:right;font-family:var(--mono)">
              <input type="number" value="${item.price||0}" onchange="orderItems[${i}].price=parseFloat(this.value)||0;renderOrderItemsList()" style="width:80px;padding:4px 7px;border:1px solid var(--border);border-radius:5px;background:var(--surface2);font-size:12px;text-align:right;color:var(--text);outline:none" onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'">
            </td>
            <td style="padding:10px 12px;text-align:right;font-family:var(--mono);font-weight:700;color:var(--blue)">₹${((item.price||0)*item.qty).toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px"><button onclick="removeOrderItem(${i})" style="background:none;border:none;color:var(--ember);cursor:pointer;font-size:16px;padding:2px 4px">✕</button></td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
  if(countEl) countEl.textContent=`${orderItems.length} product${orderItems.length!==1?'s':''} · ${orderItems.reduce((a,i)=>a+i.qty,0)} total units`;
  updateOrderTotal();
}

function updateOrderTotal(){
  const total = orderItems.reduce((a,i)=>a+(i.price||0)*i.qty,0);
  document.getElementById('ord-amount').value=total;
  document.getElementById('ord-total-display').textContent='₹'+total.toLocaleString('en-IN');
}

// Import from Sheets removed
function importOrdersFromSheets(){
  if(!S.sheetsUrl){alert('Google Sheets URL not set. Go to Settings → Google Sheets.');return;}
  const statusEl = document.getElementById('import-status');
  statusEl.textContent='⏳ Fetching...';

  // Use script tag trick to bypass CORS (JSONP-style)
  const cbName = 'sheetsOrderCB_'+Date.now();
  window[cbName] = function(data){
    delete window[cbName];
    document.getElementById('_sheets-script')?.remove();
    if(!data||!data.orders){statusEl.textContent='⚠ No data returned';setTimeout(()=>statusEl.textContent='',3000);return;}
    let added=0;
    data.orders.forEach(row=>{
      if(!row.customer) return;
      const exists=S.orders.find(o=>o.id===row.id||(o.customer===row.customer&&o.createdAt===row.date));
      if(!exists){
        S.orders.unshift({
          id:row.id||('IMP-'+uid()),
          customer:row.customer||'',
          phone:row.phone||'',
          city:row.city||'',
          requiredBy:row.requiredBy||'',
          priority:row.priority||'normal',
          amount:parseFloat(row.amount)||0,
          advance:parseFloat(row.advance)||0,
          items:row.items||'',
          status:row.status||'pending',
          createdAt:row.date||todayStr(),
          fromSheets:true
        });
        added++;
      }
    });
    persist();
    renderOrders();
    renderHome();
    statusEl.textContent=added>0?`✓ ${added} order${added!==1?'s':''} imported`:'✓ All up to date';
    setTimeout(()=>statusEl.textContent='',4000);
  };

  // Apps Script must support callback param — add ?action=getOrders&callback=cbName
  const script = document.createElement('script');
  script.id='_sheets-script';
  script.onerror=()=>{
    delete window[cbName];
    // Fallback: try direct fetch (works if CORS allowed)
    fetch(S.sheetsUrl+'?action=getOrders')
      .then(r=>r.json())
      .then(data=>window[cbName]&&window[cbName](data))
      .catch(()=>{
        statusEl.textContent='⚠ Could not import — update Apps Script and redeploy';
        setTimeout(()=>statusEl.textContent='',5000);
      });
  };
  script.src=S.sheetsUrl+'?action=getOrders&callback='+cbName;
  document.head.appendChild(script);
  setTimeout(()=>{
    if(window[cbName]){
      delete window[cbName];
      document.getElementById('_sheets-script')?.remove();
      // Try direct fetch as backup
      fetch(S.sheetsUrl+'?action=getOrders')
        .then(r=>r.json())
        .then(data=>{
          if(!data||!data.orders){statusEl.textContent='No orders in sheet';setTimeout(()=>statusEl.textContent='',3000);return;}
          let added=0;
          data.orders.forEach(row=>{
            if(!row.customer) return;
            const exists=S.orders.find(o=>o.id===row.id||(o.customer===row.customer&&o.createdAt===row.date));
            if(!exists){
              S.orders.unshift({id:row.id||('IMP-'+uid()),customer:row.customer||'',phone:row.phone||'',city:row.city||'',requiredBy:row.requiredBy||'',priority:row.priority||'normal',amount:parseFloat(row.amount)||0,advance:parseFloat(row.advance)||0,items:row.items||'',status:row.status||'pending',createdAt:row.date||todayStr(),fromSheets:true});
              added++;
            }
          });
          persist();renderOrders();renderHome();
          statusEl.textContent=added>0?`✓ ${added} imported`:'✓ Up to date';
          setTimeout(()=>statusEl.textContent='',4000);
        })
        .catch(()=>{statusEl.textContent='⚠ Failed — check Apps Script';setTimeout(()=>statusEl.textContent='',5000);});
    }
  },5000);
}

function saveOrder(){
  const customer = document.getElementById('ord-customer').value.trim();
  const amount = parseFloat(document.getElementById('ord-amount').value)||0;
  if(!customer){alert('Enter customer name.');return;}
  if(!orderItems.length){alert('Add at least one item.');return;}
  const itemsStr = orderItems.map(i=>`${i.name} x${i.qty}`).join(', ');
  const order = {
    id: 'ORD-'+Date.now().toString().slice(-6),
    customer,
    phone: document.getElementById('ord-phone').value.trim(),
    city: document.getElementById('ord-city').value.trim(),
    requiredBy: document.getElementById('ord-date').value,
    priority: document.getElementById('ord-priority').value,
    amount,
    advance: parseFloat(document.getElementById('ord-advance').value)||0,
    items: itemsStr,
    fgItems: orderItems.map(i=>({name:i.name,qty:i.qty,price:i.price})),
    status: 'pending',
    createdAt: todayStr(),
  };
  S.orders.unshift(order);
  // Reserve inventory against this order
  if(order.items){
    if(!S.orderReservations) S.orderReservations=[];
    S.orderReservations.push({orderId:order.id, items:order.items, date:order.createdAt});
  }
  persist();
  // Sync order to Google Sheets immediately
  if(S.sheetsUrl){
    const payload = {
      action:'order',
      id: order.id,
      date: order.createdAt,
      customer: order.customer,
      phone: order.phone||'',
      city: order.city||'',
      requiredBy: order.requiredBy||'',
      priority: order.priority,
      items: order.items||'',
      amount: order.amount,
      advance: order.advance,
      balance: order.amount - order.advance,
      status: order.status
    };
    sendGet(S.sheetsUrl, 'action=order&payload='+encodeURIComponent(JSON.stringify(payload)));
  }
  closeOrderForm();
  ['ord-customer','ord-phone','ord-city','ord-items','ord-amount','ord-advance'].forEach(id=>{
    document.getElementById(id).value='';
  });
  // Show confirmation with next steps
  alert(`✓ Order created!\n\nOrder ID: ${order.id}\nCustomer: ${order.customer}\n\n→ Go to Supervisor Teams to start production\n→ Check Inventory for stock reservation`);
  renderOrders();
  renderHome();
}

function updateOrderStatus(id, status){
  const o = S.orders.find(o=>o.id===id);
  if(!o) return;
  const prev = o.status;
  o.status = status;
  o.statusUpdatedAt = todayStr();

  // On dispatch — deduct from Packing stage FG stock
  if(status==='dispatched' && prev!=='dispatched'){
    o.dispatchedAt = todayStr();
    // Try to deduct items from Packing stock via transfer record
    if(o.items && o.fgItems && o.fgItems.length){
      o.fgItems.forEach(item=>{
        const key = item.name;
        const alreadyAssigned = (o.assignedItems||{})[key]||0;
        const stillToDeduct = Math.max(0,(item.qty||1)-alreadyAssigned);
        if(stillToDeduct>0){
          if(!S.fgTransfers) S.fgTransfers=[];
          S.fgTransfers.push({id:uid(),date:todayStr(),from:'Packing',to:'Dispatch',product:key,productIn:key,qty:stillToDeduct,note:'Dispatch '+o.id+' — '+o.customer,auto:false});
        }
      });
    }
    // Sync dispatch to Sheets
    if(S.sheetsUrl){
      sendGet(S.sheetsUrl,'action=order&payload='+encodeURIComponent(JSON.stringify({
        action:'order',id:o.id,date:todayStr(),customer:o.customer,
        phone:o.phone||'',city:o.city||'',requiredBy:o.requiredBy||'',
        priority:o.priority,items:o.items||'',amount:o.amount,
        advance:o.advance,balance:o.amount-o.advance,status:'dispatched'
      })));
    }
  }

  // On start production — sync status update to Sheets
  if(status==='production' && S.sheetsUrl){
    sendGet(S.sheetsUrl,'action=order&payload='+encodeURIComponent(JSON.stringify({
      action:'order',id:o.id,date:todayStr(),customer:o.customer,
      phone:o.phone||'',city:o.city||'',requiredBy:o.requiredBy||'',
      priority:o.priority,items:o.items||'',amount:o.amount,
      advance:o.advance,balance:o.amount-o.advance,status:'production'
    })));
  }

  persist();
  renderOrders();
  renderPayments();
  renderHome();
}

function recordPayment(id){
  const o = S.orders.find(o=>o.id===id);
  if(!o) return;
  const balance = o.amount - o.advance;
  const amt = parseFloat(prompt(`Record payment for ${o.customer}
Balance due: ${fmt(balance)}
Enter amount received:`));
  if(!amt||isNaN(amt)) return;
  o.advance = Math.min(o.advance + amt, o.amount);
  persist();
  renderOrders(); renderPayments(); renderHome();
  alert(`✓ Payment of ${fmt(amt)} recorded. New balance: ${fmt(o.amount-o.advance)}`);
}

function deleteOrder(id){
  if(!confirm('Delete this order?')) return;
  S.orders = S.orders.filter(o=>o.id!==id);
  persist(); renderOrders(); renderPayments(); renderHome();
}

function renderPayments(){
  const unpaid = S.orders.filter(o=>o.status!=='dispatched'&&(o.amount-o.advance)>0);
  const totalBalance = unpaid.reduce((a,o)=>a+(o.amount-o.advance),0);
  const overdueBalance = unpaid.filter(o=>isOverdue(o)).reduce((a,o)=>a+(o.amount-o.advance),0);
  const totalAdvance = S.orders.reduce((a,o)=>a+o.advance,0);

  document.getElementById('pay-metrics').innerHTML=`
    <div class="met m-red"><div class="ml">Total Balance Due</div><div class="mv r">${fmt(totalBalance)}</div></div>
    <div class="met m-red"><div class="ml">Overdue Amount</div><div class="mv r">${fmt(overdueBalance)}</div></div>
    <div class="met m-green"><div class="ml">Total Advance Collected</div><div class="mv g">${fmt(totalAdvance)}</div></div>
    <div class="met m-blue"><div class="ml">Unpaid Orders</div><div class="mv b">${unpaid.length}</div></div>`;

  if(!unpaid.length){
    document.getElementById('pay-list').innerHTML='<div style="color:#9CA3AF;font-size:12px;padding:12px">No pending payments. All orders are paid or dispatched.</div>';
    return;
  }

  document.getElementById('pay-list').innerHTML=`<table class="tbl"><thead><tr>
    <th>Customer</th><th>Order ID</th><th>City</th><th>Status</th>
    <th class="num">Order ₹</th><th class="num">Advance ₹</th><th class="num">Balance ₹</th><th>Due By</th><th></th>
  </tr></thead><tbody>${unpaid.sort((a,b)=>(isOverdue(b)?1:0)-(isOverdue(a)?1:0)).map(o=>{
    const bal=o.amount-o.advance;const od=isOverdue(o);
    return`<tr class="${od?'tr-l':''}">
      <td style="font-weight:500;color:#111827">${o.customer}${od?' 🚨':''}</td>
      <td style="font-family:var(--mono);color:#6B7280">${o.id}</td>
      <td style="color:#6B7280">${o.city||'—'}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-family:var(--mono);font-weight:600">${o.status.toUpperCase()}</span></td>
      <td class="num">${fmtN(o.amount)}</td>
      <td class="num">${fmtN(o.advance)}</td>
      <td class="num" style="color:#B91C1C;font-weight:600">${fmt(bal)}</td>
      <td style="font-size:11px;color:${od?'#B91C1C':'#6B7280'}">${o.requiredBy?new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</td>
      <td><button class="btn btn-sm btn-xs" onclick="recordPayment('${o.id}')" style="background:#FFFBEB;color:#92400E;border-color:#FDE68A">💰 Pay</button></td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

function renderStock(){
  if(!S.purchases) S.purchases=[];
  // Sync stock items with RM catalogue
  S.rm.forEach(r=>{
    if(!S.stock.find(s=>s.id===r.id)){
      S.stock.push({id:r.id,name:r.name,unit:r.unit,opening:0,reorder:100,openingDate:todayStr()});
    }
  });
  S.stock=S.stock.filter(s=>S.rm.find(r=>r.id===s.id));

  // Calculate running balance for each material:
  // balance = opening + all purchases - all issues (across all saved days + today)
  function getBalance(matName, unit){
    const s=S.stock.find(st=>st.name===matName);
    const opening=s?s.opening:0;
    // Purchases
    const purchased=(S.purchases||[]).filter(p=>p.name===matName).reduce((a,p)=>a+p.qty,0);
    // Issues from saved ledger days
    const issuedHistory=S.ledger.reduce((a,day)=>{
      return a+(day.rawLog||[]).filter(r=>r.name===matName).reduce((b,r)=>b+r.qty,0);
    },0);
    // Issues from today (not yet saved)
    const issuedToday=S.rawLog.filter(r=>r.name===matName).reduce((a,r)=>a+r.qty,0);
    return opening+purchased-issuedHistory-issuedToday;
  }

  // Populate material selects
  const matSel=document.getElementById('stk-mat');
  const purSel=document.getElementById('pur-mat');
  if(matSel) matSel.innerHTML=S.rm.map(r=>`<option value="${r.id}">${r.name} (${r.unit})</option>`).join('');
  if(purSel) purSel.innerHTML=S.rm.map(r=>`<option value="${r.id}">${r.name} (${r.unit})</option>`).join('');

  // Alerts
  const critical=S.stock.filter(s=>{
    const bal=getBalance(s.name,s.unit);
    return s.reorder>0&&bal<=s.reorder;
  });
  document.getElementById('stock-alerts').innerHTML=critical.length
    ?critical.map(s=>{
        const bal=getBalance(s.name,s.unit);
        return`<div class="wbox">🚨 <b>${s.name}</b> — only <b>${bal.toFixed(1)} ${s.unit}</b> remaining (reorder level: ${s.reorder} ${s.unit}). Please procure immediately.</div>`;
      }).join('')
    :'<div class="gbox">✓ All raw materials are above reorder levels.</div>';

  // Stock table
  document.getElementById('stock-list').innerHTML=`
    <table class="tbl"><thead><tr>
      <th>Material</th><th class="num">Opening Stock</th>
      <th class="num">+ Purchased</th><th class="num">− Used (History)</th>
      <th class="num">− Used (Today)</th><th class="num">Balance</th>
      <th>Unit</th><th class="num">Reorder Level</th><th>Status</th>
    </tr></thead><tbody>
    ${S.stock.map(s=>{
      const purchased=(S.purchases||[]).filter(p=>p.name===s.name).reduce((a,p)=>a+p.qty,0);
      const usedHistory=S.ledger.reduce((a,day)=>a+(day.rawLog||[]).filter(r=>r.name===s.name).reduce((b,r)=>b+r.qty,0),0);
      const usedToday=S.rawLog.filter(r=>r.name===s.name).reduce((a,r)=>a+r.qty,0);
      const bal=s.opening+purchased-usedHistory-usedToday;
      const crit=s.reorder>0&&bal<=s.reorder;
      return`<tr class="${crit?'tr-l':''}">
        <td style="font-weight:500;color:#111827">${s.name}</td>
        <td class="num">${s.opening}</td>
        <td class="num" style="color:#065F46">${purchased>0?'+'+purchased:'—'}</td>
        <td class="num" style="color:#6B7280">${usedHistory>0?'-'+usedHistory:'—'}</td>
        <td class="num" style="color:#B91C1C">${usedToday>0?'-'+usedToday:'—'}</td>
        <td class="num" style="font-weight:700;font-size:14px;color:${crit?'#B91C1C':'#065F46'}">${bal.toFixed(1)}</td>
        <td style="color:#6B7280">${s.unit}</td>
        <td class="num" style="color:#9CA3AF">${s.reorder}</td>
        <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${crit?'#FEF2F2':'#ECFDF5'};color:${crit?'#B91C1C':'#065F46'};border:1px solid ${crit?'#FECACA':'#A7F3D0'}">${crit?'REORDER':'OK'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table>`;

  // Movement history
  const allMovements=[];
  // Opening stocks
  S.stock.forEach(s=>{
    if(s.opening>0) allMovements.push({date:s.openingDate||'Start',type:'opening',name:s.name,unit:s.unit,qty:s.opening,note:'Opening stock'});
  });
  // Purchases
  (S.purchases||[]).forEach(p=>{
    allMovements.push({date:p.date,type:'purchase',name:p.name,unit:p.unit,qty:p.qty,cost:p.cost,note:p.note||''});
  });
  // Issues from saved days
  S.ledger.forEach(day=>{
    (day.rawLog||[]).forEach(r=>{
      allMovements.push({date:day.date,type:'issue',name:r.name,unit:r.unit,qty:r.qty,note:'Issued to '+r.stage});
    });
  });
  // Today's issues
  S.rawLog.forEach(r=>{
    allMovements.push({date:S.workDate,type:'issue',name:r.name,unit:r.unit,qty:r.qty,note:'Issued to '+r.stage+' (today)'});
  });
  allMovements.sort((a,b)=>b.date.localeCompare(a.date));

  const histEl=document.getElementById('stock-history');
  if(!allMovements.length){
    histEl.innerHTML='<div style="color:#9CA3AF;font-size:12px">No stock movements yet.</div>';
    return;
  }
  histEl.innerHTML=`<table class="tbl"><thead><tr>
    <th>Date</th><th>Type</th><th>Material</th><th class="num">Qty</th><th>Unit</th><th>Note</th>
  </tr></thead><tbody>
  ${allMovements.slice(0,50).map(m=>{
    const color=m.type==='issue'?'#B91C1C':m.type==='purchase'?'#065F46':'#1E40AF';
    const bg=m.type==='issue'?'#FEF2F2':m.type==='purchase'?'#ECFDF5':'#EFF6FF';
    const sign=m.type==='issue'?'-':'+';
    return`<tr>
      <td style="font-family:var(--mono);font-size:11px;color:#6B7280">${m.date}</td>
      <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${bg};color:${color}">${m.type.toUpperCase()}</span></td>
      <td style="font-weight:500;color:#111827">${m.name}</td>
      <td class="num" style="font-weight:600;color:${color}">${sign}${m.qty} ${m.unit}</td>
      <td style="color:#9CA3AF">${m.unit}</td>
      <td style="font-size:11px;color:#6B7280">${m.note}${m.cost?` · ₹${m.cost}`:''}</td>
    </tr>`;
  }).join('')}
  </tbody></table>
  ${allMovements.length>50?`<div style="text-align:center;color:#9CA3AF;font-size:12px;padding:10px">Showing last 50 entries of ${allMovements.length} total</div>`:''}`;
}

function openStockUpdate(){
  const sel=document.getElementById('stk-mat');
  if(sel) sel.innerHTML=S.rm.map(r=>`<option value="${r.id}">${r.name} (${r.unit})</option>`).join('');
  document.getElementById('stock-form').style.display='block';
  const first=S.stock[0];
  if(first){
    document.getElementById('stk-qty').value=first.opening||0;
    document.getElementById('stk-reorder').value=first.reorder||100;
  }
  const matSel=document.getElementById('stk-mat');
  matSel.onchange=function(){
    const s=S.stock.find(st=>st.id===parseInt(this.value));
    if(s){document.getElementById('stk-qty').value=s.opening||0;document.getElementById('stk-reorder').value=s.reorder||100;}
  };
}

function closeStockForm(){ document.getElementById('stock-form').style.display='none'; }

function saveStock(){
  const id=parseInt(document.getElementById('stk-mat').value);
  const qty=parseFloat(document.getElementById('stk-qty').value)||0;
  const reorder=parseFloat(document.getElementById('stk-reorder').value)||0;
  const rm=S.rm.find(r=>r.id===id);
  let s=S.stock.find(st=>st.id===id);
  if(!s){s={id,name:rm.name,unit:rm.unit,opening:0,reorder:100,openingDate:todayStr()};S.stock.push(s);}
  s.opening=qty;s.reorder=reorder;s.name=rm.name;s.unit=rm.unit;
  if(!s.openingDate) s.openingDate=todayStr();
  persist();closeStockForm();renderStock();
  alert(`✓ Opening stock set: ${rm.name} = ${qty} ${rm.unit}`);
}

function openPurchase(){
  if(!S.purchases) S.purchases=[];
  const sel=document.getElementById('pur-mat');
  if(sel) sel.innerHTML=S.rm.map(r=>`<option value="${r.id}" data-unit="${r.unit}">${r.name} (${r.unit})</option>`).join('');
  document.getElementById('purchase-form').style.display='block';
  document.getElementById('purchase-form').scrollIntoView({behavior:'smooth'});
}

function closePurchase(){ document.getElementById('purchase-form').style.display='none'; }

function savePurchase(){
  if(!S.purchases) S.purchases=[];
  const sel=document.getElementById('pur-mat');
  const opt=sel.options[sel.selectedIndex];
  if(!opt) return;
  const rm=S.rm.find(r=>r.id===parseInt(opt.value));
  const qty=parseFloat(document.getElementById('pur-qty').value)||0;
  if(!qty){alert('Enter quantity received.');return;}
  const cost=parseFloat(document.getElementById('pur-cost').value)||0;
  const note=document.getElementById('pur-note').value.trim();
  S.purchases.push({
    id:uid(),date:todayStr(),name:rm.name,unit:rm.unit,qty,cost,note
  });
  persist();
  document.getElementById('pur-qty').value='';
  document.getElementById('pur-cost').value='';
  document.getElementById('pur-note').value='';
  closePurchase();
  renderStock();
  alert(`✓ ${qty} ${rm.unit} of ${rm.name} added to stock.`);
}

function openRMPurchaseForm(){
  if(!S.purchases) S.purchases=[];
  const sel=document.getElementById('rmp-mat');
  if(sel) sel.innerHTML=S.rm.map(r=>`<option value="${r.id}" data-unit="${r.unit}">${r.name} (${r.unit})</option>`).join('');
  const fil=document.getElementById('rmp-filter');
  if(fil) fil.innerHTML='<option value="all">All Materials</option>'+S.rm.map(r=>`<option value="${r.name}">${r.name}</option>`).join('');
  document.getElementById('rmp-date').value=todayStr();
  // Pre-fill reorder from stock
  const firstRM=S.rm[0];
  if(firstRM){
    const s=S.stock.find(st=>st.id===firstRM.id);
    document.getElementById('rmp-reorder').value=s?s.reorder:100;
  }
  document.getElementById('rmp-mat').onchange=function(){
    const rm=S.rm.find(r=>r.id===parseInt(this.value));
    if(rm){
      const s=S.stock.find(st=>st.id===rm.id);
      document.getElementById('rmp-reorder').value=s?s.reorder:100;
    }
  };
  document.getElementById('rmp-form').style.display='block';
  document.getElementById('rmp-form').scrollIntoView({behavior:'smooth'});
}

function closeRMPurchaseForm(){ document.getElementById('rmp-form').style.display='none'; }

function saveRMPurchase(){
  if(!S.purchases) S.purchases=[];
  const type=document.getElementById('rmp-type').value;
  const sel=document.getElementById('rmp-mat');
  const rm=S.rm.find(r=>r.id===parseInt(sel.value));
  if(!rm){alert('Select a material.');return;}
  const qty=parseFloat(document.getElementById('rmp-qty').value)||0;
  if(!qty){alert('Enter quantity.');return;}
  const cost=parseFloat(document.getElementById('rmp-cost').value)||0;
  const note=document.getElementById('rmp-note').value.trim();
  const date=document.getElementById('rmp-date').value||todayStr();
  const reorder=parseFloat(document.getElementById('rmp-reorder').value)||100;

  // Update reorder level in stock
  let s=S.stock.find(st=>st.id===rm.id);
  if(!s){s={id:rm.id,name:rm.name,unit:rm.unit,opening:0,reorder:100,openingDate:date};S.stock.push(s);}
  s.reorder=reorder;s.name=rm.name;s.unit=rm.unit;

  // For opening stock — update the opening field directly
  if(type==='opening'){
    s.opening=qty;
    s.openingDate=date;
    // Remove old opening entries for this material
    S.purchases=S.purchases.filter(p=>!(p.type==='opening'&&p.name===rm.name));
  }

  // All types go into purchases log
  const sign=(type==='wastage')?-1:1;
  S.purchases.push({id:uid(),date,type,name:rm.name,unit:rm.unit,qty:qty*sign,cost,note,reorder});
  persist();
  closeRMPurchaseForm();
  // Clear form
  ['rmp-qty','rmp-cost','rmp-note'].forEach(id=>document.getElementById(id).value='');
  renderRMPurchase();
  renderStock();
  alert(`✓ ${type==='opening'?'Opening stock':'Entry'} saved: ${rm.name} ${sign>0?'+':''}${qty*sign} ${rm.unit}`);
}

function renderRMPurchase(){
  if(!S.purchases) S.purchases=[];
  // Populate filter
  const fil=document.getElementById('rmp-filter');
  if(fil){
    const cur=fil.value;
    fil.innerHTML='<option value="all">All Materials</option>'+S.rm.map(r=>`<option value="${r.name}">${r.name}</option>`).join('');
    fil.value=cur;
  }
  const filterMat=fil?fil.value:'all';

  // Metrics
  const totalPurchased=S.purchases.filter(p=>p.type==='purchase'&&p.qty>0).reduce((a,p)=>a+p.qty,0);
  const totalCost=S.purchases.filter(p=>p.type==='purchase'&&p.cost>0).reduce((a,p)=>a+p.cost,0);
  const entries=S.purchases.length;
  document.getElementById('rmp-metrics').innerHTML=`
    <div class="met m-green"><div class="ml">Total Purchases</div><div class="mv g">${entries} entries</div></div>
    <div class="met m-amber"><div class="ml">Total Procurement Cost</div><div class="mv a">${fmt(totalCost)}</div></div>`;

  // Per-material summary
  const matSummary={};
  S.rm.forEach(r=>{
    const s=S.stock.find(st=>st.id===r.id);
    const opening=s?s.opening:0;
    const purchased=S.purchases.filter(p=>p.name===r.name&&p.type==='purchase').reduce((a,p)=>a+p.qty,0);
    const adjustments=S.purchases.filter(p=>p.name===r.name&&p.type!=='purchase'&&p.type!=='opening').reduce((a,p)=>a+p.qty,0);
    const usedHistory=S.ledger.reduce((a,day)=>a+(day.rawLog||[]).filter(rl=>rl.name===r.name).reduce((b,rl)=>b+rl.qty,0),0);
    const usedToday=S.rawLog.filter(rl=>rl.name===r.name).reduce((a,rl)=>a+rl.qty,0);
    const balance=opening+purchased+adjustments-usedHistory-usedToday;
    matSummary[r.name]={name:r.name,unit:r.unit,opening,purchased,adjustments,used:usedHistory+usedToday,balance,reorder:s?s.reorder:100};
  });

  document.getElementById('rmp-summary').innerHTML=`
    <table class="tbl"><thead><tr>
      <th>Material</th><th class="num">Opening</th><th class="num">+ Purchased</th>
      <th class="num">± Adjustments</th><th class="num">− Used</th>
      <th class="num">Balance</th><th>Unit</th><th>Status</th>
    </tr></thead><tbody>
    ${Object.values(matSummary).map(m=>{
      const crit=m.reorder>0&&m.balance<=m.reorder;
      return`<tr class="${crit?'tr-l':''}">
        <td style="font-weight:500;color:#111827">${m.name}</td>
        <td class="num">${m.opening}</td>
        <td class="num" style="color:#065F46">${m.purchased>0?'+'+m.purchased:'—'}</td>
        <td class="num" style="color:#1E40AF">${m.adjustments!==0?m.adjustments:'—'}</td>
        <td class="num" style="color:#B91C1C">${m.used>0?'-'+m.used:'—'}</td>
        <td class="num" style="font-weight:700;color:${crit?'#B91C1C':'#065F46'}">${m.balance.toFixed(1)} ${m.unit}</td>
        <td style="color:#9CA3AF">${m.unit}</td>
        <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${crit?'#FEF2F2':'#ECFDF5'};color:${crit?'#B91C1C':'#065F46'};border:1px solid ${crit?'#FECACA':'#A7F3D0'}">${crit?'LOW':'OK'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table>`;

  // History
  const entries2=filterMat==='all'?S.purchases:S.purchases.filter(p=>p.name===filterMat);
  const sorted=[...entries2].sort((a,b)=>b.date.localeCompare(a.date));
  const typeColor={opening:'#1E40AF',purchase:'#065F46',return:'#6B21A8',wastage:'#B91C1C',adjustment:'#B45309'};
  const typeBg={opening:'#EFF6FF',purchase:'#ECFDF5',return:'#FAF5FF',wastage:'#FEF2F2',adjustment:'#FFFBEB'};
  document.getElementById('rmp-history').innerHTML=sorted.length?`
    <table class="tbl"><thead><tr>
      <th>Date</th><th>Type</th><th>Material</th><th class="num">Qty</th><th class="num">Unit Cost ₹</th><th>Supplier / Note</th>
    </tr></thead><tbody>
    ${sorted.map(p=>`<tr>
      <td style="font-family:var(--mono);font-size:11px;color:#6B7280">${p.date}</td>
      <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${typeBg[p.type]||'#F9FAFB'};color:${typeColor[p.type]||'#374151'}">${p.type.toUpperCase()}</span></td>
      <td style="font-weight:500;color:#111827">${p.name}</td>
      <td class="num" style="font-weight:600;color:${p.qty>=0?'#065F46':'#B91C1C'}">${p.qty>=0?'+':''}${p.qty} ${p.unit}</td>
      <td class="num">${p.cost?fmt(p.cost):'—'}</td>
      <td style="font-size:11px;color:#6B7280">${p.note||'—'}</td>
    </tr>`).join('')}
    </tbody></table>`
  :'<div style="color:#9CA3AF;font-size:12px">No entries yet. Click + Add Purchase / Opening Stock to start.</div>';
}

function initFGStock(){
  if(!S.fgStock) S.fgStock={};
  if(!S.fgTransfers) S.fgTransfers=[];
  if(!S.fgAdjustments) S.fgAdjustments=[];
  persist();
}


function switchFGStage(stage){
  activeFGStage=stage;
  document.querySelectorAll('#fg-stage-tabs .tab').forEach(t=>{
    const s=t.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    t.classList.toggle('active',s===stage);
  });
  renderFGStock();
}

function renderFGStock(){
  initFGStock();
  // Collect all products that have any stock across any stage
  const allProducts=new Set();
  S.fg.forEach(f=>allProducts.add(f.name));
  // Also from production logs
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>allProducts.add(p.name))));
  S.ledger.forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>allProducts.add(p.name)))));

  const stagesToShow=activeFGStage==='all'?FG_STAGES:[activeFGStage];
  const stageColors={Moulding:'#EFF6FF|#1D4ED8|#BFDBFE',Finishing:'#FFFBEB|#B45309|#FDE68A',Painting:'#ECFDF5|#065F46|#A7F3D0',Packing:'#FAF5FF|#6B21A8|#E9D5FF'};

  let html2='';
  stagesToShow.forEach(stage=>{
    const [bg,color,border]=stageColors[stage].split('|');
    // Products with stock at this stage
    const stageProds=[...allProducts].map(name=>({name,qty:getFGBalance(name,stage)})).filter(p=>p.qty>0);
    const totalQty=stageProds.reduce((a,p)=>a+p.qty,0);
    const totalVal=stageProds.reduce((a,p)=>{
      // For colour variants like "Garden Pot L — Orange", look up base name
      const baseName = p.name.includes(' — ') ? p.name.split(' — ')[0] : p.name;
      const fg=S.fg.find(f=>f.name===p.name)||S.fg.find(f=>f.name===baseName);
      return a+(fg?p.qty*fg.price:0);
    },0);

    html2+=`<div class="card" style="border-left:3px solid ${border};margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="background:${bg};color:${color};border:1px solid ${border};padding:4px 12px;border-radius:20px;font-family:var(--mono);font-size:10px;font-weight:700">${stage.toUpperCase()}</span>
          <span style="font-size:12px;color:#6B7280">${stageProds.length} products · ${totalQty} units</span>
        </div>
        <div style="font-family:var(--mono);font-size:14px;font-weight:700;color:#065F46">${fmt(totalVal)}</div>
      </div>
      ${stageProds.length?`<table class="tbl"><thead><tr>
        <th>Product</th><th class="num">Qty in ${stage}</th><th class="num">Selling ₹/unit</th><th class="num">Stock Value ₹</th>
        <th>Action</th>
      </tr></thead><tbody>
      ${stageProds.map(p=>{
        const fg=S.fg.find(f=>f.name===p.name);
        const val=fg?p.qty*fg.price:0;
        const nextStage=FG_STAGES[FG_STAGES.indexOf(stage)+1]||'Dispatch';
        return`<tr>
          <td style="font-weight:500;color:#111827">${p.name}</td>
          <td class="num" style="font-weight:700;font-size:14px;color:#111827">${p.qty}</td>
          <td class="num">${fg?fmtN(fg.price):'—'}</td>
          <td class="num">${fmtN(val)}</td>
          <td style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn btn-sm" style="background:${bg};color:${color};border-color:${border};font-size:11px" onclick="quickTransfer('${stage}','${nextStage}','${p.name}',${p.qty})">→ ${nextStage}</button>
            ${stage==='Packing'?`<button class="btn btn-sm btn-jade" onclick="openAssignModal('${p.name}',${p.qty},'fgstock')">📋 Assign to Order</button>`:''}
          </td>
        </tr>`;
      }).join('')}
      </tbody></table>`:'<div style="color:#9CA3AF;font-size:12px;padding:8px 0">No stock at this stage yet.</div>'}
    </div>`;
  });

  document.getElementById('fg-stock-content').innerHTML=html2||'<div style="color:#9CA3AF;font-size:12px">No finished goods stock yet.</div>';

  // History
  const allMoves=[];
  (S.fgTransfers||[]).forEach(t=>allMoves.push({date:t.date,type:'Transfer',from:t.from,to:t.to,product:t.product,qty:t.qty,note:t.note||''}));
  (S.fgAdjustments||[]).forEach(a=>allMoves.push({date:a.date,type:'Adjustment',from:a.stage,to:'—',product:a.product,qty:a.qty,note:a.note||''}));
  allMoves.sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById('fg-history').innerHTML=allMoves.length?`
    <table class="tbl"><thead><tr>
      <th>Date</th><th>Type</th><th>Product</th><th class="num">Qty</th><th>From</th><th>To</th><th>Note</th>
    </tr></thead><tbody>
    ${allMoves.slice(0,50).map(m=>`<tr>
      <td style="font-family:var(--mono);font-size:11px;color:#6B7280">${m.date}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${m.type==='Transfer'?'#EFF6FF':'#FFFBEB'};color:${m.type==='Transfer'?'#1D4ED8':'#B45309'}">${m.type}</span></td>
      <td style="font-weight:500;color:#111827">${m.product}</td>
      <td class="num" style="font-weight:600">${m.qty}</td>
      <td>${m.from?`<span class="sp sp${FG_STAGES.indexOf(m.from)}">${m.from}</span>`:'—'}</td>
      <td>${m.to&&m.to!=='—'?`<span class="sp sp${FG_STAGES.indexOf(m.to)}">${m.to}</span>`:m.to||'—'}</td>
      <td style="font-size:11px;color:#6B7280">${m.note||'—'}${m.auto?'<span style="font-family:var(--mono);font-size:9px;background:#EFF6FF;color:#1D4ED8;padding:1px 5px;border-radius:10px;margin-left:4px">AUTO</span>':''}</td>
    </tr>`).join('')}
    </tbody></table>`
  :'<div style="color:#9CA3AF;font-size:12px">No transfers recorded yet.</div>';
}

function quickTransfer(from, to, product, maxQty){
  const qty=parseInt(prompt(`Transfer "${product}" from ${from} to ${to}
Available: ${maxQty} units
Enter quantity to transfer:`));
  if(!qty||isNaN(qty)||qty<=0) return;
  if(qty>maxQty){alert(`Only ${maxQty} units available in ${from}.`);return;}
  S.fgTransfers.push({id:uid(),date:todayStr(),from,to,product,qty,note:'Quick transfer'});
  persist();renderFGStock();
  alert(`✓ ${qty} × ${product} moved from ${from} to ${to}`);
}

function openFGTransfer(){
  initFGStock();
  const sel=document.getElementById('fgt-prod');
  sel.innerHTML=S.fg.map(f=>`<option value="${f.name}">${f.name}</option>`).join('');
  document.getElementById('fgt-date').value=todayStr();
  document.getElementById('fg-transfer-form').style.display='block';
  document.getElementById('fg-transfer-form').scrollIntoView({behavior:'smooth'});
}

function closeFGTransfer(){document.getElementById('fg-transfer-form').style.display='none';}

function updateFGTransferTo(){
  const from=document.getElementById('fgt-from').value;
  const toSel=document.getElementById('fgt-to');
  const idx=FG_STAGES.indexOf(from);
  toSel.innerHTML=FG_STAGES.slice(idx+1).map(s=>`<option value="${s}">${s}</option>`).join('')+'<option value="Dispatch">Dispatch (Sold)</option>';
}

function saveFGTransfer(){
  initFGStock();
  const from=document.getElementById('fgt-from').value;
  const to=document.getElementById('fgt-to').value;
  const prod=document.getElementById('fgt-prod').value;
  const qty=parseInt(document.getElementById('fgt-qty').value)||0;
  const date=document.getElementById('fgt-date').value||todayStr();
  const note=document.getElementById('fgt-note').value.trim();
  if(!prod||!qty){alert('Select product and enter quantity.');return;}
  const available=getFGBalance(prod,from);
  if(qty>available){alert(`Only ${available} units of "${prod}" available in ${from}.`);return;}
  S.fgTransfers.push({id:uid(),date,from,to,product:prod,qty,note});
  persist();closeFGTransfer();renderFGStock();
  alert(`✓ ${qty} × ${prod} transferred: ${from} → ${to}`);
}

function openFGAdjust(){
  initFGStock();
  const sel=document.getElementById('fga-prod');
  sel.innerHTML=S.fg.map(f=>`<option value="${f.name}">${f.name}</option>`).join('');
  document.getElementById('fg-adjust-form').style.display='block';
}

function closeFGAdjust(){document.getElementById('fg-adjust-form').style.display='none';}

function saveFGAdjust(){
  initFGStock();
  const stage=document.getElementById('fga-stage').value;
  const prod=document.getElementById('fga-prod').value;
  const qty=parseFloat(document.getElementById('fga-qty').value)||0;
  const note=document.getElementById('fga-note').value.trim();
  if(!prod||!qty){alert('Select product and enter quantity.');return;}
  S.fgAdjustments.push({id:uid(),date:todayStr(),stage,product:prod,qty,note});
  persist();closeFGAdjust();renderFGStock();
  alert(`✓ Adjustment saved: ${prod} ${qty>0?'+':''}${qty} at ${stage}`);
}

function getAllFGProducts(){
  const all=new Set();
  S.fg.forEach(f=>all.add(f.name));
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>all.add(p.name))));
  S.ledger.forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>all.add(p.name)))));
  (S.fgTransfers||[]).forEach(t=>{all.add(t.product);});
  return [...all].sort();
}

function renderInventory(){
  initFGStock();
  if(!S.purchases) S.purchases=[];

  const today = S.workDate||todayStr();
  const el = document.getElementById('inv-date-label');
  if(el) el.textContent = 'All-time inventory — updated live · ' + new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  // ── SEARCH BOX ──
  const searchBox = document.getElementById('inv-search');
  const q = (searchBox ? searchBox.value : '').toLowerCase().trim();

  // ── RM BALANCE HELPER ──
  function getRMBalance(name){
    const s=S.stock.find(st=>st.name===name);
    const opening=s?s.opening:0;
    const purchased=(S.purchases||[]).filter(p=>p.name===name&&p.qty>0).reduce((a,p)=>a+p.qty,0);
    const wastage=(S.purchases||[]).filter(p=>p.name===name&&p.qty<0).reduce((a,p)=>a+p.qty,0);
    const usedHistory=S.ledger.reduce((a,day)=>a+(day.rawLog||[]).filter(r=>r.name===name).reduce((b,r)=>b+r.qty,0),0);
    const usedToday=S.rawLog.filter(r=>r.name===name).reduce((a,r)=>a+r.qty,0);
    return opening+purchased+wastage-usedHistory-usedToday;
  }

  // ── FG CUMULATIVE BALANCE (all time including all saved days) ──
  function getFGCumulative(productName, stage){
    return getFGBalance(productName, stage);
  }

  // ── HEALTH METRICS ──
  const rmItems = S.rm.map(r=>({name:r.name,unit:r.unit,bal:getRMBalance(r.name),reorder:(S.stock.find(st=>st.id===r.id)||{}).reorder||0}));
  const rmLow = rmItems.filter(r=>r.reorder>0&&r.bal<=r.reorder).length;
  const allProds = getAllFGProducts();
  const fgPipeline = ['Moulding','Finishing','Painting'].reduce((a,st)=>a+allProds.filter(p=>getFGCumulative(p,st)>0).length,0);
  const fgReady = allProds.filter(p=>getFGCumulative(p,'Packing')>0).length;
  const fgVal = allProds.reduce((a,p)=>{
    const fg=S.fg.find(f=>f.name===p)||S.fg.find(f=>f.name===(p.includes(' — ')?p.split(' — ')[0]:p));
    const qty=FG_STAGES.reduce((b,st)=>b+getFGCumulative(p,st),0);
    return a+(fg?qty*fg.price:0);
  },0);

  document.getElementById('inv-health').innerHTML=`
    <div class="met ${rmLow?'m-red':'m-green'}"><div class="ml">RM Low Alerts</div><div class="mv ${rmLow?'r':'g'}">${rmLow}</div></div>
    <div class="met m-blue"><div class="ml">FG in Pipeline</div><div class="mv b">${fgPipeline}</div></div>
    <div class="met m-green"><div class="ml">Ready to Dispatch</div><div class="mv g">${fgReady}</div></div>
    <div class="met m-amber"><div class="ml">Total FG Value</div><div class="mv a">${fmt(fgVal)}</div></div>`;

  // ── RM TABLE ──
  const rmFiltered = rmItems.filter(r=>!q||r.name.toLowerCase().includes(q));
  document.getElementById('inv-rm').innerHTML = rmFiltered.length ? `
    <table class="tbl"><thead><tr>
      <th>#</th><th>Material</th><th class="num">Balance</th><th class="num">Used Today</th>
      <th>Unit</th><th class="num">Reorder Level</th><th>Status</th>
    </tr></thead><tbody>
    ${rmFiltered.map((r,i)=>{
      const usedToday=S.rawLog.filter(rl=>rl.name===r.name).reduce((a,rl)=>a+rl.qty,0);
      return`<tr class="${r.reorder>0&&r.bal<=r.reorder?'tr-l':''}">
        <td style="color:var(--text4)">${i+1}</td>
        <td style="font-weight:500;color:var(--text)">${r.name}</td>
        <td class="num" style="font-weight:700;font-size:14px;color:${r.reorder>0&&r.bal<=r.reorder?'var(--ember)':'var(--jade)'}">${r.bal.toFixed(1)}</td>
        <td class="num" style="color:${usedToday?'var(--ember)':'var(--text4)'}">${usedToday?'-'+usedToday:'—'}</td>
        <td style="color:var(--text3)">${r.unit}</td>
        <td class="num" style="color:var(--text4)">${r.reorder||'—'}</td>
        <td><span class="badge ${r.reorder>0&&r.bal<=r.reorder?'b-ember':'b-jade'}">${r.reorder>0&&r.bal<=r.reorder?'🚨 REORDER':'✓ OK'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table>`
  : '<div style="color:var(--text4);font-size:12px">No RM data found.</div>';

  // ── STAGE TRANSITIONS (recent) ──
  const yesterday = new Date(today+'T00:00:00');
  yesterday.setDate(yesterday.getDate()-1);
  const yd = yesterday.toISOString().slice(0,10);
  const recentTransfers = (S.fgTransfers||[]).filter(t=>t.date===yd||t.date===today);

  if(!recentTransfers.length){
    document.getElementById('inv-transitions').innerHTML='<div style="color:var(--text4);font-size:12px">No stage transitions recorded yet. Use FG Stock → Transfer to record movements.</div>';
  } else {
    const groups={};
    recentTransfers.forEach(t=>{
      const key=t.from+'→'+t.to;
      if(!groups[key]){groups[key]={from:t.from,to:t.to,items:[]};}
      groups[key].items.push(t);
    });
    document.getElementById('inv-transitions').innerHTML=Object.values(groups).map(g=>`
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
          <span class="sp sp${FG_STAGES.indexOf(g.from)}">${g.from}</span>
          <span style="color:var(--text4);font-size:16px">→</span>
          <span class="sp sp${FG_STAGES.indexOf(g.to)}">${g.to}</span>
          <span style="font-size:11px;color:var(--text3)">${g.items.length} product${g.items.length!==1?'s':''} moved</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${g.items.map(t=>`<span style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:11px">
            <b style="color:var(--text)">${t.product}</b>
            <span style="color:var(--ember);font-family:var(--mono);font-weight:700"> −${t.qty}</span>
            <span style="color:var(--text4)"> from ${t.from}</span>
            <span style="color:var(--jade);font-family:var(--mono);font-weight:700"> +${t.qty}</span>
            <span style="color:var(--text4)"> to ${t.to}</span>
          </span>`).join('')}
        </div>
      </div>`).join('');
  }

  // ── CUMULATIVE FG TABLE (all time, with search) ──
  const prodsWithStock = allProds.filter(p=>{
    const hasStock = FG_STAGES.some(st=>getFGCumulative(p,st)>0);
    const matchesSearch = !q || p.toLowerCase().includes(q);
    return hasStock && matchesSearch;
  });

  // Total ever produced (all stages combined, all time)
  function getTotalEverProduced(productName){
    const today = S.sessions.reduce((a,ss)=>{
      return a+(ss.teams||[]).reduce((b,t)=>b+t.production.filter(p=>p.name===productName).reduce((c,p)=>c+p.qty,0),0);
    },0);
    const history = S.ledger.reduce((a,day)=>{
      return a+(day.sessions||[]).reduce((b,ss)=>b+(ss.teams||[]).reduce((c,t)=>c+t.production.filter(p=>p.name===productName).reduce((d,p)=>d+p.qty,0),0),0);
    },0);
    return today + history;
  }

  if(!prodsWithStock.length){
    document.getElementById('inv-fg').innerHTML = q
      ? `<div style="color:var(--text4);font-size:12px">No products matching "<b>${q}</b>" found in inventory.</div>`
      : '<div style="color:var(--text4);font-size:12px">No finished goods in stock yet. Production logged by supervisors will appear here.</div>';
  } else {
    document.getElementById('inv-fg').innerHTML=`
      <div style="overflow-x:auto">
      <table class="tbl" style="min-width:800px"><thead><tr>
        <th>Product</th>
        <th class="num" style="background:#EFF6FF;color:#1D4ED8">Moulding</th>
        <th class="num" style="background:#FFFBEB;color:#92400E">Finishing</th>
        <th class="num" style="background:#ECFDF5;color:#065F46">Painting</th>
        <th class="num" style="background:#F5F3FF;color:#5B21B6">Packing ✓</th>
        <th class="num">Total Stock</th>
        <th class="num">Ever Made</th>
        <th class="num">₹/unit</th>
        <th class="num">Stock Value</th>
        <th>Movements</th>
      </tr></thead><tbody>
      ${prodsWithStock.map(p=>{
        const qtys = FG_STAGES.map(st=>getFGCumulative(p,st));
        const total = qtys.reduce((a,q2)=>a+q2,0);
        const everMade = getTotalEverProduced(p);
        const baseName = p.includes(' — ')?p.split(' — ')[0]:p;
        const fg = S.fg.find(f=>f.name===p)||S.fg.find(f=>f.name===baseName);
        const val = fg?total*fg.price:0;
        // Recent transfers for this product
        const recentT = (S.fgTransfers||[]).filter(t=>(t.product===p||t.productIn===p)&&(t.date===today||t.date===yd));
        const transStr = recentT.map(t=>`<span style="font-size:9px;white-space:nowrap;display:inline-flex;align-items:center;gap:2px;background:var(--surface2);padding:2px 6px;border-radius:20px;margin:1px;border:1px solid var(--border)">
          <span style="color:var(--ember);font-weight:700">−${t.qty}</span>
          <span style="color:var(--text4)">${(t.from||'').slice(0,4)}</span>
          <span style="color:var(--text4)">→</span>
          <span style="color:var(--jade);font-weight:700">+${t.qty}</span>
          <span style="color:var(--text4)">${(t.to||'').slice(0,4)}</span>
        </span>`).join('');
        return`<tr>
          <td style="font-weight:500;color:var(--text)">${p}</td>
          ${qtys.map((q2,i)=>`<td class="num" style="font-weight:${q2>0?'700':'400'};color:${q2>0?'var(--text)':'#E5E7EB'}">${q2>0?q2:'—'}</td>`).join('')}
          <td class="num" style="font-weight:700;color:var(--text)">${total}</td>
          <td class="num" style="color:var(--text4);font-family:var(--mono)">${everMade}</td>
          <td class="num" style="color:var(--text3)">${fg?fmtN(fg.price):'—'}</td>
          <td class="num" style="color:var(--jade);font-weight:600">${val?fmtN(val):'—'}</td>
          <td style="min-width:100px">${transStr||'<span style="color:#E5E7EB;font-size:10px">—</span>'}</td>
        </tr>`;
      }).join('')}
      </tbody></table>
      <div style="font-family:var(--mono);font-size:10px;color:var(--text4);margin-top:10px;text-align:right">
        ${prodsWithStock.length} product${prodsWithStock.length!==1?'s':''} · Total value: ${fmt(prodsWithStock.reduce((a,p)=>{const qtys=FG_STAGES.map(st=>getFGCumulative(p,st));const total=qtys.reduce((b,q2)=>b+q2,0);const baseName=p.includes(' — ')?p.split(' — ')[0]:p;const fg=S.fg.find(f=>f.name===p)||S.fg.find(f=>f.name===baseName);return a+(fg?total*fg.price:0);},0))}
      </div>
      </div>`;
  }

  // Alerts
  const alerts=[];
  rmItems.filter(r=>r.reorder>0&&r.bal<=r.reorder).forEach(r=>alerts.push(`<div class="alert-banner danger">🚨 <b>${r.name}</b> — ${r.bal.toFixed(1)} ${r.unit} left (reorder: ${r.reorder})</div>`));
  const packingGoods = allProds.filter(p=>getFGCumulative(p,'Packing')>0);
  if(packingGoods.length) alerts.push(`<div class="alert-banner ok">✅ <b>${packingGoods.length} product${packingGoods.length!==1?'s':''}</b> ready in Packing — ready to dispatch</div>`);
  document.getElementById('inv-alerts').innerHTML=alerts.join('');
}

// NOTE: a second calcOT() used to live here. It read the legacy `worker.ot`
// field and, being the later declaration, silently overrode the real one —
// so every OT figure resolved to 0. The single implementation now lives with
// the other money helpers near uid(). Do not redeclare it here.


// ════════════════════════════════════
// DOCUMENTS — QUOTATION / INVOICE / CHALLAN
// ════════════════════════════════════
let docItems = [];
let docCounter = { quotation:1, invoice:1, challan:1 };

// ════ SALARY MANAGEMENT ════
let salActiveLab = null;
let salActiveMonth = null;

// ── MONTHLY SALARY — single source of truth ──
// Both the Salary screen and the Excel/Sheets export read from here, so
// the two can never disagree again. They previously used different OT
// formulas and produced different payroll figures for the same month.

function renderSalary(){
  const monthEl = document.getElementById('sal-month');
  if(!monthEl) return;
  const month = monthEl.value || todayStr().slice(0,7);
  salActiveMonth = month;

  const {rows, totals} = computeSalaryMonth(month);
  const totalGross=totals.gross, totalAdv=totals.adv,
        totalDed=totals.ded,     totalNet=totals.net;

  document.getElementById('sal-metrics').innerHTML=`
    <div class="met m-blue"><div class="ml">Total Workers</div><div class="mv w">${S.lab.length}</div></div>
    <div class="met m-green"><div class="ml">Total Gross</div><div class="mv g">${fmt(totalGross)}</div></div>
    <div class="met m-amber"><div class="ml">Total Advances</div><div class="mv a">${fmt(totalAdv)}</div></div>
    <div class="met m-red"><div class="ml">Total Deductions</div><div class="mv r">${fmt(totalDed)}</div></div>
    <div class="met m-green"><div class="ml">Net Payable</div><div class="mv g" style="font-size:20px">${fmt(totalNet)}</div></div>`;

  document.getElementById('sal-tbody').innerHTML = rows.map(({l,days,otHrs,otAmt,gross,adv,ded,net,i})=>`
    <tr>
      <td style="color:var(--text4);font-family:var(--mono)">${i+1}</td>
      <td style="font-weight:600">${l.name}</td>
      <td style="color:var(--text3);font-size:11px">${l.role}</td>
      <td class="num">₹${fmtN(l.wage)}</td>
      <td class="num">${days}</td>
      <td class="num">${otHrs?otHrs+'h':'—'}</td>
      <td class="num">${otAmt?fmt(otAmt):'—'}</td>
      <td class="num pv">${fmt(gross)}</td>
      <td class="num" style="color:var(--amber)">${adv?fmt(adv):'—'}</td>
      <td class="num lv">${ded?fmt(ded):'—'}</td>
      <td class="num pv" style="font-weight:700">${fmt(net)}</td>
      <td><button class="btn btn-sm" onclick="openSalModal(${l.id})">✏️</button></td>
    </tr>`).join('');

  document.getElementById('sal-tfoot').innerHTML=`
    <td colspan="7">TOTAL</td>
    <td class="num pv">${fmt(totalGross)}</td>
    <td class="num" style="color:var(--amber)">${fmt(totalAdv)}</td>
    <td class="num lv">${fmt(totalDed)}</td>
    <td class="num pv" style="font-weight:800;font-size:14px">${fmt(totalNet)}</td>
    <td></td>`;
}

function openSalModal(labId){
  salActiveLab = labId;
  const l = S.lab.find(x=>x.id===labId);
  if(!l) return;
  const month = document.getElementById('sal-month').value||todayStr().slice(0,7);
  const adj = (S.salaryAdj[month]||{})[labId]||{};
  document.getElementById('sal-modal-name').textContent = l.name;
  document.getElementById('sal-advance').value = adj.advance||'';
  document.getElementById('sal-deduction').value = adj.deduction||'';
  document.getElementById('sal-note').value = adj.note||'';
  document.getElementById('sal-modal').style.display='flex';
}

function closeSalModal(){ document.getElementById('sal-modal').style.display='none'; }

function saveSalAdj(){
  const month = document.getElementById('sal-month').value||todayStr().slice(0,7);
  if(!S.salaryAdj) S.salaryAdj={};
  if(!S.salaryAdj[month]) S.salaryAdj[month]={};
  S.salaryAdj[month][salActiveLab]={
    advance: parseFloat(document.getElementById('sal-advance').value)||0,
    deduction: parseFloat(document.getElementById('sal-deduction').value)||0,
    note: document.getElementById('sal-note').value.trim()
  };
  persist();
  closeSalModal();
  renderSalary();
}

function exportSalaryExcel(){
  if(!checkXLSX()) return;
  const month = (document.getElementById('sal-month')||document.getElementById('export-sal-month'))?.value||todayStr().slice(0,7);
  // Same computation the Salary screen uses — the two cannot diverge.
  const {rows} = computeSalaryMonth(month);

  const aoa=[['#','Worker','Role','Daily Wage','Days Present','OT Days','OT Hours','OT Amount','Gross Pay','Advance','Deduction','Net Pay','Note']];
  rows.forEach(r=>aoa.push([
    r.i+1, r.l.name, r.l.role, r.l.wage, r.days, r.otDay, r.otHrs,
    r.otAmt, r.gross, r.adv, r.ded, r.net, r.note
  ]));
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Salary '+month);
  downloadXLSX(wb,'Salary_'+month+'.xlsx');

  // Also sync to Google Sheets Monthly Salary tab
  if(S.sheetsUrl){
    const workers=rows.map(r=>({
      name:r.l.name, role:r.l.role, days:r.days, otDays:r.otDay,
      wage:r.l.wage, gross:r.gross, advance:r.adv, deduction:r.ded, net:r.net
    }));
    const payload={action:'monthlySalary',month,workers};
    sendGet(S.sheetsUrl,'action=monthlySalary&payload='+encodeURIComponent(JSON.stringify(payload)));
    alert('✓ Salary exported to Excel and synced to Google Sheets → Monthly Salary tab');
  }
}

// ════ DISPATCH MANAGER ════
function renderDispatch(){
  // Pending/ready orders
  const readyOrders = S.orders.filter(o=>o.status==='ready'||o.status==='production');
  const pendingEl = document.getElementById('dispatch-pending-orders');
  if(pendingEl){
    pendingEl.innerHTML = readyOrders.length ? readyOrders.map(o=>`
      <div class="card" style="border-left:3px solid var(--jade);margin-bottom:10px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-weight:700;font-size:14px">${o.customer} <span style="font-family:var(--mono);font-size:9px;color:var(--text4)">${o.id}</span></div>
            <div style="font-size:12px;color:var(--text3);margin-top:3px">${o.items||'—'} · ${o.city||'—'}</div>
            <div style="font-size:11px;color:var(--text4);font-family:var(--mono);margin-top:2px">Balance: ${fmt(o.amount-o.advance)}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <span style="font-size:10px;padding:2px 10px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-family:var(--mono);font-weight:700">${o.status.toUpperCase()}</span>
            <button class="btn btn-sm btn-jade" onclick="doDispatch('${o.id}')">🚚 Dispatch Now</button>
          </div>
        </div>
      </div>`).join('')
    : '<div class="wbox">No orders ready to dispatch. Mark orders as Ready from the Orders screen first.</div>';
  }

  // Dispatch history
  const hist = document.getElementById('dispatch-history');
  if(hist){
    const dispatched = (S.dispatches||[]).slice().reverse();
    hist.innerHTML = dispatched.length ? `<div class="tw"><table class="tbl">
      <thead><tr><th>Date</th><th>Order ID</th><th>Customer</th><th>Items</th><th class="num">Amount</th><th>Challan</th></tr></thead>
      <tbody>${dispatched.map(d=>`<tr>
        <td style="font-family:var(--mono);font-size:11px">${d.date}</td>
        <td style="font-family:var(--mono);font-size:11px;color:var(--text4)">${d.orderId}</td>
        <td style="font-weight:600">${d.customer}</td>
        <td style="font-size:11px;color:var(--text3)">${d.items||'—'}</td>
        <td class="num pv">${fmt(d.amount||0)}</td>
        <td><span style="font-family:var(--mono);font-size:10px;color:var(--text4)">${d.challan||'—'}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div style="color:var(--text4);font-size:12px;padding:8px 0">No dispatches yet.</div>';
  }
}

function doDispatch(ordId){
  const o = S.orders.find(x=>x.id===ordId);
  if(!o) return;
  const challan = prompt(`Dispatch order for ${o.customer}?\n\nEnter Challan/DC Number (or leave blank):`, 'DC-'+Date.now().toString().slice(-4));
  if(challan===null) return; // cancelled
  // Record dispatch
  if(!S.dispatches) S.dispatches=[];
  S.dispatches.push({
    id:uid(), date:todayStr(), orderId:o.id,
    customer:o.customer, items:o.items,
    amount:o.amount, advance:o.advance,
    balance:o.amount-o.advance,
    challan:challan||'', city:o.city
  });
  // Update order status → dispatched (this also deducts Packing stock via updateOrderStatus)
  updateOrderStatus(ordId,'dispatched');
  persist();
  renderDispatch();
  alert(`✓ Dispatched to ${o.customer}${challan?' — Challan: '+challan:''}`);
}

// ════ BILL OF MATERIALS ════
let bomEditProduct = null;
let bomRMRows = [];

function renderBOM(){
  if(!S.bom) S.bom={};
  const el = document.getElementById('bom-list');
  if(!el) return;
  const keys = Object.keys(S.bom);
  el.innerHTML = keys.length ? `<div class="tw"><table class="tbl">
    <thead><tr><th>Product</th><th>Raw Materials</th><th>Auto Deduct</th><th>Action</th></tr></thead>
    <tbody>${keys.map(prod=>{
      const mats = S.bom[prod]||[];
      return`<tr>
        <td style="font-weight:600">${prod}</td>
        <td style="font-size:11px;color:var(--text3)">${mats.map(m=>`${m.qty} ${m.unit} ${m.name}`).join(' + ')||'—'}</td>
        <td><span class="badge b-jade">Auto ✓</span></td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-sm btn-blue" onclick="editBOM('${prod.replace(/'/g,"\\'")}')">✏️ Edit</button>
          <button class="btn btn-sm btn-ember" onclick="deleteBOM('${prod.replace(/'/g,"\\'")}')">✕</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`
  : '<div class="wbox">No BOM defined yet. Click + Add Product BOM to start.</div>';
}

function addBOMRow(){
  bomEditProduct=null; bomRMRows=[];
  document.getElementById('bom-prod-search').value='';
  document.getElementById('bom-form-title').textContent='Add Product BOM';
  renderBOMRMRows();
  document.getElementById('bom-form-wrap').style.display='block';
  document.getElementById('bom-form-wrap').scrollIntoView({behavior:'smooth'});
}

function editBOM(prod){
  bomEditProduct=prod;
  bomRMRows=(S.bom[prod]||[]).map(m=>({...m}));
  document.getElementById('bom-prod-search').value=prod;
  document.getElementById('bom-form-title').textContent='Edit BOM: '+prod;
  renderBOMRMRows();
  document.getElementById('bom-form-wrap').style.display='block';
  document.getElementById('bom-form-wrap').scrollIntoView({behavior:'smooth'});
}

function deleteBOM(prod){ if(confirm('Delete BOM for '+prod+'?')){delete S.bom[prod];persist();renderBOM();} }
function closeBOMForm(){ document.getElementById('bom-form-wrap').style.display='none'; }

function filterBOMProducts(){
  const q=document.getElementById('bom-prod-search').value.trim().toLowerCase();
  const dd=document.getElementById('bom-prod-dropdown');
  if(!q){dd.style.display='none';return;}
  const matches=S.fg.filter(p=>p.name.toLowerCase().includes(q)).slice(0,15);
  if(!matches.length){dd.style.display='none';return;}
  dd.innerHTML=matches.map(p=>`<div onclick="selectBOMProd('${p.name.replace(/'/g,"\\'")}');" style="padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">${p.name}</div>`).join('');
  dd.style.display='block';
}

function selectBOMProd(name){
  document.getElementById('bom-prod-search').value=name;
  document.getElementById('bom-prod-dropdown').style.display='none';
}

function addBOMRM(){
  bomRMRows.push({name:'',qty:0,unit:'kg'});
  renderBOMRMRows();
}

function renderBOMRMRows(){
  document.getElementById('bom-rm-rows').innerHTML = bomRMRows.map((r,i)=>`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <select onchange="bomRMRows[${i}].name=this.value;bomRMRows[${i}].unit=S.rm.find(m=>m.name===this.value)?.unit||'kg'" style="flex:2;padding:7px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text);font-size:12px">
        <option value="">Select RM</option>
        ${S.rm.map(m=>`<option value="${m.name}" ${r.name===m.name?'selected':''}>${m.name} (${m.unit})</option>`).join('')}
      </select>
      <input type="number" value="${r.qty}" min="0" step="0.01" placeholder="Qty" onchange="bomRMRows[${i}].qty=parseFloat(this.value)||0" style="width:80px;padding:7px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text);font-size:12px">
      <span style="font-family:var(--mono);font-size:11px;color:var(--text4);min-width:30px">${r.unit||'kg'}</span>
      <button class="btn btn-sm btn-ember" onclick="bomRMRows.splice(${i},1);renderBOMRMRows()">✕</button>
    </div>`).join('');
}

function saveBOM(){
  const prod=document.getElementById('bom-prod-search').value.trim();
  if(!prod){alert('Select a product first.');return;}
  const valid=bomRMRows.filter(r=>r.name&&r.qty>0);
  if(!valid.length){alert('Add at least one RM with quantity.');return;}
  if(!S.bom) S.bom={};
  S.bom[prod]=valid;
  persist();
  closeBOMForm();
  renderBOM();
  alert(`✓ BOM saved for ${prod}. RM will now auto-deduct when this product is logged in production.`);
}

// ════ EXCEL EXPORTS ════
function renderExportPage(){
  const m=document.getElementById('export-sal-month');
  if(m) m.value=todayStr().slice(0,7);
  setExpRange('month');
}

function setExpRange(preset){
  const from=document.getElementById('exp-from');
  const to=document.getElementById('exp-to');
  if(!from||!to) return;
  const today=todayStr();
  if(preset==='today'){ from.value=today; to.value=today; }
  else if(preset==='week'){const d=new Date();d.setDate(d.getDate()-6);from.value=d.toISOString().slice(0,10);to.value=today;}
  else if(preset==='month'){from.value=today.slice(0,7)+'-01';to.value=today;}
  else if(preset==='all'){from.value='2020-01-01';to.value=today;}
}

function getExpDates(){
  const from=document.getElementById('exp-from')?.value||'2020-01-01';
  const to=document.getElementById('exp-to')?.value||todayStr();
  return{from,to};
}

function inRange(date,from,to){ return date>=from&&date<=to; }

function checkXLSX(){
  if(typeof XLSX==='undefined'){alert('Excel export unavailable — check internet connection.');return false;}
  return true;
}

function downloadXLSX(wb, filename){
  try{
    const wbout=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    const blob=new Blob([wbout],{type:'application/octet-stream'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
  }catch(e){ XLSX.writeFile(wb,filename); }
}

function exportAttendance(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Date','Worker','Role','Daily Wage','OT Hours','OT Amount','Status','Wage Earned']];
  if(inRange(S.workDate||todayStr(),from,to)){
    S.lab.forEach(l=>{
      const otHrs=l.doingOT?(parseFloat(l.otHours)||0):0;
      const otAmt=calcOT(l);
      rows.push([S.workDate,l.name,l.role,l.wage,otHrs,otAmt,l.present?'Present':'Absent',l.present?l.wage:0]);
    });
  }
  S.ledger.filter(e=>inRange(e.date,from,to)).forEach(day=>(day.attendance||[]).forEach(a=>{
    const l=S.lab.find(x=>x.id===a.id);if(!l)return;
    const otHrs=a.doingOT?(parseFloat(a.otHours)||0):0;
    const otAmt=Math.round((l.wage/8)*otHrs);
    rows.push([day.date,l.name,l.role,l.wage,otHrs,otAmt,a.present?'Present':'Absent',a.present?l.wage:0]);
  }));
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Attendance');
  downloadXLSX(wb,`Attendance_${from}_to_${to}.xlsx`);
}

function exportProduction(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Date','Supervisor','Stage','Product','Qty','Unit Value','Total Value']];
  if(inRange(S.workDate||todayStr(),from,to)){
    S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>{
      rows.push([S.workDate,ss.supName,t.stage,p.name,p.qty,p.unitVal||0,p.value||0]);
    })));
  }
  S.ledger.filter(e=>inRange(e.date,from,to)).forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>(t.production||[]).forEach(p=>{
    rows.push([day.date,ss.supName,t.stage,p.name,p.qty,p.unitVal||0,p.value||0]);
  }))));
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Production');
  downloadXLSX(wb,`Production_${from}_to_${to}.xlsx`);
}

function exportOrders(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Order ID','Date','Customer','Phone','City','Required By','Priority','Items','Amount','Advance','Balance','Status']];
  S.orders.filter(o=>inRange(o.createdAt||'',from,to)).forEach(o=>{
    rows.push([o.id,o.createdAt,o.customer,o.phone||'',o.city||'',o.requiredBy||'',o.priority,o.items||'',o.amount,o.advance,o.amount-o.advance,o.status]);
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Orders');
  downloadXLSX(wb,`Orders_${from}_to_${to}.xlsx`);
}

function exportPnL(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Date','Goods Value','Labour Cost','RM Cost','Net Profit','Margin %']];
  S.ledger.filter(e=>inRange(e.date,from,to)).forEach(e=>{
    rows.push([e.date,e.goodsValue||0,e.labourCost||0,e.rmCost||0,e.netProfit||0,e.goodsValue>0?Math.round((e.netProfit/e.goodsValue)*100):0]);
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'PnL Ledger');
  downloadXLSX(wb,`PnL_${from}_to_${to}.xlsx`);
}


function saveDocAsOrder(){
  const type = document.getElementById('doc-type').value;
  const cust = document.getElementById('doc-cust').value.trim();
  const phone = document.getElementById('doc-phone').value.trim();
  const city = document.getElementById('doc-city').value.trim();
  const dueDate = document.getElementById('doc-due')?.value||'';
  const advance = parseFloat(document.getElementById('doc-advance').value)||0;
  const discount = parseFloat(document.getElementById('doc-discount').value)||0;

  if(!cust){ alert('Enter customer name first.'); return; }
  if(!docItems.length){ alert('Add at least one item first.'); return; }

  const total = docItems.reduce((a,i)=>a+(i.qty*(i.rate||0)),0) - discount;
  const itemsStr = docItems.map(i=>`${i.name} x${i.qty}`).join(', ');

  const order = {
    id: 'ORD-'+Date.now().toString().slice(-6),
    customer: cust,
    phone, city,
    requiredBy: dueDate,
    priority: 'normal',
    amount: total,
    advance,
    items: itemsStr,
    fgItems: docItems.map(i=>({name:i.name, qty:i.qty, price:i.rate||0})),
    status: 'pending',
    createdAt: todayStr(),
    fromQuotation: true,
    docType: type,
  };

  if(!S.orders) S.orders=[];
  // Check not duplicate
  const exists = S.orders.find(o=>o.customer===cust&&o.createdAt===todayStr()&&o.amount===total);
  if(exists){ alert('An order for '+cust+' with same amount already exists today.'); return; }

  S.orders.unshift(order);
  persist();

  // Sync to Sheets
  if(S.sheetsUrl){
    const payload={action:'order',date:todayStr(),id:order.id,customer:order.customer,phone:order.phone,city:order.city,requiredBy:order.requiredBy,priority:order.priority,items:order.items,amount:order.amount,advance:order.advance,balance:order.amount-order.advance,status:'pending'};
    sendGet(S.sheetsUrl,'action=order&payload='+encodeURIComponent(JSON.stringify(payload)));
  }

  alert(`✓ Order created for ${cust} — ₹${total.toLocaleString('en-IN')}\n\nFind it in Orders tab.`);
}

function renderDocs(){
  // Populate product dropdown
  const sel = document.getElementById('doc-item-prod');
  if(sel) sel.innerHTML = '<option value="">— select product —</option>' +
    S.fg.map(f=>`<option value="${f.id}" data-price="${f.price}">[#${f.id}] ${f.name} — ${fmt(f.price)}</option>`).join('');

  // Populate order dropdown
  const osel = document.getElementById('doc-from-order');
  if(osel) osel.innerHTML = '<option value="">— select order —</option>' +
    S.orders.map(o=>`<option value="${o.id}">${o.id} · ${o.customer} · ${o.city}</option>`).join('');

  // Set default date and number
  const today = todayStr();
  document.getElementById('doc-date').value = today;
  const valid = new Date(today+'T00:00:00'); valid.setDate(valid.getDate()+15);
  document.getElementById('doc-valid').value = valid.toISOString().slice(0,10);
  document.getElementById('doc-number').value = 'Q-' + today.replace(/-/g,'').slice(2) + '-' + String(docCounter.quotation).padStart(3,'0');

  renderDocItems();
  updateDocPreview();
}

function updateDocType(){
  const type = document.getElementById('doc-type').value;
  const validWrap = document.getElementById('doc-valid-wrap');
  validWrap.style.display = type==='quotation' ? 'block' : 'none';
  const prefixes = {quotation:'Q', invoice:'INV', challan:'DC'};
  const today = todayStr();
  document.getElementById('doc-number').value = prefixes[type] + '-' + today.replace(/-/g,'').slice(2) + '-' + String(docCounter[type]).padStart(3,'0');
  updateDocPreview();
}

function fillFromOrder(){
  const id = document.getElementById('doc-from-order').value;
  if(!id) return;
  const o = S.orders.find(o=>o.id===id);
  if(!o) return;
  document.getElementById('doc-cust').value = o.customer||'';
  document.getElementById('doc-phone').value = o.phone||'';
  document.getElementById('doc-city').value = o.city||'';
  document.getElementById('doc-advance').value = o.advance||0;
  // Parse items if available
  if(o.items){
    document.getElementById('doc-notes').value = o.items;
  }
  updateDocPreview();
}

function docItemFill(){
  const sel = document.getElementById('doc-item-prod');
  const opt = sel.options[sel.selectedIndex];
  if(opt && opt.dataset.price){
    document.getElementById('doc-item-rate').value = opt.dataset.price;
  }
}

function addDocItem(){
  const sel = document.getElementById('doc-item-prod');
  const opt = sel.options[sel.selectedIndex];
  if(!opt||!opt.value){alert('Select a product.');return;}
  const fg = S.fg.find(f=>f.id===parseInt(opt.value));
  const qty = parseInt(document.getElementById('doc-item-qty').value)||1;
  const rate = parseFloat(document.getElementById('doc-item-rate').value)||0;
  if(!rate){alert('Enter rate.');return;}
  docItems.push({id:uid(), name:fg.name, qty, rate, total:qty*rate});
  document.getElementById('doc-item-qty').value='1';
  document.getElementById('doc-item-rate').value='';
  sel.value='';
  renderDocItems();
  updateDocPreview();
}

function removeDocItem(id){
  docItems = docItems.filter(i=>i.id!==id);
  renderDocItems();
  updateDocPreview();
}

function renderDocItems(){
  const el = document.getElementById('doc-items-list');
  if(!docItems.length){el.innerHTML='<div style="color:var(--text4);font-size:12px;margin-bottom:10px">No items added yet.</div>';return;}
  el.innerHTML=`<table class="tbl" style="margin-bottom:10px"><thead><tr><th>#</th><th>Product</th><th class="num">Qty</th><th class="num">Rate ₹</th><th class="num">Total ₹</th><th></th></tr></thead><tbody>
  ${docItems.map((item,i)=>`<tr>
    <td style="color:var(--text4)">${i+1}</td>
    <td style="font-weight:500;color:var(--text)">${item.name}</td>
    <td class="num">${item.qty}</td>
    <td class="num">${fmtN(item.rate)}</td>
    <td class="num" style="font-weight:600">${fmtN(item.total)}</td>
    <td><button class="btn btn-ember btn-xs" onclick="removeDocItem(${item.id})">✕</button></td>
  </tr>`).join('')}
  </tbody></table>`;
}

function updateDocPreview(){
  const preview = document.getElementById('doc-preview');
  if(!preview) return;
  preview.innerHTML = buildDocHTML(false);
}

function buildDocHTML(forPrint){
  const type = document.getElementById('doc-type').value;
  const num = document.getElementById('doc-number').value;
  const date = document.getElementById('doc-date').value;
  const valid = document.getElementById('doc-valid').value;
  const cust = document.getElementById('doc-cust').value||'—';
  const phone = document.getElementById('doc-phone').value;
  const city = document.getElementById('doc-city').value;
  const addr = document.getElementById('doc-addr').value;
  const notes = document.getElementById('doc-notes').value;
  const discount = parseFloat(document.getElementById('doc-discount').value)||0;
  const advance = parseFloat(document.getElementById('doc-advance').value)||0;

  const subtotal = docItems.reduce((a,i)=>a+i.total,0);
  const total = subtotal - discount;
  const balance = total - advance;

  const typeLabels = {quotation:'QUOTATION', invoice:'INVOICE', challan:'DELIVERY CHALLAN'};
  const typeLabel = typeLabels[type]||'DOCUMENT';
  const typeColors = {quotation:'#1E40AF', invoice:'#065F46', challan:'#6B21A8'};
  const typeColor = typeColors[type]||'#111827';

  const formatDate = (d) => {
    if(!d) return '—';
    try{ return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}); }
    catch(e){ return d; }
  };

  return `<div style="font-family:'Inter',Arial,sans-serif;color:#111827;max-width:700px;margin:0 auto">

    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid ${typeColor}">
      <div>
        <div style="font-size:28px;font-weight:900;color:${typeColor};letter-spacing:-.02em">Propskart</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;font-family:monospace;letter-spacing:.04em">WEDDING PROPS & GARDEN DÉCOR · RANCHI</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:800;color:${typeColor};letter-spacing:.04em">${typeLabel}</div>
        <div style="font-size:13px;font-weight:600;margin-top:4px;color:#374151"># ${num||'—'}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:2px">Date: ${formatDate(date)}</div>
        ${type==='quotation'&&valid?`<div style="font-size:11px;color:#6B7280">Valid until: ${formatDate(valid)}</div>`:''}
      </div>
    </div>

    <!-- CUSTOMER -->
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:14px 16px;margin-bottom:20px">
      <div style="font-size:10px;font-family:monospace;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${type==='challan'?'Deliver To':'Bill To'}</div>
      <div style="font-size:15px;font-weight:700;color:#111827">${cust}</div>
      ${phone?`<div style="font-size:12px;color:#6B7280;margin-top:3px">📞 ${phone}</div>`:''}
      ${city||addr?`<div style="font-size:12px;color:#6B7280;margin-top:2px">📍 ${[addr,city].filter(Boolean).join(', ')}</div>`:''}
    </div>

    <!-- ITEMS TABLE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:${typeColor}">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">PRODUCT / DESCRIPTION</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">QTY</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">RATE ₹</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">AMOUNT ₹</th>
        </tr>
      </thead>
      <tbody>
        ${docItems.length ? docItems.map((item,i)=>`
          <tr style="border-bottom:1px solid #F3F4F6;background:${i%2===0?'white':'#FAFAFA'}">
            <td style="padding:10px 12px;font-size:12px;color:#9CA3AF">${i+1}</td>
            <td style="padding:10px 12px;font-size:13px;font-weight:500;color:#111827">${item.name}</td>
            <td style="padding:10px 12px;text-align:right;font-size:12px;font-family:monospace">${item.qty}</td>
            <td style="padding:10px 12px;text-align:right;font-size:12px;font-family:monospace">${item.rate.toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600;font-family:monospace">${item.total.toLocaleString('en-IN')}</td>
          </tr>`).join('')
          : '<tr><td colspan="5" style="padding:20px;text-align:center;color:#9CA3AF;font-size:12px">No items added</td></tr>'}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <div style="min-width:240px">
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6">
          <span style="font-size:12px;color:#6B7280">Subtotal</span>
          <span style="font-size:12px;font-family:monospace;font-weight:500">₹ ${subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${discount>0?`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6">
          <span style="font-size:12px;color:#059669">Discount</span>
          <span style="font-size:12px;font-family:monospace;color:#059669">− ₹ ${discount.toLocaleString('en-IN')}</span>
        </div>`:''}
        <div style="display:flex;justify-content:space-between;padding:10px 12px;background:${typeColor};border-radius:6px;margin-top:4px">
          <span style="font-size:13px;font-weight:700;color:white">TOTAL</span>
          <span style="font-size:15px;font-weight:800;font-family:monospace;color:white">₹ ${total.toLocaleString('en-IN')}</span>
        </div>
        ${advance>0?`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6;margin-top:4px">
          <span style="font-size:12px;color:#6B7280">Advance Paid</span>
          <span style="font-size:12px;font-family:monospace;color:#059669">− ₹ ${advance.toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:7px 0">
          <span style="font-size:13px;font-weight:600;color:#DC2626">Balance Due</span>
          <span style="font-size:13px;font-weight:700;font-family:monospace;color:#DC2626">₹ ${balance.toLocaleString('en-IN')}</span>
        </div>`:''}
      </div>
    </div>

    ${notes?`<!-- NOTES -->
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin-bottom:20px">
      <div style="font-size:10px;font-family:monospace;color:#92400E;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Terms & Notes</div>
      <div style="font-size:12px;color:#78350F;line-height:1.6">${notes}</div>
    </div>`:''}

    <!-- FOOTER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:20px;border-top:1px solid #E5E7EB;margin-top:8px">
      <div style="font-size:11px;color:#9CA3AF">
        <div>Propskart — Ranchi, Jharkhand</div>
        <div style="margin-top:2px">Thank you for your business!</div>
      </div>
      <div style="text-align:right">
        <div style="height:40px;border-bottom:1px solid #374151;width:150px;margin-bottom:4px"></div>
        <div style="font-size:11px;color:#6B7280">Authorised Signature</div>
      </div>
    </div>

  </div>`;
}

function printDoc(){
  if(!docItems.length){alert('Add at least one item before printing.');return;}

  const type = document.getElementById('doc-type').value;
  const num = document.getElementById('doc-number').value;
  const cust = document.getElementById('doc-cust').value.trim();
  const phone = document.getElementById('doc-phone').value.trim();
  const city = document.getElementById('doc-city').value.trim();
  const advance = parseFloat(document.getElementById('doc-advance').value)||0;
  const notes = document.getElementById('doc-notes').value.trim();
  const subtotal = docItems.reduce((a,i)=>a+i.total,0);
  const discount = parseFloat(document.getElementById('doc-discount').value)||0;
  const total = subtotal - discount;
  const docDate = document.getElementById('doc-date').value;
  const validDate = document.getElementById('doc-valid').value;

  // Auto-save to Orders when Quotation is created
  if(type === 'quotation' && cust){
    // Check if order with this doc number already exists
    const existing = S.orders.find(o=>o.id===num);
    if(!existing){
      const newOrder = {
        id: num,
        customer: cust,
        phone: phone,
        city: city,
        requiredBy: validDate||'',
        priority: 'normal',
        amount: total,
        advance: advance,
        items: docItems.map(i=>i.qty+'× '+i.name).join(', '),
        status: 'pending',
        createdAt: docDate||todayStr(),
        fromQuotation: true
      };
      S.orders.unshift(newOrder);
      persist();

      // Show confirmation
      const badge = document.createElement('div');
      badge.className = 'gbox';
      badge.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;max-width:320px;box-shadow:0 4px 16px rgba(0,0,0,.15)';
      badge.innerHTML = `✓ Order <b>${num}</b> saved to Orders for <b>${cust}</b> — ₹${total.toLocaleString('en-IN')}`;
      document.body.appendChild(badge);
      setTimeout(()=>badge.remove(), 4000);
    }
  }

  // Increment counter
  docCounter[type]++;

  const content = buildDocHTML(true);
  const w = window.open('','_blank','width=800,height=900');
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Propskart — ${document.getElementById('doc-type').value}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',Arial,sans-serif;padding:30px;background:white;color:#111827}
      @media print{body{padding:10px}@page{margin:15mm}}
    </style>
  </head><body>${content}</body></html>`);
  w.document.close();
  // iOS needs a longer delay and user interaction
  setTimeout(()=>{
    try{ w.print(); }
    catch(e){
      // iOS fallback — show print instructions
      alert('To print on iPhone:\n1. Tap Share button (box with arrow)\n2. Select "Print"\n3. Choose printer');
    }
  }, 800);
}

function clearDoc(){
  docItems=[];
  renderDocItems();
  ['doc-cust','doc-phone','doc-city','doc-addr','doc-notes','doc-discount','doc-advance'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
  });
  document.getElementById('doc-from-order').value='';
  updateDocPreview();
}

// ── INIT ──
// loadState() and the S binding moved to core/state.js.

let activeSupId = null;
let activeTeamId = null;
let orderFilter = 'all';
let activeFGStage = 'all';

try{
  S.sheetsUrl=SHEETS_URL;
  const today = todayStr();
  // Respect the date loadState() decided on — it already handles the
  // date-changed and day-was-saved cases. Assigning unconditionally here
  // discarded that decision.
  if(!S.workDate) S.workDate = today;
  persist();
  if(!S.stock||!S.stock.length){S.stock=S.rm.map(r=>({id:r.id,name:r.name,unit:r.unit,opening:0,reorder:100,openingDate:todayStr()}));}
  if(!S.orders) S.orders=[];
  if(!S.purchases) S.purchases=[];
  const wd=document.getElementById('work-date');
  if(wd){ wd.value=today; }
  if(!S.fgTransfers) S.fgTransfers=[];
  if(!S.fgAdjustments) S.fgAdjustments=[];
  if(!S.fgStock) S.fgStock={};
  if(!S.unitTransfers) S.unitTransfers=[];
  if(!S.dispatches) S.dispatches=[];
  if(!S.salaryAdj) S.salaryAdj={};
  if(!S.bom) S.bom={};
  persist();
  updateSyncStatus();
  const rq=document.getElementById('raw-qty');if(rq)rq.addEventListener('input',rawFill);
  const rm=document.getElementById('raw-mat');if(rm)rm.addEventListener('change',rawFill);
  document.getElementById('work-date').addEventListener('change',function(){S.workDate=this.value;persist();});
  const ac=document.getElementById('apps-script-code');if(ac)ac.value=APPS_SCRIPT_CODE;

  // Firebase initializes after login (see doLogin)

  // ── AUTO DATE REFRESH ──
  // Check every minute if date has changed (handles midnight + timezone)
  setInterval(()=>{
    const newToday = todayStr();
    if(S.workDate && S.workDate !== newToday){
      // Date has changed — clear sessions and update
      S.sessions = [];
      S.rawLog = [];
      S.lab.forEach(l=>{ l.present=false; l.doingOT=false; l.otHours=0; });
      S.workDate = newToday;
      const wdEl = document.getElementById('work-date');
      if(wdEl) wdEl.value = newToday;
      persist();
      console.log('Date auto-updated to', newToday);
    }
  }, 60000); // check every 60 seconds

}catch(e){
  console.error('Init error:', e.message, e.stack);
  // App still works — show login
  try{ document.getElementById('login-page').style.display='flex'; }catch(e2){}
}



// ── WINDOW EXPORTS (needed for inline onclick handlers) ──
// ── IMMEDIATE WINDOW EXPORTS (run before any onclick fires) ──
(function(){
  if(typeof spBadge === "function") window.spBadge = spBadge;
  if(typeof defaultState === "function") window.defaultState = defaultState;
  if(typeof togglePwd === "function") window.togglePwd = togglePwd;
  if(typeof doLogin === "function") window.doLogin = doLogin;
  if(typeof onLoginSuccess === "function") window.onLoginSuccess = onLoginSuccess;
  if(typeof doLogout === "function") window.doLogout = doLogout;
  if(typeof updateSidebarForRole === "function") window.updateSidebarForRole = updateSidebarForRole;
  if(typeof toggleSection === "function") window.toggleSection = toggleSection;
  if(typeof openSection === "function") window.openSection = openSection;
  if(typeof openSidebar === "function") window.openSidebar = openSidebar;
  if(typeof closeSidebar === "function") window.closeSidebar = closeSidebar;
  if(typeof go === "function") window.go = go;
  if(typeof switchDashTab === "function") window.switchDashTab = switchDashTab;
  if(typeof renderDashboard === "function") window.renderDashboard = renderDashboard;
  if(typeof renderTaskBoard === "function") window.renderTaskBoard = renderTaskBoard;
  if(typeof isOverdue === "function") window.isOverdue = isOverdue;
  if(typeof orderStatusColor === "function") window.orderStatusColor = orderStatusColor;
  if(typeof orderStatusBg === "function") window.orderStatusBg = orderStatusBg;
  if(typeof initFirebase === "function") window.initFirebase = initFirebase;
  if(typeof scheduleAutoBackup === "function") window.scheduleAutoBackup = scheduleAutoBackup;
  if(typeof updateSyncDot === "function") window.updateSyncDot = updateSyncDot;
  if(typeof startFirebaseSync === "function") window.startFirebaseSync = startFirebaseSync;
  // Both are `async function`, which the original export sweep missed. They are
  // called from inline markup handlers, and once this file becomes an ES module
  // its top-level declarations stop being global — only these assignments keep
  // those buttons alive.
  if(typeof pushToFirebase === "function") window.pushToFirebase = pushToFirebase;
  if(typeof runDailyBackup === "function") window.runDailyBackup = runDailyBackup;
  if(typeof renderScreen === "function") window.renderScreen = renderScreen;
  if(typeof showScreenError === "function") window.showScreenError = showScreenError;
  if(typeof clearScreenError === "function") window.clearScreenError = clearScreenError;
  // applyProdRefresh is reached from the badge's inline onclick, so it has to
  // be on window like every other handler in this file.
  if(typeof applyProdRefresh === "function") window.applyProdRefresh = applyProdRefresh;
  if(typeof prodFingerprint === "function") window.prodFingerprint = prodFingerprint;
  if(typeof markProdSeen === "function") window.markProdSeen = markProdSeen;
  if(typeof showProdRefresh === "function") window.showProdRefresh = showProdRefresh;
  if(typeof persist === "function") window.persist = persist;
  if(typeof uid === "function") window.uid = uid;
  if(typeof fmt === "function") window.fmt = fmt;
  if(typeof fmtN === "function") window.fmtN = fmtN;
  if(typeof todayStr === "function") window.todayStr = todayStr;
  if(typeof sendGet === "function") window.sendGet = sendGet;
  if(typeof sendViaImage === "function") window.sendViaImage = sendViaImage;
  if(typeof setSyncStatus === "function") window.setSyncStatus = setSyncStatus;
  if(typeof updateSyncStatus === "function") window.updateSyncStatus = updateSyncStatus;
  if(typeof uploadRM === "function") window.uploadRM = uploadRM;
  if(typeof uploadLab === "function") window.uploadLab = uploadLab;
  if(typeof dlSampleRM === "function") window.dlSampleRM = dlSampleRM;
  if(typeof dlSampleLab === "function") window.dlSampleLab = dlSampleLab;
  if(typeof renderSetup === "function") window.renderSetup = renderSetup;
  if(typeof addRM === "function") window.addRM = addRM;
  if(typeof delRM === "function") window.delRM = delRM;
  if(typeof addFG === "function") window.addFG = addFG;
  if(typeof delFG === "function") window.delFG = delFG;
  if(typeof addLab === "function") window.addLab = addLab;
  if(typeof delLab === "function") window.delLab = delLab;
  if(typeof renderSheets === "function") window.renderSheets = renderSheets;
  if(typeof saveUrl === "function") window.saveUrl = saveUrl;
  if(typeof testConnection === "function") window.testConnection = testConnection;
  if(typeof copyScript === "function") window.copyScript = copyScript;
  if(typeof switchAttTab === "function") window.switchAttTab = switchAttTab;
  if(typeof renderAtt === "function") window.renderAtt = renderAtt;
  if(typeof renderOTTab === "function") window.renderOTTab = renderOTTab;
  if(typeof setOTHours === "function") window.setOTHours = setOTHours;
  if(typeof togAtt === "function") window.togAtt = togAtt;
  if(typeof togOT === "function") window.togOT = togOT;
  if(typeof markAll === "function") window.markAll = markAll;
  if(typeof updAttMet === "function") window.updAttMet = updAttMet;
  if(typeof renderSupLogin === "function") window.renderSupLogin = renderSupLogin;
  if(typeof delSess === "function") window.delSess = delSess;
  if(typeof enterSup === "function") window.enterSup = enterSup;
  if(typeof renderSupWork === "function") window.renderSupWork = renderSupWork;
  if(typeof renderSupTeamOverview === "function") window.renderSupTeamOverview = renderSupTeamOverview;
  if(typeof addNewTeam === "function") window.addNewTeam = addNewTeam;
  if(typeof selectTeam === "function") window.selectTeam = selectTeam;
  if(typeof deleteTeam === "function") window.deleteTeam = deleteTeam;
  if(typeof renderSupTeamWork === "function") window.renderSupTeamWork = renderSupTeamWork;
  if(typeof swStage === "function") window.swStage = swStage;
  if(typeof swTogTeam === "function") window.swTogTeam = swTogTeam;
  if(typeof swFill === "function") window.swFill = swFill;
  if(typeof logProd === "function") window.logProd = logProd;
  if(typeof delProd === "function") window.delProd = delProd;
  if(typeof saveSup === "function") window.saveSup = saveSup;
  if(typeof exitSup === "function") window.exitSup = exitSup;
  if(typeof updateColorFieldVisibility === "function") window.updateColorFieldVisibility = updateColorFieldVisibility;
  if(typeof renderRaw === "function") window.renderRaw = renderRaw;
  if(typeof rawFill === "function") window.rawFill = rawFill;
  if(typeof issueRaw === "function") window.issueRaw = issueRaw;
  if(typeof delRaw === "function") window.delRaw = delRaw;
  if(typeof renderRawLog === "function") window.renderRawLog = renderRawLog;
  if(typeof renderRawPnL === "function") window.renderRawPnL = renderRawPnL;
  if(typeof renderDay === "function") window.renderDay = renderDay;
  if(typeof buildPayload === "function") window.buildPayload = buildPayload;
  if(typeof syncToSheets === "function") window.syncToSheets = syncToSheets;
  if(typeof saveDay === "function") window.saveDay = saveDay;
  if(typeof initMonthly === "function") window.initMonthly = initMonthly;
  if(typeof prevMonth === "function") window.prevMonth = prevMonth;
  if(typeof nextMonth === "function") window.nextMonth = nextMonth;
  if(typeof showMonthDay === "function") window.showMonthDay = showMonthDay;
  if(typeof renderMonthly === "function") window.renderMonthly = renderMonthly;
  if(typeof renderOrders === "function") window.renderOrders = renderOrders;
  if(typeof filterOrders === "function") window.filterOrders = filterOrders;
  if(typeof openNewOrder === "function") window.openNewOrder = openNewOrder;
  if(typeof closeOrderForm === "function") window.closeOrderForm = closeOrderForm;
  if(typeof filterOrderProducts === "function") window.filterOrderProducts = filterOrderProducts;
  if(typeof selectOrderProduct === "function") window.selectOrderProduct = selectOrderProduct;
  if(typeof addOrderItem === "function") window.addOrderItem = addOrderItem;
  if(typeof changeOrderItemQty === "function") window.changeOrderItemQty = changeOrderItemQty;
  if(typeof removeOrderItem === "function") window.removeOrderItem = removeOrderItem;
  if(typeof renderOrderItemsList === "function") window.renderOrderItemsList = renderOrderItemsList;
  if(typeof updateOrderTotal === "function") window.updateOrderTotal = updateOrderTotal;
  if(typeof importOrdersFromSheets === "function") window.importOrdersFromSheets = importOrdersFromSheets;
  if(typeof saveOrder === "function") window.saveOrder = saveOrder;
  if(typeof updateOrderStatus === "function") window.updateOrderStatus = updateOrderStatus;
  if(typeof recordPayment === "function") window.recordPayment = recordPayment;
  if(typeof deleteOrder === "function") window.deleteOrder = deleteOrder;
  if(typeof renderPayments === "function") window.renderPayments = renderPayments;
  if(typeof renderStock === "function") window.renderStock = renderStock;
  if(typeof openStockUpdate === "function") window.openStockUpdate = openStockUpdate;
  if(typeof closeStockForm === "function") window.closeStockForm = closeStockForm;
  if(typeof saveStock === "function") window.saveStock = saveStock;
  if(typeof openPurchase === "function") window.openPurchase = openPurchase;
  if(typeof closePurchase === "function") window.closePurchase = closePurchase;
  if(typeof savePurchase === "function") window.savePurchase = savePurchase;
  if(typeof openRMPurchaseForm === "function") window.openRMPurchaseForm = openRMPurchaseForm;
  if(typeof closeRMPurchaseForm === "function") window.closeRMPurchaseForm = closeRMPurchaseForm;
  if(typeof saveRMPurchase === "function") window.saveRMPurchase = saveRMPurchase;
  if(typeof renderRMPurchase === "function") window.renderRMPurchase = renderRMPurchase;
  if(typeof initFGStock === "function") window.initFGStock = initFGStock;
  if(typeof getFGBalance === "function") window.getFGBalance = getFGBalance;
  if(typeof switchFGStage === "function") window.switchFGStage = switchFGStage;
  if(typeof renderFGStock === "function") window.renderFGStock = renderFGStock;
  if(typeof quickTransfer === "function") window.quickTransfer = quickTransfer;
  if(typeof openFGTransfer === "function") window.openFGTransfer = openFGTransfer;
  if(typeof closeFGTransfer === "function") window.closeFGTransfer = closeFGTransfer;
  if(typeof updateFGTransferTo === "function") window.updateFGTransferTo = updateFGTransferTo;
  if(typeof saveFGTransfer === "function") window.saveFGTransfer = saveFGTransfer;
  if(typeof openFGAdjust === "function") window.openFGAdjust = openFGAdjust;
  if(typeof closeFGAdjust === "function") window.closeFGAdjust = closeFGAdjust;
  if(typeof saveFGAdjust === "function") window.saveFGAdjust = saveFGAdjust;
  if(typeof getAllFGProducts === "function") window.getAllFGProducts = getAllFGProducts;
  if(typeof renderInventory === "function") window.renderInventory = renderInventory;
  if(typeof calcOT === "function") window.calcOT = calcOT;
  if(typeof otAmt === "function") window.otAmt = otAmt;
  if(typeof renderSalary === "function") window.renderSalary = renderSalary;
  if(typeof openSalModal === "function") window.openSalModal = openSalModal;
  if(typeof closeSalModal === "function") window.closeSalModal = closeSalModal;
  if(typeof saveSalAdj === "function") window.saveSalAdj = saveSalAdj;
  if(typeof exportSalaryExcel === "function") window.exportSalaryExcel = exportSalaryExcel;
  if(typeof renderDispatch === "function") window.renderDispatch = renderDispatch;
  if(typeof doDispatch === "function") window.doDispatch = doDispatch;
  if(typeof renderBOM === "function") window.renderBOM = renderBOM;
  if(typeof addBOMRow === "function") window.addBOMRow = addBOMRow;
  if(typeof editBOM === "function") window.editBOM = editBOM;
  if(typeof deleteBOM === "function") window.deleteBOM = deleteBOM;
  if(typeof closeBOMForm === "function") window.closeBOMForm = closeBOMForm;
  if(typeof filterBOMProducts === "function") window.filterBOMProducts = filterBOMProducts;
  if(typeof selectBOMProd === "function") window.selectBOMProd = selectBOMProd;
  if(typeof addBOMRM === "function") window.addBOMRM = addBOMRM;
  if(typeof renderBOMRMRows === "function") window.renderBOMRMRows = renderBOMRMRows;
  if(typeof saveBOM === "function") window.saveBOM = saveBOM;
  if(typeof renderExportPage === "function") window.renderExportPage = renderExportPage;
  if(typeof setExpRange === "function") window.setExpRange = setExpRange;
  if(typeof getExpDates === "function") window.getExpDates = getExpDates;
  if(typeof inRange === "function") window.inRange = inRange;
  if(typeof checkXLSX === "function") window.checkXLSX = checkXLSX;
  if(typeof downloadXLSX === "function") window.downloadXLSX = downloadXLSX;
  if(typeof exportAttendance === "function") window.exportAttendance = exportAttendance;
  if(typeof exportProduction === "function") window.exportProduction = exportProduction;
  if(typeof exportOrders === "function") window.exportOrders = exportOrders;
  if(typeof exportPnL === "function") window.exportPnL = exportPnL;
  if(typeof saveDocAsOrder === "function") window.saveDocAsOrder = saveDocAsOrder;
  if(typeof renderDocs === "function") window.renderDocs = renderDocs;
  if(typeof updateDocType === "function") window.updateDocType = updateDocType;
  if(typeof fillFromOrder === "function") window.fillFromOrder = fillFromOrder;
  if(typeof docItemFill === "function") window.docItemFill = docItemFill;
  if(typeof addDocItem === "function") window.addDocItem = addDocItem;
  if(typeof removeDocItem === "function") window.removeDocItem = removeDocItem;
  if(typeof renderDocItems === "function") window.renderDocItems = renderDocItems;
  if(typeof updateDocPreview === "function") window.updateDocPreview = updateDocPreview;
  if(typeof buildDocHTML === "function") window.buildDocHTML = buildDocHTML;
  if(typeof printDoc === "function") window.printDoc = printDoc;
  if(typeof clearDoc === "function") window.clearDoc = clearDoc;
  if(typeof loadState === "function") window.loadState = loadState;
  console.log('Factory OS ready');
})();

// ── BOOT CLOUD SYNC ──
// supabase-js and supabase-db.js are loaded by index.html before this
// file, so the SDK is already present. No runtime CDN fetch needed.
initFirebase();


// ══════════════════════════════════════════════
// ── FACTORY OS FIXES & ENHANCEMENTS ──
// ══════════════════════════════════════════════

// NOTE: pushAttendanceLive() and pullSupervisorData() now live in the
// cloud-sync section above. The versions that were here merged and
// de-duplicated supervisor documents by hand and polled every 10s.
// Postgres realtime replaces all of it.

// ── Session backup every 5 min ──
setInterval(function(){
  if(S&&S.sessions&&S.sessions.length>0){
    try{localStorage.setItem('_sessions_backup_',JSON.stringify({
      sessions:S.sessions,date:todayStr(),savedAt:Date.now()
    }));}catch(e){}
  }
}, 5*60*1000);

// ── Restore sessions on load if missing ──
(function(){
  try{
    var bk=localStorage.getItem('_sessions_backup_');
    if(!bk) return;
    var b=JSON.parse(bk);
    var td=new Date();
    var today=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
    if(b.date===today&&(Date.now()-b.savedAt)<12*3600000){
      if(S&&(!S.sessions||S.sessions.length===0)&&b.sessions.length>0){
        S.sessions=b.sessions;
        try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
      }
    }
  }catch(e){}
})();

// ── CLEANUP: unregister stale PWA service worker from old build ──
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(function(regs){
    regs.forEach(function(r){ r.unregister(); });
    if(regs.length && window.caches){
      caches.keys().then(function(keys){ keys.forEach(function(k){ caches.delete(k); }); });
    }
  }).catch(function(){});
}


// ── DAY ROLLOVER ──
// Adopt a new work date: clear day-specific data, reset attendance
function isDaySaved(d){
  if(d && S.workDate && d===S.workDate){
    // current working day can never be "already saved" — clean any stale flag from testing
    if(localStorage.getItem('_day_cleared_'+d)) localStorage.removeItem('_day_cleared_'+d);
    return false;
  }
  return !!(d && ((S.ledger||[]).some(function(e){return e.date===d;}) || localStorage.getItem('_day_cleared_'+d)));
}
function adoptWorkDate(newDate, savedDate){
  if(savedDate) localStorage.setItem('_day_cleared_'+savedDate,'1');
  // Move to the new date BEFORE filtering. isDaySaved() treats S.workDate as
  // "the open day, never saved" and clears its _day_cleared_ flag as a side
  // effect — so filtering first made every row still carrying the OLD date
  // look unsaved, erased the flag marking that day closed, and carried
  // already-saved production forward into the new day, where getFGBalance()
  // counted it a second time on top of the ledger.
  S.workDate=newDate;
  // Drop only sessions from days already saved; carry unsaved in-progress work to the new date
  S.sessions=(S.sessions||[]).filter(function(s){return !isDaySaved(s.date);});
  S.sessions.forEach(function(s){s.date=newDate;});
  S.rawLog=(S.rawLog||[]).filter(function(r){return !isDaySaved(r.date);});
  S.rawLog.forEach(function(r){r.date=newDate;});
  (S.lab||[]).forEach(function(l){l.present=false;l.doingOT=false;l.otHours=0;});
  var wd=document.getElementById('work-date'); if(wd) wd.value=newDate;
  try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
  try{renderDashboard();}catch(e){}
  var sid=(document.querySelector('.screen.active')||{}).id;
  if(sid) try{go(sid.replace('sc-',''));}catch(e){}
}
// Auto-advance if our workDate is in the past AND that day was already saved
function checkDayRollover(){
  if(!S||!S.workDate) return;
  // Prune leftover sessions/rawLog from days already saved (safe: they live in the ledger)
  var pruned=false;
  var isDone=function(d){return d && d!==S.workDate && isDaySaved(d);};
  if((S.sessions||[]).some(function(s){return isDone(s.date);})){ S.sessions=S.sessions.filter(function(s){return !isDone(s.date);}); pruned=true; }
  if((S.rawLog||[]).some(function(r){return isDone(r.date);})){ S.rawLog=S.rawLog.filter(function(r){return !isDone(r.date);}); pruned=true; }
  if(pruned){
    try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
    try{renderDashboard();}catch(e){}
    var _sid=(document.querySelector('.screen.active')||{}).id;
    if(_sid) try{go(_sid.replace('sc-',''));}catch(e){}
  }
  var today=todayStr();
  if(S.workDate>=today) return;
  var wasSaved=(S.ledger||[]).some(function(e){return e.date===S.workDate;})
    || localStorage.getItem('_day_cleared_'+S.workDate);
  if(wasSaved) adoptWorkDate(today);
  // If not saved: leave data alone — the day still needs to be saved manually
}
// Check every 60s so cleanup and overnight rollover happen without user action
setInterval(checkDayRollover, 60*1000);
