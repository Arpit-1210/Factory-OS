// Markup for the "stock" screen (#sc-stock). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-stock">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>RM <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)">Running balance — opening + purchases − usage</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-amber" data-click="openPurchase">+ Purchase</button>
            <button class="btn btn-sm" data-click="openRMOpeningStock">📥 Opening Stock</button>
            <button class="btn btn-sm" data-click="openStockUpdate">⚙ Set Opening</button>
          </div>
        </div>
        <div id="stock-alerts"></div>

        <!-- Shown when no raw-material declaration exists, or one was drafted
             and never confirmed. Balances treat a missing declaration as zero,
             which is a legitimate answer and an easy one to reach by accident. -->
        <div id="rmo-notice" style="display:none;margin-bottom:14px"></div>

        <!-- ── RAW MATERIAL OPENING STOCK ──
             What was in the store on the go-live date. The finished-goods twin
             of this panel lives in the FG Stock screen. -->
        <div id="rmo-panel" style="display:none">
          <div class="card" style="margin-bottom:16px">
            <div class="ch">
              <div class="ct">📥 Opening Stock — Raw Materials</div>
              <button class="btn btn-sm" data-click="closeRMOpeningStock">✕</button>
            </div>
            <div class="ibox">
              How much of each material was physically in the store on your go-live
              date. Everything after it is calculated: opening + purchases
              ± adjustments − issues. Leave a cell blank for nothing.
            </div>
            <div id="rmo-lockbar" style="display:none;margin-bottom:12px"></div>
            <div class="fg fg2" style="margin-bottom:12px">
              <div class="fld">
                <label>Stock as of (go-live date)</label>
                <input id="rmo-date" type="date">
              </div>
              <div class="fld">
                <label>Import from a sheet</label>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <!-- The stylesheet hides every file input, so this one is
                       opened by a real button. -->
                  <button class="btn btn-sm" data-click="pickRMOpeningFile" style="flex:1;min-width:130px">📊 Choose sheet</button>
                  <button class="btn btn-sm" data-click="dlSampleRMOpening">⬇ Template</button>
                  <input type="file" id="rmo-file" accept=".xlsx,.xls,.csv" data-change="uploadRMOpeningStock">
                </div>
              </div>
            </div>
            <div id="rmo-status"></div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
              <input id="rmo-search" type="search" placeholder="Search materials…" data-input="filterRMOpeningStock"
                     style="flex:1;min-width:180px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--surface2);color:var(--text)">
              <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text4);white-space:nowrap;cursor:pointer">
                <input type="checkbox" id="rmo-only-filled" data-change="toggleRMOpeningFilled" style="cursor:pointer">
                Only rows with a quantity
              </label>
            </div>
            <div id="rmo-count" style="font-size:11px;color:var(--text4);font-family:var(--mono);margin-bottom:6px"></div>
            <div class="tw" style="max-height:420px;overflow:auto">
              <table class="tbl" id="rmo-table">
                <thead><tr><th>Material</th><th class="num">Opening Qty</th><th>Unit</th></tr></thead>
                <tbody id="rmo-body"></tbody>
              </table>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap">
              <button class="btn btn-sm" data-click="clearRMOpeningStock" id="rmo-clear">Clear all</button>
              <button class="btn btn-amber" data-click="confirmRMOpeningStock" id="rmo-confirm">✓ Confirm &amp; Lock</button>
              <button class="btn btn-sm" data-click="unlockRMOpeningStock" id="rmo-unlock" style="display:none">🔓 Unlock to edit</button>
            </div>
          </div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Current Stock Levels</div></div><div id="stock-list"></div></div>
        <div id="purchase-form" style="display:none">
          <div class="card" style="max-width:540px">
            <div class="ch"><div class="ct">Add Purchase</div><button class="btn btn-sm" data-click="closePurchase">✕</button></div>
            <div class="fg fg4">
              <div class="fld"><label>Material</label><select id="pur-mat"></select></div>
              <div class="fld"><label>Quantity</label><input id="pur-qty" type="number" placeholder="0"></div>
              <div class="fld"><label>Unit Cost ₹</label><input id="pur-cost" type="number" placeholder="0"></div>
              <div class="fld"><label>Supplier</label><input id="pur-note" placeholder="e.g. Ravi Traders"></div>
            </div>
            <button class="btn btn-amber" data-click="savePurchase">✓ Add to Stock</button>
          </div>
        </div>
        <div id="stock-form" style="display:none">
          <div class="card" style="max-width:500px">
            <div class="ch"><div class="ct">Set Opening Stock</div><button class="btn btn-sm" data-click="closeStockForm">✕</button></div>
            <div class="fg fg3">
              <div class="fld"><label>Material</label><select id="stk-mat"></select></div>
              <div class="fld"><label>Current Stock</label><input id="stk-qty" type="number" placeholder="0"></div>
              <div class="fld"><label>Reorder Level</label><input id="stk-reorder" type="number" placeholder="100"></div>
            </div>
            <button class="btn btn-amber btn-sm" data-click="saveStock">✓ Set Stock</button>
          </div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Movement History</div></div><div id="stock-history"></div></div>
      </div>`;
