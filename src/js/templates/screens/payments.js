// Markup for the "payments" screen (#sc-payments). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-payments">
        <div class="page-hero"><h1>Payments <span style="color:var(--amber)">Tracker</span></h1><p>Advance, balance due and overdue payments</p></div>
        <div class="mrow" id="pay-metrics"></div>
        <div class="card"><div class="ch"><div class="ct">Balance Due — All Orders</div></div><div id="pay-list"></div></div>
      </div>`;
