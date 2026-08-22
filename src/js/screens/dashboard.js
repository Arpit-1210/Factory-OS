// ==================================================================
//  SCREEN / DASHBOARD — Owner overview: metrics, task board, alerts
//
//  Markup: src/js/templates/screens/dashboard.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { calcOT, getFGBalance, isOverdue } from '../core/calc.js';
import { STAGES } from '../core/config.js';
import { fmt, todayStr } from '../core/format.js';
import { currentRole } from '../core/session.js';
import { S } from '../core/state.js';

// ── screen state ──
let activeDashTab = 'overview';

function switchDashTab(tab){
  activeDashTab = tab;
  ['overview','factory','money'].forEach(t=>{
    document.getElementById('dash-tab-'+t).style.display = t===tab?'block':'none';
    document.getElementById('dashtab-'+t).classList.toggle('active', t===tab);
  });
}
function renderDashboard(){
  if(!S||!S.lab) return;

  // Hide money tab for non-owners
  const moneyTab = document.getElementById('dashtab-money');
  if(moneyTab) moneyTab.style.display = currentRole==='owner'?'':'none';
  if(currentRole!=='owner' && activeDashTab==='money'){ activeDashTab='overview'; switchDashTab('overview'); }

  const present = S.lab.filter(l=>l.present);
  const activeTeams = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).length,0);
  const totalGoods = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  const totalUnits = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.qty,0),0),0);
  const totalRM = S.rawLog.reduce((a,r)=>a+r.cost,0);
  const bw = present.reduce((a,l)=>a+l.wage,0);
  const ot = present.reduce((a,l)=>a+calcOT(l),0);
  const totalLab = bw+ot;
  const net = totalGoods-totalLab-totalRM;
  const packingItems = getAllFGProducts ? getAllFGProducts().filter(p=>getFGBalance(p,'Packing')>0).length : 0;
  const activeOrders = S.orders.filter(o=>o.status!=='dispatched').length;
  const balanceDue = S.orders.filter(o=>o.status!=='dispatched').reduce((a,o)=>a+(o.amount-o.advance),0);
  const overdueOrds = S.orders.filter(o=>isOverdue(o));
  const inProd = S.orders.filter(o=>o.status==='production');
  const now = new Date();
  const monthEntries = S.ledger.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const monthProfit = monthEntries.reduce((a,e)=>a+e.netProfit,0);
  let rmLow=0;
  S.stock.forEach(st=>{
    if(st.reorder<=0)return;
    const purchased=(S.purchases||[]).filter(p=>p.name===st.name&&p.qty>0).reduce((a,p)=>a+p.qty,0);
    const usedH=S.ledger.reduce((a,d)=>a+(d.rawLog||[]).filter(r=>r.name===st.name).reduce((b,r)=>b+r.qty,0),0);
    const usedT=S.rawLog.filter(r=>r.name===st.name).reduce((a,r)=>a+r.qty,0);
    const bal=st.opening+purchased-usedH-usedT;
    if(bal<=st.reorder)rmLow++;
  });

  // ── ALERTS (always visible) ──
  let alerts='';
  if(overdueOrds.length) alerts+=`<div class="alert-banner danger">🚨 ${overdueOrds.length} order${overdueOrds.length>1?'s':''} overdue<span class="ab-action" onclick="go('orders')">View →</span></div>`;
  if(rmLow>0) alerts+=`<div class="alert-banner warn">📦 ${rmLow} RM material${rmLow>1?'s':''} low on stock<span class="ab-action" onclick="go('stock')">Reorder →</span></div>`;
  if(inProd.length) alerts+=`<div class="alert-banner ok">🏗️ ${inProd.length} order${inProd.length>1?'s':''} in production<span class="ab-action" onclick="go('orders')">View →</span></div>`;
  document.getElementById('dash-alerts').innerHTML=alerts?`<div class="alert-row">${alerts}</div>`:'';

  // ── TAB 1: OVERVIEW ──
  const overviewCards = currentRole==='owner' ? `
    <div class="dash-card c-jade" onclick="go('day')">
      <span class="dc-icon">🏭</span><div class="dc-label">Goods Value Today</div>
      <div class="dc-value green" style="font-size:20px">${fmt(totalGoods)}</div><div class="dc-sub">${totalUnits} units made</div>
    </div>
    <div class="dash-card c-amber" onclick="go('payments')">
      <span class="dc-icon">💸</span><div class="dc-label">Balance Due</div>
      <div class="dc-value amber" style="font-size:20px">${fmt(balanceDue)}</div><div class="dc-sub">${activeOrders} active orders</div>
    </div>
    <div class="dash-card c-blue" onclick="go('att')">
      <span class="dc-icon">👷</span><div class="dc-label">Workers Present</div>
      <div class="dc-value">${present.length}</div><div class="dc-sub">of ${S.lab.length} total</div>
    </div>
    <div class="dash-card c-purple" onclick="go('fgstock')">
      <span class="dc-icon">📦</span><div class="dc-label">Ready to Dispatch</div>
      <div class="dc-value ${packingItems>0?'green':''}">${packingItems}</div><div class="dc-sub">in packing stage</div>
    </div>
    <div class="dash-card c-blue" onclick="go('transfers')">
      <span class="dc-icon">🔄</span><div class="dc-label">Unit 2 Transfers</div>
      <div class="dc-value">${(S.unitTransfers||[]).filter(t=>t.date===todayStr()).length}</div><div class="dc-sub">today · ${(S.unitTransfers||[]).length} total</div>
    </div>` : `
    <div class="dash-card c-blue" onclick="go('att')">
      <span class="dc-icon">👷</span><div class="dc-label">Workers Present</div>
      <div class="dc-value">${present.length}</div><div class="dc-sub">of ${S.lab.length} total</div>
    </div>
    <div class="dash-card c-amber" onclick="go('sup')">
      <span class="dc-icon">🏗️</span><div class="dc-label">Active Teams</div>
      <div class="dc-value">${activeTeams}</div><div class="dc-sub">${S.sessions.length} supervisor${S.sessions.length!==1?'s':''}</div>
    </div>
    <div class="dash-card c-jade" onclick="go('day')">
      <span class="dc-icon">📦</span><div class="dc-label">Units Produced</div>
      <div class="dc-value">${totalUnits}</div><div class="dc-sub">today so far</div>
    </div>
    <div class="dash-card c-purple" onclick="go('fgstock')">
      <span class="dc-icon">✅</span><div class="dc-label">Ready to Dispatch</div>
      <div class="dc-value ${packingItems>0?'green':''}">${packingItems}</div><div class="dc-sub">in packing stage</div>
    </div>`;
  document.getElementById('dash-overview-cards').innerHTML=overviewCards;

  // ── TAB 2: FACTORY ──
  document.getElementById('dash-factory-cards').innerHTML=`
    <div class="dash-card c-amber" onclick="go('sup')">
      <span class="dc-icon">🏗️</span><div class="dc-label">Active Teams</div>
      <div class="dc-value">${activeTeams}</div><div class="dc-sub">${S.sessions.length} supervisor${S.sessions.length!==1?'s':''}</div>
    </div>
    <div class="dash-card c-blue" onclick="go('att')">
      <span class="dc-icon">👷</span><div class="dc-label">Present Today</div>
      <div class="dc-value">${present.length}</div><div class="dc-sub">Labour: ${fmt(totalLab)}</div>
    </div>
    <div class="dash-card c-jade" onclick="go('day')">
      <span class="dc-icon">📦</span><div class="dc-label">Units Produced</div>
      <div class="dc-value">${totalUnits}</div><div class="dc-sub">Value: ${fmt(totalGoods)}</div>
    </div>
    <div class="dash-card c-ember" onclick="go('stock')">
      <span class="dc-icon">🧪</span><div class="dc-label">RM Low Stock</div>
      <div class="dc-value ${rmLow>0?'red':''}">${rmLow}</div><div class="dc-sub">${rmLow>0?'needs reorder':'all OK'}</div>
    </div>
    <div class="dash-card c-purple" onclick="go('fgstock')">
      <span class="dc-icon">📦</span><div class="dc-label">In Packing</div>
      <div class="dc-value ${packingItems>0?'green':''}">${packingItems}</div><div class="dc-sub">ready to dispatch</div>
    </div>
    <div class="dash-card c-amber" onclick="go('raw')">
      <span class="dc-icon">🧪</span><div class="dc-label">RM Issued Today</div>
      <div class="dc-value">${S.rawLog.length}</div><div class="dc-sub">Cost: ${fmt(totalRM)}</div>
    </div>`;

  // Stage flow
  const stageUnits = {};
  STAGES.forEach(s=>{stageUnits[s]=0;});
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>{stageUnits[t.stage]=(stageUnits[t.stage]||0)+p.qty;})));
  document.getElementById('dash-teams').innerHTML = (() => {
    const allTeams = S.sessions.flatMap(ss=>(ss.teams||[]).map(t=>({...t,supName:ss.supName})));
    return allTeams.length ? allTeams.map(t=>{
      const gv=t.production.reduce((a,p)=>a+p.value,0);
      return`<div class="tp">
        <div class="tph">
          <div><span class="tpn">${t.supName}</span>&nbsp;<span class="sp sp${STAGES.indexOf(t.stage)}">${t.stage}</span></div>
          <span style="font-family:var(--mono);font-size:11px;color:var(--jade);font-weight:700">${fmt(gv)}</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:${t.production.length?'5px':'0'}">${t.team.map(m=>m.name).join(', ')||'No workers yet'}</div>
        ${t.production.length?`<div style="font-size:10px;color:var(--jade);font-family:var(--mono)">${t.production.map(p=>p.qty+'× '+p.name).join(' | ')}</div>`:''}
      </div>`;}).join('')
    : '<div style="color:var(--text4);font-size:12px;padding:8px 0">No active teams yet.</div>';
  })();
  document.getElementById('dash-stage-flow').innerHTML = STAGES.map(s=>{
    const u = stageUnits[s]||0;
    return`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px"><span class="sp sp${STAGES.indexOf(s)}">${s}</span></div>
      <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:${u>0?'var(--jade)':'var(--text4)'}">${u} units</div>
    </div>`;}).join('');

  // ── TAB 3: MONEY (Owner only) ──
  if(currentRole==='owner'){
    document.getElementById('dash-money-cards').innerHTML=`
      <div class="dash-card c-jade" onclick="go('day')">
        <span class="dc-icon">💰</span><div class="dc-label">Net Profit Today</div>
        <div class="dc-value ${net>=0?'green':'red'}" style="font-size:20px">${fmt(net)}</div>
        <div class="dc-sub">${totalGoods>0?Math.round(net/totalGoods*100)+'% margin':'no production'}</div>
      </div>
      <div class="dash-card c-blue" onclick="go('month')">
        <span class="dc-icon">📅</span><div class="dc-label">Month Profit</div>
        <div class="dc-value ${monthProfit>=0?'green':'red'}" style="font-size:20px">${fmt(monthProfit)}</div>
        <div class="dc-sub">${monthEntries.length} days this month</div>
      </div>
      <div class="dash-card c-jade" onclick="go('day')">
        <span class="dc-icon">🏭</span><div class="dc-label">Goods Value Today</div>
        <div class="dc-value green" style="font-size:20px">${fmt(totalGoods)}</div>
        <div class="dc-sub">${totalUnits} units</div>
      </div>
      <div class="dash-card c-ember" onclick="go('day')">
        <span class="dc-icon">💸</span><div class="dc-label">Total Cost Today</div>
        <div class="dc-value red" style="font-size:20px">${fmt(totalLab+totalRM)}</div>
        <div class="dc-sub">Labour + RM</div>
      </div>
      <div class="dash-card c-amber" onclick="go('payments')">
        <span class="dc-icon">💳</span><div class="dc-label">Balance Due</div>
        <div class="dc-value amber" style="font-size:20px">${fmt(balanceDue)}</div>
        <div class="dc-sub">${activeOrders} active orders</div>
      </div>
      <div class="dash-card c-blue" onclick="go('att')">
        <span class="dc-icon">👷</span><div class="dc-label">Labour Cost</div>
        <div class="dc-value" style="font-size:20px">${fmt(totalLab)}</div>
        <div class="dc-sub">${present.length} workers present</div>
      </div>`;

    // Recent orders
    const recent=S.orders.slice(0,6);
    document.getElementById('dash-recent-orders').innerHTML=recent.length
      ?recent.map(o=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);gap:8px">
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.customer}${isOverdue(o)?' 🚨':''}</div>
            <div style="font-size:10px;color:var(--text4);font-family:var(--mono)">${o.id} · ${o.status.toUpperCase()}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:12px;font-weight:700;color:var(--text);font-family:var(--mono)">${fmt(o.amount)}</div>
            <div style="font-size:10px;color:var(--ember);font-family:var(--mono)">Bal: ${fmt(o.amount-o.advance)}</div>
          </div>
        </div>`).join('')
      :'<div style="color:var(--text4);font-size:12px;padding:12px 0">No orders yet.</div>';

    // P&L breakdown
    document.getElementById('dash-pnl').innerHTML=`
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--jade-l);border:1px solid var(--jade-b);border-radius:var(--r)">
          <span style="font-size:12px;color:var(--jade)">🏭 Goods Value</span>
          <span style="font-family:var(--mono);font-weight:700;color:var(--jade)">${fmt(totalGoods)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--ember-l);border:1px solid var(--ember-b);border-radius:var(--r)">
          <span style="font-size:12px;color:var(--ember)">👷 Labour Cost</span>
          <span style="font-family:var(--mono);font-weight:700;color:var(--ember)">−${fmt(totalLab)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--ember-l);border:1px solid var(--ember-b);border-radius:var(--r)">
          <span style="font-size:12px;color:var(--ember)">🧪 RM Cost</span>
          <span style="font-family:var(--mono);font-weight:700;color:var(--ember)">−${fmt(totalRM)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:${net>=0?'var(--jade-l)':'var(--ember-l)'};border:1px solid ${net>=0?'var(--jade-b)':'var(--ember-b)'};border-radius:var(--r)">
          <span style="font-size:13px;font-weight:700;color:${net>=0?'var(--jade)':'var(--ember)'}">💰 Net Profit</span>
          <span style="font-family:var(--mono);font-size:16px;font-weight:800;color:${net>=0?'var(--jade)':'var(--ember)'}">${fmt(net)}</span>
        </div>
      </div>`;
  }

  renderTaskBoard();
}
function renderTaskBoard(){
  const el = document.getElementById('dash-task-list');
  if(!el) return;

  const activeOrders = (S.orders||[]).filter(o=>o.status==='pending'||o.status==='production'||o.status==='ready');
  if(!activeOrders.length){
    el.innerHTML='<div style="color:var(--text4);font-size:12px;padding:8px 0">No active orders. Create an order to see tasks here.</div>';
    return;
  }

  // Only count Packing stage production
  const producedToday = {};
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>{
    if(t.stage!=='Packing') return;
    t.production.forEach(p=>{
      const key=(p.baseName||p.name).toLowerCase().trim();
      producedToday[key]=(producedToday[key]||0)+p.qty;
    });
  }));
  S.ledger.forEach(day=>(day.sessions||[]).forEach(ss=>(ss.teams||[]).forEach(t=>{
    if(t.stage!=='Packing') return;
    (t.production||[]).forEach(p=>{
      const key=(p.baseName||p.name).toLowerCase().trim();
      producedToday[key]=(producedToday[key]||0)+p.qty;
    });
  })));
  // Also include existing Packing FG stock
  const packingStock = (S.fgStock&&S.fgStock['Packing'])||{};
  Object.keys(packingStock).forEach(name=>{
    const key=name.toLowerCase().trim();
    producedToday[key]=(producedToday[key]||0)+(packingStock[name]||0);
  });

  el.innerHTML = activeOrders.map(o=>{
    const od = isOverdue(o);
    const dueLabel = o.requiredBy ? new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
    const daysLeft = o.requiredBy ? Math.ceil((new Date(o.requiredBy+'T00:00:00')-new Date())/(1000*60*60*24)) : null;
    const dueColor = od?'var(--ember)':daysLeft!==null&&daysLeft<=3?'#D97706':'var(--text3)';
    // Use fgItems (structured) if available, else parse items string
    const parsedItems = o.fgItems && o.fgItems.length
      ? o.fgItems.map(i=>({name:i.name, qty:i.qty}))
      : (o.items||'').split(/[,\n]/).map(s=>s.trim()).filter(Boolean).map(line=>{
          const m1=line.match(/^(.+?)\s*[xX×]\s*(\d+)\s*$/);
          const m2=line.match(/^(\d+)\s*[xX×]\s*(.+)$/);
          if(m1) return{name:m1[1].trim(),qty:parseInt(m1[2])};
          if(m2) return{name:m2[2].trim(),qty:parseInt(m2[1])};
          return{name:line,qty:null};
        });
    const statusColor=o.status==='ready'?'var(--jade)':o.status==='production'?'var(--blue)':'var(--amber)';
    return`<div style="border:1px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:10px;border-left:3px solid ${statusColor}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text)">${o.customer} <span style="font-family:var(--mono);font-size:9px;color:var(--text4)">${o.id}</span></div>
          <div style="font-size:11px;color:${dueColor};margin-top:2px">📅 Due: ${dueLabel} ${daysLeft!==null?'('+( od?'OVERDUE':(daysLeft===0?'Today':daysLeft+' days left'))+')':''}</div>
        </div>
        <span style="font-size:10px;padding:2px 10px;border-radius:20px;background:${orderStatusBg(o.status)};color:${orderStatusColor(o.status)};font-family:var(--mono);font-weight:700">${o.status==='ready'?'✅ Ready':o.status==='production'?'🏗️ In Production':'⏳ Pending'}</span>
      </div>
      ${parsedItems.length?`<div style="display:flex;flex-direction:column;gap:4px">${parsedItems.map(item=>{
        const key=item.name.toLowerCase().trim();
        const made=producedToday[key]||0;
        const needed=item.qty||1;
        const done=made>=needed;
        const pct=item.qty?Math.min(100,Math.round((made/needed)*100)):(made>0?100:0);
        return`<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:${done?'var(--jade-l)':'var(--surface2)'}">
          <span style="font-size:16px">${done?'✅':'⬜'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:${done?'600':'400'};color:${done?'var(--jade)':'var(--text)'}">${item.name}</div>
            ${item.qty?`<div style="margin-top:3px;background:var(--border);border-radius:4px;height:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${done?'var(--jade)':'var(--amber)'}"></div></div>`:''}
          </div>
          <div style="font-family:var(--mono);font-size:11px;color:${done?'var(--jade)':'var(--text3)'}">${item.qty?`${made}/${needed}`:(made>0?made+' made':'—')}</div>
        </div>`;
      }).join('')}</div>`:`<div style="font-size:12px;color:var(--text4)">${o.items||'No items'}</div>`}
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        ${o.status==='pending'?`<button class="btn btn-sm" style="background:var(--blue-l);color:var(--blue);border-color:var(--blue-b)" onclick="updateOrderStatus('${o.id}','production')">→ Start Production</button>`:''}
        ${o.status==='production'?`<button class="btn btn-sm" style="background:var(--jade-l);color:var(--jade);border-color:var(--jade-b)" onclick="updateOrderStatus('${o.id}','ready')">→ Mark Ready</button>`:''}
        ${o.status==='ready'?`<button class="btn btn-sm" style="background:var(--surface2);color:var(--text2);border-color:var(--border)" onclick="updateOrderStatus('${o.id}','dispatched')">🚚 Dispatch</button>`:''}
      </div>
    </div>`;
  }).join('');
}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, {
  switchDashTab,
  renderDashboard,
  renderTaskBoard,
});

// State the rest of the app reads. Re-published on each change by the
// functions above; mirrored here so the initial value is visible too.
window.activeDashTab = activeDashTab;
