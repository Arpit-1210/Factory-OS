// ==================================================================
//  SCREEN / RAW — Issuing raw materials to a stage
//
//  Markup: src/js/templates/screens/raw.js
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

import { sessionProduction } from '../core/calc.js';
import { fmt, fmtN, spBadge } from '../core/format.js';
import { S, uid } from '../core/state.js';
import { persist } from '../core/sync.js';

export function renderRaw(){
  const ms=document.getElementById('raw-mat');ms.innerHTML='<option value="">— select —</option>'+S.rm.map(r=>`<option value="${r.id}" data-price="${r.price}" data-unit="${r.unit}">${r.name} (${r.unit})</option>`).join('');
  renderRawLog();renderRawPnL();
}
export function rawFill(){const ms=document.getElementById('raw-mat');const opt=ms.options[ms.selectedIndex];if(!opt||!opt.value)return;const price=parseFloat(opt.dataset.price)||0;const unit=opt.dataset.unit||'';const qty=parseFloat(document.getElementById('raw-qty').value)||1;document.getElementById('raw-cost').value=Math.round(price*qty);document.getElementById('raw-hint').textContent=`₹${fmtN(price)}/${unit}`;}
export function issueRaw(){const stg=document.getElementById('raw-stg').value;const ms=document.getElementById('raw-mat');const opt=ms.options[ms.selectedIndex];if(!opt||!opt.value){alert('Select a material.');return;}const rm=S.rm.find(r=>r.id===parseInt(opt.value));const qty=parseFloat(document.getElementById('raw-qty').value)||0;const cost=parseFloat(document.getElementById('raw-cost').value)||0;if(!qty||!cost){alert('Enter quantity.');return;}S.rawLog.push({id:uid(),stage:stg,name:rm.name,unit:rm.unit,qty,unitPrice:rm.price,cost});document.getElementById('raw-qty').value='';document.getElementById('raw-cost').value='';persist();renderRawLog();renderRawPnL();}
export function delRaw(id){S.rawLog=S.rawLog.filter(r=>r.id!==id);persist();renderRawLog();renderRawPnL();}
export function renderRawLog(){const el=document.getElementById('raw-log');if(!S.rawLog.length){el.innerHTML='<div style="color:#6B7280;font-size:12px">Nothing issued yet.</div>';return;}el.innerHTML=`<table class="tbl"><thead><tr><th>Stage</th><th>Material</th><th class="num">Qty</th><th class="num">₹/unit</th><th class="num">Total</th><th></th></tr></thead><tbody>${S.rawLog.map(r=>`<tr><td>${spBadge(r.stage)}</td><td style="font-weight:500;color:#111827">${r.name}</td><td class="num">${r.qty} ${r.unit}</td><td class="num">${fmtN(r.unitPrice)}</td><td class="num">${fmtN(r.cost)}</td><td><button class="btn btn-ember btn-xs" data-click="delRaw" data-args="[${r.id}]">✕</button></td></tr>`).join('')}</tbody></table>`;}
export function renderRawPnL(){const t=S.rawLog.reduce((a,r)=>a+r.cost,0);const g=S.sessions.reduce((a,ss)=>a+sessionProduction(ss).reduce((b,p)=>b+(p.value||0),0),0);const profit=g-t;document.getElementById('raw-pnl').innerHTML=`<div class="mrow"><div class="met m-blue"><div class="ml">All Goods</div><div class="mv w">${fmt(g)}</div></div><div class="met m-red"><div class="ml">RM Cost</div><div class="mv r">${fmt(t)}</div></div><div class="met ${profit>=0?'m-green':'m-red'}"><div class="ml">RM Supervisor Net</div><div class="mv ${profit>=0?'g':'r'}">${fmt(profit)}</div></div></div>`;}

