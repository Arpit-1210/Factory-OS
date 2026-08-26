// ==================================================================
//  SCREEN / MONTH — Monthly report across saved days
//
//  Markup: src/js/templates/screens/month.js
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

import { MNAMES, STAGES } from '../core/config.js';
import { fmt, fmtN, spBadge } from '../core/format.js';
import { S } from '../core/state.js';

export function initMonthly(){
  const now=new Date();
  const ms=document.getElementById('m-mon');
  const ys=document.getElementById('m-yr');
  if(!ms.innerHTML){
    ms.innerHTML=MNAMES.map((m,i)=>`<option value="${i}" ${i===now.getMonth()?'selected':''}>${m}</option>`).join('');
    const curYr=now.getFullYear();
    ys.innerHTML=[curYr-2,curYr-1,curYr,curYr+1].map(y=>`<option value="${y}" ${y===curYr?'selected':''}>${y}</option>`).join('');
  }
  renderMonthly();
}
export function prevMonth(){
  const ms=document.getElementById('m-mon');const ys=document.getElementById('m-yr');
  let m=parseInt(ms.value),y=parseInt(ys.value);
  m--;if(m<0){m=11;y--;}
  ms.value=m;ys.value=y;renderMonthly();
}
export function nextMonth(){
  const ms=document.getElementById('m-mon');const ys=document.getElementById('m-yr');
  let m=parseInt(ms.value),y=parseInt(ys.value);
  m++;if(m>11){m=0;y++;}
  ms.value=m;ys.value=y;renderMonthly();
}
export function showMonthDay(dateStr){
  const e = S.ledger.find(x=>x.date===dateStr);
  const detail = document.getElementById('m-day-detail');
  if(!e){ detail.style.display='none'; return; }

  const d = new Date(dateStr+'T00:00:00');
  document.getElementById('m-day-title').textContent =
    d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const mg = e.goodsValue>0?Math.round(e.netProfit/e.goodsValue*100):0;
  document.getElementById('m-day-metrics').innerHTML=`
    <div class="met m-blue"><div class="ml">Workers</div><div class="mv w">${e.workersPresent||0}</div></div>
    <div class="met m-green"><div class="ml">Goods Value</div><div class="mv g">${fmt(e.goodsValue||0)}</div></div>
    <div class="met m-red"><div class="ml">Labour</div><div class="mv r">${fmt(e.labourCost||0)}</div></div>
    <div class="met m-amber"><div class="ml">RM Cost</div><div class="mv a">${fmt(e.rmCost||0)}</div></div>
    <div class="met ${e.netProfit>=0?'m-green':'m-red'}"><div class="ml">Net Profit</div><div class="mv ${e.netProfit>=0?'g':'r'}">${fmt(e.netProfit||0)}</div></div>
    <div class="met ${mg>=0?'m-green':'m-red'}"><div class="ml">Margin</div><div class="mv ${mg>=0?'g':'r'}">${mg}%</div></div>`;

  // Production log
  const prodEl = document.getElementById('m-day-prod');
  const prods = e.productLog||[];
  if(prods.length){
    prodEl.innerHTML=`<div class="ct" style="margin-bottom:8px">Production</div>
    <div class="tw"><table class="tbl">
      <thead><tr><th>Supervisor</th><th>Stage</th><th>Product</th><th class="num">Qty</th><th class="num">Value ₹</th></tr></thead>
      <tbody>${prods.map(p=>`<tr>
        <td style="font-size:12px">${p.supName||'—'}</td>
        <td><span class="sp sp${STAGES.indexOf(p.stage)}">${p.stage}</span></td>
        <td style="font-weight:500">${p.name}</td>
        <td class="num">${p.qty}</td>
        <td class="num pv">${fmtN(p.value||0)}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } else {
    prodEl.innerHTML='<div style="color:var(--text4);font-size:12px">No production log for this day.</div>';
  }

  detail.style.display='block';
  detail.scrollIntoView({behavior:'smooth',block:'nearest'});
}
export function renderMonthly(){
  const month=parseInt(document.getElementById('m-mon').value);const year=parseInt(document.getElementById('m-yr').value);
  const entries=S.ledger.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getMonth()===month&&d.getFullYear()===year;});
  // ||0 on every one of these. showMonthDay() has always guarded its reads;
  // these did not, so a single ledger entry missing any field — an older
  // payload shape, a partial row — turned the entire month's totals, and
  // every tile derived from them, into NaN. Rendered as '₹NaN'.
  const num=v=>Number(v)||0;
  const tG=entries.reduce((a,e)=>a+num(e.goodsValue),0);const tL=entries.reduce((a,e)=>a+num(e.labourCost),0);const tOT=entries.reduce((a,e)=>a+num(e.overtimeCost),0);const tR=entries.reduce((a,e)=>a+num(e.rmCost),0);const tN=entries.reduce((a,e)=>a+num(e.netProfit),0);const pd=entries.length;const best=pd?entries.reduce((a,e)=>num(e.netProfit)>a?num(e.netProfit):a,-Infinity):0;const avg=pd?Math.round(tN/pd):0;
  document.getElementById('m-met').innerHTML=`<div class="met m-blue"><div class="ml">Production Days</div><div class="mv w">${pd}</div></div><div class="met m-green"><div class="ml">Total Goods</div><div class="mv g">${fmt(tG)}</div></div><div class="met m-red"><div class="ml">Total Labour</div><div class="mv r">${fmt(tL)}</div></div><div class="met m-amber"><div class="ml">Total OT</div><div class="mv a">${fmt(tOT)}</div></div><div class="met m-amber"><div class="ml">Total RM</div><div class="mv a">${fmt(tR)}</div></div><div class="met ${tN>=0?'m-green':'m-red'}"><div class="ml">Monthly Profit</div><div class="mv ${tN>=0?'g':'r'}">${fmt(tN)}</div></div><div class="met ${avg>=0?'m-green':'m-red'}"><div class="ml">Avg Daily</div><div class="mv ${avg>=0?'g':'r'}">${fmt(avg)}</div></div><div class="met m-green"><div class="ml">Best Day</div><div class="mv g">${pd?fmt(best):'—'}</div></div>`;
  const fd=new Date(year,month,1).getDay();const dim=new Date(year,month+1,0).getDate();const now=new Date();const emap={};entries.forEach(e=>emap[e.date]=e);
  let cal='';for(let i=0;i<fd;i++)cal+=`<div class="cc empty"></div>`;
  for(let d=1;d<=dim;d++){const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const e=emap[ds];const isT=now.getDate()===d&&now.getMonth()===month&&now.getFullYear()===year;cal+=`<div class="cc ${e?(e.netProfit>=0?'pd':'ld'):''} ${isT?'td':''}" data-click="showMonthDay" data-args="[&quot;${ds}&quot;]" style="cursor:${e?'pointer':'default'}">`+`<div class="ccn">${d}</div>${e?`<div class="ccv ${e.netProfit>=0?'g':'r'}">${e.netProfit>=0?'+':''}${Math.round(e.netProfit/1000)}k</div>`:''}</div>`;}
  document.getElementById('m-cal').innerHTML=cal;
  let lr='';
  if(!entries.length)lr=`<tr><td colspan="8" style="text-align:center;color:var(--fog);padding:24px">No data for this month yet.</td></tr>`;
  else{entries.forEach(e=>{const d=new Date(e.date+'T00:00:00');const g=num(e.goodsValue),l=num(e.labourCost),o=num(e.overtimeCost),r=num(e.rmCost),n=num(e.netProfit);const mg=g?Math.round(n/g*100):0;lr+=`<tr class="${n>0?'tr-p':n<0?'tr-l':''}"><td style="font-weight:500;color:#111827">${d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</td><td class="num">${num(e.workersPresent)}</td><td class="num">${fmtN(g)}</td><td class="num">${fmtN(l)}</td><td class="num">${fmtN(o)}</td><td class="num">${fmtN(r)}</td><td class="num ${n>=0?'pv':'lv'}">${fmt(n)}</td><td class="num ${mg>=0?'pv':'lv'}">${mg}%</td></tr>`;});lr+=`<tr class="tr-total"><td>TOTAL</td><td class="num">—</td><td class="num">${fmtN(tG)}</td><td class="num">${fmtN(tL)}</td><td class="num">${fmtN(tOT)}</td><td class="num">${fmtN(tR)}</td><td class="num ${tN>=0?'pv':'lv'}">${fmt(tN)}</td><td class="num ${tN>=0?'pv':'lv'}">${tG?Math.round(tN/tG*100):0}%</td></tr>`;}
  document.getElementById('m-ledger').innerHTML=lr;
  const pm={};entries.forEach(e=>(e.productLog||[]).forEach(p=>{if(!pm[p.name])pm[p.name]={name:p.name,qty:0,value:0};pm[p.name].qty+=num(p.qty);pm[p.name].value+=num(p.qty)*num(p.unitVal);}));const prods=Object.values(pm).sort((a,b)=>b.value-a.value);const maxV=prods[0]?.value||1;
  document.getElementById('m-prods').innerHTML=prods.length?`<table class="tbl"><thead><tr><th>Product</th><th class="num">Units</th><th class="num">Value ₹</th><th style="width:80px">Share</th></tr></thead><tbody>${prods.map(p=>`<tr><td style="font-weight:500;color:#111827">${p.name}</td><td class="num">${p.qty}</td><td class="num">${fmtN(p.value)}</td><td><div class="prog"><div class="pf" style="width:${Math.round(p.value/maxV*100)}%"></div></div></td></tr>`).join('')}</tbody></table>`:'<div style="color:#6B7280;font-size:12px">No data.</div>';
  const stT={};STAGES.forEach(s=>stT[s]={g:0,l:0,ot:0,r:0});
  entries.forEach(e=>{
    // Goods ARE per team, so they accumulate inside the team walk.
    (e.sessions||[]).forEach(ss=>{
      (ss.teams||[]).forEach(t=>{
        if(!stT[t.stage]) return;
        stT[t.stage].g+=(t.production||[]).reduce((a,p)=>a+num(p.value),0);
      });
    });
    // Labour, OT and RM are NOT. buildPayload() writes stageLab/stageOT/stageRM
    // as one total per stage per DAY, but this used to add them inside the team
    // loop above — so a stage that ran two teams had its whole day's labour
    // counted twice, and the Stage P&L under-reported that stage's profit by a
    // full day of wages. Added once per day, outside the walk.
    ['stageLab','stageOT','stageRM'].forEach((key,i)=>{
      const field=['l','ot','r'][i];
      Object.keys(e[key]||{}).forEach(stage=>{
        if(stT[stage]) stT[stage][field]+=num(e[key][stage]);
      });
    });
  });
  document.getElementById('m-stages').innerHTML=STAGES.map((s,si)=>{const t=stT[s];const n=t.g-t.l-t.ot-t.r;return`<tr><td><span class="sp sp${si}">${s}</span></td><td class="num">${fmtN(t.g)}</td><td class="num">${fmtN(t.l)}</td><td class="num">${fmtN(t.ot)}</td><td class="num">${fmtN(t.r)}</td><td class="num ${n>=0?'pv':'lv'}">${fmt(n)}</td></tr>`;}).join('');
  const supM={};entries.forEach(e=>(e.sessions||[]).forEach(ss=>{if(!supM[ss.supName])supM[ss.supName]={name:ss.supName,stages:new Set(),days:0,goods:0,lab:0};(ss.teams||[]).forEach(t=>{supM[ss.supName].stages.add(t.stage);supM[ss.supName].goods+=(t.production||[]).reduce((a,p)=>a+num(p.value),0);supM[ss.supName].lab+=(t.team||[]).reduce((a,m)=>a+num(m.wage),0);});supM[ss.supName].days++;supM[ss.supName].lab+=num(ss.supWage);}));
  document.getElementById('m-sups').innerHTML=Object.values(supM).sort((a,b)=>b.goods-a.goods).map(s=>{const n=s.goods-s.lab;return`<tr><td style="font-weight:600">${s.name}</td><td>${[...s.stages].map(st=>spBadge(st)).join(' ')}</td><td class="num">${s.days}</td><td class="num">${fmtN(s.goods)}</td><td class="num">${fmtN(s.lab)}</td><td class="num ${n>=0?'pv':'lv'}">${fmt(n)}</td></tr>`;}).join('')||`<tr><td colspan="6" style="color:var(--text4);text-align:center">No supervisor data.</td></tr>`;
}


// Was inline DOM poking in the markup.
export function closeMonthDayDetail(){
  const el = document.getElementById('m-day-detail');
  if (el) el.style.display = 'none';
}

