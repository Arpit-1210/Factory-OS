// Markup for the "salary" screen (#sc-salary). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `<div class="screen" id="sc-salary">
  <div class="page-hero"><h1>Salary <span>Management</span></h1><p>Monthly payroll, advances and deductions</p></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
    <div class="fld" style="margin:0"><label>Month</label><input type="month" id="sal-month" style="width:160px"></div>
    <button class="btn btn-blue" data-click="renderSalary" style="margin-top:18px">Load</button>
    <button class="btn btn-amber" data-click="exportSalaryExcel" style="margin-top:18px">📊 Export Excel</button>
  </div>
  <div id="sal-metrics" class="mrow"></div>
  <div class="card">
    <div class="ch"><div class="ct">Worker Payroll</div><div style="font-size:11px;color:var(--text4);font-family:var(--mono)">Click worker to add advance/deduction</div></div>
    <div class="tw"><table class="tbl" id="sal-table">
      <thead><tr>
        <th>#</th><th>Worker</th><th>Role</th><th class="num">Daily Wage</th>
        <th class="num">Days Present</th><th class="num">OT Hours</th><th class="num">OT Amount</th>
        <th class="num">Gross</th><th class="num">Advance</th><th class="num">Deduction</th><th class="num">Net Pay</th><th>Action</th>
      </tr></thead>
      <tbody id="sal-tbody"></tbody>
      <tfoot><tr class="tr-total" id="sal-tfoot"></tr></tfoot>
    </table></div>
  </div>
  <!-- Advance/Deduction modal -->
  <div id="sal-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:none;align-items:center;justify-content:center">
    <div class="card" style="max-width:400px;width:90%;margin:0">
      <div class="ch"><div class="ct" id="sal-modal-name">Worker</div><button class="btn btn-sm" data-click="closeSalModal">✕</button></div>
      <div class="fg fg2">
        <div class="fld"><label>Advance Paid ₹</label><input type="number" id="sal-advance" placeholder="0"></div>
        <div class="fld"><label>Deduction ₹</label><input type="number" id="sal-deduction" placeholder="0"></div>
      </div>
      <div class="fld"><label>Note</label><input id="sal-note" placeholder="e.g. Advance taken 15th July"></div>
      <button class="btn btn-amber btn-full" data-click="saveSalAdj" style="margin-top:10px">Save</button>
    </div>
  </div>
</div>`;
