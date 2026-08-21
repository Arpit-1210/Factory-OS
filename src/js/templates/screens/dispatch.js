// Markup for the "dispatch" screen (#sc-dispatch). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `<div class="screen" id="sc-dispatch">
  <div class="page-hero"><h1>Dispatch <span>Manager</span></h1><p>Link dispatches to orders and deduct from stock</p></div>
  <div id="dispatch-pending-orders"></div>
  <div class="card" style="margin-top:16px">
    <div class="ch"><div class="ct">Dispatch History</div></div>
    <div id="dispatch-history"></div>
  </div>
</div>`;
