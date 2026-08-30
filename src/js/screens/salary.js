// ==================================================================
//  SCREEN / SALARY — Monthly payroll, advances and deductions
//
//  Markup: src/js/templates/screens/salary.js
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

import { computeSalaryMonth, otAmt } from '../core/calc.js';
import { fmt, fmtN, todayStr } from '../core/format.js';
import { S } from '../core/state.js';
import { sendGet } from '../core/sheets-sync.js';
import { persist } from '../core/sync.js';
import { checkXLSX, downloadXLSX } from '../core/xlsx.js';

// ── screen state ──
let salActiveLab = null;
let salActiveMonth = null;

export function renderSalary(){
  const monthEl = document.getElementById('sal-month');
  if(!monthEl) return;
  // Default to the month of the day being worked, not the calendar month.
  // #sal-month starts empty, so on a past-date login in a previous month this
  // opened on the wrong month: the open day's attendance was filtered out
  // (calc.js gates on the month) and days/gross read low. Write the default
  // back into the picker so the screen, saveSalAdj() and the export cannot
  // disagree about which month is showing.
  const month = monthEl.value || (S.workDate||todayStr()).slice(0,7);
  if(!monthEl.value) monthEl.value = month;
  salActiveMonth = month;

  const {rows, totals} = computeSalaryMonth(month);
  const totalGross=totals.gross, totalAdv=totals.adv,
        totalDed=totals.ded,     totalNet=totals.net;

  document.getElementById('sal-metrics').innerHTML=`
    <div class="met m-blue"><div class="ml">Total Workers</div><div class="mv w">${S.lab.length}</div></div>
    <div class="met m-green"><div class="ml">Total Gross</div><div class="mv g">${fmt(totalGross)}</div></div>
    <div class="met m-amber"><div class="ml">Total Advances</div><div class="mv a">${fmt(totalAdv)}</div></div>
    <div class="met m-red"><div class="ml">Total Deductions</div><div class="mv r">${fmt(totalDed)}</div></div>
    <div class="met m-green"><div class="ml">Net Payable</div><div class="mv g" style="font-size:20px">${fmt(totalNet)}</div></div>`;

  document.getElementById('sal-tbody').innerHTML = rows.map(({l,days,otHrs,otAmt,gross,adv,ded,net,i})=>`
    <tr>
      <td style="color:var(--text4);font-family:var(--mono)">${i+1}</td>
      <td style="font-weight:600">${l.name}</td>
      <td style="color:var(--text3);font-size:11px">${l.role}</td>
      <td class="num">₹${fmtN(l.wage)}</td>
      <td class="num">${days}</td>
      <td class="num">${otHrs?otHrs+'h':'—'}</td>
      <td class="num">${otAmt?fmt(otAmt):'—'}</td>
      <td class="num pv">${fmt(gross)}</td>
      <td class="num" style="color:var(--amber)">${adv?fmt(adv):'—'}</td>
      <td class="num lv">${ded?fmt(ded):'—'}</td>
      <td class="num pv" style="font-weight:700">${fmt(net)}</td>
      <td><button class="btn btn-sm" data-click="openSalModal" data-args="[${l.id}]">✏️</button></td>
    </tr>`).join('');

  document.getElementById('sal-tfoot').innerHTML=`
    <td colspan="7">TOTAL</td>
    <td class="num pv">${fmt(totalGross)}</td>
    <td class="num" style="color:var(--amber)">${fmt(totalAdv)}</td>
    <td class="num lv">${fmt(totalDed)}</td>
    <td class="num pv" style="font-weight:800;font-size:14px">${fmt(totalNet)}</td>
    <td></td>`;
}
export function openSalModal(labId){
  salActiveLab = labId;
  const l = S.lab.find(x=>x.id===labId);
  if(!l) return;
  const month = document.getElementById('sal-month').value||(S.workDate||todayStr()).slice(0,7);
  const adj = (S.salaryAdj[month]||{})[labId]||{};
  document.getElementById('sal-modal-name').textContent = l.name;
  document.getElementById('sal-advance').value = adj.advance||'';
  document.getElementById('sal-deduction').value = adj.deduction||'';
  document.getElementById('sal-note').value = adj.note||'';
  document.getElementById('sal-modal').style.display='flex';
}
export function closeSalModal(){ document.getElementById('sal-modal').style.display='none'; }
export function saveSalAdj(){
  const month = document.getElementById('sal-month').value||(S.workDate||todayStr()).slice(0,7);
  if(!S.salaryAdj) S.salaryAdj={};
  if(!S.salaryAdj[month]) S.salaryAdj[month]={};
  S.salaryAdj[month][salActiveLab]={
    advance: parseFloat(document.getElementById('sal-advance').value)||0,
    deduction: parseFloat(document.getElementById('sal-deduction').value)||0,
    note: document.getElementById('sal-note').value.trim()
  };
  persist();
  closeSalModal();
  renderSalary();
}
export function exportSalaryExcel(){
  if(!checkXLSX()) return;
  const month = (document.getElementById('sal-month')||document.getElementById('export-sal-month'))?.value||(S.workDate||todayStr()).slice(0,7);
  // Same computation the Salary screen uses — the two cannot diverge.
  const {rows} = computeSalaryMonth(month);

  const aoa=[['#','Worker','Role','Daily Wage','Days Present','OT Days','OT Hours','OT Amount','Gross Pay','Advance','Deduction','Net Pay','Note']];
  rows.forEach(r=>aoa.push([
    r.i+1, r.l.name, r.l.role, r.l.wage, r.days, r.otDay, r.otHrs,
    r.otAmt, r.gross, r.adv, r.ded, r.net, r.note
  ]));
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Salary '+month);
  downloadXLSX(wb,'Salary_'+month+'.xlsx');

  // Also sync to Google Sheets Monthly Salary tab
  if(S.sheetsUrl){
    const workers=rows.map(r=>({
      name:r.l.name, role:r.l.role, days:r.days, otDays:r.otDay,
      wage:r.l.wage, gross:r.gross, advance:r.adv, deduction:r.ded, net:r.net
    }));
    const payload={action:'monthlySalary',month,workers};
    sendGet(S.sheetsUrl,'action=monthlySalary&payload='+encodeURIComponent(JSON.stringify(payload)));
    alert('✓ Salary exported to Excel and synced to Google Sheets → Monthly Salary tab');
  }
}

