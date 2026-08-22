// Markup for the "dashboard" screen (#sc-dashboard). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen active" id="sc-dashboard">
        <!-- Dashboard Tab Bar -->
        <div class="tabs" id="dash-tabs" style="margin-bottom:16px">
          <div class="tab active" id="dashtab-overview" data-click="switchDashTab" data-args="[&quot;overview&quot;]">📊 Overview</div>
          <div class="tab" id="dashtab-factory" data-click="switchDashTab" data-args="[&quot;factory&quot;]">🏭 Factory</div>
          <div class="tab dash-money-tab" id="dashtab-money" data-click="switchDashTab" data-args="[&quot;money&quot;]">💰 Money</div>
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
              <button class="btn btn-sm" data-click="go" data-args="[&quot;orders&quot;]">All Orders →</button>
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
              <div class="ch"><div class="ct">📋 Recent Orders</div><button class="btn btn-sm" data-click="go" data-args="[&quot;orders&quot;]">View all →</button></div>
              <div id="dash-recent-orders"></div>
            </div>
            <div class="card">
              <div class="ch"><div class="ct">💸 Today's P&amp;L</div></div>
              <div id="dash-pnl"></div>
            </div>
          </div>
        </div>
      </div>`;
