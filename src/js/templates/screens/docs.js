// Markup for the "docs" screen (#sc-docs). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `<div class="screen" id="sc-docs">
  <div class="page-hero">
    <h1>Documents <span style="color:var(--amber)">Generator</span></h1>
    <p style="color:var(--text4);font-family:var(--mono)">Generate Quotation, Invoice or Delivery Challan — print or save as PDF</p>
  </div>

  <div class="g2">
    <!-- LEFT: Form -->
    <div>
      <div class="card">
        <div class="ch"><div class="ct">Document Details</div></div>

        <div class="fg fg2">
          <div class="fld">
            <label>Document Type</label>
            <select id="doc-type" data-change="updateDocType">
              <option value="quotation">📋 Quotation</option>
              <option value="invoice">🧾 Invoice</option>
              <option value="challan">🚚 Delivery Challan</option>
            </select>
          </div>
          <div class="fld">
            <label>Document Number</label>
            <input id="doc-number" placeholder="e.g. Q-2026-001">
          </div>
        </div>

        <div class="fg fg2">
          <div class="fld">
            <label>Date</label>
            <input id="doc-date" type="date">
          </div>
          <div class="fld" id="doc-valid-wrap">
            <label>Valid Until</label>
            <input id="doc-valid" type="date">
          </div>
        </div>

        <div class="div"></div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Customer Details</div>

        <!-- Fill from existing order -->
        <div class="fld" style="margin-bottom:10px">
          <label>Fill from existing order (optional)</label>
          <select id="doc-from-order" data-change="fillFromOrder">
            <option value="">— select order —</option>
          </select>
        </div>

        <div class="fg fg2">
          <div class="fld"><label>Customer Name</label><input id="doc-cust" placeholder="e.g. Shubham Decorators"></div>
          <div class="fld"><label>Phone</label><input id="doc-phone" placeholder="9XXXXXXXXX"></div>
        </div>
        <div class="fg fg2">
          <div class="fld"><label>City</label><input id="doc-city" placeholder="e.g. Mumbai"></div>
          <div class="fld"><label>Address (optional)</label><input id="doc-addr" placeholder="Street, Area..."></div>
        </div>

        <div class="div"></div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Items</div>

        <div id="doc-items-list"></div>

        <div class="fg fg4" style="margin-bottom:8px">
          <div class="fld">
            <label>Product</label>
            <select id="doc-item-prod" data-change="docItemFill"><option value="">— select —</option></select>
          </div>
          <div class="fld"><label>Qty</label><input id="doc-item-qty" type="number" placeholder="1" min="1" value="1"></div>
          <div class="fld"><label>Rate ₹</label><input id="doc-item-rate" type="number" placeholder="0"></div>
          <div class="fld" style="display:flex;align-items:flex-end">
            <button class="btn btn-amber" style="width:100%" data-click="addDocItem">+ Add</button>
          </div>
        </div>

        <div class="fg fg2">
          <div class="fld"><label>Discount ₹ (optional)</label><input id="doc-discount" type="number" placeholder="0" data-input="updateDocPreview"></div>
          <div class="fld"><label>Advance Paid ₹ (optional)</label><input id="doc-advance" type="number" placeholder="0" data-input="updateDocPreview"></div>
        </div>

        <div class="fld"><label>Notes / Terms</label><input id="doc-notes" placeholder="e.g. Delivery within 15 days, 50% advance required"></div>

        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <button class="btn btn-blue" data-click="saveDocAsOrder" style="flex:1;justify-content:center;padding:12px;font-size:14px">📋 Save as Order</button>
          <button class="btn btn-amber" data-click="printDoc" style="flex:1;justify-content:center;padding:12px;font-size:14px">🖨️ Print / PDF</button>
          <button class="btn" data-click="clearDoc">✕ Clear</button>
        </div>
      </div>
    </div>

    <!-- RIGHT: Live Preview -->
    <div>
      <div class="card" style="padding:0;overflow:hidden">
        <div style="background:var(--surface2);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;justify-content:space-between">
          <div class="ct">Live Preview</div>
          <button class="btn btn-sm" data-click="printDoc">🖨️ Print</button>
        </div>
        <div id="doc-preview" style="padding:24px;min-height:400px;font-family:'Inter',sans-serif;font-size:13px;color:#111827"></div>
      </div>
    </div>
  </div>
</div>`;
