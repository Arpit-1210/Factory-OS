// Markup for the "month" screen (#sc-month). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-month">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>Monthly <span>Report</span></h1></div>
          <div style="display:flex;gap:7px;align-items:center">
            <button class="btn btn-sm" data-click="prevMonth">← Prev</button>
            <select id="m-mon" data-change="renderMonthly" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:var(--r);font-family:var(--body)"></select>
            <select id="m-yr" data-change="renderMonthly" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:var(--r);font-family:var(--body)"></select>
            <button class="btn btn-sm" data-click="nextMonth">Next →</button>
          </div>
        </div>
        <div class="mrow" id="m-met"></div>
        <div class="card"><div class="ch"><div class="ct">Daily Profit Calendar</div></div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px">
            <div class="cdow">Sun</div><div class="cdow">Mon</div><div class="cdow">Tue</div><div class="cdow">Wed</div><div class="cdow">Thu</div><div class="cdow">Fri</div><div class="cdow">Sat</div>
          </div>
          <div class="cal-wrap" id="m-cal"></div>
          <div style="margin-top:8px;font-size:11px;color:var(--text4);font-family:var(--mono)">Click any day to see details</div>
        </div>
        <!-- Day drill-down -->
        <div id="m-day-detail" style="display:none">
          <div class="card" style="border-left:3px solid var(--blue)">
            <div class="ch">
              <div>
                <div class="ct">Day Detail</div>
                <div id="m-day-title" style="font-size:16px;font-weight:700;color:var(--text);margin-top:4px"></div>
                <!-- When the day was actually typed in, and whether it has been
                     overwritten since. Hidden unless there is something to say. -->
                <div id="m-day-provenance" style="display:none;margin-top:6px;font-size:11px;color:var(--amber);font-family:var(--mono);line-height:1.6"></div>
              </div>
              <button class="btn btn-sm" data-click="closeMonthDayDetail">✕</button>
            </div>
            <div id="m-day-metrics" class="mrow" style="margin-bottom:16px"></div>
            <div id="m-day-prod"></div>
          </div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Day-by-Day Ledger</div></div>
          <div class="tw"><table class="tbl" style="min-width:700px"><thead><tr><th>Date</th><th>Workers</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">OT ₹</th><th class="num">RM ₹</th><th class="num">Net Profit ₹</th><th class="num">Margin %</th></tr></thead><tbody id="m-ledger"></tbody></table></div>
        </div>
        <div class="g2">
          <div class="card"><div class="ch"><div class="ct">Product-wise Production</div></div><div id="m-prods"></div></div>
          <div class="card"><div class="ch"><div class="ct">Stage-wise P&L</div></div><table class="tbl"><thead><tr><th>Stage</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">OT ₹</th><th class="num">RM ₹</th><th class="num">Net ₹</th></tr></thead><tbody id="m-stages"></tbody></table></div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Supervisor Performance</div></div>
          <table class="tbl"><thead><tr><th>Supervisor</th><th>Stages</th><th class="num">Days</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">Avg Team</th><th class="num">₹/Worker/Day</th><th class="num">Net ₹</th></tr></thead><tbody id="m-sups"></tbody></table>
        </div>
        <div class="card"><div class="ch"><div class="ct">Top Performing Days</div></div><div id="m-top-days"></div></div>
      </div>`;
