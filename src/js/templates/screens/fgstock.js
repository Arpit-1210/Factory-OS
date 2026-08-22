// Markup for the "fgstock" screen (#sc-fgstock). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-fgstock">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>FG <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)">Moulding → Finishing → Painting → Packing</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-amber" data-click="openFGTransfer">↔ Transfer</button>
            <button class="btn btn-sm" data-click="openFGAdjust">✏️ Adjust</button>
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
