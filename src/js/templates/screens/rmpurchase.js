// Markup for the "rmpurchase" screen (#sc-rmpurchase). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-rmpurchase">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>RM <span style="color:var(--amber)">Purchase</span></h1><p style="color:var(--text4);font-family:var(--mono)">Opening stock, procurement & adjustments</p></div>
          <button class="btn btn-amber" data-click="openRMPurchaseForm">+ Add Entry</button>
        </div>
        <div id="rmp-form" style="display:none">
          <div class="card" style="max-width:580px">
            <div class="ch"><div class="ct">New Stock Entry</div><button class="btn btn-sm" data-click="closeRMPurchaseForm">✕</button></div>
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
            <button class="btn btn-amber" data-click="saveRMPurchase">✓ Save Entry</button>
          </div>
        </div>
        <div class="mrow" id="rmp-metrics"></div>
        <div class="card"><div class="ch"><div class="ct">Material-wise Summary</div></div><div id="rmp-summary"></div></div>
        <div class="card">
          <div class="ch">
            <div class="ct">All Entries</div>
            <select id="rmp-filter" data-change="renderRMPurchase" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:12px;color:var(--text2)"><option value="all">All Materials</option></select>
          </div>
          <div id="rmp-history"></div>
        </div>
      </div>`;
