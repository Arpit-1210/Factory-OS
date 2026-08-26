// ==================================================================
//  COMPONENT / SIDEBAR — Role-aware navigation menu
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

