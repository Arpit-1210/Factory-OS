// ==================================================================
//  SCREEN / DOCS — Quotations, invoices and challans
//
//  Markup: src/js/templates/screens/docs.js
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

import { fmt, fmtN, todayStr } from '../core/format.js';
import { S, uid } from '../core/state.js';
import { sendGet } from '../core/sheets-sync.js';
import { persist } from '../core/sync.js';

// ── screen state ──
let docItems = [];
let docCounter = { quotation:1, invoice:1, challan:1 };

export function saveDocAsOrder(){
  const type = document.getElementById('doc-type').value;
  const cust = document.getElementById('doc-cust').value.trim();
  const phone = document.getElementById('doc-phone').value.trim();
  const city = document.getElementById('doc-city').value.trim();
  const dueDate = document.getElementById('doc-due')?.value||'';
  const advance = parseFloat(document.getElementById('doc-advance').value)||0;
  const discount = parseFloat(document.getElementById('doc-discount').value)||0;

  if(!cust){ alert('Enter customer name first.'); return; }
  if(!docItems.length){ alert('Add at least one item first.'); return; }

  const total = docItems.reduce((a,i)=>a+(i.qty*(i.rate||0)),0) - discount;
  const itemsStr = docItems.map(i=>`${i.name} x${i.qty}`).join(', ');

  const order = {
    id: 'ORD-'+Date.now().toString().slice(-6),
    customer: cust,
    phone, city,
    requiredBy: dueDate,
    priority: 'normal',
    amount: total,
    advance,
    items: itemsStr,
    fgItems: docItems.map(i=>({name:i.name, qty:i.qty, price:i.rate||0})),
    status: 'pending',
    createdAt: S.workDate||todayStr(),
    fromQuotation: true,
    docType: type,
  };

  if(!S.orders) S.orders=[];
  // Check not duplicate
  // Compare against the same day the order is being filed under, or the
  // guard never trips while entering a past day.
  const filedOn = S.workDate||todayStr();
  const exists = S.orders.find(o=>o.customer===cust&&o.createdAt===filedOn&&o.amount===total);
  if(exists){ alert('An order for '+cust+' with the same amount already exists on that date.'); return; }

  S.orders.unshift(order);
  persist();

  // Sync to Sheets
  if(S.sheetsUrl){
    const payload={action:'order',date:filedOn,id:order.id,customer:order.customer,phone:order.phone,city:order.city,requiredBy:order.requiredBy,priority:order.priority,items:order.items,amount:order.amount,advance:order.advance,balance:order.amount-order.advance,status:'pending'};
    sendGet(S.sheetsUrl,'action=order&payload='+encodeURIComponent(JSON.stringify(payload)));
  }

  alert(`✓ Order created for ${cust} — ₹${total.toLocaleString('en-IN')}\n\nFind it in Orders tab.`);
}
export function renderDocs(){
  // Populate product dropdown
  const sel = document.getElementById('doc-item-prod');
  if(sel) sel.innerHTML = '<option value="">— select product —</option>' +
    S.fg.map(f=>`<option value="${f.id}" data-price="${f.price}">[#${f.id}] ${f.name} — ${fmt(f.price)}</option>`).join('');

  // Populate order dropdown
  const osel = document.getElementById('doc-from-order');
  if(osel) osel.innerHTML = '<option value="">— select order —</option>' +
    S.orders.map(o=>`<option value="${o.id}">${o.id} · ${o.customer} · ${o.city}</option>`).join('');

  // Set default date and number.
  // The document's issue date follows the day being worked: a quotation
  // written up while entering a past day belongs to that day, and the serial
  // number is derived from the same date so numbering stays in step with it.
  const today = S.workDate||todayStr();
  document.getElementById('doc-date').value = today;
  const valid = new Date(today+'T00:00:00'); valid.setDate(valid.getDate()+15);
  document.getElementById('doc-valid').value = valid.toISOString().slice(0,10);
  document.getElementById('doc-number').value = 'Q-' + today.replace(/-/g,'').slice(2) + '-' + String(docCounter.quotation).padStart(3,'0');

  renderDocItems();
  updateDocPreview();
}
export function updateDocType(){
  const type = document.getElementById('doc-type').value;
  const validWrap = document.getElementById('doc-valid-wrap');
  validWrap.style.display = type==='quotation' ? 'block' : 'none';
  const prefixes = {quotation:'Q', invoice:'INV', challan:'DC'};
  const today = S.workDate||todayStr();
  document.getElementById('doc-number').value = prefixes[type] + '-' + today.replace(/-/g,'').slice(2) + '-' + String(docCounter[type]).padStart(3,'0');
  updateDocPreview();
}
export function fillFromOrder(){
  const id = document.getElementById('doc-from-order').value;
  if(!id) return;
  const o = S.orders.find(o=>o.id===id);
  if(!o) return;
  document.getElementById('doc-cust').value = o.customer||'';
  document.getElementById('doc-phone').value = o.phone||'';
  document.getElementById('doc-city').value = o.city||'';
  document.getElementById('doc-advance').value = o.advance||0;
  // Parse items if available
  if(o.items){
    document.getElementById('doc-notes').value = o.items;
  }
  updateDocPreview();
}
export function docItemFill(){
  const sel = document.getElementById('doc-item-prod');
  const opt = sel.options[sel.selectedIndex];
  if(opt && opt.dataset.price){
    document.getElementById('doc-item-rate').value = opt.dataset.price;
  }
}
export function addDocItem(){
  const sel = document.getElementById('doc-item-prod');
  const opt = sel.options[sel.selectedIndex];
  if(!opt||!opt.value){alert('Select a product.');return;}
  const fg = S.fg.find(f=>f.id===parseInt(opt.value));
  const qty = parseInt(document.getElementById('doc-item-qty').value)||1;
  const rate = parseFloat(document.getElementById('doc-item-rate').value)||0;
  if(!rate){alert('Enter rate.');return;}
  docItems.push({id:uid(), name:fg.name, qty, rate, total:qty*rate});
  document.getElementById('doc-item-qty').value='1';
  document.getElementById('doc-item-rate').value='';
  sel.value='';
  renderDocItems();
  updateDocPreview();
}
export function removeDocItem(id){
  docItems = docItems.filter(i=>i.id!==id);
  renderDocItems();
  updateDocPreview();
}
export function renderDocItems(){
  const el = document.getElementById('doc-items-list');
  if(!docItems.length){el.innerHTML='<div style="color:var(--text4);font-size:12px;margin-bottom:10px">No items added yet.</div>';return;}
  el.innerHTML=`<table class="tbl" style="margin-bottom:10px"><thead><tr><th>#</th><th>Product</th><th class="num">Qty</th><th class="num">Rate ₹</th><th class="num">Total ₹</th><th></th></tr></thead><tbody>
  ${docItems.map((item,i)=>`<tr>
    <td style="color:var(--text4)">${i+1}</td>
    <td style="font-weight:500;color:var(--text)">${item.name}</td>
    <td class="num">${item.qty}</td>
    <td class="num">${fmtN(item.rate)}</td>
    <td class="num" style="font-weight:600">${fmtN(item.total)}</td>
    <td><button class="btn btn-ember btn-xs" data-click="removeDocItem" data-args="[${item.id}]">✕</button></td>
  </tr>`).join('')}
  </tbody></table>`;
}
export function updateDocPreview(){
  const preview = document.getElementById('doc-preview');
  if(!preview) return;
  preview.innerHTML = buildDocHTML(false);
}
export function buildDocHTML(forPrint){
  const type = document.getElementById('doc-type').value;
  const num = document.getElementById('doc-number').value;
  const date = document.getElementById('doc-date').value;
  const valid = document.getElementById('doc-valid').value;
  const cust = document.getElementById('doc-cust').value||'—';
  const phone = document.getElementById('doc-phone').value;
  const city = document.getElementById('doc-city').value;
  const addr = document.getElementById('doc-addr').value;
  const notes = document.getElementById('doc-notes').value;
  const discount = parseFloat(document.getElementById('doc-discount').value)||0;
  const advance = parseFloat(document.getElementById('doc-advance').value)||0;

  const subtotal = docItems.reduce((a,i)=>a+i.total,0);
  const total = subtotal - discount;
  const balance = total - advance;

  const typeLabels = {quotation:'QUOTATION', invoice:'INVOICE', challan:'DELIVERY CHALLAN'};
  const typeLabel = typeLabels[type]||'DOCUMENT';
  const typeColors = {quotation:'#1E40AF', invoice:'#065F46', challan:'#6B21A8'};
  const typeColor = typeColors[type]||'#111827';

  const formatDate = (d) => {
    if(!d) return '—';
    try{ return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}); }
    catch(e){ return d; }
  };

  return `<div style="font-family:'Inter',Arial,sans-serif;color:#111827;max-width:700px;margin:0 auto">

    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid ${typeColor}">
      <div>
        <div style="font-size:28px;font-weight:900;color:${typeColor};letter-spacing:-.02em">Propskart</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px;font-family:monospace;letter-spacing:.04em">WEDDING PROPS & GARDEN DÉCOR · RANCHI</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:800;color:${typeColor};letter-spacing:.04em">${typeLabel}</div>
        <div style="font-size:13px;font-weight:600;margin-top:4px;color:#374151"># ${num||'—'}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:2px">Date: ${formatDate(date)}</div>
        ${type==='quotation'&&valid?`<div style="font-size:11px;color:#6B7280">Valid until: ${formatDate(valid)}</div>`:''}
      </div>
    </div>

    <!-- CUSTOMER -->
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:14px 16px;margin-bottom:20px">
      <div style="font-size:10px;font-family:monospace;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${type==='challan'?'Deliver To':'Bill To'}</div>
      <div style="font-size:15px;font-weight:700;color:#111827">${cust}</div>
      ${phone?`<div style="font-size:12px;color:#6B7280;margin-top:3px">📞 ${phone}</div>`:''}
      ${city||addr?`<div style="font-size:12px;color:#6B7280;margin-top:2px">📍 ${[addr,city].filter(Boolean).join(', ')}</div>`:''}
    </div>

    <!-- ITEMS TABLE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:${typeColor}">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">PRODUCT / DESCRIPTION</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">QTY</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">RATE ₹</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-family:monospace;letter-spacing:.06em;color:white;font-weight:600">AMOUNT ₹</th>
        </tr>
      </thead>
      <tbody>
        ${docItems.length ? docItems.map((item,i)=>`
          <tr style="border-bottom:1px solid #F3F4F6;background:${i%2===0?'white':'#FAFAFA'}">
            <td style="padding:10px 12px;font-size:12px;color:#9CA3AF">${i+1}</td>
            <td style="padding:10px 12px;font-size:13px;font-weight:500;color:#111827">${item.name}</td>
            <td style="padding:10px 12px;text-align:right;font-size:12px;font-family:monospace">${item.qty}</td>
            <td style="padding:10px 12px;text-align:right;font-size:12px;font-family:monospace">${item.rate.toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600;font-family:monospace">${item.total.toLocaleString('en-IN')}</td>
          </tr>`).join('')
          : '<tr><td colspan="5" style="padding:20px;text-align:center;color:#9CA3AF;font-size:12px">No items added</td></tr>'}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <div style="min-width:240px">
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6">
          <span style="font-size:12px;color:#6B7280">Subtotal</span>
          <span style="font-size:12px;font-family:monospace;font-weight:500">₹ ${subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${discount>0?`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6">
          <span style="font-size:12px;color:#059669">Discount</span>
          <span style="font-size:12px;font-family:monospace;color:#059669">− ₹ ${discount.toLocaleString('en-IN')}</span>
        </div>`:''}
        <div style="display:flex;justify-content:space-between;padding:10px 12px;background:${typeColor};border-radius:6px;margin-top:4px">
          <span style="font-size:13px;font-weight:700;color:white">TOTAL</span>
          <span style="font-size:15px;font-weight:800;font-family:monospace;color:white">₹ ${total.toLocaleString('en-IN')}</span>
        </div>
        ${advance>0?`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F3F4F6;margin-top:4px">
          <span style="font-size:12px;color:#6B7280">Advance Paid</span>
          <span style="font-size:12px;font-family:monospace;color:#059669">− ₹ ${advance.toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:7px 0">
          <span style="font-size:13px;font-weight:600;color:#DC2626">Balance Due</span>
          <span style="font-size:13px;font-weight:700;font-family:monospace;color:#DC2626">₹ ${balance.toLocaleString('en-IN')}</span>
        </div>`:''}
      </div>
    </div>

    ${notes?`<!-- NOTES -->
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin-bottom:20px">
      <div style="font-size:10px;font-family:monospace;color:#92400E;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Terms & Notes</div>
      <div style="font-size:12px;color:#78350F;line-height:1.6">${notes}</div>
    </div>`:''}

    <!-- FOOTER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:20px;border-top:1px solid #E5E7EB;margin-top:8px">
      <div style="font-size:11px;color:#9CA3AF">
        <div>Propskart — Ranchi, Jharkhand</div>
        <div style="margin-top:2px">Thank you for your business!</div>
      </div>
      <div style="text-align:right">
        <div style="height:40px;border-bottom:1px solid #374151;width:150px;margin-bottom:4px"></div>
        <div style="font-size:11px;color:#6B7280">Authorised Signature</div>
      </div>
    </div>

  </div>`;
}
export function printDoc(){
  if(!docItems.length){alert('Add at least one item before printing.');return;}

  const type = document.getElementById('doc-type').value;
  const num = document.getElementById('doc-number').value;
  const cust = document.getElementById('doc-cust').value.trim();
  const phone = document.getElementById('doc-phone').value.trim();
  const city = document.getElementById('doc-city').value.trim();
  const advance = parseFloat(document.getElementById('doc-advance').value)||0;
  const notes = document.getElementById('doc-notes').value.trim();
  const subtotal = docItems.reduce((a,i)=>a+i.total,0);
  const discount = parseFloat(document.getElementById('doc-discount').value)||0;
  const total = subtotal - discount;
  const docDate = document.getElementById('doc-date').value;
  const validDate = document.getElementById('doc-valid').value;

  // Auto-save to Orders when Quotation is created
  if(type === 'quotation' && cust){
    // Check if order with this doc number already exists
    const existing = S.orders.find(o=>o.id===num);
    if(!existing){
      const newOrder = {
        id: num,
        customer: cust,
        phone: phone,
        city: city,
        requiredBy: validDate||'',
        priority: 'normal',
        amount: total,
        advance: advance,
        items: docItems.map(i=>i.qty+'× '+i.name).join(', '),
        status: 'pending',
        createdAt: docDate||S.workDate||todayStr(),
        fromQuotation: true
      };
      S.orders.unshift(newOrder);
      persist();

      // Show confirmation
      const badge = document.createElement('div');
      badge.className = 'gbox';
      badge.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;max-width:320px;box-shadow:0 4px 16px rgba(0,0,0,.15)';
      badge.innerHTML = `✓ Order <b>${num}</b> saved to Orders for <b>${cust}</b> — ₹${total.toLocaleString('en-IN')}`;
      document.body.appendChild(badge);
      setTimeout(()=>badge.remove(), 4000);
    }
  }

  // Increment counter
  docCounter[type]++;

  const content = buildDocHTML(true);
  const w = window.open('','_blank','width=800,height=900');
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Propskart — ${document.getElementById('doc-type').value}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',Arial,sans-serif;padding:30px;background:white;color:#111827}
      @media print{body{padding:10px}@page{margin:15mm}}
    </style>
  </head><body>${content}</body></html>`);
  w.document.close();
  // iOS needs a longer delay and user interaction
  setTimeout(()=>{
    try{ w.print(); }
    catch(e){
      // iOS fallback — show print instructions
      alert('To print on iPhone:\n1. Tap Share button (box with arrow)\n2. Select "Print"\n3. Choose printer');
    }
  }, 800);
}
export function clearDoc(){
  docItems=[];
  renderDocItems();
  ['doc-cust','doc-phone','doc-city','doc-addr','doc-notes','doc-discount','doc-advance'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
  });
  document.getElementById('doc-from-order').value='';
  updateDocPreview();
}

