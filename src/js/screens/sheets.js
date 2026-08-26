// ==================================================================
//  SCREEN / SHEETS — Google Sheets backup connection
//
//  Markup: src/js/templates/screens/sheets.js
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

import { APPS_SCRIPT_CODE } from '../core/config.js';
import { todayStr } from '../core/format.js';
import { fbEnabled } from '../core/session.js';
import { S } from '../core/state.js';
import { sendGet, setSyncStatus, updateSyncStatus } from '../core/sheets-sync.js';
import { persist, pushToFirebase, runDailyBackup } from '../core/sync.js';

export function renderSheets(){
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
export function saveUrl(){S.sheetsUrl=document.getElementById('sheets-url').value.trim();persist();updateSyncStatus();}
export function testConnection(){
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
export function copyScript(){
  const ta=document.getElementById('apps-script-code');ta.select();document.execCommand('copy');
  const c=document.getElementById('copy-confirm');c.style.display='inline';
  setTimeout(()=>c.style.display='none',2000);
}


// Small wrappers so the markup carries no expressions of its own.
export function selectAllIn(ev){ if (ev && ev.target && ev.target.select) ev.target.select(); }
export async function backupNow(){ await runDailyBackup(); alert('✓ Backup saved'); }
export async function forceSync(){ await pushToFirebase(); alert('✓ Synced'); }

