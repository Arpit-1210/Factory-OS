// Markup for the "stock" screen (#sc-stock). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-stock">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>RM <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)">Running balance — opening + purchases − usage</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-amber" data-click="openPurchase">+ Purchase</button>
            <button class="btn btn-sm" data-click="openStockUpdate">⚙ Set Opening</button>
          </div>
        </div>
        <div id="stock-alerts"></div>
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
