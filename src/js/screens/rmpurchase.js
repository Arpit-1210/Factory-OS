// ==================================================================
//  SCREEN / RMPURCHASE — Raw material purchase entry
//
//  Markup: src/js/templates/screens/rmpurchase.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { fmt, todayStr } from '../core/format.js';
import { S, uid } from '../core/state.js';
import { persist } from '../core/sync.js';
import { renderStock } from './stock.js';

export function openRMPurchaseForm(){
  if(!S.purchases) S.purchases=[];
  const sel=document.getElementById('rmp-mat');
  if(sel) sel.innerHTML=S.rm.map(r=>`<option value="${r.id}" data-unit="${r.unit}">${r.name} (${r.unit})</option>`).join('');
  const fil=document.getElementById('rmp-filter');
  if(fil) fil.innerHTML='<option value="all">All Materials</option>'+S.rm.map(r=>`<option value="${r.name}">${r.name}</option>`).join('');
  document.getElementById('rmp-date').value=todayStr();
  // Pre-fill reorder from stock
  const firstRM=S.rm[0];
  if(firstRM){
    const s=S.stock.find(st=>st.id===firstRM.id);
    document.getElementById('rmp-reorder').value=s?s.reorder:100;
  }
  document.getElementById('rmp-mat').onchange=function(){
    const rm=S.rm.find(r=>r.id===parseInt(this.value));
    if(rm){
      const s=S.stock.find(st=>st.id===rm.id);
      document.getElementById('rmp-reorder').value=s?s.reorder:100;
    }
  };
  document.getElementById('rmp-form').style.display='block';
  document.getElementById('rmp-form').scrollIntoView({behavior:'smooth'});
}
export function closeRMPurchaseForm(){ document.getElementById('rmp-form').style.display='none'; }
export function saveRMPurchase(){
  if(!S.purchases) S.purchases=[];
  const type=document.getElementById('rmp-type').value;
  const sel=document.getElementById('rmp-mat');
  const rm=S.rm.find(r=>r.id===parseInt(sel.value));
  if(!rm){alert('Select a material.');return;}
  const qty=parseFloat(document.getElementById('rmp-qty').value)||0;
  if(!qty){alert('Enter quantity.');return;}
  const cost=parseFloat(document.getElementById('rmp-cost').value)||0;
  const note=document.getElementById('rmp-note').value.trim();
  const date=document.getElementById('rmp-date').value||todayStr();
  const reorder=parseFloat(document.getElementById('rmp-reorder').value)||100;

  // Update reorder level in stock
  let s=S.stock.find(st=>st.id===rm.id);
  if(!s){s={id:rm.id,name:rm.name,unit:rm.unit,opening:0,reorder:100,openingDate:date};S.stock.push(s);}
  s.reorder=reorder;s.name=rm.name;s.unit=rm.unit;

  // For opening stock — update the opening field directly
  if(type==='opening'){
    s.opening=qty;
    s.openingDate=date;
    // Remove old opening entries for this material
    S.purchases=S.purchases.filter(p=>!(p.type==='opening'&&p.name===rm.name));
  }

  // All types go into purchases log
  const sign=(type==='wastage')?-1:1;
  S.purchases.push({id:uid(),date,type,name:rm.name,unit:rm.unit,qty:qty*sign,cost,note,reorder});
  persist();
  closeRMPurchaseForm();
  // Clear form
  ['rmp-qty','rmp-cost','rmp-note'].forEach(id=>document.getElementById(id).value='');
  renderRMPurchase();
  renderStock();
  alert(`✓ ${type==='opening'?'Opening stock':'Entry'} saved: ${rm.name} ${sign>0?'+':''}${qty*sign} ${rm.unit}`);
}
export function renderRMPurchase(){
  if(!S.purchases) S.purchases=[];
  // Populate filter
  const fil=document.getElementById('rmp-filter');
  if(fil){
    const cur=fil.value;
    fil.innerHTML='<option value="all">All Materials</option>'+S.rm.map(r=>`<option value="${r.name}">${r.name}</option>`).join('');
    fil.value=cur;
  }
  const filterMat=fil?fil.value:'all';

  // Metrics
  const totalPurchased=S.purchases.filter(p=>p.type==='purchase'&&p.qty>0).reduce((a,p)=>a+p.qty,0);
  const totalCost=S.purchases.filter(p=>p.type==='purchase'&&p.cost>0).reduce((a,p)=>a+p.cost,0);
  const entries=S.purchases.length;
  document.getElementById('rmp-metrics').innerHTML=`
    <div class="met m-green"><div class="ml">Total Purchases</div><div class="mv g">${entries} entries</div></div>
    <div class="met m-amber"><div class="ml">Total Procurement Cost</div><div class="mv a">${fmt(totalCost)}</div></div>`;

  // Per-material summary
  const matSummary={};
  S.rm.forEach(r=>{
    const s=S.stock.find(st=>st.id===r.id);
    const opening=s?s.opening:0;
    const purchased=S.purchases.filter(p=>p.name===r.name&&p.type==='purchase').reduce((a,p)=>a+p.qty,0);
    const adjustments=S.purchases.filter(p=>p.name===r.name&&p.type!=='purchase'&&p.type!=='opening').reduce((a,p)=>a+p.qty,0);
    const usedHistory=S.ledger.reduce((a,day)=>a+(day.rawLog||[]).filter(rl=>rl.name===r.name).reduce((b,rl)=>b+rl.qty,0),0);
    const usedToday=S.rawLog.filter(rl=>rl.name===r.name).reduce((a,rl)=>a+rl.qty,0);
    const balance=opening+purchased+adjustments-usedHistory-usedToday;
    matSummary[r.name]={name:r.name,unit:r.unit,opening,purchased,adjustments,used:usedHistory+usedToday,balance,reorder:s?s.reorder:100};
  });

  document.getElementById('rmp-summary').innerHTML=`
    <table class="tbl"><thead><tr>
      <th>Material</th><th class="num">Opening</th><th class="num">+ Purchased</th>
      <th class="num">± Adjustments</th><th class="num">− Used</th>
      <th class="num">Balance</th><th>Unit</th><th>Status</th>
    </tr></thead><tbody>
    ${Object.values(matSummary).map(m=>{
      const crit=m.reorder>0&&m.balance<=m.reorder;
      return`<tr class="${crit?'tr-l':''}">
        <td style="font-weight:500;color:#111827">${m.name}</td>
        <td class="num">${m.opening}</td>
        <td class="num" style="color:#065F46">${m.purchased>0?'+'+m.purchased:'—'}</td>
        <td class="num" style="color:#1E40AF">${m.adjustments!==0?m.adjustments:'—'}</td>
        <td class="num" style="color:#B91C1C">${m.used>0?'-'+m.used:'—'}</td>
        <td class="num" style="font-weight:700;color:${crit?'#B91C1C':'#065F46'}">${m.balance.toFixed(1)} ${m.unit}</td>
        <td style="color:#9CA3AF">${m.unit}</td>
        <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${crit?'#FEF2F2':'#ECFDF5'};color:${crit?'#B91C1C':'#065F46'};border:1px solid ${crit?'#FECACA':'#A7F3D0'}">${crit?'LOW':'OK'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table>`;

  // History
  const entries2=filterMat==='all'?S.purchases:S.purchases.filter(p=>p.name===filterMat);
  const sorted=[...entries2].sort((a,b)=>b.date.localeCompare(a.date));
  const typeColor={opening:'#1E40AF',purchase:'#065F46',return:'#6B21A8',wastage:'#B91C1C',adjustment:'#B45309'};
  const typeBg={opening:'#EFF6FF',purchase:'#ECFDF5',return:'#FAF5FF',wastage:'#FEF2F2',adjustment:'#FFFBEB'};
  document.getElementById('rmp-history').innerHTML=sorted.length?`
    <table class="tbl"><thead><tr>
      <th>Date</th><th>Type</th><th>Material</th><th class="num">Qty</th><th class="num">Unit Cost ₹</th><th>Supplier / Note</th>
    </tr></thead><tbody>
    ${sorted.map(p=>`<tr>
      <td style="font-family:var(--mono);font-size:11px;color:#6B7280">${p.date}</td>
      <td><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${typeBg[p.type]||'#F9FAFB'};color:${typeColor[p.type]||'#374151'}">${p.type.toUpperCase()}</span></td>
      <td style="font-weight:500;color:#111827">${p.name}</td>
      <td class="num" style="font-weight:600;color:${p.qty>=0?'#065F46':'#B91C1C'}">${p.qty>=0?'+':''}${p.qty} ${p.unit}</td>
      <td class="num">${p.cost?fmt(p.cost):'—'}</td>
      <td style="font-size:11px;color:#6B7280">${p.note||'—'}</td>
    </tr>`).join('')}
    </tbody></table>`
  :'<div style="color:#9CA3AF;font-size:12px">No entries yet. Click + Add Purchase / Opening Stock to start.</div>';
}

