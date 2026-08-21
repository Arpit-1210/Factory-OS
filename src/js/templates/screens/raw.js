// Markup for the "raw" screen (#sc-raw). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-raw">
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
      </div>`;
