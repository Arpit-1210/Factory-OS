// ==================================================================
//  SCREEN / ATT — Daily attendance and overtime hours
//
//  Markup: src/js/templates/screens/att.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { calcOT } from '../core/calc.js';
import { fmt, todayStr } from '../core/format.js';
import { S } from '../core/state.js';

// ── screen state ──
let activeAttTab = 'attendance';

function switchAttTab(tab){
  activeAttTab = tab;
  document.getElementById('att-tab-attendance').style.display = tab==='attendance' ? 'block' : 'none';
  document.getElementById('att-tab-ot').style.display = tab==='ot' ? 'block' : 'none';
  document.querySelectorAll('#att-tabs .tab').forEach((t,i)=>{
    t.classList.toggle('active', (i===0&&tab==='attendance')||(i===1&&tab==='ot'));
  });
  if(tab==='ot') renderOTTab();
}
function renderAtt(){
  const d=document.getElementById('work-date');
  // DISPLAY the working date — do not overwrite it. This used to assign
  // todayStr() on every render, which silently undid Save Day: saveDay()
  // advances workDate to the next day and then navigates here, and this
  // line reset it to the calendar date. Overnight rollover is handled by
  // checkDayRollover(), which correctly leaves unsaved days alone.
  d.value=S.workDate||todayStr();
  if(!S.lab.length){
    document.getElementById('att-grid').innerHTML='<div style="color:var(--text4)">No workers. Add in Setup.</div>';
    updAttMet();return;
  }
  document.getElementById('att-grid').innerHTML=S.lab.map(l=>`
    <div class="wc ${l.present?'present':'absent'}" onclick="togAtt(${l.id})">
      <div>
        <div class="wn">${l.name}${l.isSup?' ⭐':''}</div>
        <div class="ws">${l.role} · ₹${l.wage}/day</div>
      </div>
      <div style="font-size:16px;font-weight:700;color:${l.present?'var(--jade)':'var(--ember)'}">${l.present?'✓':'✗'}</div>
    </div>`).join('');
  updAttMet();
  if(activeAttTab==='ot') renderOTTab();
}
function renderOTTab(){
  const present = S.lab.filter(l=>l.present);
  const otEl = document.getElementById('ot-grid');
  if(!otEl) return;
  if(!present.length){
    otEl.innerHTML='<div style="color:var(--text4);font-size:12px;padding:12px 0">No present workers. Mark attendance first.</div>';
    return;
  }
  let totalOT = 0;
  present.forEach(l=>{ totalOT += calcOT(l); });
  const otDisp = document.getElementById('ot-total-display');
  if(otDisp) otDisp.textContent = 'Total OT: ₹'+totalOT.toLocaleString('en-IN');

  otEl.innerHTML = `<table class="tbl" style="width:100%">
    <thead><tr>
      <th>Worker</th><th>Role</th><th class="num">Daily Wage</th>
      <th class="num">OT Hours</th><th class="num">OT Pay</th><th>Mark OT</th>
    </tr></thead>
    <tbody>${present.map(l=>{
      const hrs = l.otHours||0;
      const otPay = calcOT(l);
      return`<tr style="${l.doingOT?'background:var(--amber-l)':''}">
        <td style="font-weight:600">${l.name}${l.isSup?' ⭐':''}</td>
        <td style="color:var(--text3);font-size:11px">${l.role}</td>
        <td class="num">₹${l.wage}</td>
        <td class="num">
          <input type="number" value="${hrs}" min="0" max="12" step="0.5"
            onchange="setOTHours(${l.id},this.value)"
            style="width:60px;padding:4px 7px;border:1px solid var(--border);border-radius:5px;text-align:right;font-size:12px;background:var(--surface2)">
          hrs
        </td>
        <td class="num" style="font-weight:700;color:${otPay>0?'var(--amber)':'var(--text4)'}">
          ${otPay>0?'₹'+otPay.toLocaleString('en-IN'):'—'}
        </td>
        <td>
          <button class="btn btn-sm ${l.doingOT?'btn-amber':'btn-jade'}" onclick="togOT(${l.id})">
            ${l.doingOT?'✓ OT':'Mark OT'}
          </button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}
function setOTHours(id, val){
  const l = S.lab.find(x=>x.id===id);
  if(!l) return;
  l.otHours = parseFloat(val)||0;
  if(l.otHours > 0) l.doingOT = true;
  else l.doingOT = false;
  persist();
  renderOTTab();
  updAttMet();
}
function togAtt(id){const l=S.lab.find(l=>l.id===id);l.present^=1;if(!l.present){l.doingOT=false;l.otHours=0;}persist();renderAtt();if(typeof pushAttendanceLive==="function")pushAttendanceLive();}
function togOT(id){
  const l=S.lab.find(l=>l.id===id);
  if(!l) return;
  l.doingOT^=1;
  if(!l.doingOT) l.otHours=0;
  persist();
  renderOTTab();
  updAttMet();
}
function markAll(v){S.lab.forEach(l=>{l.present=!!v;if(!v){l.doingOT=false;l.otHours=0;}});persist();renderAtt();if(typeof pushAttendanceLive==="function")pushAttendanceLive();}
function updAttMet(){
  const p=S.lab.filter(l=>l.present);
  const bw=p.reduce((a,l)=>a+l.wage,0);
  const ot=p.reduce((a,l)=>a+calcOT(l),0);
  document.getElementById('a-tot').textContent=S.lab.length;
  document.getElementById('a-pres').textContent=p.length;
  document.getElementById('a-abs').textContent=S.lab.length-p.length;
  document.getElementById('a-wage').textContent=fmt(bw);
  document.getElementById('a-ot').textContent=fmt(ot);
  document.getElementById('a-total-lab').textContent=fmt(bw+ot);
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
  switchAttTab,
  renderAtt,
  renderOTTab,
  setOTHours,
  togAtt,
  togOT,
  markAll,
  updAttMet,
});

// State the rest of the app reads. Re-published on each change by the
// functions above; mirrored here so the initial value is visible too.
window.activeAttTab = activeAttTab;
