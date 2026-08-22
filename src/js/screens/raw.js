// ==================================================================
//  SCREEN / RAW — Issuing raw materials to a stage
//
//  Markup: src/js/templates/screens/raw.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { sessionProduction } from '../core/calc.js';
import { fmt, fmtN, spBadge } from '../core/format.js';
import { S, uid } from '../core/state.js';

function renderRaw(){
  const ms=document.getElementById('raw-mat');ms.innerHTML='<option value="">— select —</option>'+S.rm.map(r=>`<option value="${r.id}" data-price="${r.price}" data-unit="${r.unit}">${r.name} (${r.unit})</option>`).join('');
  renderRawLog();renderRawPnL();
}
function rawFill(){const ms=document.getElementById('raw-mat');const opt=ms.options[ms.selectedIndex];if(!opt||!opt.value)return;const price=parseFloat(opt.dataset.price)||0;const unit=opt.dataset.unit||'';const qty=parseFloat(document.getElementById('raw-qty').value)||1;document.getElementById('raw-cost').value=Math.round(price*qty);document.getElementById('raw-hint').textContent=`₹${fmtN(price)}/${unit}`;}
function issueRaw(){const stg=document.getElementById('raw-stg').value;const ms=document.getElementById('raw-mat');const opt=ms.options[ms.selectedIndex];if(!opt||!opt.value){alert('Select a material.');return;}const rm=S.rm.find(r=>r.id===parseInt(opt.value));const qty=parseFloat(document.getElementById('raw-qty').value)||0;const cost=parseFloat(document.getElementById('raw-cost').value)||0;if(!qty||!cost){alert('Enter quantity.');return;}S.rawLog.push({id:uid(),stage:stg,name:rm.name,unit:rm.unit,qty,unitPrice:rm.price,cost});document.getElementById('raw-qty').value='';document.getElementById('raw-cost').value='';persist();renderRawLog();renderRawPnL();}
function delRaw(id){S.rawLog=S.rawLog.filter(r=>r.id!==id);persist();renderRawLog();renderRawPnL();}
function renderRawLog(){const el=document.getElementById('raw-log');if(!S.rawLog.length){el.innerHTML='<div style="color:#6B7280;font-size:12px">Nothing issued yet.</div>';return;}el.innerHTML=`<table class="tbl"><thead><tr><th>Stage</th><th>Material</th><th class="num">Qty</th><th class="num">₹/unit</th><th class="num">Total</th><th></th></tr></thead><tbody>${S.rawLog.map(r=>`<tr><td>${spBadge(r.stage)}</td><td style="font-weight:500;color:#111827">${r.name}</td><td class="num">${r.qty} ${r.unit}</td><td class="num">${fmtN(r.unitPrice)}</td><td class="num">${fmtN(r.cost)}</td><td><button class="btn btn-ember btn-xs" onclick="delRaw(${r.id})">✕</button></td></tr>`).join('')}</tbody></table>`;}
function renderRawPnL(){const t=S.rawLog.reduce((a,r)=>a+r.cost,0);const g=S.sessions.reduce((a,ss)=>a+sessionProduction(ss).reduce((b,p)=>b+(p.value||0),0),0);const profit=g-t;document.getElementById('raw-pnl').innerHTML=`<div class="mrow"><div class="met m-blue"><div class="ml">All Goods</div><div class="mv w">${fmt(g)}</div></div><div class="met m-red"><div class="ml">RM Cost</div><div class="mv r">${fmt(t)}</div></div><div class="met ${profit>=0?'m-green':'m-red'}"><div class="ml">RM Supervisor Net</div><div class="mv ${profit>=0?'g':'r'}">${fmt(profit)}</div></div></div>`;}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, {
  renderRaw,
  rawFill,
  issueRaw,
  delRaw,
  renderRawLog,
  renderRawPnL,
});
