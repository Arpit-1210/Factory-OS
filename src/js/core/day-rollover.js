// ==================================================================
//  CORE / DAY LIFECYCLE — which day is open, and how it changes
//
//  Nothing here is published on `window`. The markup names actions
//  (data-click="saveDay") and core/actions.js resolves them through real
//  imports, so a screen reaches another screen by importing it — never
//  through the global object.
//
//  ── THE MODEL ──
//  A day is in exactly one of two states:
//
//    OPEN    no day_ledger row. Work is recorded against it.
//    CLOSED  a day_ledger row exists. It belongs to Monthly history.
//
//  `S.ledger` IS that state — it mirrors day_ledger and is shared by every
//  device. There is no second opinion.
//
//  There used to be one. Two localStorage flags, `_day_cleared_<date>` and
//  `_last_saved_date`, recorded "this day was closed" per-device, unsynced and
//  never expiring. They disagreed with the ledger and with each other: device B
//  did not know device A had closed a day, `_last_saved_date` stayed armed one
//  load too long and wiped work re-entered on a closed day, and isDaySaved()
//  DELETED a flag as a side effect of being asked a question. Both flags are
//  gone. One source of truth.
//
//  ── EVERY TRANSITION GOES THROUGH openWorkDate() ──
//  `S.workDate` had seven writers, three of which moved the date without
//  loading the day they moved to. The header date picker was the worst: it
//  assigned the new date and persisted, so the push two seconds later
//  re-stamped the CURRENT day's attendance, sessions and raw log onto the
//  chosen date — and because raw_log and fg_transfers upsert on `id`, those
//  rows moved off the day they were recorded on. Opening an old day to look at
//  it silently rewrote it.
//
//  Now openWorkDate() is the only way in, and it always loads the day it
//  switches to.
// ==================================================================

import { LS_KEY } from './config.js';
import { todayStr } from './format.js';
import { go } from './router.js';
import { S } from './state.js';
import { renderDashboard } from '../screens/dashboard.js';

/**
 * Has this day been closed? Answered from the ledger alone.
 *
 * Pure: no writes, no localStorage, and no special case for the currently open
 * day. The old version returned false whenever `d === S.workDate` — "the open
 * day can never be already saved" — which was untrue the moment a day was
 * deliberately reopened for editing, and it erased that day's closed-marker on
 * the way past.
 */
export function isDaySaved(d){
  return !!(d && (S.ledger||[]).some(function(e){return e.date===d;}));
}

/** True when the user is deliberately sitting in a closed day to edit it. */
export function isReopened(){
  return !!(S.reopenDate && S.reopenDate===S.workDate);
}

export function addDays(dateStr, n){
  var d = new Date(dateStr+'T00:00:00');
  d.setDate(d.getDate()+n);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

/**
 * The first day at or after `from` that has not been closed.
 *
 * Save Day advances to the next calendar day; if that day is closed too
 * (re-closing an old day, or catching up after a break) landing on it would
 * open a day that belongs to history. Walks forward instead. Bounded so a
 * corrupt ledger cannot spin.
 */
export function nextOpenDate(from){
  var d = from || todayStr();
  for(var i=0;i<400 && isDaySaved(d);i++) d = addDays(d,1);
  return d;
}

/** Restore a closed day's own numbers from its ledger entry. */
function loadFromLedger(entry){
  S.sessions = entry && entry.sessions ? JSON.parse(JSON.stringify(entry.sessions)) : [];
  S.rawLog   = entry && entry.rawLog   ? JSON.parse(JSON.stringify(entry.rawLog))   : [];
  (S.lab||[]).forEach(function(l){
    var a = ((entry&&entry.attendance)||[]).find(function(x){return x.id===l.id;});
    l.present = !!(a&&a.present);
    l.doingOT = !!(a&&a.doingOT);
    l.otHours = (a&&a.otHours)||0;
  });
}

/** Empty the day-scoped slots so a pull fills them from the day's own rows. */
function clearDaySlots(){
  S.sessions = [];
  S.rawLog   = [];
  (S.lab||[]).forEach(function(l){l.present=false;l.doingOT=false;l.otHours=0;});
}

/**
 * Remember a past day that was left open, so moving to today does not bury it.
 *
 * Signing in with no date now goes to today rather than resuming whatever day
 * the device was left on. That is the right default, but the day being stepped
 * over may hold a real shift that was never closed — and an unclosed day is
 * invisible everywhere that matters: it has no ledger row, so it is absent from
 * Monthly and from payroll, while its attendance and production rows sit in
 * Postgres under a date nothing asks about.
 *
 * Nothing is deleted here. The rows are keyed by work_date and come straight
 * back when the day is opened. This only makes sure someone is told.
 */
export function noteUnclosedDay(date){
  S.unclosedDay = null;
  if(!date || date >= todayStr()) return false;   // today or later: nothing left behind
  if(isDaySaved(date)) return false;              // already closed: properly recorded
  // An empty day is not worth chasing — no attendance, no production, no issues.
  var hasWork = (S.sessions||[]).length > 0 ||
                (S.rawLog||[]).length > 0 ||
                (S.lab||[]).some(function(l){return l.present;});
  if(!hasWork) return false;
  S.unclosedDay = date;
  return true;
}

/** Paint (or hide) the notice about a past day that still needs closing. */
function paintUnclosedBanner(){
  var el = document.getElementById('unclosed-banner');
  if(!el) return;
  var d = S.unclosedDay;
  // Once that day is closed, or the user has navigated onto it, the notice has
  // served its purpose.
  if(!d || isDaySaved(d) || S.workDate===d){ el.style.display='none'; return; }
  var txt = document.getElementById('unclosed-banner-text');
  if(txt){
    var pretty = new Date(d+'T00:00:00')
      .toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
    txt.textContent = pretty + ' was left open and never closed. Its work is saved but '+
                      'will not appear in Monthly Data or payroll until the day is closed.';
  }
  var btn = document.getElementById('unclosed-banner-open');
  if(btn) btn.setAttribute('data-args', JSON.stringify([d]));
  el.style.display='flex';
}

/** Go to the day the unclosed-day notice is about, so it can be closed. */
export function openUnclosedDay(date){
  var d = date || S.unclosedDay;
  if(!d) return false;
  return openWorkDate(d);
}

/** Stop showing the unclosed-day notice for this session. */
export function dismissUnclosedDay(){
  S.unclosedDay = null;
  paintUnclosedBanner();
}

/**
 * Make a reopened closed day unmistakable. Editing history and recording
 * today's work looked identical, which is how a day got re-closed by accident.
 */
function paintBanner(){
  var el=document.getElementById('reopen-banner');
  if(!el) return;
  if(!isReopened()){ el.style.display='none'; return; }
  var txt=document.getElementById('reopen-banner-text');
  if(txt){
    var pretty=new Date(S.workDate+'T00:00:00')
      .toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
    txt.textContent='Editing '+pretty+' — this day is closed and already counted in Monthly Data. Saving again replaces its entry.';
  }
  el.style.display='flex';
}

/**
 * @param {boolean} fromRemote  true when this was triggered by another
 *   device rather than by the person at this one.
 *
 * A remote event must not re-render the production screen. Re-rendering it
 * resets the selected team and wipes half-typed inputs, which is why the
 * realtime callback in sync.js has always skipped it — and why repaint() has
 * to skip it too, now that a remote day-closure reaches this module.
 * A repaint the user asked for (they picked a date) still paints everything.
 */
function repaint(fromRemote){
  var wd=document.getElementById('work-date'); if(wd) wd.value=S.workDate;
  paintBanner();
  paintUnclosedBanner();
  try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}
  try{renderDashboard();}catch(e){}
  var sid=(document.querySelector('.screen.active')||{}).id;
  if(!sid) return;
  if(fromRemote && sid==='sc-sup') return;
  try{go(sid.replace('sc-',''));}catch(e){}
}

/**
 * Move to `date` and load that day.
 *
 * The only way to CHANGE the open day from outside this module. (Two writers
 * of S.workDate remain, and neither is a transition: state.js decides the
 * starting day during loadState(), before S exists, and app.js fills it in
 * when it is empty. adoptWorkDate() below is the post-close advance.)
 *
 * This used to say "the ONLY writer of S.workDate", which was not true —
 * core/auth.js assigned it directly on a past-date login and so skipped the
 * ledger check, the banner and the persist. Accuracy here is load-bearing:
 * the claim is what made that assignment look sanctioned.
 *
 * A closed day requires `opts.reopen` — landing on one implicitly (a midnight
 * rollover, a stale stored date snapping back) must give an empty day, while
 * opening one deliberately must load it. Conflating those two is what put a
 * closed day's production back under Today's Production.
 *
 * Returns false and moves nothing if a closed day was reached without
 * `reopen`, so callers can report it rather than silently doing something else.
 *
 * @param {{reopen?:boolean, pull?:boolean}} [opts]
 *   reopen  this day was named deliberately, so a closed one may be opened
 *   pull    false to skip the follow-up pull; the caller is pulling itself
 */
export function openWorkDate(date, opts){
  opts = opts || {};
  if(!date) return false;
  var closed = isDaySaved(date);
  if(closed && !opts.reopen) return false;

  S.workDate   = date;
  S.reopenDate = closed ? date : null;

  if(closed){
    // The ledger payload is the whole day — sessions, raw log and attendance.
    // Read from it rather than from the live tables: the live rows for a
    // closed day are a leftover, and on a day closed by another device they
    // may not be here at all.
    loadFromLedger((S.ledger||[]).find(function(e){return e.date===date;}));
  }else{
    clearDaySlots();
  }
  repaint();

  // Pull the day's own rows. Only for an open day — a closed day is already
  // fully described by its ledger entry, and re-pulling would drag the stale
  // operational rows back in.
  //
  // `opts.pull === false` is for the login path, which is about to pull as part
  // of its own chain; two pulls for one day change would race, and only the
  // login's own pull reports success back to the push decision.
  if(opts.pull!==false && !closed && typeof FactoryDB!=='undefined' && FactoryDB.isReady()){
    try{
      Promise.resolve(FactoryDB.pull(S)).then(function(){
        // The pull brings the ledger with it, so a day that looked open a
        // moment ago may turn out to have been closed on another device.
        reconcileOpenDay();
        repaint();
      })
        .catch(function(e){ console.warn('[day] pull after date change:', e); });
    }catch(e){ console.warn('[day] pull after date change:', e); }
  }
  return true;
}

/**
 * Settle what the open day means, once the ledger is known. Call after any
 * pull.
 *
 * The ledger arrives with the pull, so until it lands nothing can tell whether
 * the open day is closed. Two situations end up here:
 *
 *   · This device closed the day, and the day's own production_sessions /
 *     attendance rows are still in Postgres (closing writes the ledger row; it
 *     does not delete the operational rows). The pull loads them and they read
 *     as live work. This is the "yesterday's production is still under Today's
 *     Production" report.
 *   · ANOTHER device closed the day while this one had it open. day_ledger is
 *     in the realtime publication, so that arrives here too.
 *
 * Either way the ledger entry is authoritative and the live rows are a
 * leftover, so show the ledger's version of the day and mark it reopened —
 * visibly a closed day being viewed, not today's work.
 */
export function reconcileOpenDay(fromRemote){
  if(!S || !S.workDate) return false;
  if(!isDaySaved(S.workDate)){
    if(S.reopenDate) S.reopenDate = null;
    return false;
  }
  S.reopenDate = S.workDate;
  loadFromLedger((S.ledger||[]).find(function(e){return e.date===S.workDate;}));
  repaint(fromRemote);
  return true;
}

/** Leave a reopened past day and go back to the current working day. */
export function returnToToday(){
  S.reopenDate = null;
  return openWorkDate(nextOpenDate(todayStr()));
}

/**
 * Kept for the one caller that advances after a close, and for tests.
 * The old two-argument form wrote a `_day_cleared_` flag that no longer
 * exists; the second parameter was already dead in production.
 */
export function adoptWorkDate(newDate){
  S.reopenDate = null;
  S.workDate = newDate;
  clearDaySlots();
  repaint();
}

/**
 * Advance past a closed day once the calendar has moved on. Runs on a 60s
 * interval from app.js.
 */
export function checkDayRollover(){
  if(!S||!S.workDate) return;

  // Deliberately editing a past day: leave it alone. Without this the interval
  // dragged the user back to today within a minute of opening an old date —
  // which, since any date worth opening is by definition in the ledger, made
  // past-date editing impossible to hold on to.
  if(isReopened()) return;

  // Drop sessions and raw-log rows belonging to some OTHER day that is closed.
  // Safe: that day is fully recorded in the ledger.
  var pruned=false;
  var stale=function(d){return d && d!==S.workDate && isDaySaved(d);};
  if((S.sessions||[]).some(function(s){return stale(s.date);})){
    S.sessions=S.sessions.filter(function(s){return !stale(s.date);}); pruned=true;
  }
  if((S.rawLog||[]).some(function(r){return stale(r.date);})){
    S.rawLog=S.rawLog.filter(function(r){return !stale(r.date);}); pruned=true;
  }
  if(pruned) repaint();

  var today=todayStr();
  if(S.workDate>=today) return;

  // An unsaved past day stays open — it still needs to be closed by hand, and
  // wiping it would destroy a shift nobody has recorded yet.
  if(!isDaySaved(S.workDate)) return;

  adoptWorkDate(nextOpenDate(today));
}
