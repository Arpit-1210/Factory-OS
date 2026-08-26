// ==================================================================
//  SCREEN / DAY — Day sheet: the daily P and L, and closing the day
//
//  Markup: src/js/templates/screens/day.js
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

import { calcOT } from '../core/calc.js';
import { STAGES } from '../core/config.js';
import { fmt, fmtN } from '../core/format.js';
import { go } from '../core/router.js';
import { fbEnabled } from '../core/session.js';
import { S } from '../core/state.js';
import { persist, pushToFirebase } from '../core/sync.js';
import { sendViaImage, setSyncStatus } from '../core/sheets-sync.js';

export function renderDay(){
  const d=new Date(S.workDate+'T00:00:00');
  document.getElementById('day-title').innerHTML=d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}).replace(/,/,',')+'&nbsp;<span style="color:var(--amber)">'+d.getFullYear()+'</span>';
  const present=S.lab.filter(l=>l.present);
  const bw=present.reduce((a,l)=>a+l.wage,0);
  const ot=present.reduce((a,l)=>a+calcOT(l),0);
  const totalLab=bw+ot;
  const totalGoods=S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  const totalRM=S.rawLog.reduce((a,r)=>a+r.cost,0);const net=totalGoods-totalLab-totalRM;const margin=totalGoods?Math.round(net/totalGoods*100):0;
  document.getElementById('day-met').innerHTML=`<div class="met m-blue"><div class="ml">Present</div><div class="mv w">${present.length}</div></div><div class="met m-green"><div class="ml">Goods Value</div><div class="mv g">${fmt(totalGoods)}</div></div><div class="met m-red"><div class="ml">Labour</div><div class="mv r">${fmt(bw)}</div></div><div class="met m-amber"><div class="ml">Overtime</div><div class="mv a">${fmt(ot)}</div></div><div class="met m-amber"><div class="ml">RM Cost</div><div class="mv a">${fmt(totalRM)}</div></div><div class="met ${net>=0?'m-green':'m-red'}"><div class="ml">Net Profit</div><div class="mv ${net>=0?'g':'r'}">${fmt(net)}</div></div><div class="met ${net>=0?'m-green':'m-red'}"><div class="ml">Margin</div><div class="mv ${net>=0?'g':'r'}">${margin}%</div></div>`;
  let invHTML='';
  STAGES.forEach((stage,si)=>{
    const pm={};
    S.sessions.forEach(ss=>(ss.teams||[]).filter(t=>t.stage===stage).forEach(t=>t.production.forEach(p=>{
      if(!pm[p.name])pm[p.name]={...p,qty:0,value:0};pm[p.name].qty+=p.qty;pm[p.name].value+=p.value;
    })));
    if(!Object.keys(pm).length)return;
    const ns=STAGES[si+1];const mn={};
    if(ns)S.sessions.forEach(ss=>(ss.teams||[]).filter(t=>t.stage===ns).forEach(t=>t.production.forEach(p=>mn[p.name]=(mn[p.name]||0)+p.qty)));
    invHTML+=`<div style="margin-bottom:16px"><div style="margin-bottom:8px"><span class="sp sp${si}">${stage}</span></div><table class="tbl"><thead><tr><th>Product</th><th class="num">Produced</th><th class="num">Moved to ${ns||'Customer'}</th><th class="num">Remaining</th><th class="num">₹/unit</th><th class="num">Stock Value</th></tr></thead><tbody>${Object.values(pm).map(p=>{const mv=mn[p.name]||0;const rem=p.qty-mv;return`<tr><td style="font-weight:500">${p.name}</td><td class="num">${p.qty}</td><td class="num" style="color:${mv?'var(--amber)':'var(--text4)'}">${mv?'→'+mv:'—'}</td><td class="num">${rem}</td><td class="num">${fmtN(p.unitVal)}</td><td class="num">${fmtN(rem*p.unitVal)}</td></tr>`;}).join('')}</tbody></table></div>`;
  });
  document.getElementById('day-inv').innerHTML=invHTML||'<div style="color:var(--text4);font-size:12px">No production logged today.</div>';
  let rows='';let gG=0,gL=0,gOT=0,gR=0;
  S.sessions.forEach(ss=>{
    (ss.teams||[]).forEach(t=>{
      const supW=S.lab.find(l=>l.id===ss.supId);
      const supOT=calcOT(supW);
      const teamOT=t.team.reduce((a,m)=>a+calcOT(m),0);
      const lc=t.team.reduce((a,m)=>a+m.wage,0)+(t.teamId===1?ss.supWage:0);
      const otc=(t.teamId===1?supOT:0)+teamOT;
      const gv=t.production.reduce((a,p)=>a+p.value,0);
      const sRM=S.rawLog.filter(r=>r.stage===t.stage).reduce((a,r)=>a+r.cost,0)/Math.max(1,S.sessions.reduce((a,s2)=>a+(s2.teams||[]).filter(t2=>t2.stage===t.stage).length,0));
      const net2=gv-lc-otc-sRM;gG+=gv;gL+=lc;gOT+=otc;gR+=sRM;
      rows+=`<tr><td style="font-weight:500">${ss.supName}</td><td><span class="sp sp${STAGES.indexOf(t.stage)}">${t.stage}</span></td><td style="font-size:11px;color:var(--text3)">${t.team.map(m=>m.name).join(', ')||'—'}</td><td class="num">${fmtN(gv)}</td><td class="num">${fmtN(lc)}</td><td class="num">${otc?fmtN(otc):'—'}</td><td class="num">${fmtN(sRM)}</td><td class="num ${net2>=0?'pv':'lv'}">${fmt(net2)}</td></tr>`;
    });
  });
  if(!S.sessions.length)rows=`<tr><td colspan="8" style="color:var(--text4);text-align:center;padding:20px">No sessions yet.</td></tr>`;
  const gNet=gG-gL-gOT-gR;
  rows+=`<tr class="tr-total"><td colspan="3">TOTAL</td><td class="num">${fmtN(gG)}</td><td class="num">${fmtN(gL)}</td><td class="num">${fmtN(gOT)}</td><td class="num">${fmtN(gR)}</td><td class="num ${gNet>=0?'pv':'lv'}">${fmt(gNet)}</td></tr>`;
  document.getElementById('day-teams').innerHTML=rows;
  // Attendance removed from Day Sheet — see Attendance screen
  const rmTotal=S.rawLog.reduce((a,r)=>a+r.cost,0);const rmProfit=totalGoods-rmTotal;
  document.getElementById('day-rm-pnl').innerHTML=`<div class="mrow"><div class="met m-blue"><div class="ml">Total Goods</div><div class="mv w">${fmt(totalGoods)}</div></div><div class="met m-red"><div class="ml">RM Issued</div><div class="mv r">${fmt(rmTotal)}</div></div><div class="met ${rmProfit>=0?'m-green':'m-red'}"><div class="ml">RM Supervisor Net</div><div class="mv ${rmProfit>=0?'g':'r'}">${fmt(rmProfit)}</div></div></div>`;
}
export function buildPayload(){
  const present=S.lab.filter(l=>l.present);
  const bw=present.reduce((a,l)=>a+l.wage,0);
  const ot=present.reduce((a,l)=>a+calcOT(l),0);
  const totalLab=bw+ot;
  const totalGoods=S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  // Only count actual RM issues — exclude Unit2 transfers
  const totalRM=S.rawLog.filter(r=>r.stage!=='Unit2-Transfer').reduce((a,r)=>a+r.cost,0);
  const net=totalGoods-totalLab-totalRM;
  const stageRM={},stageLab={},stageOT={};
  S.rawLog.filter(r=>r.stage!=='Unit2-Transfer').forEach(r=>stageRM[r.stage]=(stageRM[r.stage]||0)+r.cost);
  S.sessions.forEach(ss=>{
    const sup=S.lab.find(l=>l.id===ss.supId);
    const supOT=calcOT(sup);
    (ss.teams||[]).forEach(t=>{
      const teamLab=t.team.reduce((a,m)=>a+m.wage,0);
      const teamOT=t.team.reduce((a,m)=>a+calcOT(m),0);
      stageLab[t.stage]=(stageLab[t.stage]||0)+teamLab+(t.teamId===1?ss.supWage:0);
      stageOT[t.stage]=(stageOT[t.stage]||0)+teamOT+(t.teamId===1?supOT:0);
    });
  });
  const productLog=[];
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>productLog.push({...p,stage:t.stage,supName:ss.supName,teamId:t.teamId}))));
  const attendance=S.lab.map(l=>({id:l.id,name:l.name,role:l.role,wage:l.wage,present:l.present,doingOT:l.doingOT,otHours:l.otHours||0,ot:l.otHours||0}));
  return{
    date:S.workDate,
    workersPresent:present.length,
    goodsValue:totalGoods,
    labourCost:bw,
    overtimeCost:ot,
    rmCost:totalRM,
    netProfit:net,
    margin:totalGoods?Math.round(net/totalGoods*100):0,
    productLog,
    rawLog:S.rawLog.filter(r=>r.stage!=='Unit2-Transfer'),
    attendance,
    stageRM,stageLab,stageOT,
    sessions:JSON.parse(JSON.stringify(S.sessions))
  };
}
export function syncToSheets(){
  if(!S.sheetsUrl){alert('Google Sheets not connected. Go to Sheets tab.');return;}
  setSyncStatus('syncing','Syncing...');
  sendViaImage(S.sheetsUrl,buildPayload());
  setSyncStatus('ok','Synced ✓');
  setTimeout(()=>setSyncStatus('ok','Connected'),3000);
}
// ── CLOSING THE DAY ──
//
// The old version did all of this in the wrong order and on a fixed timer:
// it marked the day closed in localStorage, cleared the sessions, advanced
// the work date, and only THEN attempted the write — never awaiting it. Three
// separate failures followed from that ordering:
//
//   · The success alert and the navigation ran on a 3s setTimeout, not on the
//     result, so "✓ Day saved!" appeared whether the write succeeded, was
//     refused by RLS, or was parked in the offline outbox.
//   · The `_day_cleared_` flag was written BEFORE the write could fail, so a
//     failed save still made loadState() destroy that day's sessions on the
//     next boot — losing the shift from the device as well as from Postgres.
//   · It called persist(), pushToFirebase() and go() without importing any of
//     them, so it threw at the first one and never reached the write at all.
//
// Now: write first, and only commit to closing the day once the row is
// actually in day_ledger.
export async function saveDay(){
  const payload = buildPayload();
  const entry = {...payload, date:S.workDate, rawLog:S.rawLog.map(r=>({...r}))};

  const savedDate = S.workDate;
  const next = new Date(savedDate+'T00:00:00');
  next.setDate(next.getDate()+1);
  const nextStr = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
  const nextLabel = next.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'});

  const btn = document.querySelector('[data-click="saveDay"]');
  const restore = btn ? btn.textContent : '';
  if(btn){ btn.textContent='⏳ Saving...'; btn.disabled=true; }

  // ── THE WRITE, BEFORE ANYTHING IS CLEARED ──
  let saved = true;
  if(fbEnabled){
    try{
      saved = await FactoryDB.saveDay(savedDate, payload);
    }catch(e){
      console.error('saveDay:', e);
      saved = false;
    }
  }

  if(fbEnabled && !saved){
    // Nothing is cleared and no flag is written, so the day is still open and
    // the user can try again once the cause is fixed. Say what actually
    // happened rather than claiming success.
    if(btn){ btn.textContent=restore; btn.disabled=false; }
    const err = (typeof FactoryDB!=='undefined' && FactoryDB.lastWriteError)
      ? FactoryDB.lastWriteError() : null;
    alert(err && err.table==='day_ledger'
      ? 'Could not close the day: '+err.hint+'.'+'\n\n'+
        'Nothing has been cleared — the day is still open. '+
        'Closing the day is an owner action; ask the owner to run it.'
      : 'Could not reach the server to close the day.'+'\n\n'+
        'Nothing has been cleared — the day is still open. '+
        'Check the connection and press Save Day again.');
    return false;
  }

  // The row is in day_ledger. Now it is safe to close the day locally.
  const ei = S.ledger.findIndex(e=>e.date===savedDate);
  if(ei>=0) S.ledger[ei]=entry; else S.ledger.push(entry);
  S.ledger.sort((a,b)=>a.date.localeCompare(b.date));

  if(S.sheetsUrl){ sendViaImage(S.sheetsUrl, payload); }

  localStorage.setItem('_day_cleared_'+savedDate, '1');
  localStorage.setItem('_last_saved_date', savedDate);
  localStorage.removeItem('_day_cleared_'+nextStr); // clear tomorrow's flag

  S.sessions = [];
  S.rawLog = [];
  S.lab.forEach(l=>{ l.present=false; l.doingOT=false; l.otHours=0; });
  S.workDate = nextStr;
  const wdEl = document.getElementById('work-date');
  if(wdEl) wdEl.value = nextStr;
  persist();

  // Push the cleared state under the NEW date. Every operational table is
  // keyed by work_date, so the next day simply has no rows yet — which is what
  // made the old _dayCleared flags, the supervisor doc wipes and the rollover
  // broadcast unnecessary.
  if(fbEnabled){
    try{ await pushToFirebase(); }catch(e){ console.warn('saveDay push:', e); }
  }

  if(btn){ btn.textContent=restore || '💾 Save Day & Start Next'; btn.disabled=false; }
  alert('✓ Day saved!\nNext: '+nextLabel);
  go('att');
  return true;
}
