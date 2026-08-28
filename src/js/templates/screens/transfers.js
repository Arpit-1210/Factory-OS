// Markup for the "transfers" screen (#sc-transfers). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `<div class="screen" id="sc-transfers">
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
        <select id="ut-type" data-change="renderUTItemDD">
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
          <input id="ut-item-search" placeholder="Search item..." data-input="filterUTItems" data-click="filterUTItems" autocomplete="off">
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
    <button class="btn btn-amber btn-full" data-click="saveUnitTransfer">✓ Log Transfer</button>
  </div>

  <!-- Metrics -->
  <div id="ut-metrics" class="mrow"></div>

  <!-- Table -->
  <div class="card">
    <div class="ch">
      <div class="ct">Transfer Log</div>
      <div style="display:flex;gap:8px">
        <select id="ut-filter-dir" data-change="renderUnitTransfers" style="font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text2)">
          <option value="all">All Directions</option>
          <option value="Unit1→Unit2">Unit 1 → Unit 2</option>
          <option value="Unit2→Unit1">Unit 2 → Unit 1</option>
        </select>
        <select id="ut-filter-type" data-change="renderUnitTransfers" style="font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text2)">
          <option value="all">All Types</option>
          <option value="RM">RM Only</option>
          <option value="FG">FG Only</option>
        </select>
        <button class="btn btn-sm" data-click="exportUnitTransfers">📊 Export</button>
      </div>
    </div>
    <div id="ut-log"></div>
  </div>
</div>`;
