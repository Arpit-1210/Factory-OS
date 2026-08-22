// Markup for the "orders" screen (#sc-orders). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-orders">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>Orders <span style="color:var(--blue)">Pipeline</span></h1></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-sm btn-jade" data-click="importOrdersFromSheets">📥 Import from Sheets</button>
            <span id="import-status" style="font-size:11px;color:var(--text4);font-family:var(--mono)"></span>
            <button class="btn btn-amber" data-click="openNewOrder">+ New Order</button>
          </div>
        </div>
        <div class="tabs" id="order-tabs">
          <div class="tab active" data-click="filterOrders" data-args="[&quot;all&quot;]">All</div>
          <div class="tab" data-click="filterOrders" data-args="[&quot;pending&quot;]">⏳ Pending</div>
          <div class="tab" data-click="filterOrders" data-args="[&quot;production&quot;]">🏗️ In Production</div>
          <div class="tab" data-click="filterOrders" data-args="[&quot;ready&quot;]">✅ Ready</div>
          <div class="tab" data-click="filterOrders" data-args="[&quot;dispatched&quot;]">🚚 Dispatched</div>
        </div>
        <div class="mrow" id="order-metrics"></div>
        <div id="order-list"></div>
<div id="order-form-wrap" style="display:none">
  <div class="card" style="max-width:780px">
    <div class="ch"><div class="ct">New Customer Order</div><button class="btn btn-sm" data-click="closeOrderForm">✕ Cancel</button></div>

    <!-- Customer details -->
    <div class="fg fg2">
      <div class="fld"><label>Customer Name</label><input id="ord-customer" placeholder="e.g. Shubham Decorators"></div>
      <div class="fld"><label>Phone</label><input id="ord-phone" placeholder="9XXXXXXXXX" type="tel"></div>
    </div>
    <div class="fg fg3">
      <div class="fld"><label>City</label><input id="ord-city" placeholder="e.g. Mumbai"></div>
      <div class="fld"><label>Required By</label><input id="ord-date" type="date"></div>
      <div class="fld"><label>Priority</label><select id="ord-priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent 🚨</option></select></div>
    </div>
    <div class="fld" style="margin-bottom:14px"><label>Advance Paid ₹</label><input id="ord-advance" type="number" placeholder="0" style="max-width:200px"></div>

    <!-- Divider -->
    <div style="height:1px;background:var(--border);margin-bottom:14px"></div>

    <!-- Cart header -->
    <div style="font-family:var(--mono);font-size:9px;font-weight:600;color:var(--text4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">🛒 Order Items</div>

    <!-- Search bar to add products -->
    <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap">
      <div style="position:relative;flex:1;min-width:220px">
        <input id="ord-item-search" placeholder="Search product from catalogue..." data-input="filterOrderProducts" autocomplete="off" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);font-size:12px;color:var(--text);outline:none">
        <div id="ord-item-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);max-height:220px;overflow-y:auto;z-index:999;box-shadow:var(--shadow-lg)"></div>
      </div>
      <input id="ord-item-qty" type="number" placeholder="Qty" min="1" value="1" style="width:72px;padding:9px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);font-size:12px;color:var(--text);outline:none">
      <input id="ord-item-price" type="number" placeholder="₹/pc" style="width:90px;padding:9px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);font-size:12px;color:var(--text);outline:none">
      <button class="btn btn-blue btn-sm" data-click="addOrderItem" style="padding:9px 16px;font-size:12px">+ Add</button>
    </div>

    <!-- Cart items table -->
    <div id="ord-items-list" style="margin-bottom:14px"></div>

    <!-- Total row -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--surface2);border-radius:var(--r);margin-bottom:14px;border:1px solid var(--border)">
      <div>
        <div style="font-size:11px;color:var(--text4);font-family:var(--mono)">TOTAL AMOUNT</div>
        <div id="ord-items-count" style="font-size:11px;color:var(--text4);margin-top:2px"></div>
      </div>
      <span id="ord-total-display" style="font-family:var(--mono);font-size:22px;font-weight:700;color:var(--blue)">₹0</span>
      <input type="hidden" id="ord-amount">
    </div>

    <button class="btn btn-blue btn-full" data-click="saveOrder" style="font-size:14px;padding:13px">✓ Create Order</button>
  </div>
</div>

      </div>`;
