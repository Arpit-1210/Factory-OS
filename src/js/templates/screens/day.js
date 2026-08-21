// Markup for the "day" screen (#sc-day). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-day">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px">
          <div class="page-hero" style="margin-bottom:0"><h1 id="day-title">Day <span style="color:var(--amber)">Sheet</span></h1></div>
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            <button class="btn btn-jade btn-sm" onclick="syncToSheets()">☁ Sync to Sheets</button>
            <button class="btn btn-amber" onclick="saveDay()">💾 Save Day & Start Next</button>
          </div>
        </div>
        <div class="mrow" id="day-met"></div>
        <div class="card"><div class="ch"><div class="ct">Team-wise Performance</div></div><div id="day-team-cards"></div><div class="div"></div><div class="ct" style="margin-bottom:10px">Summary Table</div>
          <div class="tw"><table class="tbl"><thead><tr><th>Supervisor</th><th>Stage</th><th>Team Members</th><th class="num">Size</th><th class="num">Goods ₹</th><th class="num">Labour ₹</th><th class="num">OT ₹</th><th class="num">RM ₹</th><th class="num">Net ₹</th><th class="num">₹/Worker</th></tr></thead><tbody id="day-teams"></tbody></table></div>
        </div>
        <div class="card"><div class="ch"><div class="ct">Stage-wise Inventory</div></div><div id="day-inv"></div></div>
        <!-- Attendance removed from Day Sheet -->
        <div class="card"><div class="ch"><div class="ct">RM P&L</div></div><div id="day-rm-pnl"></div></div>
      </div>`;
