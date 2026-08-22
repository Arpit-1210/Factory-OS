// ==================================================================
//  SCREEN / BOM — Bill of materials per product
//
//  Markup: src/js/templates/screens/bom.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { S } from '../core/state.js';
import { argsAttr } from '../core/format.js';
import { persist } from '../core/sync.js';

// ── screen state ──
let bomEditProduct = null;
let bomRMRows = [];

export function renderBOM(){
  if(!S.bom) S.bom={};
  const el = document.getElementById('bom-list');
  if(!el) return;
  const keys = Object.keys(S.bom);
  el.innerHTML = keys.length ? `<div class="tw"><table class="tbl">
    <thead><tr><th>Product</th><th>Raw Materials</th><th>Auto Deduct</th><th>Action</th></tr></thead>
    <tbody>${keys.map(prod=>{
      const mats = S.bom[prod]||[];
      return`<tr>
        <td style="font-weight:600">${prod}</td>
        <td style="font-size:11px;color:var(--text3)">${mats.map(m=>`${m.qty} ${m.unit} ${m.name}`).join(' + ')||'—'}</td>
        <td><span class="badge b-jade">Auto ✓</span></td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-sm btn-blue" data-click="editBOM" ${argsAttr(prod)}>✏️ Edit</button>
          <button class="btn btn-sm btn-ember" data-click="deleteBOM" ${argsAttr(prod)}>✕</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`
  : '<div class="wbox">No BOM defined yet. Click + Add Product BOM to start.</div>';
}
export function addBOMRow(){
  bomEditProduct=null; bomRMRows=[];
  document.getElementById('bom-prod-search').value='';
  document.getElementById('bom-form-title').textContent='Add Product BOM';
  renderBOMRMRows();
  document.getElementById('bom-form-wrap').style.display='block';
  document.getElementById('bom-form-wrap').scrollIntoView({behavior:'smooth'});
}
export function editBOM(prod){
  bomEditProduct=prod;
  bomRMRows=(S.bom[prod]||[]).map(m=>({...m}));
  document.getElementById('bom-prod-search').value=prod;
  document.getElementById('bom-form-title').textContent='Edit BOM: '+prod;
  renderBOMRMRows();
  document.getElementById('bom-form-wrap').style.display='block';
  document.getElementById('bom-form-wrap').scrollIntoView({behavior:'smooth'});
}
export function deleteBOM(prod){ if(confirm('Delete BOM for '+prod+'?')){delete S.bom[prod];persist();renderBOM();} }
export function closeBOMForm(){ document.getElementById('bom-form-wrap').style.display='none'; }
export function filterBOMProducts(){
  const q=document.getElementById('bom-prod-search').value.trim().toLowerCase();
  const dd=document.getElementById('bom-prod-dropdown');
  if(!q){dd.style.display='none';return;}
  const matches=S.fg.filter(p=>p.name.toLowerCase().includes(q)).slice(0,15);
  if(!matches.length){dd.style.display='none';return;}
  dd.innerHTML=matches.map(p=>`<div data-click="selectBOMProd" ${argsAttr(p.name)} style="padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border)" class="dd-row">${p.name}</div>`).join('');
  dd.style.display='block';
}
export function selectBOMProd(name){
  document.getElementById('bom-prod-search').value=name;
  document.getElementById('bom-prod-dropdown').style.display='none';
}
export function addBOMRM(){
  bomRMRows.push({name:'',qty:0,unit:'kg'});
  renderBOMRMRows();
}
export function renderBOMRMRows(){
  document.getElementById('bom-rm-rows').innerHTML = bomRMRows.map((r,i)=>`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <select data-change="setBOMRowMaterial" data-args="[${i}]" style="flex:2;padding:7px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text);font-size:12px">
        <option value="">Select RM</option>
        ${S.rm.map(m=>`<option value="${m.name}" ${r.name===m.name?'selected':''}>${m.name} (${m.unit})</option>`).join('')}
      </select>
      <input type="number" value="${r.qty}" min="0" step="0.01" placeholder="Qty" data-change="setBOMRowQty" data-args="[${i}]" style="width:80px;padding:7px 10px;border:1.5px solid var(--border);border-radius:var(--r);background:var(--surface2);color:var(--text);font-size:12px">
      <span style="font-family:var(--mono);font-size:11px;color:var(--text4);min-width:30px">${r.unit||'kg'}</span>
      <button class="btn btn-sm btn-ember" data-click="removeBOMRow" data-args="[${i}]">✕</button>
    </div>`).join('');
}
export function saveBOM(){
  const prod=document.getElementById('bom-prod-search').value.trim();
  if(!prod){alert('Select a product first.');return;}
  const valid=bomRMRows.filter(r=>r.name&&r.qty>0);
  if(!valid.length){alert('Add at least one RM with quantity.');return;}
  if(!S.bom) S.bom={};
  S.bom[prod]=valid;
  persist();
  closeBOMForm();
  renderBOM();
  alert(`✓ BOM saved for ${prod}. RM will now auto-deduct when this product is logged in production.`);
}


// BOM row edits. These were inline `bomRMRows[i].x = this.value` mutations;
// as named handlers they take the row index and read the value off the
// element the delegated listener fired for.
export function setBOMRowMaterial(i, ev){
  const name = ev && ev.target ? ev.target.value : '';
  bomRMRows[i].name = name;
  const mat = (S.rm || []).find(m => m.name === name);
  bomRMRows[i].unit = mat ? mat.unit : '';
  renderBOMRMRows();
}
export function setBOMRowQty(i, ev){
  bomRMRows[i].qty = parseFloat(ev && ev.target ? ev.target.value : 0) || 0;
}
export function removeBOMRow(i){
  bomRMRows.splice(i, 1);
  renderBOMRMRows();
}

