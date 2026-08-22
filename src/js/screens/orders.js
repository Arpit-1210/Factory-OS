// ==================================================================
//  SCREEN / ORDERS — Order pipeline, items and status
//
//  Markup: src/js/templates/screens/orders.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { isOverdue } from '../core/calc.js';
import { fmt, todayStr } from '../core/format.js';
import { S, uid } from '../core/state.js';

// ── screen state ──
let orderItems = []; // [{name, qty, price}]
let orderFilter = 'all';

function renderOrders(){
  const orders = orderFilter==='all' ? S.orders : S.orders.filter(o=>o.status===orderFilter);

  // Tab active state
  document.querySelectorAll('#order-tabs .tab').forEach(t=>{
    const f = t.onclick?.toString().match(/'(\w+)'/)?.[1];
    t.classList.toggle('active', f===orderFilter);
  });

  // Metrics
  const total=S.orders.length;
  const pending=S.orders.filter(o=>o.status==='pending').length;
  const production=S.orders.filter(o=>o.status==='production').length;
  const ready=S.orders.filter(o=>o.status==='ready').length;
  const totalAmount=S.orders.reduce((a,o)=>a+o.amount,0);
  const balanceDue=S.orders.filter(o=>o.status!=='dispatched').reduce((a,o)=>a+(o.amount-o.advance),0);
  const overdue=S.orders.filter(o=>isOverdue(o)).length;
  document.getElementById('order-metrics').innerHTML=`
    <div class="met m-blue"><div class="ml">Total Orders</div><div class="mv w">${total}</div></div>
    <div class="met m-amber"><div class="ml">Pending</div><div class="mv a">${pending}</div></div>
    <div class="met m-blue"><div class="ml">In Production</div><div class="mv b">${production}</div></div>
    <div class="met m-green"><div class="ml">Ready</div><div class="mv g">${ready}</div></div>
    <div class="met m-amber"><div class="ml">Balance Due</div><div class="mv a">${fmt(balanceDue)}</div></div>
    ${overdue?`<div class="met m-red"><div class="ml">Overdue 🚨</div><div class="mv r">${overdue}</div></div>`:''}`;

  if(!orders.length){
    document.getElementById('order-list').innerHTML=`<div class="card" style="text-align:center;padding:32px;color:#9CA3AF">No orders yet. Click <b>+ New Order</b> to create one.</div>`;
    return;
  }

  document.getElementById('order-list').innerHTML = orders.map(o=>{
    const balance = o.amount - o.advance;
    const od = isOverdue(o);
    const priorityColor = o.priority==='urgent'?'#B91C1C':o.priority==='high'?'#92400E':'#6B7280';
    return`<div class="card" style="border-left:3px solid ${od?'#EF4444':orderStatusBg(o.status)};margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-weight:600;font-size:14px;color:#111827">${o.customer}</span>
            <span style="font-family:var(--mono);font-size:9px;color:#9CA3AF">${o.id}</span>
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-weight:600;font-family:var(--mono)">${o.status.toUpperCase()}</span>
            ${od?'<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:#FEF2F2;color:#B91C1C;font-weight:600;font-family:var(--mono)">OVERDUE</span>':''}
            ${o.priority!=='normal'?`<span style="font-size:10px;color:${priorityColor};font-weight:600">${o.priority==='urgent'?'🚨 URGENT':'⚡ HIGH'}</span>`:''}
          </div>
          <div style="font-size:12px;color:#6B7280">${o.city}${o.phone?' · '+o.phone:''} ${o.requiredBy?' · Required by '+new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</div>
          ${o.items?`<div style="font-size:12px;color:#374151;margin-top:3px">${o.items}</div>`:''}
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:#111827">${fmt(o.amount)}</div>
          <div style="font-size:11px;color:#6B7280">Advance: ${fmt(o.advance)}</div>
          <div style="font-size:12px;font-weight:600;color:${balance>0?'#B91C1C':'#065F46'}">Balance: ${fmt(balance)}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
        ${o.status==='pending'?`<button class="btn btn-sm" onclick="updateOrderStatus('${o.id}','production')" style="background:#EFF6FF;color:#1E40AF;border-color:#BFDBFE">→ Start Production</button>`:''}
        ${o.status==='production'?`<button class="btn btn-sm" onclick="updateOrderStatus('${o.id}','ready')" style="background:#ECFDF5;color:#065F46;border-color:#A7F3D0">→ Mark Ready</button>`:''}
        ${o.status==='ready'?`<button class="btn btn-sm" onclick="updateOrderStatus('${o.id}','dispatched')" style="background:#F9FAFB;color:#374151;border-color:#E5E7EB">🚚 Dispatch</button>`:''}
        ${balance>0 && o.status!=='dispatched'?`<button class="btn btn-sm" onclick="recordPayment('${o.id}')" style="background:#FFFBEB;color:#92400E;border-color:#FDE68A">💰 Record Payment</button>`:''}
        <button class="btn btn-sm btn-ember btn-xs" onclick="deleteOrder('${o.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}
function filterOrders(f){ orderFilter=f; renderOrders(); }
function openNewOrder(){
  orderItems = [];
  renderOrderItemsList();
  document.getElementById('ord-item-search').value='';
  document.getElementById('ord-item-qty').value='1';
  document.getElementById('ord-item-price').value='';
  document.getElementById('ord-customer').value='';
  document.getElementById('ord-phone').value='';
  document.getElementById('ord-city').value='';
  document.getElementById('ord-advance').value='';
  document.getElementById('ord-amount').value='';
  document.getElementById('ord-total-display').textContent='₹0';
  const today = new Date(); today.setDate(today.getDate()+7);
  document.getElementById('ord-date').value = today.toISOString().slice(0,10);
  document.getElementById('order-form-wrap').style.display='block';
  document.getElementById('order-form-wrap').scrollIntoView({behavior:'smooth'});
}
function closeOrderForm(){
  document.getElementById('order-form-wrap').style.display='none';
  document.getElementById('ord-item-dropdown').style.display='none';
}
function filterOrderProducts(){
  const q = document.getElementById('ord-item-search').value.trim().toLowerCase();
  const dd = document.getElementById('ord-item-dropdown');
  if(!q){dd.style.display='none';return;}
  const matches = S.fg.filter(p=>p.name.toLowerCase().includes(q)).slice(0,25);
  if(!matches.length){dd.style.display='none';return;}
  dd.innerHTML = matches.map(p=>`<div onclick="selectOrderProduct('${p.name.replace(/'/g,"\\'")}',${p.price||0})"
    style="padding:9px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"
    onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
    <span style="font-weight:500;color:var(--text)">${p.name}</span>
    <span style="font-family:var(--mono);font-size:11px;color:var(--text4);margin-left:12px;flex-shrink:0">₹${p.price||0}</span>
  </div>`).join('');
  dd.style.display='block';
}
function selectOrderProduct(name, price){
  document.getElementById('ord-item-search').value=name;
  document.getElementById('ord-item-price').value=price||'';
  document.getElementById('ord-item-dropdown').style.display='none';
}
function addOrderItem(){
  const name = document.getElementById('ord-item-search').value.trim();
  const qty = parseInt(document.getElementById('ord-item-qty').value)||1;
  const price = parseFloat(document.getElementById('ord-item-price').value)||0;
  if(!name){alert('Select a product first.');return;}
  // Check if already added — update qty
  const existing = orderItems.find(i=>i.name===name);
  if(existing){ existing.qty+=qty; existing.price=price||existing.price; }
  else orderItems.push({name,qty,price});
  document.getElementById('ord-item-search').value='';
  document.getElementById('ord-item-qty').value='1';
  document.getElementById('ord-item-price').value='';
  renderOrderItemsList();
}
function changeOrderItemQty(idx, delta){
  orderItems[idx].qty = Math.max(1, (orderItems[idx].qty||1)+delta);
  renderOrderItemsList();
}
function removeOrderItem(idx){
  orderItems.splice(idx,1);
  renderOrderItemsList();
}
function renderOrderItemsList(){
  const el = document.getElementById('ord-items-list');
  const countEl = document.getElementById('ord-items-count');
  if(!orderItems.length){
    el.innerHTML='<div style="color:var(--text4);font-size:12px;padding:12px 0;text-align:center;border:1px dashed var(--border);border-radius:var(--r)">No items added yet — search and add products above</div>';
    if(countEl) countEl.textContent='';
    updateOrderTotal();
    return;
  }
  el.innerHTML=`<div style="border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:var(--surface2)">
          <th style="padding:8px 12px;text-align:left;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">#</th>
          <th style="padding:8px 12px;text-align:left;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Product</th>
          <th style="padding:8px 12px;text-align:right;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">₹/pc</th>
          <th style="padding:8px 12px;text-align:right;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Total</th>
          <th style="padding:8px 12px"></th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map((item,i)=>`
          <tr style="border-top:1px solid var(--border);${i%2===0?'background:var(--surface)':'background:var(--bg2)'}">
            <td style="padding:10px 12px;color:var(--text4);font-family:var(--mono);font-size:11px">${i+1}</td>
            <td style="padding:10px 12px;font-weight:500;color:var(--text)">${item.name}</td>
            <td style="padding:10px 12px;text-align:right">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                <button onclick="changeOrderItemQty(${i},-1)" style="width:22px;height:22px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--text2)">−</button>
                <span style="font-family:var(--mono);font-weight:600;min-width:28px;text-align:center">${item.qty}</span>
                <button onclick="changeOrderItemQty(${i},1)" style="width:22px;height:22px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--text2)">+</button>
              </div>
            </td>
            <td style="padding:10px 12px;text-align:right;font-family:var(--mono)">
              <input type="number" value="${item.price||0}" onchange="orderItems[${i}].price=parseFloat(this.value)||0;renderOrderItemsList()" style="width:80px;padding:4px 7px;border:1px solid var(--border);border-radius:5px;background:var(--surface2);font-size:12px;text-align:right;color:var(--text);outline:none" onfocus="this.style.borderColor='var(--blue)'" onblur="this.style.borderColor='var(--border)'">
            </td>
            <td style="padding:10px 12px;text-align:right;font-family:var(--mono);font-weight:700;color:var(--blue)">₹${((item.price||0)*item.qty).toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px"><button onclick="removeOrderItem(${i})" style="background:none;border:none;color:var(--ember);cursor:pointer;font-size:16px;padding:2px 4px">✕</button></td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
  if(countEl) countEl.textContent=`${orderItems.length} product${orderItems.length!==1?'s':''} · ${orderItems.reduce((a,i)=>a+i.qty,0)} total units`;
  updateOrderTotal();
}
function updateOrderTotal(){
  const total = orderItems.reduce((a,i)=>a+(i.price||0)*i.qty,0);
  document.getElementById('ord-amount').value=total;
  document.getElementById('ord-total-display').textContent='₹'+total.toLocaleString('en-IN');
}
// Import from Sheets removed
function importOrdersFromSheets(){
  if(!S.sheetsUrl){alert('Google Sheets URL not set. Go to Settings → Google Sheets.');return;}
  const statusEl = document.getElementById('import-status');
  statusEl.textContent='⏳ Fetching...';

  // Use script tag trick to bypass CORS (JSONP-style)
  const cbName = 'sheetsOrderCB_'+Date.now();
  window[cbName] = function(data){
    delete window[cbName];
    document.getElementById('_sheets-script')?.remove();
    if(!data||!data.orders){statusEl.textContent='⚠ No data returned';setTimeout(()=>statusEl.textContent='',3000);return;}
    let added=0;
    data.orders.forEach(row=>{
      if(!row.customer) return;
      const exists=S.orders.find(o=>o.id===row.id||(o.customer===row.customer&&o.createdAt===row.date));
      if(!exists){
        S.orders.unshift({
          id:row.id||('IMP-'+uid()),
          customer:row.customer||'',
          phone:row.phone||'',
          city:row.city||'',
          requiredBy:row.requiredBy||'',
          priority:row.priority||'normal',
          amount:parseFloat(row.amount)||0,
          advance:parseFloat(row.advance)||0,
          items:row.items||'',
          status:row.status||'pending',
          createdAt:row.date||todayStr(),
          fromSheets:true
        });
        added++;
      }
    });
    persist();
    renderOrders();
    renderHome();
    statusEl.textContent=added>0?`✓ ${added} order${added!==1?'s':''} imported`:'✓ All up to date';
    setTimeout(()=>statusEl.textContent='',4000);
  };

  // Apps Script must support callback param — add ?action=getOrders&callback=cbName
  const script = document.createElement('script');
  script.id='_sheets-script';
  script.onerror=()=>{
    delete window[cbName];
    // Fallback: try direct fetch (works if CORS allowed)
    fetch(S.sheetsUrl+'?action=getOrders')
      .then(r=>r.json())
      .then(data=>window[cbName]&&window[cbName](data))
      .catch(()=>{
        statusEl.textContent='⚠ Could not import — update Apps Script and redeploy';
        setTimeout(()=>statusEl.textContent='',5000);
      });
  };
  script.src=S.sheetsUrl+'?action=getOrders&callback='+cbName;
  document.head.appendChild(script);
  setTimeout(()=>{
    if(window[cbName]){
      delete window[cbName];
      document.getElementById('_sheets-script')?.remove();
      // Try direct fetch as backup
      fetch(S.sheetsUrl+'?action=getOrders')
        .then(r=>r.json())
        .then(data=>{
          if(!data||!data.orders){statusEl.textContent='No orders in sheet';setTimeout(()=>statusEl.textContent='',3000);return;}
          let added=0;
          data.orders.forEach(row=>{
            if(!row.customer) return;
            const exists=S.orders.find(o=>o.id===row.id||(o.customer===row.customer&&o.createdAt===row.date));
            if(!exists){
              S.orders.unshift({id:row.id||('IMP-'+uid()),customer:row.customer||'',phone:row.phone||'',city:row.city||'',requiredBy:row.requiredBy||'',priority:row.priority||'normal',amount:parseFloat(row.amount)||0,advance:parseFloat(row.advance)||0,items:row.items||'',status:row.status||'pending',createdAt:row.date||todayStr(),fromSheets:true});
              added++;
            }
          });
          persist();renderOrders();renderHome();
          statusEl.textContent=added>0?`✓ ${added} imported`:'✓ Up to date';
          setTimeout(()=>statusEl.textContent='',4000);
        })
        .catch(()=>{statusEl.textContent='⚠ Failed — check Apps Script';setTimeout(()=>statusEl.textContent='',5000);});
    }
  },5000);
}
function saveOrder(){
  const customer = document.getElementById('ord-customer').value.trim();
  const amount = parseFloat(document.getElementById('ord-amount').value)||0;
  if(!customer){alert('Enter customer name.');return;}
  if(!orderItems.length){alert('Add at least one item.');return;}
  const itemsStr = orderItems.map(i=>`${i.name} x${i.qty}`).join(', ');
  const order = {
    id: 'ORD-'+Date.now().toString().slice(-6),
    customer,
    phone: document.getElementById('ord-phone').value.trim(),
    city: document.getElementById('ord-city').value.trim(),
    requiredBy: document.getElementById('ord-date').value,
    priority: document.getElementById('ord-priority').value,
    amount,
    advance: parseFloat(document.getElementById('ord-advance').value)||0,
    items: itemsStr,
    fgItems: orderItems.map(i=>({name:i.name,qty:i.qty,price:i.price})),
    status: 'pending',
    createdAt: todayStr(),
  };
  S.orders.unshift(order);
  // Reserve inventory against this order
  if(order.items){
    if(!S.orderReservations) S.orderReservations=[];
    S.orderReservations.push({orderId:order.id, items:order.items, date:order.createdAt});
  }
  persist();
  // Sync order to Google Sheets immediately
  if(S.sheetsUrl){
    const payload = {
      action:'order',
      id: order.id,
      date: order.createdAt,
      customer: order.customer,
      phone: order.phone||'',
      city: order.city||'',
      requiredBy: order.requiredBy||'',
      priority: order.priority,
      items: order.items||'',
      amount: order.amount,
      advance: order.advance,
      balance: order.amount - order.advance,
      status: order.status
    };
    sendGet(S.sheetsUrl, 'action=order&payload='+encodeURIComponent(JSON.stringify(payload)));
  }
  closeOrderForm();
  ['ord-customer','ord-phone','ord-city','ord-items','ord-amount','ord-advance'].forEach(id=>{
    document.getElementById(id).value='';
  });
  // Show confirmation with next steps
  alert(`✓ Order created!\n\nOrder ID: ${order.id}\nCustomer: ${order.customer}\n\n→ Go to Supervisor Teams to start production\n→ Check Inventory for stock reservation`);
  renderOrders();
  renderHome();
}
function updateOrderStatus(id, status){
  const o = S.orders.find(o=>o.id===id);
  if(!o) return;
  const prev = o.status;
  o.status = status;
  o.statusUpdatedAt = todayStr();

  // On dispatch — deduct from Packing stage FG stock
  if(status==='dispatched' && prev!=='dispatched'){
    o.dispatchedAt = todayStr();
    // Try to deduct items from Packing stock via transfer record
    if(o.items && o.fgItems && o.fgItems.length){
      o.fgItems.forEach(item=>{
        const key = item.name;
        const alreadyAssigned = (o.assignedItems||{})[key]||0;
        const stillToDeduct = Math.max(0,(item.qty||1)-alreadyAssigned);
        if(stillToDeduct>0){
          if(!S.fgTransfers) S.fgTransfers=[];
          S.fgTransfers.push({id:uid(),date:todayStr(),from:'Packing',to:'Dispatch',product:key,productIn:key,qty:stillToDeduct,note:'Dispatch '+o.id+' — '+o.customer,auto:false});
        }
      });
    }
    // Sync dispatch to Sheets
    if(S.sheetsUrl){
      sendGet(S.sheetsUrl,'action=order&payload='+encodeURIComponent(JSON.stringify({
        action:'order',id:o.id,date:todayStr(),customer:o.customer,
        phone:o.phone||'',city:o.city||'',requiredBy:o.requiredBy||'',
        priority:o.priority,items:o.items||'',amount:o.amount,
        advance:o.advance,balance:o.amount-o.advance,status:'dispatched'
      })));
    }
  }

  // On start production — sync status update to Sheets
  if(status==='production' && S.sheetsUrl){
    sendGet(S.sheetsUrl,'action=order&payload='+encodeURIComponent(JSON.stringify({
      action:'order',id:o.id,date:todayStr(),customer:o.customer,
      phone:o.phone||'',city:o.city||'',requiredBy:o.requiredBy||'',
      priority:o.priority,items:o.items||'',amount:o.amount,
      advance:o.advance,balance:o.amount-o.advance,status:'production'
    })));
  }

  persist();
  renderOrders();
  renderPayments();
  renderHome();
}
function recordPayment(id){
  const o = S.orders.find(o=>o.id===id);
  if(!o) return;
  const balance = o.amount - o.advance;
  const amt = parseFloat(prompt(`Record payment for ${o.customer}
Balance due: ${fmt(balance)}
Enter amount received:`));
  if(!amt||isNaN(amt)) return;
  o.advance = Math.min(o.advance + amt, o.amount);
  persist();
  renderOrders(); renderPayments(); renderHome();
  alert(`✓ Payment of ${fmt(amt)} recorded. New balance: ${fmt(o.amount-o.advance)}`);
}
function deleteOrder(id){
  if(!confirm('Delete this order?')) return;
  S.orders = S.orders.filter(o=>o.id!==id);
  persist(); renderOrders(); renderPayments(); renderHome();
}


// Status pill colours. Presentation, so they live with the screen that
// shows them rather than in shared formatting.
function orderStatusColor(s){return s==='pending'?'#92400E':s==='production'?'#1E40AF':s==='ready'?'#065F46':'#6B7280';}
function orderStatusBg(s){return s==='pending'?'var(--amber-l)':s==='production'?'var(--blue-l)':s==='ready'?'var(--jade-l)':'var(--surface2)';}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, {
  orderStatusColor, orderStatusBg,
  renderOrders,
  filterOrders,
  openNewOrder,
  closeOrderForm,
  filterOrderProducts,
  selectOrderProduct,
  addOrderItem,
  changeOrderItemQty,
  removeOrderItem,
  renderOrderItemsList,
  updateOrderTotal,
  importOrdersFromSheets,
  saveOrder,
  updateOrderStatus,
  recordPayment,
  deleteOrder,
});

// State the rest of the app reads. Re-published on each change by the
// functions above; mirrored here so the initial value is visible too.
window.orderItems = orderItems;
window.orderFilter = orderFilter;
