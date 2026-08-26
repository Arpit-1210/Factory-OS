// ==================================================================
//  CORE / SHEETS SYNC — Google Sheets backup over JSONP
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

import { S } from './state.js';
import { updateSyncDot } from './sync.js';

export function sendGet(url, params){
  const fullUrl = url + '?' + params;
  // Script tag is the ONLY method that works 100% cross-origin on ALL browsers
  // including Safari, Edge, Chrome, Firefox, and mobile — no CORS issues ever
  const s = document.createElement('script');
  s.src = fullUrl;
  s.onload = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  s.onerror = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  document.head.appendChild(s);
}
export function sendViaImage(url, payload){
  // Split into small chunks — each well under URL limit

  // Chunk 1: Summary row (always tiny)
  const summary = {
    action:'summary',
    date: payload.date,
    workers: payload.workersPresent,
    goods: payload.goodsValue,
    labour: payload.labourCost,
    ot: payload.overtimeCost||0,
    rm: payload.rmCost,
    net: payload.netProfit,
    margin: payload.margin||0
  };
  sendGet(url, 'action=summary&payload=' + encodeURIComponent(JSON.stringify(summary)));

  // Chunk 2: Production log (one request per item)
  (payload.productLog||[]).forEach(function(p, i){
    setTimeout(function(){
      const prod = {action:'prod', date:payload.date, sup:p.supName||'', stage:p.stage||'', name:p.name, qty:p.qty, uv:p.unitVal, val:p.value};
      sendGet(url, 'action=prod&payload=' + encodeURIComponent(JSON.stringify(prod)));
    }, i * 300);
  });

  // Chunk 3: Raw materials (one per item)
  (payload.rawLog||[]).forEach(function(r, i){
    setTimeout(function(){
      const rm = {action:'rm', date:payload.date, stage:r.stage, name:r.name, qty:r.qty, unit:r.unit, up:r.unitPrice, cost:r.cost};
      sendGet(url, 'action=rm&payload=' + encodeURIComponent(JSON.stringify(rm)));
    }, i * 300 + 500);
  });

  // Attendance: NOT synced daily — monthly salary export syncs to Sheets instead

  return Promise.resolve(true);
}
export function setSyncStatus(s,t){
  // Called during init before DOM may be ready — guard silently
  try{ updateSyncDot(s==='ok'?'ok':s==='err'?'err':'syncing'); }catch(e){}
}
export function updateSyncStatus(){ S.sheetsUrl?setSyncStatus('ok','Connected'):setSyncStatus('','Not connected'); }

