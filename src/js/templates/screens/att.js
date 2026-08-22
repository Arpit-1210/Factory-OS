// Markup for the "att" screen (#sc-att). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-att">
        <div class="page-hero"><h1>Morning <span>Attendance</span></h1></div>
        <div class="mrow">
          <div class="met m-blue"><div class="ml">Total</div><div class="mv w" id="a-tot">0</div></div>
          <div class="met m-green"><div class="ml">Present</div><div class="mv g" id="a-pres">0</div></div>
          <div class="met m-red"><div class="ml">Absent</div><div class="mv r" id="a-abs">0</div></div>
          <div class="met m-amber"><div class="ml">Base Wage</div><div class="mv a" id="a-wage">₹0</div></div>
          <div class="met m-amber"><div class="ml">OT Cost</div><div class="mv a" id="a-ot">₹0</div></div>
          <div class="met m-red"><div class="ml">Total Labour</div><div class="mv r" id="a-total-lab">₹0</div></div>
        </div>

        <div class="tabs" id="att-tabs" style="margin-bottom:16px">
          <div class="tab active" data-click="switchAttTab" data-args="[&quot;attendance&quot;]">✅ Attendance</div>
          <div class="tab" data-click="switchAttTab" data-args="[&quot;ot&quot;]">⏰ Overtime</div>
        </div>

        <!-- ATTENDANCE TAB -->
        <div id="att-tab-attendance">
          <div class="card">
            <div class="ch">
              <div class="ct">Tap to mark Present / Absent · ⭐ Supervisor</div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-jade btn-sm" data-click="markAll" data-args="[1]">✓ All Present</button>
                <button class="btn btn-ember btn-sm" data-click="markAll" data-args="[0]">✗ All Absent</button>
              </div>
            </div>
            <div class="wg" id="att-grid"></div>
          </div>
        </div>

        <!-- OT TAB -->
        <div id="att-tab-ot" style="display:none">
          <div class="ibox">Only present workers shown. Enter OT hours for each worker. OT Pay = Wage ÷ 8 × Hours.</div>
          <div class="card">
            <div class="ch">
              <div class="ct">Overtime — Present Workers Only</div>
              <div style="font-size:11px;color:var(--text4);font-family:var(--mono)" id="ot-total-display">Total OT: ₹0</div>
            </div>
            <div id="ot-grid"></div>
          </div>
        </div>

        <button class="btn btn-blue" data-click="go" data-args="[&quot;sup&quot;]" style="margin-top:8px">→ Supervisor Teams</button>
      </div>`;
