// ══════════════════════════════════════════════════════════════════
//  CORE / CALC — the business maths
//
//  Payroll, finished-goods stock, overtime, order status. These are the
//  numbers that get paid and the quantities the factory believes it holds,
//  so they live in one place with no DOM and no rendering.
//
//  `S` is imported as a live binding from state.js: when the realtime pull
//  replaces the whole state via setS(), the functions here see the new
//  object with no re-wiring.
//
//  See config.js for why these are also published on `window` during the
//  split — app.js still calls them as globals.
// ══════════════════════════════════════════════════════════════════

import { S } from './state.js';
import { todayStr } from './format.js';
export function isOverdue(ord){if(ord.status==='dispatched'||!ord.requiredBy)return false;return new Date(ord.requiredBy+'T00:00:00')<new Date();}

export function calcOT(w){
  if(!w || !w.doingOT) return 0;
  return Math.round(((parseFloat(w.wage)||0)/8) * (parseFloat(w.otHours)||0));
}

export function sessionTeams(ss){
  if(!ss) return [];
  if(ss.teams) return ss.teams;
  if(ss.team || ss.production){
    return [{teamId:1, stage:ss.stage, team:ss.team||[], production:ss.production||[]}];
  }
  return [];
}

export function sessionProduction(ss){
  return sessionTeams(ss).reduce(function(a,t){ return a.concat(t.production||[]); },[]);
}

export function sessionMembers(ss){
  return sessionTeams(ss).reduce(function(a,t){ return a.concat(t.team||[]); },[]);
}

/**
 * Closed days EXCEPT the one currently open.
 *
 * Anything that adds the open day to the ledger has to exclude the open day
 * FROM the ledger, or it counts that day twice. S.sessions and the ledger
 * entry for S.workDate describe the same production whenever a closed day is
 * open for editing — and, until the day-lifecycle fix, whenever a closed day
 * was accidentally reopened by a rollover.
 *
 * computeSalaryMonth() had this guard from the start. getFGBalance(),
 * renderTaskBoard() and both Excel exports did not.
 */
export function closedDaysExcludingOpen(){
  return (S.ledger||[]).filter(e => e.date !== S.workDate);
}

export function getFGBalance(productName, stage){
  if(!S.fgStock) return 0;

  // 1. Manual opening stock set in setup
  const opening = (S.fgStock[stage]&&S.fgStock[stage][productName])||0;

  // 2. Production logged directly at this stage (today + history)
  const producedToday = S.sessions.reduce((a,ss)=>
    a+(ss.teams||[]).filter(t=>t.stage===stage)
      .reduce((b,t)=>b+t.production
        .filter(p=>(p.baseName||p.name)===productName||p.name===productName)
        .reduce((c,p)=>c+p.qty,0),0)
  ,0);
  const producedHistory = closedDaysExcludingOpen().reduce((a,day)=>
    a+(day.sessions||[]).reduce((b,ss)=>
      b+(ss.teams||[]).filter(t=>t.stage===stage)
        .reduce((c,t)=>c+(t.production||[])
          .filter(p=>(p.baseName||p.name)===productName||p.name===productName)
          .reduce((d,p)=>d+p.qty,0),0)
    ,0)
  ,0);

  // 3. Transferred IN to this stage from another stage (stage-to-stage moves)
  //    Only count inter-stage transfers (not Order- or Dispatch destinations which are exits)
  //
  //    S.fgTransfers holds EVERY transfer, not just the open day's. It used to
  //    be filtered to the work date by pull(), which made this formula
  //    "all-time production minus today's transfers only": every transfer out
  //    from every previous day vanished from the balance, so stage stock
  //    inflated a little more each day, on every device.
  const REAL_STAGES = ['Moulding','Finishing','Painting','Packing'];
  const transferredIn = (S.fgTransfers||[]).filter(t=>{
    if(t.to!==stage) return false;
    if(!REAL_STAGES.includes(t.from)) return false; // skip Unit2, external etc
    const inName = t.productIn||t.product;
    return inName===productName||t.product===productName;
  }).reduce((a,t)=>a+t.qty,0);

  // 4. Transferred OUT from this stage (to another stage, Order, Dispatch, Unit2)
  const transferredOut = (S.fgTransfers||[]).filter(t=>{
    if(t.from!==stage) return false;
    const outName = t.productIn||t.product;
    return outName===productName||t.product===productName;
  }).reduce((a,t)=>a+t.qty,0);

  // 5. Manual adjustments
  const adjustments = (S.fgAdjustments||[])
    .filter(a=>a.stage===stage&&(a.product===productName||(a.product||'').startsWith(productName)))
    .reduce((a,adj)=>a+adj.qty,0);

  return Math.max(0, opening + producedToday + producedHistory + transferredIn - transferredOut + adjustments);
}

export function otAmt(worker){
  return calcOT(worker);
}

export function computeSalaryMonth(month){
  const monthLedger = (S.ledger||[]).filter(e=>(e.date||'').slice(0,7)===month);

  // Build per-worker attendance count from ledger
  const presenceDays = {};
  const otDays = {};
  const otHoursTotal = {};
  S.lab.forEach(l=>{ presenceDays[l.id]=0; otDays[l.id]=0; otHoursTotal[l.id]=0; });

  monthLedger.forEach(day=>{
    (day.attendance||[]).forEach(a=>{
      if(a.present){
        presenceDays[a.id]=(presenceDays[a.id]||0)+1;
      }
      if(a.doingOT){
        otDays[a.id]=(otDays[a.id]||0)+1;
        otHoursTotal[a.id]=(otHoursTotal[a.id]||0)+(parseFloat(a.otHours)||0);
      }
    });
  });

  // Also count the open working day — but only if it is in the selected
  // month AND has not already been written to the ledger, otherwise a
  // saved day would be counted twice. Uses workDate, not the calendar
  // date, so past-date entry sessions land in the correct month.
  const wd = S.workDate||todayStr();
  if(wd.slice(0,7)===month && !monthLedger.some(e=>e.date===wd)){
    S.lab.forEach(l=>{
      if(l.present){
        presenceDays[l.id]=(presenceDays[l.id]||0)+1;
      }
      if(l.doingOT){
        otDays[l.id]=(otDays[l.id]||0)+1;
        otHoursTotal[l.id]=(otHoursTotal[l.id]||0)+(parseFloat(l.otHours)||0);
      }
    });
  }

  if(!S.salaryAdj) S.salaryAdj={};
  const adj = S.salaryAdj[month]||{};

  const totals = {gross:0, adv:0, ded:0, net:0};

  const rows = S.lab.map((l,i)=>{
    const days  = presenceDays[l.id]||0;
    const otDay = otDays[l.id]||0;
    const otHrs = otHoursTotal[l.id]||0;
    // Same rate as calcOT(): daily wage / 8 per hour.
    const otAmt = Math.round((l.wage/8)*otHrs);
    const gross = l.wage*days + otAmt;
    const adv   = (adj[l.id]?.advance)||0;
    const ded   = (adj[l.id]?.deduction)||0;
    const net   = gross - adv - ded;
    const note  = adj[l.id]?.note||'';
    totals.gross+=gross; totals.adv+=adv; totals.ded+=ded; totals.net+=net;
    return{l,days,otDay,otHrs,otAmt,gross,adv,ded,net,note,i};
  });

  return {rows, totals};
}

