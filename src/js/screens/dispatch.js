// ==================================================================
//  SCREEN / DISPATCH — Ready orders, and shipping them out
//
//  Markup: src/js/templates/screens/dispatch.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

// ════ DISPATCH MANAGER ════
function renderDispatch(){
  // Pending/ready orders
  const readyOrders = S.orders.filter(o=>o.status==='ready'||o.status==='production');
  const pendingEl = document.getElementById('dispatch-pending-orders');
  if(pendingEl){
    pendingEl.innerHTML = readyOrders.length ? readyOrders.map(o=>`
      <div class="card" style="border-left:3px solid var(--jade);margin-bottom:10px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-weight:700;font-size:14px">${o.customer} <span style="font-family:var(--mono);font-size:9px;color:var(--text4)">${o.id}</span></div>
            <div style="font-size:12px;color:var(--text3);margin-top:3px">${o.items||'—'} · ${o.city||'—'}</div>
            <div style="font-size:11px;color:var(--text4);font-family:var(--mono);margin-top:2px">Balance: ${fmt(o.amount-o.advance)}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <span style="font-size:10px;padding:2px 10px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-family:var(--mono);font-weight:700">${o.status.toUpperCase()}</span>
            <button class="btn btn-sm btn-jade" onclick="doDispatch('${o.id}')">🚚 Dispatch Now</button>
          </div>
        </div>
      </div>`).join('')
    : '<div class="wbox">No orders ready to dispatch. Mark orders as Ready from the Orders screen first.</div>';
  }

  // Dispatch history
  const hist = document.getElementById('dispatch-history');
  if(hist){
    const dispatched = (S.dispatches||[]).slice().reverse();
    hist.innerHTML = dispatched.length ? `<div class="tw"><table class="tbl">
      <thead><tr><th>Date</th><th>Order ID</th><th>Customer</th><th>Items</th><th class="num">Amount</th><th>Challan</th></tr></thead>
      <tbody>${dispatched.map(d=>`<tr>
        <td style="font-family:var(--mono);font-size:11px">${d.date}</td>
        <td style="font-family:var(--mono);font-size:11px;color:var(--text4)">${d.orderId}</td>
        <td style="font-weight:600">${d.customer}</td>
        <td style="font-size:11px;color:var(--text3)">${d.items||'—'}</td>
        <td class="num pv">${fmt(d.amount||0)}</td>
        <td><span style="font-family:var(--mono);font-size:10px;color:var(--text4)">${d.challan||'—'}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div style="color:var(--text4);font-size:12px;padding:8px 0">No dispatches yet.</div>';
  }
}
function doDispatch(ordId){
  const o = S.orders.find(x=>x.id===ordId);
  if(!o) return;
  const challan = prompt(`Dispatch order for ${o.customer}?\n\nEnter Challan/DC Number (or leave blank):`, 'DC-'+Date.now().toString().slice(-4));
  if(challan===null) return; // cancelled
  // Record dispatch
  if(!S.dispatches) S.dispatches=[];
  S.dispatches.push({
    id:uid(), date:todayStr(), orderId:o.id,
    customer:o.customer, items:o.items,
    amount:o.amount, advance:o.advance,
    balance:o.amount-o.advance,
    challan:challan||'', city:o.city
  });
  // Update order status → dispatched (this also deducts Packing stock via updateOrderStatus)
  updateOrderStatus(ordId,'dispatched');
  persist();
  renderDispatch();
  alert(`✓ Dispatched to ${o.customer}${challan?' — Challan: '+challan:''}`);
}

// ── bridge (delete once every caller imports instead) ──
Object.assign(window, {
  renderDispatch,
  doDispatch,
});
