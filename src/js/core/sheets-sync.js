// ==================================================================
//  CORE / SHEETS SYNC — Google Sheets backup over JSONP
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

function sendGet(url, params){
  const fullUrl = url + '?' + params;
  // Script tag is the ONLY method that works 100% cross-origin on ALL browsers
  // including Safari, Edge, Chrome, Firefox, and mobile — no CORS issues ever
  const s = document.createElement('script');
  s.src = fullUrl;
  s.onload = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  s.onerror = function(){ try{if(s.parentNode)s.parentNode.removeChild(s);}catch(e){} };
  document.head.appendChild(s);
}
function sendViaImage(url, payload){
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
function setSyncStatus(s,t){
  // Called during init before DOM may be ready — guard silently
  try{ updateSyncDot(s==='ok'?'ok':s==='err'?'err':'syncing'); }catch(e){}
}
function updateSyncStatus(){ S.sheetsUrl?setSyncStatus('ok','Connected'):setSyncStatus('','Not connected'); }

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, {
  sendGet,
  sendViaImage,
  setSyncStatus,
  updateSyncStatus,
});
