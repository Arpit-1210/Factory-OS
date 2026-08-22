// ==================================================================
//  SCREEN / EXPORTS — Excel exports across date ranges
//
//  Markup: src/js/templates/screens/exports.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { calcOT, getFGBalance } from '../core/calc.js';
import { FG_STAGES } from '../core/config.js';
import { todayStr } from '../core/format.js';
import { S } from '../core/state.js';
import { checkXLSX, downloadXLSX } from '../core/xlsx.js';
import { getAllFGProducts } from './fgstock.js';

// ════ EXCEL EXPORTS ════
export function renderExportPage(){
  const m=document.getElementById('export-sal-month');
  if(m) m.value=todayStr().slice(0,7);
  setExpRange('month');
}
export function setExpRange(preset){
  const from=document.getElementById('exp-from');
  const to=document.getElementById('exp-to');
  if(!from||!to) return;
  const today=todayStr();
  if(preset==='today'){ from.value=today; to.value=today; }
  else if(preset==='week'){const d=new Date();d.setDate(d.getDate()-6);from.value=d.toISOString().slice(0,10);to.value=today;}
  else if(preset==='month'){from.value=today.slice(0,7)+'-01';to.value=today;}
  else if(preset==='all'){from.value='2020-01-01';to.value=today;}
}
export function getExpDates(){
  const from=document.getElementById('exp-from')?.value||'2020-01-01';
  const to=document.getElementById('exp-to')?.value||todayStr();
  return{from,to};
}
export function inRange(date,from,to){ return date>=from&&date<=to; }
export function exportAttendance(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Date','Worker','Role','Daily Wage','OT Hours','OT Amount','Status','Wage Earned']];
  if(inRange(S.workDate||todayStr(),from,to)){
    S.lab.forEach(l=>{
      const otHrs=l.doingOT?(parseFloat(l.otHours)||0):0;
      const otAmt=calcOT(l);
      rows.push([S.workDate,l.name,l.role,l.wage,otHrs,otAmt,l.present?'Present':'Absent',l.present?l.wage:0]);
    });
  }
  S.ledger.filter(e=>inRange(e.date,from,to)).forEach(day=>(day.attendance||[]).forEach(a=>{
    const l=S.lab.find(x=>x.id===a.id);if(!l)return;
    const otHrs=a.doingOT?(parseFloat(a.otHours)||0):0;
    const otAmt=Math.round((l.wage/8)*otHrs);
    rows.push([day.date,l.name,l.role,l.wage,otHrs,otAmt,a.present?'Present':'Absent',a.present?l.wage:0]);
  }));
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Attendance');
  downloadXLSX(wb,`Attendance_${from}_to_${to}.xlsx`);
}
export function exportProduction(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Date','Supervisor','Stage','Product','Qty','Unit Value','Total Value']];
  if(inRange(S.workDate||todayStr(),from,to)){
    S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>{
      rows.push([S.workDate,ss.supName,t.stage,p.name,p.qty,p.unitVal||0,p.value||0]);
    })));
  }
  S.ledger.filter(e=>inRange(e.date,from,to)).forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>(t.production||[]).forEach(p=>{
    rows.push([day.date,ss.supName,t.stage,p.name,p.qty,p.unitVal||0,p.value||0]);
  }))));
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Production');
  downloadXLSX(wb,`Production_${from}_to_${to}.xlsx`);
}
export function exportOrders(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Order ID','Date','Customer','Phone','City','Required By','Priority','Items','Amount','Advance','Balance','Status']];
  S.orders.filter(o=>inRange(o.createdAt||'',from,to)).forEach(o=>{
    rows.push([o.id,o.createdAt,o.customer,o.phone||'',o.city||'',o.requiredBy||'',o.priority,o.items||'',o.amount,o.advance,o.amount-o.advance,o.status]);
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Orders');
  downloadXLSX(wb,`Orders_${from}_to_${to}.xlsx`);
}
export function exportPnL(){
  if(!checkXLSX()) return;
  const{from,to}=getExpDates();
  const rows=[['Date','Goods Value','Labour Cost','RM Cost','Net Profit','Margin %']];
  S.ledger.filter(e=>inRange(e.date,from,to)).forEach(e=>{
    rows.push([e.date,e.goodsValue||0,e.labourCost||0,e.rmCost||0,e.netProfit||0,e.goodsValue>0?Math.round((e.netProfit/e.goodsValue)*100):0]);
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'PnL Ledger');
  downloadXLSX(wb,`PnL_${from}_to_${to}.xlsx`);
}


// Current position rather than a date range: stock is a snapshot, so the
// export range pickers do not apply to it.
export function exportInventory(){
  if(!checkXLSX()) return;
  const wb=XLSX.utils.book_new();

  const rmRows=[['Material','Unit','Opening','Purchased','Used','Balance','Reorder Level']];
  (S.stock||[]).forEach(st=>{
    const purchased=(S.purchases||[]).filter(p=>p.name===st.name).reduce((a,p)=>a+(p.qty||0),0);
    const usedHistory=(S.ledger||[]).reduce((a,d)=>a+(d.rawLog||[]).filter(r=>r.name===st.name).reduce((b,r)=>b+(r.qty||0),0),0);
    const usedToday=(S.rawLog||[]).filter(r=>r.name===st.name).reduce((a,r)=>a+(r.qty||0),0);
    const used=usedHistory+usedToday;
    rmRows.push([st.name,st.unit||'',st.opening||0,purchased,used,(st.opening||0)+purchased-used,st.reorder||0]);
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rmRows),'Raw Materials');

  const fgRows=[['Product','Moulding','Finishing','Painting','Packing','Total']];
  (getAllFGProducts()||[]).forEach(name=>{
    const per=FG_STAGES.map(st=>getFGBalance(name,st));
    fgRows.push([name,...per,per.reduce((a,b)=>a+b,0)]);
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(fgRows),'Finished Goods');

  downloadXLSX(wb,`Inventory_${todayStr()}.xlsx`);
}

