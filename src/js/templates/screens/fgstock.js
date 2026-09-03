// Markup for the "fgstock" screen (#sc-fgstock). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-fgstock">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>FG <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)">Moulding → Finishing → Painting → Packing</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-amber" data-click="openFGTransfer">↔ Transfer</button>
            <button class="btn btn-sm" data-click="openFGAdjust">✏️ Adjust</button>
            <button class="btn btn-sm" data-click="openOpeningStock" id="fgo-open-btn">📥 Opening Stock</button>
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
          <div class="tab active" data-click="switchFGStage" data-args="[&quot;all&quot;]">All Stages</div>
          <div class="tab" data-click="switchFGStage" data-args="[&quot;Moulding&quot;]">🔵 Moulding</div>
          <div class="tab" data-click="switchFGStage" data-args="[&quot;Finishing&quot;]">🟡 Finishing</div>
          <div class="tab" data-click="switchFGStage" data-args="[&quot;Painting&quot;]">🟢 Painting</div>
          <div class="tab" data-click="switchFGStage" data-args="[&quot;Packing&quot;]">🟣 Packing</div>
        </div>
        <!-- A standing note when the factory has no opening declaration, or
             when one has been drafted but never confirmed. Balances treat a
             missing declaration as zero, which is a legitimate answer and an
             easy one to arrive at by accident. -->
        <div id="fgo-notice" style="display:none;margin-bottom:14px"></div>

        <!-- ── OPENING STOCK ──
             What the factory held on its go-live date. Entered once, confirmed,
             and thereafter the fixed point every balance is measured from. -->
        <div id="fgo-panel" style="display:none">
          <div class="card" style="margin-bottom:16px">
            <div class="ch">
              <div class="ct">📥 Opening Stock</div>
              <button class="btn btn-sm" data-click="closeOpeningStock">✕</button>
            </div>
            <div class="ibox">
              What was physically on the floor at each stage on your go-live date.
              Everything after it is calculated: opening + produced + transfers in
              − transfers out. Leave a cell blank for nothing.
            </div>
            <div id="fgo-lockbar" style="display:none;margin-bottom:12px"></div>
            <div class="fg fg2" style="margin-bottom:12px">
              <div class="fld">
                <label>Stock as of (go-live date)</label>
                <input id="fgo-date" type="date">
              </div>
              <div class="fld">
                <label>Import from a sheet</label>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <!-- The stylesheet hides every file input, so this one is
                       opened by a real button — the same way the Setup
                       screen's Excel importers work. -->
                  <button class="btn btn-sm" data-click="pickOpeningFile" style="flex:1;min-width:130px">📊 Choose sheet</button>
                  <button class="btn btn-sm" data-click="dlSampleOpening">⬇ Template</button>
                  <input type="file" id="fgo-file" accept=".xlsx,.xls,.csv" data-change="uploadOpeningStock">
                </div>
              </div>
            </div>
            <div id="fgo-status"></div>
            <!-- A real catalogue runs to hundreds of products. Without a search
                 the owner scrolls thousands of pixels to reach each one. -->
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
              <input id="fgo-search" type="search" placeholder="Search products…" data-input="filterOpeningStock"
                     style="flex:1;min-width:180px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--surface2);color:var(--text)">
              <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text4);white-space:nowrap;cursor:pointer">
                <input type="checkbox" id="fgo-only-filled" data-change="toggleOpeningFilled" style="cursor:pointer">
                Only rows with a quantity
              </label>
            </div>
            <div id="fgo-count" style="font-size:11px;color:var(--text4);font-family:var(--mono);margin-bottom:6px"></div>
            <div class="tw" style="max-height:420px;overflow:auto">
              <table class="tbl" id="fgo-table">
                <thead><tr>
                  <th>Product</th>
                  <th class="num">Moulding</th><th class="num">Finishing</th>
                  <th class="num">Painting</th><th class="num">Packing</th>
                  <th class="num">Total</th>
                </tr></thead>
                <tbody id="fgo-body"></tbody>
              </table>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap">
              <button class="btn btn-sm" data-click="clearOpeningStock" id="fgo-clear">Clear all</button>
              <button class="btn btn-amber" data-click="confirmOpeningStock" id="fgo-confirm">✓ Confirm &amp; Lock</button>
              <button class="btn btn-sm" data-click="unlockOpeningStock" id="fgo-unlock" style="display:none">🔓 Unlock to edit</button>
            </div>
          </div>
        </div>

        <div id="fg-stock-content"></div>
        <div id="fg-transfer-form" style="display:none">
          <div class="card" style="max-width:540px">
            <div class="ch"><div class="ct">↔ Transfer Goods</div><button class="btn btn-sm" data-click="closeFGTransfer">✕</button></div>
            <div class="ibox">Goods deducted from source stage and added to destination automatically.</div>
            <div class="fg fg2">
              <div class="fld"><label>From Stage</label><select id="fgt-from" data-change="updateFGTransferTo"><option>Moulding</option><option>Finishing</option><option>Painting</option><option>Packing</option></select></div>
              <div class="fld"><label>To Stage</label><select id="fgt-to"><option>Finishing</option><option>Painting</option><option>Packing</option><option>Dispatch</option></select></div>
            </div>
            <div class="fg fg3">
              <div class="fld"><label>Product</label><select id="fgt-prod"></select></div>
              <div class="fld"><label>Quantity</label><input id="fgt-qty" type="number" placeholder="0"></div>
              <div class="fld"><label>Date</label><input id="fgt-date" type="date"></div>
            </div>
            <div class="fld" style="margin-bottom:10px"><label>Note</label><input id="fgt-note" placeholder="e.g. Moved to finishing team"></div>
            <button class="btn btn-amber" data-click="saveFGTransfer">✓ Transfer</button>
          </div>
        </div>
        <div id="fg-adjust-form" style="display:none">
          <div class="card" style="max-width:500px">
            <div class="ch"><div class="ct">✏️ Manual Adjustment</div><button class="btn btn-sm" data-click="closeFGAdjust">✕</button></div>
            <div class="fg fg4">
              <div class="fld"><label>Stage</label><select id="fga-stage"><option>Moulding</option><option>Finishing</option><option>Painting</option><option>Packing</option></select></div>
              <div class="fld"><label>Product</label><select id="fga-prod"></select></div>
              <div class="fld"><label>Qty (+/-)</label><input id="fga-qty" type="number" placeholder="e.g. -2"></div>
              <div class="fld"><label>Reason</label><input id="fga-note" placeholder="Damage, recount..."></div>
            </div>
            <button class="btn btn-amber btn-sm" data-click="saveFGAdjust">✓ Adjust</button>
          </div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Movement History</div></div><div id="fg-history"></div></div>
      </div>`;
