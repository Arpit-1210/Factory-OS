// Markup for the "bom" screen (#sc-bom). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `<div class="screen" id="sc-bom">
  <div class="page-hero"><h1>Bill of <span>Materials</span></h1><p>Define RM consumed per product — auto-deduct on production</p></div>
  <div class="card">
    <div class="ch"><div class="ct">Product BOM</div><button class="btn btn-sm btn-blue" data-click="addBOMRow">+ Add Product BOM</button></div>
    <div id="bom-list"></div>
  </div>
  <div class="card" id="bom-form-wrap" style="display:none;max-width:560px">
    <div class="ch"><div class="ct" id="bom-form-title">Add BOM</div><button class="btn btn-sm" data-click="closeBOMForm">✕</button></div>
    <div class="fld" style="margin-bottom:10px">
      <label>Product</label>
      <div style="position:relative">
        <input id="bom-prod-search" placeholder="Search product..." data-input="filterBOMProducts" autocomplete="off">
        <div id="bom-prod-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);max-height:180px;overflow-y:auto;z-index:99;box-shadow:var(--shadow)"></div>
      </div>
    </div>
    <div id="bom-rm-rows"></div>
    <button class="btn btn-sm btn-blue" data-click="addBOMRM" style="margin-bottom:12px">+ Add RM</button>
    <button class="btn btn-amber btn-full" data-click="saveBOM">Save BOM</button>
  </div>
</div>`;
