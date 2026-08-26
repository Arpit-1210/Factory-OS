// ==================================================================
//  SCREEN / SETUP — Catalogues: raw materials, products and workers
//
//  Markup: src/js/templates/screens/setup.js
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

import { fmtN } from '../core/format.js';
import { S, uid } from '../core/state.js';
import { persist } from '../core/sync.js';
import { downloadXLSX } from '../core/xlsx.js';

export function uploadRM(evt){ const f=evt.target.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'binary'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});let n=0;rows.forEach((row,i)=>{if(i===0||!row[0])return;S.rm.push({id:uid(),name:String(row[0]).trim(),unit:String(row[1]||'kg').trim(),price:parseFloat(row[2])||0});n++;});persist();document.getElementById('rm-st').innerHTML=`<div class="gbox">✓ Imported ${n} materials</div>`;renderSetup();}catch(e){document.getElementById('rm-st').innerHTML=`<div class="wbox">Error reading file</div>`;}};r.readAsBinaryString(f);}
export function uploadLab(evt){ const f=evt.target.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'binary'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});let n=0;rows.forEach((row,i)=>{if(i===0||!row[0])return;const isSup=String(row[3]||'').toLowerCase().includes('yes');S.lab.push({id:uid(),name:String(row[0]).trim(),role:String(row[1]||'Floor worker').trim(),wage:parseFloat(row[2])||0,isSup,present:false,doingOT:false,otHours:0});n++;});persist();document.getElementById('lab-st').innerHTML=`<div class="gbox">✓ Imported ${n} workers</div>`;renderSetup();}catch(e){document.getElementById('lab-st').innerHTML=`<div class="wbox">Error reading file</div>`;}};r.readAsBinaryString(f);}
export function dlSampleRM(){const ws=XLSX.utils.aoa_to_sheet([['Material Name','Unit','Price per Unit (Rs)'],['FRP Resin','kg',220],['Hardener','kg',180],['Gelcoat','kg',310]]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Sheet1');downloadXLSX(wb,'sample_raw_materials.xlsx');}
// No OT column: overtime is paid per hour at (daily wage / 8) and entered
// on the Attendance screen each day, not stored per worker.
export function dlSampleLab(){const ws=XLSX.utils.aoa_to_sheet([['Name','Role','Daily Wage (Rs)','Supervisor? (Yes/No)'],['Ramesh Kumar','Floor worker',600,'No'],['Karan Patel','Supervisor',900,'Yes']]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Sheet1');downloadXLSX(wb,'sample_labour.xlsx');}
export function renderSetup(){
  const q=(document.getElementById('fg-search')?.value||'').toLowerCase();
  document.getElementById('tb-rm').innerHTML=S.rm.map((r,i)=>`<tr><td style="color:var(--fog)">${i+1}</td><td style="font-weight:500;color:#111827">${r.name}</td><td style="color:var(--dust)">${r.unit}</td><td class="num">${fmtN(r.price)}</td><td><button class="btn btn-ember btn-xs" data-click="delRM" data-args="[${r.id}]">✕</button></td></tr>`).join('');
  document.getElementById('tb-fg').innerHTML=S.fg.filter(f=>!q||f.name.toLowerCase().includes(q)).map((f,i)=>`<tr><td style="color:var(--fog)">${i+1}</td><td style="font-weight:500;color:#111827">${f.name}</td><td class="num" style="color:var(--fog)">${f.id}</td><td class="num">${fmtN(f.price)}</td><td><button class="btn btn-ember btn-xs" data-click="delFG" data-args="[${f.id}]">✕</button></td></tr>`).join('');
  // The SUP badge is a BUTTON now, not a static label.
  //
  // `isSup` decides who appears on the Start Production screen
  // (production.js filters `l.isSup && l.present`), and it is stored in
  // workers.is_supervisor. If that column is false for the real supervisors —
  // a hand-seeded table, an import, or a pull that read the schema default —
  // Start Production is empty no matter how many people are marked present,
  // and the owner's next push writes the wrong value straight back. There was
  // no way to correct it in the app at all: `isSup` could only be set when a
  // worker was first added, so the only route was delete-and-re-add, which
  // takes that worker's attendance history with it.
  document.getElementById('tb-lab').innerHTML=S.lab.map((l,i)=>`<tr><td style="color:var(--fog)">${i+1}</td><td style="font-weight:500;color:#111827">${l.name}</td><td style="color:var(--dust)">${l.role}</td><td class="num">${fmtN(l.wage)}</td><td class="num">${l.otHours?l.otHours+'h':'—'}</td><td><button class="btn btn-xs ${l.isSup?'btn-jade':''}" data-click="togLabSup" data-args="[${l.id}]" title="${l.isSup?'Supervisor — tap to remove':'Tap to make supervisor'}">${l.isSup?'SUP':'—'}</button></td><td><button class="btn btn-ember btn-xs" data-click="delLab" data-args="[${l.id}]">✕</button></td></tr>`).join('');
}
export function addRM(){const n=document.getElementById('rm-n').value.trim();const u=document.getElementById('rm-u').value;const p=parseFloat(document.getElementById('rm-p').value)||0;if(!n||!p){alert('Enter name and price.');return;}S.rm.push({id:uid(),name:n,unit:u,price:p});document.getElementById('rm-n').value='';document.getElementById('rm-p').value='';persist();renderSetup();}
export function delRM(id){S.rm=S.rm.filter(r=>r.id!==id);persist();renderSetup();}
export function addFG(){const n=document.getElementById('fg-n').value.trim();const p=parseFloat(document.getElementById('fg-p').value)||0;if(!n||!p){alert('Enter product name and price.');return;}S.fg.push({id:uid(),name:n,price:p});document.getElementById('fg-n').value='';document.getElementById('fg-p').value='';persist();renderSetup();}
export function delFG(id){S.fg=S.fg.filter(f=>f.id!==id);persist();renderSetup();}
export function addLab(){const n=document.getElementById('lab-n').value.trim();const r=document.getElementById('lab-r').value;const w=parseFloat(document.getElementById('lab-w').value)||0;const ot=parseFloat(document.getElementById('lab-ot').value)||0;const s=document.getElementById('lab-s').value==='1';if(!n||!w){alert('Enter name and wage.');return;}S.lab.push({id:uid(),name:n,role:r,wage:w,isSup:s,present:false,doingOT:false,otHours:0});document.getElementById('lab-n').value='';document.getElementById('lab-w').value='';document.getElementById('lab-ot').value='';persist();renderSetup();}
export function delLab(id){S.lab=S.lab.filter(l=>l.id!==id);persist();renderSetup();}
/** Promote or demote a worker to supervisor. Owner-only screen. */
export function togLabSup(id){
  const l=S.lab.find(x=>x.id===id);
  if(!l) return;
  l.isSup=!l.isSup;
  persist();
  renderSetup();
}


// The visible buttons proxy to hidden <input type=file> elements.
export function pickRMFile(){ const el = document.getElementById('f-rm'); if (el) el.click(); }
export function pickLabFile(){ const el = document.getElementById('f-lab'); if (el) el.click(); }

