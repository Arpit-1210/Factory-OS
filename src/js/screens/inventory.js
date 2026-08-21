// ==================================================================
//  SCREEN / INVENTORY — Combined RM and FG position
//
//  Markup: src/js/templates/screens/inventory.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

function renderInventory(){
  initFGStock();
  if(!S.purchases) S.purchases=[];

  const today = S.workDate||todayStr();
  const el = document.getElementById('inv-date-label');
  if(el) el.textContent = 'All-time inventory — updated live · ' + new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  // ── SEARCH BOX ──
  const searchBox = document.getElementById('inv-search');
  const q = (searchBox ? searchBox.value : '').toLowerCase().trim();

  // ── RM BALANCE HELPER ──
  function getRMBalance(name){
    const s=S.stock.find(st=>st.name===name);
    const opening=s?s.opening:0;
    const purchased=(S.purchases||[]).filter(p=>p.name===name&&p.qty>0).reduce((a,p)=>a+p.qty,0);
    const wastage=(S.purchases||[]).filter(p=>p.name===name&&p.qty<0).reduce((a,p)=>a+p.qty,0);
    const usedHistory=S.ledger.reduce((a,day)=>a+(day.rawLog||[]).filter(r=>r.name===name).reduce((b,r)=>b+r.qty,0),0);
    const usedToday=S.rawLog.filter(r=>r.name===name).reduce((a,r)=>a+r.qty,0);
    return opening+purchased+wastage-usedHistory-usedToday;
  }

  // ── FG CUMULATIVE BALANCE (all time including all saved days) ──
  function getFGCumulative(productName, stage){
    return getFGBalance(productName, stage);
  }

  // ── HEALTH METRICS ──
  const rmItems = S.rm.map(r=>({name:r.name,unit:r.unit,bal:getRMBalance(r.name),reorder:(S.stock.find(st=>st.id===r.id)||{}).reorder||0}));
  const rmLow = rmItems.filter(r=>r.reorder>0&&r.bal<=r.reorder).length;
  const allProds = getAllFGProducts();
  const fgPipeline = ['Moulding','Finishing','Painting'].reduce((a,st)=>a+allProds.filter(p=>getFGCumulative(p,st)>0).length,0);
  const fgReady = allProds.filter(p=>getFGCumulative(p,'Packing')>0).length;
  const fgVal = allProds.reduce((a,p)=>{
    const fg=S.fg.find(f=>f.name===p)||S.fg.find(f=>f.name===(p.includes(' — ')?p.split(' — ')[0]:p));
    const qty=FG_STAGES.reduce((b,st)=>b+getFGCumulative(p,st),0);
    return a+(fg?qty*fg.price:0);
  },0);

  document.getElementById('inv-health').innerHTML=`
    <div class="met ${rmLow?'m-red':'m-green'}"><div class="ml">RM Low Alerts</div><div class="mv ${rmLow?'r':'g'}">${rmLow}</div></div>
    <div class="met m-blue"><div class="ml">FG in Pipeline</div><div class="mv b">${fgPipeline}</div></div>
    <div class="met m-green"><div class="ml">Ready to Dispatch</div><div class="mv g">${fgReady}</div></div>
    <div class="met m-amber"><div class="ml">Total FG Value</div><div class="mv a">${fmt(fgVal)}</div></div>`;

  // ── RM TABLE ──
  const rmFiltered = rmItems.filter(r=>!q||r.name.toLowerCase().includes(q));
  document.getElementById('inv-rm').innerHTML = rmFiltered.length ? `
    <table class="tbl"><thead><tr>
      <th>#</th><th>Material</th><th class="num">Balance</th><th class="num">Used Today</th>
      <th>Unit</th><th class="num">Reorder Level</th><th>Status</th>
    </tr></thead><tbody>
    ${rmFiltered.map((r,i)=>{
      const usedToday=S.rawLog.filter(rl=>rl.name===r.name).reduce((a,rl)=>a+rl.qty,0);
      return`<tr class="${r.reorder>0&&r.bal<=r.reorder?'tr-l':''}">
        <td style="color:var(--text4)">${i+1}</td>
        <td style="font-weight:500;color:var(--text)">${r.name}</td>
        <td class="num" style="font-weight:700;font-size:14px;color:${r.reorder>0&&r.bal<=r.reorder?'var(--ember)':'var(--jade)'}">${r.bal.toFixed(1)}</td>
        <td class="num" style="color:${usedToday?'var(--ember)':'var(--text4)'}">${usedToday?'-'+usedToday:'—'}</td>
        <td style="color:var(--text3)">${r.unit}</td>
        <td class="num" style="color:var(--text4)">${r.reorder||'—'}</td>
        <td><span class="badge ${r.reorder>0&&r.bal<=r.reorder?'b-ember':'b-jade'}">${r.reorder>0&&r.bal<=r.reorder?'🚨 REORDER':'✓ OK'}</span></td>
      </tr>`;
    }).join('')}
    </tbody></table>`
  : '<div style="color:var(--text4);font-size:12px">No RM data found.</div>';

  // ── STAGE TRANSITIONS (recent) ──
  const yesterday = new Date(today+'T00:00:00');
  yesterday.setDate(yesterday.getDate()-1);
  const yd = yesterday.toISOString().slice(0,10);
  const recentTransfers = (S.fgTransfers||[]).filter(t=>t.date===yd||t.date===today);

  if(!recentTransfers.length){
    document.getElementById('inv-transitions').innerHTML='<div style="color:var(--text4);font-size:12px">No stage transitions recorded yet. Use FG Stock → Transfer to record movements.</div>';
  } else {
    const groups={};
    recentTransfers.forEach(t=>{
      const key=t.from+'→'+t.to;
      if(!groups[key]){groups[key]={from:t.from,to:t.to,items:[]};}
      groups[key].items.push(t);
    });
    document.getElementById('inv-transitions').innerHTML=Object.values(groups).map(g=>`
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
          <span class="sp sp${FG_STAGES.indexOf(g.from)}">${g.from}</span>
          <span style="color:var(--text4);font-size:16px">→</span>
          <span class="sp sp${FG_STAGES.indexOf(g.to)}">${g.to}</span>
          <span style="font-size:11px;color:var(--text3)">${g.items.length} product${g.items.length!==1?'s':''} moved</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${g.items.map(t=>`<span style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:11px">
            <b style="color:var(--text)">${t.product}</b>
            <span style="color:var(--ember);font-family:var(--mono);font-weight:700"> −${t.qty}</span>
            <span style="color:var(--text4)"> from ${t.from}</span>
            <span style="color:var(--jade);font-family:var(--mono);font-weight:700"> +${t.qty}</span>
            <span style="color:var(--text4)"> to ${t.to}</span>
          </span>`).join('')}
        </div>
      </div>`).join('');
  }

  // ── CUMULATIVE FG TABLE (all time, with search) ──
  const prodsWithStock = allProds.filter(p=>{
    const hasStock = FG_STAGES.some(st=>getFGCumulative(p,st)>0);
    const matchesSearch = !q || p.toLowerCase().includes(q);
    return hasStock && matchesSearch;
  });

  // Total ever produced (all stages combined, all time)
  function getTotalEverProduced(productName){
    const today = S.sessions.reduce((a,ss)=>{
      return a+(ss.teams||[]).reduce((b,t)=>b+t.production.filter(p=>p.name===productName).reduce((c,p)=>c+p.qty,0),0);
    },0);
    const history = S.ledger.reduce((a,day)=>{
      return a+(day.sessions||[]).reduce((b,ss)=>b+(ss.teams||[]).reduce((c,t)=>c+t.production.filter(p=>p.name===productName).reduce((d,p)=>d+p.qty,0),0),0);
    },0);
    return today + history;
  }

  if(!prodsWithStock.length){
    document.getElementById('inv-fg').innerHTML = q
      ? `<div style="color:var(--text4);font-size:12px">No products matching "<b>${q}</b>" found in inventory.</div>`
      : '<div style="color:var(--text4);font-size:12px">No finished goods in stock yet. Production logged by supervisors will appear here.</div>';
  } else {
    document.getElementById('inv-fg').innerHTML=`
      <div style="overflow-x:auto">
      <table class="tbl" style="min-width:800px"><thead><tr>
        <th>Product</th>
        <th class="num" style="background:#EFF6FF;color:#1D4ED8">Moulding</th>
        <th class="num" style="background:#FFFBEB;color:#92400E">Finishing</th>
        <th class="num" style="background:#ECFDF5;color:#065F46">Painting</th>
        <th class="num" style="background:#F5F3FF;color:#5B21B6">Packing ✓</th>
        <th class="num">Total Stock</th>
        <th class="num">Ever Made</th>
        <th class="num">₹/unit</th>
        <th class="num">Stock Value</th>
        <th>Movements</th>
      </tr></thead><tbody>
      ${prodsWithStock.map(p=>{
        const qtys = FG_STAGES.map(st=>getFGCumulative(p,st));
        const total = qtys.reduce((a,q2)=>a+q2,0);
        const everMade = getTotalEverProduced(p);
        const baseName = p.includes(' — ')?p.split(' — ')[0]:p;
        const fg = S.fg.find(f=>f.name===p)||S.fg.find(f=>f.name===baseName);
        const val = fg?total*fg.price:0;
        // Recent transfers for this product
        const recentT = (S.fgTransfers||[]).filter(t=>(t.product===p||t.productIn===p)&&(t.date===today||t.date===yd));
        const transStr = recentT.map(t=>`<span style="font-size:9px;white-space:nowrap;display:inline-flex;align-items:center;gap:2px;background:var(--surface2);padding:2px 6px;border-radius:20px;margin:1px;border:1px solid var(--border)">
          <span style="color:var(--ember);font-weight:700">−${t.qty}</span>
          <span style="color:var(--text4)">${(t.from||'').slice(0,4)}</span>
          <span style="color:var(--text4)">→</span>
          <span style="color:var(--jade);font-weight:700">+${t.qty}</span>
          <span style="color:var(--text4)">${(t.to||'').slice(0,4)}</span>
        </span>`).join('');
        return`<tr>
          <td style="font-weight:500;color:var(--text)">${p}</td>
          ${qtys.map((q2,i)=>`<td class="num" style="font-weight:${q2>0?'700':'400'};color:${q2>0?'var(--text)':'#E5E7EB'}">${q2>0?q2:'—'}</td>`).join('')}
          <td class="num" style="font-weight:700;color:var(--text)">${total}</td>
          <td class="num" style="color:var(--text4);font-family:var(--mono)">${everMade}</td>
          <td class="num" style="color:var(--text3)">${fg?fmtN(fg.price):'—'}</td>
          <td class="num" style="color:var(--jade);font-weight:600">${val?fmtN(val):'—'}</td>
          <td style="min-width:100px">${transStr||'<span style="color:#E5E7EB;font-size:10px">—</span>'}</td>
        </tr>`;
      }).join('')}
      </tbody></table>
      <div style="font-family:var(--mono);font-size:10px;color:var(--text4);margin-top:10px;text-align:right">
        ${prodsWithStock.length} product${prodsWithStock.length!==1?'s':''} · Total value: ${fmt(prodsWithStock.reduce((a,p)=>{const qtys=FG_STAGES.map(st=>getFGCumulative(p,st));const total=qtys.reduce((b,q2)=>b+q2,0);const baseName=p.includes(' — ')?p.split(' — ')[0]:p;const fg=S.fg.find(f=>f.name===p)||S.fg.find(f=>f.name===baseName);return a+(fg?total*fg.price:0);},0))}
      </div>
      </div>`;
  }

  // Alerts
  const alerts=[];
  rmItems.filter(r=>r.reorder>0&&r.bal<=r.reorder).forEach(r=>alerts.push(`<div class="alert-banner danger">🚨 <b>${r.name}</b> — ${r.bal.toFixed(1)} ${r.unit} left (reorder: ${r.reorder})</div>`));
  const packingGoods = allProds.filter(p=>getFGCumulative(p,'Packing')>0);
  if(packingGoods.length) alerts.push(`<div class="alert-banner ok">✅ <b>${packingGoods.length} product${packingGoods.length!==1?'s':''}</b> ready in Packing — ready to dispatch</div>`);
  document.getElementById('inv-alerts').innerHTML=alerts.join('');
}

// ── bridge (delete once every caller imports instead) ──
Object.assign(window, {
  renderInventory,
});
