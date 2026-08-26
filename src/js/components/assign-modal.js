// ==================================================================
//  COMPONENT / ASSIGN MODAL — commit packed stock to a customer order
//
//  Markup: the #assign-modal block in templates/shell.js
//
//  Opened from two places, both of which shipped calling it before it existed:
//  the FG Stock screen's per-product "Assign" button, and the Production
//  screen after packing is logged. Neither worked — openAssignModal was
//  wired to markup and defined nowhere.
//
//  HOW AN ASSIGNMENT IS RECORDED
//  As an fgTransfer from 'Packing' to 'Order'. That is not a new convention:
//  getFGBalance() already treats Order and Dispatch as exits rather than
//  stock-bearing stages, so stock leaves Packing and does not reappear
//  anywhere. Using the existing movement record keeps one history of where
//  goods went, instead of a parallel bookkeeping the stock screens cannot see.
// ==================================================================

import { getFGBalance, isOverdue } from '../core/calc.js';
import { fmtN, todayStr } from '../core/format.js';
import { S, uid } from '../core/state.js';
import { persist } from '../core/sync.js';
import { renderFGStock } from '../screens/fgstock.js';
import { orderStatusBg, orderStatusColor, renderOrders } from '../screens/orders.js';

let assignProduct = null;
let assignAvailable = 0;

/** Orders that are still open and mention this product in their item list. */
function ordersWanting(product) {
  const needle = String(product || '').toLowerCase();
  return (S.orders || [])
    .filter(o => o.status !== 'dispatched' && o.status !== 'cancelled')
    .filter(o => String(o.items || '').toLowerCase().includes(needle));
}

export function openAssignModal(product, available, source) {
  assignProduct = product;
  assignAvailable = Number(available) || 0;

  const label = document.getElementById('assign-product-label');
  if (label) label.textContent = product;

  const info = document.getElementById('assign-stock-info');
  if (info) {
    info.textContent = `${fmtN(assignAvailable)} available in Packing` +
                       (source === 'sup' ? ' · just logged' : '');
  }

  const list = document.getElementById('assign-order-list');
  if (list) {
    const orders = ordersWanting(product);
    list.innerHTML = orders.length
      ? orders.map(o => {
          const overdue = isOverdue(o);
          return `<div class="tp" style="margin-bottom:8px">
            <div class="tph">
              <div><span class="tpn">${o.customer || 'Order #' + o.id}</span>
                <span style="font-family:var(--mono);font-size:10px;color:${orderStatusColor(o.status)};
                  background:${orderStatusBg(o.status)};padding:2px 6px;border-radius:4px;margin-left:6px">${o.status}</span>
                ${overdue ? '<span style="color:var(--ember);font-size:10px;margin-left:6px">OVERDUE</span>' : ''}
              </div>
            </div>
            <div style="font-size:11px;color:var(--text4);margin-bottom:6px">${o.items || ''}${o.requiredBy ? ' · due ' + o.requiredBy : ''}</div>
            <div style="display:flex;gap:6px;align-items:center">
              <input type="number" min="1" max="${assignAvailable}" value="${Math.min(assignAvailable, 1)}"
                id="asg-qty-${o.id}" style="width:90px;padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px">
              <button class="btn btn-jade btn-sm" data-click="confirmAssign" data-args="[${o.id}]">Assign</button>
            </div>
          </div>`;
        }).join('')
      : '<div class="wbox">No open order lists this product. Add it to an order first, or dispatch from FG Stock.</div>';
  }

  const modal = document.getElementById('assign-modal');
  if (modal) modal.style.display = 'flex';
}

export function confirmAssign(orderId) {
  const order = (S.orders || []).find(o => o.id === orderId);
  if (!order) { alert('That order no longer exists.'); closeAssignModal(); return; }

  const input = document.getElementById('asg-qty-' + orderId);
  const qty = parseFloat(input && input.value) || 0;
  if (qty <= 0) { alert('Enter a quantity to assign.'); return; }
  if (qty > assignAvailable) {
    alert(`Only ${assignAvailable} available in Packing.`);
    return;
  }

  if (!S.fgTransfers) S.fgTransfers = [];
  S.fgTransfers.push({
    id: uid(),
    date: S.workDate || todayStr(),
    product: assignProduct,
    from: 'Packing',
    to: 'Order',
    qty,
    note: `Assigned to ${order.customer || 'order ' + order.id}`,
    orderId,
  });

  persist();
  closeAssignModal();
  // Repaint whichever stock view is open; both are safe to call blind.
  try { renderFGStock(); } catch (e) {}
  try { renderOrders(); } catch (e) {}
}

export function closeAssignModal() {
  const modal = document.getElementById('assign-modal');
  if (modal) modal.style.display = 'none';
  assignProduct = null;
  assignAvailable = 0;
}

