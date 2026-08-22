// ==================================================================
//  CORE / DAY ROLLOVER — Advancing the work date at midnight
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

// ── DAY ROLLOVER ──
// Adopt a new work date: clear day-specific data, reset attendance
function isDaySaved(d){
  if(d && S.workDate && d===S.workDate){
    // current working day can never be "already saved" — clean any stale flag from testing
    if(localStorage.getItem('_day_cleared_'+d)) localStorage.removeItem('_day_cleared_'+d);
    return false;
  }
  return !!(d && ((S.ledger||[]).some(function(e){return e.date===d;}) || localStorage.getItem('_day_cleared_'+d)));
}
function adoptWorkDate(newDate, savedDate){
  if(savedDate) localStorage.setItem('_day_cleared_'+savedDate,'1');
  // Move to the new date BEFORE filtering. isDaySaved() treats S.workDate as
  // "the open day, never saved" and clears its _day_cleared_ flag as a side
  // effect — so filtering first made every row still carrying the OLD date
  // look unsaved, erased the flag marking that day closed, and carried
  // already-saved production forward into the new day, where getFGBalance()
  // counted it a second time on top of the ledger.
  S.workDate=newDate;
  // Drop only sessions from days already saved; carry unsaved in-progress work to the new date
  S.sessions=(S.sessions||[]).filter(function(s){return !isDaySaved(s.date);});
  S.sessions.forEach(function(s){s.date=newDate;});
  S.rawLog=(S.rawLog||[]).filter(function(r){return !isDaySaved(r.date);});
  S.rawLog.forEach(function(r){r.date=newDate;});
  (S.lab||[]).forEach(function(l){l.present=false;l.doingOT=false;l.otHours=0;});
  var wd=document.getElementById('work-date'); if(wd) wd.value=newDate;
  try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
  try{renderDashboard();}catch(e){}
  var sid=(document.querySelector('.screen.active')||{}).id;
  if(sid) try{go(sid.replace('sc-',''));}catch(e){}
}
// Auto-advance if our workDate is in the past AND that day was already saved
function checkDayRollover(){
  if(!S||!S.workDate) return;
  // Prune leftover sessions/rawLog from days already saved (safe: they live in the ledger)
  var pruned=false;
  var isDone=function(d){return d && d!==S.workDate && isDaySaved(d);};
  if((S.sessions||[]).some(function(s){return isDone(s.date);})){ S.sessions=S.sessions.filter(function(s){return !isDone(s.date);}); pruned=true; }
  if((S.rawLog||[]).some(function(r){return isDone(r.date);})){ S.rawLog=S.rawLog.filter(function(r){return !isDone(r.date);}); pruned=true; }
  if(pruned){
    try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
    try{renderDashboard();}catch(e){}
    var _sid=(document.querySelector('.screen.active')||{}).id;
    if(_sid) try{go(_sid.replace('sc-',''));}catch(e){}
  }
  var today=todayStr();
  if(S.workDate>=today) return;
  var wasSaved=(S.ledger||[]).some(function(e){return e.date===S.workDate;})
    || localStorage.getItem('_day_cleared_'+S.workDate);
  if(wasSaved) adoptWorkDate(today);
  // If not saved: leave data alone — the day still needs to be saved manually
}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, {
  isDaySaved,
  adoptWorkDate,
  checkDayRollover,
});
