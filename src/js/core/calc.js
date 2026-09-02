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

// ── STOCK IS A BALANCE AS AT A DATE ──
//
// Every stock figure below is the sum of dated movements up to a cut-off, not
// a stored running total. That is how an inventory system has to work if a day
// can be entered after the fact: ask for the balance on the 26th and you get
// what was on the floor on the 26th, whatever has happened since.
//
// It did not work that way. Every term was summed over ALL time with no
// reference to the date on the row, so opening a past day showed that day's
// production and attendance beside TODAY's stock. Work was recorded for the
// 26th against balances that included the 27th through the 30th — and the
// availability checks that gate a transfer ("only N units available") were
// answering for the wrong day, refusing moves that were valid when they
// happened and permitting ones that were not.
//
// The cut-off defaults to the open day, so on today nothing changes: today is
// on or after every movement, and the sums are exactly what they were.

/** The day balances are being asked about, unless a caller says otherwise. */
export function asOfDate(){ return S.workDate || todayStr(); }

/**
 * Is a movement on or before the cut-off?
 *
 * An undated row counts as always-having-been-there. Rows written before the
 * date fixes have no `date` at all, and dropping them would silently deflate
 * every balance that depends on them — a wrong number with no visible cause.
 */
function upTo(date, asOf){ return !date || date <= asOf; }

/**
 * The catalogue product behind a produced item.
 *
 * Production logs a variant name — "Chair A — Red" — while the FG catalogue,
 * and therefore every order, knows it as "Chair A". Anything that has to line
 * production up against an order has to cross that gap, and the split was
 * written out separately in fgstock.js and inventory.js.
 *
 * The separator is an em dash with spaces, which is what production.js writes.
 */
export function baseProductName(name){
  const s = String(name||'');
  return s.includes(' — ') ? s.split(' — ')[0] : s;
}

export function getFGBalance(productName, stage, asOf){
  if(!S.fgStock) return 0;
  const cutoff = asOf || asOfDate();

  // 1. The opening declaration — what was on the floor on the go-live date.
  //    In scope only from that date onwards: before go-live the factory's
  //    recorded history simply does not reach back, and counting the opening
  //    balance there would report stock the business had not yet declared.
  //    A declaration with no date (entered before this was dated, or seeded)
  //    counts always, exactly as it used to.
  const openingAsOf = (S.fgOpening && S.fgOpening.asOfDate) || null;
  const opening = (!openingAsOf || openingAsOf <= cutoff)
    ? ((S.fgStock[stage]&&S.fgStock[stage][productName])||0)
    : 0;

  // 2. Production logged directly at this stage (open day + history).
  //    The open day's sessions belong to S.workDate, so they count only when
  //    that day is itself within the cut-off.
  const producedToday = upTo(S.workDate, cutoff) ? S.sessions.reduce((a,ss)=>
    a+(ss.teams||[]).filter(t=>t.stage===stage)
      .reduce((b,t)=>b+t.production
        .filter(p=>(p.baseName||p.name)===productName||p.name===productName)
        .reduce((c,p)=>c+p.qty,0),0)
  ,0) : 0;
  const producedHistory = closedDaysExcludingOpen()
    .filter(day=>upTo(day.date, cutoff))
    .reduce((a,day)=>
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
    if(!upTo(t.date, cutoff)) return false;
    const inName = t.productIn||t.product;
    return inName===productName||t.product===productName;
  }).reduce((a,t)=>a+t.qty,0);

  // 4. Transferred OUT from this stage (to another stage, Order, Dispatch, Unit2)
  const transferredOut = (S.fgTransfers||[]).filter(t=>{
    if(t.from!==stage) return false;
    if(!upTo(t.date, cutoff)) return false;
    const outName = t.productIn||t.product;
    return outName===productName||t.product===productName;
  }).reduce((a,t)=>a+t.qty,0);

  // 5. Manual adjustments
  const adjustments = (S.fgAdjustments||[])
    .filter(a=>a.stage===stage&&(a.product===productName||(a.product||'').startsWith(productName)))
    .filter(a=>upTo(a.date, cutoff))
    .reduce((a,adj)=>a+adj.qty,0);

  return Math.max(0, opening + producedToday + producedHistory + transferredIn - transferredOut + adjustments);
}

/**
 * Raw-material balance as at a date: opening + purchases received − issues.
 *
 * Lives here rather than in screens/stock.js because that screen had TWO
 * copies of this formula — one for the reorder alerts and one inlined in the
 * table — which could disagree with each other about the same material.
 *
 * Both copies also summed issues over the WHOLE ledger while separately adding
 * the open day's unsaved issues. On a reopened closed day those are the same
 * issues counted twice, which understated the balance and could raise a false
 * reorder alarm. closedDaysExcludingOpen() is the existing guard for that.
 */
export function getRMBalance(matName, asOf){
  const cutoff = asOf || asOfDate();
  const s = (S.stock||[]).find(st=>st.name===matName);
  const opening = s ? (s.opening||0) : 0;

  // Receipt rows in scope. `type:'opening'` rows are skipped because the
  // opening balance is already carried by S.stock.opening above — counting
  // both is how an opening quantity ends up in the balance twice.
  const rows = (S.purchases||[]).filter(p=>
    p.name===matName && p.type!=='opening' && upTo(p.date, cutoff));
  const purchased   = rows.filter(p=>p.qty>0).reduce((a,p)=>a+p.qty,0);
  // Negative receipt rows: wastage, spoilage, a correction to an over-entry.
  // Signed, so it adds. The dashboard's reorder count used to filter these
  // out with `p.qty>0` and so reported more material on hand than there was —
  // exactly the alarm you do not want a factory to miss.
  const adjustments = rows.filter(p=>p.qty<0).reduce((a,p)=>a+p.qty,0);

  const issuedHistory = closedDaysExcludingOpen()
    .filter(day=>upTo(day.date, cutoff))
    .reduce((a,day)=>a+(day.rawLog||[])
      .filter(r=>r.name===matName).reduce((b,r)=>b+r.qty,0),0);
  const issuedOpen = upTo(S.workDate, cutoff)
    ? (S.rawLog||[]).filter(r=>r.name===matName).reduce((a,r)=>a+r.qty,0)
    : 0;

  return { opening, purchased, adjustments, issuedHistory, issuedOpen,
           issued: issuedHistory + issuedOpen,
           balance: opening + purchased + adjustments - issuedHistory - issuedOpen };
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

