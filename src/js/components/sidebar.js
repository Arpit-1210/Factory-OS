// ==================================================================
//  COMPONENT / SIDEBAR — Role-aware navigation menu
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { ROLE_ACCESS } from '../core/config.js';
import { currentRole } from '../core/session.js';

// ── screen state ──
let _sidebarOpenTime = 0;

export function updateSidebarForRole(){
  if(!currentRole) return;
  const allowed=ROLE_ACCESS[currentRole]||[];
  // Show/hide section cards based on role
  const ownerSections=['sec-owner'];
  const supSections=['sec-supervisor'];
  const invSections=['sec-inventory'];
  const setSections=['sec-settings'];
  if(currentRole==='supervisor'){
    document.getElementById('sec-owner').style.display='none';
    document.getElementById('sec-inventory').style.display='none';
    document.getElementById('sec-settings').style.display='none';
    // Auto-open supervisor section
    openSection('sec-supervisor');
  } else if(currentRole==='rm'){
    document.getElementById('sec-owner').style.display='none';
    document.getElementById('sec-supervisor').style.display='none';
    document.getElementById('sec-settings').style.display='none';
    openSection('sec-inventory');
  } else {
    // Owner sees everything - open all sections
    openSection('sec-supervisor');
    openSection('sec-owner');
    openSection('sec-inventory');
    openSection('sec-settings');
  }
}
// ════ SIDEBAR ════
export function toggleSection(id){
  const el=document.getElementById(id);
  el.classList.toggle('open');
}
export function openSection(id){
  document.getElementById(id).classList.add('open');
}
export function openSidebar(){
  _sidebarOpenTime = Date.now();
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sb-overlay').style.display='block';
}
export function closeSidebar(){
  if(Date.now()-_sidebarOpenTime < 400) return;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').style.display='none';
}

