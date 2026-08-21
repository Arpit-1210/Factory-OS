// ==================================================================
//  SCREEN / SHEETS — Google Sheets backup connection
//
//  Markup: src/js/templates/screens/sheets.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

function renderSheets(){
  const urlEl=document.getElementById('sheets-url');
  if(urlEl) urlEl.value=S.sheetsUrl||'';
  const codeEl=document.getElementById('apps-script-code');
  if(codeEl) codeEl.value=APPS_SCRIPT_CODE;
  updateSyncStatus();
  const badge=document.getElementById('fb-status-badge');
  if(badge){
    if(fbEnabled){badge.textContent='✓ Connected';badge.style.background='var(--jade-l)';badge.style.color='var(--jade)';badge.style.borderColor='var(--jade-b)';}
    else{badge.textContent='Not connected';badge.style.background='var(--surface2)';badge.style.color='var(--text4)';}
  }
}
function saveUrl(){S.sheetsUrl=document.getElementById('sheets-url').value.trim();persist();updateSyncStatus();}
function testConnection(){
  const url=S.sheetsUrl;
  if(!url){document.getElementById('conn-result').innerHTML=`<div class="wbox">Paste Web App URL first.</div>`;return;}
  if(!url.includes('script.google.com/macros/s/')){document.getElementById('conn-result').innerHTML=`<div class="wbox">⚠ Wrong URL — must contain script.google.com/macros/s/</div>`;return;}
  setSyncStatus('syncing','Sending...');
  document.getElementById('conn-result').innerHTML=`<div class="ibox">⏳ Sending test row...</div>`;
  // Send a tiny test summary — guaranteed to fit in URL
  const testSummary = {action:'summary',date:'TEST-'+todayStr(),workers:1,goods:999,labour:111,ot:0,rm:222,net:666,margin:66};
  sendGet(url, 'action=summary&payload='+encodeURIComponent(JSON.stringify(testSummary)));
  setSyncStatus('ok','Connected ✓');
  document.getElementById('conn-result').innerHTML=`<div class="gbox"><b>✓ Test sent!</b><br><br>Check your Google Sheet — look for a row with date <b>TEST-${todayStr()}</b> in the Daily Ledger tab.<br>If it appears → <b>fully connected!</b></div>`;
}
function copyScript(){
  const ta=document.getElementById('apps-script-code');ta.select();document.execCommand('copy');
  const c=document.getElementById('copy-confirm');c.style.display='inline';
  setTimeout(()=>c.style.display='none',2000);
}

// ── bridge (delete once every caller imports instead) ──
Object.assign(window, {
  renderSheets,
  saveUrl,
  testConnection,
  copyScript,
});
