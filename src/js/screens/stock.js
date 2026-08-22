// ==================================================================
//  SCREEN / STOCK — Raw material stock levels and purchases
//
//  Markup: src/js/templates/screens/stock.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { todayStr } from '../core/format.js';
import { S, uid } from '../core/state.js';
import { persist } from '../core/sync.js';

export function renderStock(){
  if(!S.purchases) S.purchases=[];
  // Sync stock items with RM catalogue
  S.rm.forEach(r=>{
    if(!S.stock.find(s=>s.id===r.id)){
      S.stock.push({id:r.id,name:r.name,unit:r.unit,opening:0,reorder:100,openingDate:todayStr()});
    }
  });
  S.stock=S.stock.filter(s=>S.rm.find(r=>r.id===s.id));

  // Calculate running balance for each material:
  // balance = opening + all purchases - all issues (across all saved days + today)
  function getBalance(matName, unit){
    const s=S.stock.find(st=>st.name===matName);
    const opening=s?s.opening:0;
    // Purchases
    const purchased=(S.purchases||[]).filter(p=>p.name===matName).reduce((a,p)=>a+p.qty,0);
    // Issues from saved ledger days
    const issuedHistory=S.ledger.reduce((a,day)=>{
      return a+(day.rawLog||[]).filter(r=>r.name===matName).reduce((b,r)=>b+r.qty,0);
    },0);
    // Issues from today (not yet saved)
    const issuedToday=S.rawLog.filter(r=>r.name===matName).reduce((a,r)=>a+r.qty,0);
    return opening+purchased-issuedHistory-issuedToday;
  }

  // Populate material selects
  const matSel=document.getElementById('stk-mat');
  const purSel=document.getElementById('pur-mat');
  if(matSel) matSel.innerHTML=S.rm.map(r=>`<option value="${r.id}">${r.name} (${r.unit})</option>`).join('');
  if(purSel) purSel.innerHTML=S.rm.map(r=>`<option value="${r.id}">${r.name} (${r.unit})</option>`).join('');

  // Alerts
  const critical=S.stock.filter(s=>{
    const bal=getBalance(s.name,s.unit);
    return s.reorder>0&&bal<=s.reorder;
  });
  document.getElementById('stock-alerts').innerHTML=critical.length
    ?critical.map(s=>{
        const bal=getBalance(s.name,s.unit);
        return`<div class="wbox">🚨 <b>${s.name}</b> — only <b>${bal.toFixed(1)} ${s.unit}</b> remaining (reorder level: ${s.reorder} ${s.unit}). Please procure immediately.</div>`;
      }).join('')
    :'<div class="gbox">✓ All raw materials are above reorder levels.</div>';

  // Stock table
  document.getElementById('stock-list').innerHTML=`
    <table class="tbl"><thead><tr>
      <th>Material</th><th class="num">Opening Stock</th>
      <th class="num">+ Purchased</th><th class="num">− Used (History)</th>
      <th class="num">− Used (Today)</th><th class="num">Balance</th>
      <th>Unit</th><th class="num">Reorder Level</th><th>Status</th>
    </tr></thead><tbody>
    ${S.stock.map(s=>{
      const purchased=(S.purchases||[]).filter(p=>p.name===s.name).reduce((a,p)=>a+p.qty,0);
      const usedHistory=S.ledger.reduce((a,day)=>a+(day.rawLog||[]).filter(r=>r.name===s.name).reduce((b,r)=>b+r.qty,0),0);
      const usedToday=S.rawLog.filter(r=>r.name===s.name).reduce((a,r)=>a+r.qty,0);
      const bal=s.opening+purchased-usedHistory-usedToday;
      const crit=s.reorder>0&&bal<=s.reorder;
      return`<tr class="${crit?'tr-l':''}">
        <td style="font-weight:500;color:#111827">${s.name}</td>
        <td class="num">${s.opening}</td>
        <td class="num" style="color:#065F46">${purchased>0?'+'+purchased:'—'}</td>
        <td class="num" style="color:#6B7280">${usedHistory>0?'-'+usedHistory:'—'}</td>
        <td class="num" style="color:#B91C1C">${usedToday>0?'-'+usedToday:'—'}</td>
        <td class="num" style="font-weight:700;font-size:14px;color:${crit?'#B91C1C':'#065F46'}">${bal.toFixed(1)}</td>
        <td style="color:#6B7280">${s.unit}</td>
        <td class="num" style="color:#9CA3AF">${s.reorder}</td>
        <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${crit?'#FEF2F2':'#ECFDF5'};color:${crit?'#B91C1C':'#065F46'};border:1px solid ${crit?'#FECACA':'#A7F3D0'}">${crit?'REORDER':'OK'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table>`;

  // Movement history
  const allMovements=[];
  // Opening stocks
  S.stock.forEach(s=>{
    if(s.opening>0) allMovements.push({date:s.openingDate||'Start',type:'opening',name:s.name,unit:s.unit,qty:s.opening,note:'Opening stock'});
  });
  // Purchases
  (S.purchases||[]).forEach(p=>{
    allMovements.push({date:p.date,type:'purchase',name:p.name,unit:p.unit,qty:p.qty,cost:p.cost,note:p.note||''});
  });
  // Issues from saved days
  S.ledger.forEach(day=>{
    (day.rawLog||[]).forEach(r=>{
      allMovements.push({date:day.date,type:'issue',name:r.name,unit:r.unit,qty:r.qty,note:'Issued to '+r.stage});
    });
  });
  // Today's issues
  S.rawLog.forEach(r=>{
    allMovements.push({date:S.workDate,type:'issue',name:r.name,unit:r.unit,qty:r.qty,note:'Issued to '+r.stage+' (today)'});
  });
  allMovements.sort((a,b)=>b.date.localeCompare(a.date));

  const histEl=document.getElementById('stock-history');
  if(!allMovements.length){
    histEl.innerHTML='<div style="color:#9CA3AF;font-size:12px">No stock movements yet.</div>';
    return;
  }
  histEl.innerHTML=`<table class="tbl"><thead><tr>
    <th>Date</th><th>Type</th><th>Material</th><th class="num">Qty</th><th>Unit</th><th>Note</th>
  </tr></thead><tbody>
  ${allMovements.slice(0,50).map(m=>{
    const color=m.type==='issue'?'#B91C1C':m.type==='purchase'?'#065F46':'#1E40AF';
    const bg=m.type==='issue'?'#FEF2F2':m.type==='purchase'?'#ECFDF5':'#EFF6FF';
    const sign=m.type==='issue'?'-':'+';
    return`<tr>
      <td style="font-family:var(--mono);font-size:11px;color:#6B7280">${m.date}</td>
      <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${bg};color:${color}">${m.type.toUpperCase()}</span></td>
      <td style="font-weight:500;color:#111827">${m.name}</td>
      <td class="num" style="font-weight:600;color:${color}">${sign}${m.qty} ${m.unit}</td>
      <td style="color:#9CA3AF">${m.unit}</td>
      <td style="font-size:11px;color:#6B7280">${m.note}${m.cost?` · ₹${m.cost}`:''}</td>
    </tr>`;
  }).join('')}
  </tbody></table>
  ${allMovements.length>50?`<div style="text-align:center;color:#9CA3AF;font-size:12px;padding:10px">Showing last 50 entries of ${allMovements.length} total</div>`:''}`;
}
export function openStockUpdate(){
  const sel=document.getElementById('stk-mat');
  if(sel) sel.innerHTML=S.rm.map(r=>`<option value="${r.id}">${r.name} (${r.unit})</option>`).join('');
  document.getElementById('stock-form').style.display='block';
  const first=S.stock[0];
  if(first){
    document.getElementById('stk-qty').value=first.opening||0;
    document.getElementById('stk-reorder').value=first.reorder||100;
  }
  const matSel=document.getElementById('stk-mat');
  matSel.onchange=function(){
    const s=S.stock.find(st=>st.id===parseInt(this.value));
    if(s){document.getElementById('stk-qty').value=s.opening||0;document.getElementById('stk-reorder').value=s.reorder||100;}
  };
}
export function closeStockForm(){ document.getElementById('stock-form').style.display='none'; }
export function saveStock(){
  const id=parseInt(document.getElementById('stk-mat').value);
  const qty=parseFloat(document.getElementById('stk-qty').value)||0;
  const reorder=parseFloat(document.getElementById('stk-reorder').value)||0;
  const rm=S.rm.find(r=>r.id===id);
  let s=S.stock.find(st=>st.id===id);
  if(!s){s={id,name:rm.name,unit:rm.unit,opening:0,reorder:100,openingDate:todayStr()};S.stock.push(s);}
  s.opening=qty;s.reorder=reorder;s.name=rm.name;s.unit=rm.unit;
  if(!s.openingDate) s.openingDate=todayStr();
  persist();closeStockForm();renderStock();
  alert(`✓ Opening stock set: ${rm.name} = ${qty} ${rm.unit}`);
}
export function openPurchase(){
  if(!S.purchases) S.purchases=[];
  const sel=document.getElementById('pur-mat');
  if(sel) sel.innerHTML=S.rm.map(r=>`<option value="${r.id}" data-unit="${r.unit}">${r.name} (${r.unit})</option>`).join('');
  document.getElementById('purchase-form').style.display='block';
  document.getElementById('purchase-form').scrollIntoView({behavior:'smooth'});
}
export function closePurchase(){ document.getElementById('purchase-form').style.display='none'; }
export function savePurchase(){
  if(!S.purchases) S.purchases=[];
  const sel=document.getElementById('pur-mat');
  const opt=sel.options[sel.selectedIndex];
  if(!opt) return;
  const rm=S.rm.find(r=>r.id===parseInt(opt.value));
  const qty=parseFloat(document.getElementById('pur-qty').value)||0;
  if(!qty){alert('Enter quantity received.');return;}
  const cost=parseFloat(document.getElementById('pur-cost').value)||0;
  const note=document.getElementById('pur-note').value.trim();
  S.purchases.push({
    id:uid(),date:todayStr(),name:rm.name,unit:rm.unit,qty,cost,note
  });
  persist();
  document.getElementById('pur-qty').value='';
  document.getElementById('pur-cost').value='';
  document.getElementById('pur-note').value='';
  closePurchase();
  renderStock();
  alert(`✓ ${qty} ${rm.unit} of ${rm.name} added to stock.`);
}

