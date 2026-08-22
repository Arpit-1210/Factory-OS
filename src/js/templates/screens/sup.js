// Markup for the "sup" screen (#sc-sup). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-sup">
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
              <button class="btn btn-sm" data-click="exitSup">← Back</button>
              <button class="btn btn-jade btn-sm" data-click="saveSup">💾 Save & Exit</button>
            </div>
          </div>
          <div id="sw-overview"></div>
          <div id="sw-teamwork" style="display:none">
            <div class="card">
              <div class="ch"><div class="ct">① Stage</div><button class="btn btn-sm" data-click="clearTeamSelection">← All Teams</button></div>
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
                  <select id="sw-prod" data-change="swFill"><option value="">— select —</option></select>
                </div>
                <div class="fld"><label>Quantity</label><input type="number" id="sw-qty" placeholder="0" min="0"></div>
                <div class="fld"><label>₹/unit (auto)</label><input type="number" id="sw-price" placeholder="0"><div class="hint" id="sw-ph"></div></div>
                <div class="fld"><label>Weight/pc kg (opt)</label><input type="number" id="sw-weight" placeholder="0.0" step="0.1" min="0"></div>
                <div class="fld" id="sw-color-field" style="display:none"><label>🎨 Colour</label><input type="text" id="sw-color-val" placeholder="e.g. Orange..."></div>
                <div class="fld" style="display:flex;align-items:flex-end"><button class="btn btn-amber" style="width:100%" data-click="logProd">+ Log</button></div>
              </div>
              <div id="sw-transfer-badge"></div>
              <div id="sw-prod-tbl"></div>
            </div>
          </div>
        </div>
      </div>`;
