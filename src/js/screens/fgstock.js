// ==================================================================
//  SCREEN / FGSTOCK — Finished goods by stage, transfers and adjustments
//
//  Markup: src/js/templates/screens/fgstock.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

// ── screen state ──
let activeFGStage = 'all';

function initFGStock(){
  if(!S.fgStock) S.fgStock={};
  if(!S.fgTransfers) S.fgTransfers=[];
  if(!S.fgAdjustments) S.fgAdjustments=[];
  persist();
}
function switchFGStage(stage){
  activeFGStage=stage;
  document.querySelectorAll('#fg-stage-tabs .tab').forEach(t=>{
    const s=t.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    t.classList.toggle('active',s===stage);
  });
  renderFGStock();
}
function renderFGStock(){
  initFGStock();
  // Collect all products that have any stock across any stage
  const allProducts=new Set();
  S.fg.forEach(f=>allProducts.add(f.name));
  // Also from production logs
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>allProducts.add(p.name))));
  S.ledger.forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>allProducts.add(p.name)))));

  const stagesToShow=activeFGStage==='all'?FG_STAGES:[activeFGStage];
  const stageColors={Moulding:'#EFF6FF|#1D4ED8|#BFDBFE',Finishing:'#FFFBEB|#B45309|#FDE68A',Painting:'#ECFDF5|#065F46|#A7F3D0',Packing:'#FAF5FF|#6B21A8|#E9D5FF'};

  let html2='';
  stagesToShow.forEach(stage=>{
    const [bg,color,border]=stageColors[stage].split('|');
    // Products with stock at this stage
    const stageProds=[...allProducts].map(name=>({name,qty:getFGBalance(name,stage)})).filter(p=>p.qty>0);
    const totalQty=stageProds.reduce((a,p)=>a+p.qty,0);
    const totalVal=stageProds.reduce((a,p)=>{
      // For colour variants like "Garden Pot L — Orange", look up base name
      const baseName = p.name.includes(' — ') ? p.name.split(' — ')[0] : p.name;
      const fg=S.fg.find(f=>f.name===p.name)||S.fg.find(f=>f.name===baseName);
      return a+(fg?p.qty*fg.price:0);
    },0);

    html2+=`<div class="card" style="border-left:3px solid ${border};margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="background:${bg};color:${color};border:1px solid ${border};padding:4px 12px;border-radius:20px;font-family:var(--mono);font-size:10px;font-weight:700">${stage.toUpperCase()}</span>
          <span style="font-size:12px;color:#6B7280">${stageProds.length} products · ${totalQty} units</span>
        </div>
        <div style="font-family:var(--mono);font-size:14px;font-weight:700;color:#065F46">${fmt(totalVal)}</div>
      </div>
      ${stageProds.length?`<table class="tbl"><thead><tr>
        <th>Product</th><th class="num">Qty in ${stage}</th><th class="num">Selling ₹/unit</th><th class="num">Stock Value ₹</th>
        <th>Action</th>
      </tr></thead><tbody>
      ${stageProds.map(p=>{
        const fg=S.fg.find(f=>f.name===p.name);
        const val=fg?p.qty*fg.price:0;
        const nextStage=FG_STAGES[FG_STAGES.indexOf(stage)+1]||'Dispatch';
        return`<tr>
          <td style="font-weight:500;color:#111827">${p.name}</td>
          <td class="num" style="font-weight:700;font-size:14px;color:#111827">${p.qty}</td>
          <td class="num">${fg?fmtN(fg.price):'—'}</td>
          <td class="num">${fmtN(val)}</td>
          <td style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn btn-sm" style="background:${bg};color:${color};border-color:${border};font-size:11px" onclick="quickTransfer('${stage}','${nextStage}','${p.name}',${p.qty})">→ ${nextStage}</button>
            ${stage==='Packing'?`<button class="btn btn-sm btn-jade" onclick="openAssignModal('${p.name}',${p.qty},'fgstock')">📋 Assign to Order</button>`:''}
          </td>
        </tr>`;
      }).join('')}
      </tbody></table>`:'<div style="color:#9CA3AF;font-size:12px;padding:8px 0">No stock at this stage yet.</div>'}
    </div>`;
  });

  document.getElementById('fg-stock-content').innerHTML=html2||'<div style="color:#9CA3AF;font-size:12px">No finished goods stock yet.</div>';

  // History
  const allMoves=[];
  (S.fgTransfers||[]).forEach(t=>allMoves.push({date:t.date,type:'Transfer',from:t.from,to:t.to,product:t.product,qty:t.qty,note:t.note||''}));
  (S.fgAdjustments||[]).forEach(a=>allMoves.push({date:a.date,type:'Adjustment',from:a.stage,to:'—',product:a.product,qty:a.qty,note:a.note||''}));
  allMoves.sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById('fg-history').innerHTML=allMoves.length?`
    <table class="tbl"><thead><tr>
      <th>Date</th><th>Type</th><th>Product</th><th class="num">Qty</th><th>From</th><th>To</th><th>Note</th>
    </tr></thead><tbody>
    ${allMoves.slice(0,50).map(m=>`<tr>
      <td style="font-family:var(--mono);font-size:11px;color:#6B7280">${m.date}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${m.type==='Transfer'?'#EFF6FF':'#FFFBEB'};color:${m.type==='Transfer'?'#1D4ED8':'#B45309'}">${m.type}</span></td>
      <td style="font-weight:500;color:#111827">${m.product}</td>
      <td class="num" style="font-weight:600">${m.qty}</td>
      <td>${m.from?`<span class="sp sp${FG_STAGES.indexOf(m.from)}">${m.from}</span>`:'—'}</td>
      <td>${m.to&&m.to!=='—'?`<span class="sp sp${FG_STAGES.indexOf(m.to)}">${m.to}</span>`:m.to||'—'}</td>
      <td style="font-size:11px;color:#6B7280">${m.note||'—'}${m.auto?'<span style="font-family:var(--mono);font-size:9px;background:#EFF6FF;color:#1D4ED8;padding:1px 5px;border-radius:10px;margin-left:4px">AUTO</span>':''}</td>
    </tr>`).join('')}
    </tbody></table>`
  :'<div style="color:#9CA3AF;font-size:12px">No transfers recorded yet.</div>';
}
function quickTransfer(from, to, product, maxQty){
  const qty=parseInt(prompt(`Transfer "${product}" from ${from} to ${to}
Available: ${maxQty} units
Enter quantity to transfer:`));
  if(!qty||isNaN(qty)||qty<=0) return;
  if(qty>maxQty){alert(`Only ${maxQty} units available in ${from}.`);return;}
  S.fgTransfers.push({id:uid(),date:todayStr(),from,to,product,qty,note:'Quick transfer'});
  persist();renderFGStock();
  alert(`✓ ${qty} × ${product} moved from ${from} to ${to}`);
}
function openFGTransfer(){
  initFGStock();
  const sel=document.getElementById('fgt-prod');
  sel.innerHTML=S.fg.map(f=>`<option value="${f.name}">${f.name}</option>`).join('');
  document.getElementById('fgt-date').value=todayStr();
  document.getElementById('fg-transfer-form').style.display='block';
  document.getElementById('fg-transfer-form').scrollIntoView({behavior:'smooth'});
}
function closeFGTransfer(){document.getElementById('fg-transfer-form').style.display='none';}
function updateFGTransferTo(){
  const from=document.getElementById('fgt-from').value;
  const toSel=document.getElementById('fgt-to');
  const idx=FG_STAGES.indexOf(from);
  toSel.innerHTML=FG_STAGES.slice(idx+1).map(s=>`<option value="${s}">${s}</option>`).join('')+'<option value="Dispatch">Dispatch (Sold)</option>';
}
function saveFGTransfer(){
  initFGStock();
  const from=document.getElementById('fgt-from').value;
  const to=document.getElementById('fgt-to').value;
  const prod=document.getElementById('fgt-prod').value;
  const qty=parseInt(document.getElementById('fgt-qty').value)||0;
  const date=document.getElementById('fgt-date').value||todayStr();
  const note=document.getElementById('fgt-note').value.trim();
  if(!prod||!qty){alert('Select product and enter quantity.');return;}
  const available=getFGBalance(prod,from);
  if(qty>available){alert(`Only ${available} units of "${prod}" available in ${from}.`);return;}
  S.fgTransfers.push({id:uid(),date,from,to,product:prod,qty,note});
  persist();closeFGTransfer();renderFGStock();
  alert(`✓ ${qty} × ${prod} transferred: ${from} → ${to}`);
}
function openFGAdjust(){
  initFGStock();
  const sel=document.getElementById('fga-prod');
  sel.innerHTML=S.fg.map(f=>`<option value="${f.name}">${f.name}</option>`).join('');
  document.getElementById('fg-adjust-form').style.display='block';
}
function closeFGAdjust(){document.getElementById('fg-adjust-form').style.display='none';}
function saveFGAdjust(){
  initFGStock();
  const stage=document.getElementById('fga-stage').value;
  const prod=document.getElementById('fga-prod').value;
  const qty=parseFloat(document.getElementById('fga-qty').value)||0;
  const note=document.getElementById('fga-note').value.trim();
  if(!prod||!qty){alert('Select product and enter quantity.');return;}
  S.fgAdjustments.push({id:uid(),date:todayStr(),stage,product:prod,qty,note});
  persist();closeFGAdjust();renderFGStock();
  alert(`✓ Adjustment saved: ${prod} ${qty>0?'+':''}${qty} at ${stage}`);
}
function getAllFGProducts(){
  const all=new Set();
  S.fg.forEach(f=>all.add(f.name));
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>all.add(p.name))));
  S.ledger.forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>all.add(p.name)))));
  (S.fgTransfers||[]).forEach(t=>{all.add(t.product);});
  return [...all].sort();
}

// ── bridge (delete once every caller imports instead) ──
Object.assign(window, {
  initFGStock,
  switchFGStage,
  renderFGStock,
  quickTransfer,
  openFGTransfer,
  closeFGTransfer,
  updateFGTransferTo,
  saveFGTransfer,
  openFGAdjust,
  closeFGAdjust,
  saveFGAdjust,
  getAllFGProducts,
});

// State the rest of the app reads. Re-published on each change by the
// functions above; mirrored here so the initial value is visible too.
window.activeFGStage = activeFGStage;
