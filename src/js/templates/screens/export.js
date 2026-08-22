// Markup for the "export" screen (#sc-export). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `<div class="screen" id="sc-export">
  <div class="page-hero"><h1>Excel <span>Export</span></h1><p>Download reports as .xlsx files — choose date range</p></div>

  <!-- Date range selector -->
  <div class="card" style="max-width:500px;margin-bottom:20px">
    <div class="ch"><div class="ct">Date Range for Export</div></div>
    <div class="fg fg2">
      <div class="fld"><label>From Date</label><input type="date" id="exp-from"></div>
      <div class="fld"><label>To Date</label><input type="date" id="exp-to"></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <button class="btn btn-sm" data-click="setExpRange" data-args="[&quot;today&quot;]">Today</button>
      <button class="btn btn-sm" data-click="setExpRange" data-args="[&quot;week&quot;]">This Week</button>
      <button class="btn btn-sm" data-click="setExpRange" data-args="[&quot;month&quot;]">This Month</button>
      <button class="btn btn-sm" data-click="setExpRange" data-args="[&quot;all&quot;]">All Time</button>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">👷</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Attendance Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Workers present/absent with wages</div>
      <button class="btn btn-blue btn-full" data-click="exportAttendance">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">🏭</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Production Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Production by stage, product, supervisor</div>
      <button class="btn btn-blue btn-full" data-click="exportProduction">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">📋</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Orders Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">All orders with status, amount, balance</div>
      <button class="btn btn-blue btn-full" data-click="exportOrders">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">💼</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Salary Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Monthly payroll for all workers</div>
      <div class="fld" style="margin-bottom:10px;text-align:left"><label>Month</label><input type="month" id="export-sal-month"></div>
      <button class="btn btn-blue btn-full" data-click="exportSalaryExcel">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">📦</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">Inventory Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">RM stock + FG stock across all stages</div>
      <button class="btn btn-blue btn-full" data-click="exportInventory">📊 Download</button>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:36px;margin-bottom:12px">💰</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">P&amp;L Report</div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:14px">Daily profit/loss ledger history</div>
      <button class="btn btn-blue btn-full" data-click="exportPnL">📊 Download</button>
    </div>
  </div>
</div>`;
