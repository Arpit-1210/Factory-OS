// ==================================================================
//  SCREEN / PAYMENTS — Outstanding balances across orders
//
//  Markup: src/js/templates/screens/payments.js
//
//  Nothing here is published on `window`. The markup names actions
//  (data-click="saveDay") and core/actions.js resolves them through real
//  imports, so a screen reaches another screen by importing it — never
//  through the global object.
//
//  This comment used to claim the opposite, and that claim outlived the
//  refactor that made it false. It is why nineteen missing imports read as
//  deliberate on a code review: `persist()` with no import line looked like
//  the documented global, and was in fact a ReferenceError that aborted Save
//  Day before it could write. tests/free-identifiers.test.mjs now fails the
//  build on any such name.
// ==================================================================

import { isOverdue } from '../core/calc.js';
import { fmt, fmtN } from '../core/format.js';
import { S } from '../core/state.js';
import { orderStatusBg, orderStatusColor } from './orders.js';

export function renderPayments(){
  const unpaid = S.orders.filter(o=>o.status!=='dispatched'&&(o.amount-o.advance)>0);
  const totalBalance = unpaid.reduce((a,o)=>a+(o.amount-o.advance),0);
  const overdueBalance = unpaid.filter(o=>isOverdue(o)).reduce((a,o)=>a+(o.amount-o.advance),0);
  const totalAdvance = S.orders.reduce((a,o)=>a+o.advance,0);

  document.getElementById('pay-metrics').innerHTML=`
    <div class="met m-red"><div class="ml">Total Balance Due</div><div class="mv r">${fmt(totalBalance)}</div></div>
    <div class="met m-red"><div class="ml">Overdue Amount</div><div class="mv r">${fmt(overdueBalance)}</div></div>
    <div class="met m-green"><div class="ml">Total Advance Collected</div><div class="mv g">${fmt(totalAdvance)}</div></div>
    <div class="met m-blue"><div class="ml">Unpaid Orders</div><div class="mv b">${unpaid.length}</div></div>`;

  if(!unpaid.length){
    document.getElementById('pay-list').innerHTML='<div style="color:#9CA3AF;font-size:12px;padding:12px">No pending payments. All orders are paid or dispatched.</div>';
    return;
  }

  document.getElementById('pay-list').innerHTML=`<table class="tbl"><thead><tr>
    <th>Customer</th><th>Order ID</th><th>City</th><th>Status</th>
    <th class="num">Order ₹</th><th class="num">Advance ₹</th><th class="num">Balance ₹</th><th>Due By</th><th></th>
  </tr></thead><tbody>${unpaid.sort((a,b)=>(isOverdue(b)?1:0)-(isOverdue(a)?1:0)).map(o=>{
    const bal=o.amount-o.advance;const od=isOverdue(o);
    return`<tr class="${od?'tr-l':''}">
      <td style="font-weight:500;color:#111827">${o.customer}${od?' 🚨':''}</td>
      <td style="font-family:var(--mono);color:#6B7280">${o.id}</td>
      <td style="color:#6B7280">${o.city||'—'}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-family:var(--mono);font-weight:600">${o.status.toUpperCase()}</span></td>
      <td class="num">${fmtN(o.amount)}</td>
      <td class="num">${fmtN(o.advance)}</td>
      <td class="num" style="color:#B91C1C;font-weight:600">${fmt(bal)}</td>
      <td style="font-size:11px;color:${od?'#B91C1C':'#6B7280'}">${o.requiredBy?new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</td>
      <td><button class="btn btn-sm btn-xs" data-click="recordPayment" data-args="[&quot;${o.id}&quot;]" style="background:#FFFBEB;color:#92400E;border-color:#FDE68A">💰 Pay</button></td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

