// ── DASHBOARD SCREEN ──
// Each screen exports a render(container, state, role) function

import { fmt, todayStr, isOverdue, spBadge } from '../js/utils.js';
import { STAGES } from '../js/config.js';

let _activeDashTab = 'overview';

export function render(container, S, role) {
  // Hide money tab for non-owners
  const showMoney = role === 'owner';

  container.innerHTML = `
    <div class="tabs" id="dash-tabs" style="margin-bottom:16px">
      <div class="tab ${_activeDashTab==='overview'?'active':''}" onclick="switchDashTab('overview')">📊 Overview</div>
      <div class="tab ${_activeDashTab==='factory'?'active':''}" onclick="switchDashTab('factory')">🏭 Factory</div>
      ${showMoney ? `<div class="tab ${_activeDashTab==='money'?'active':''}" onclick="switchDashTab('money')">💰 Money</div>` : ''}
    </div>
    <div id="dash-alerts" style="margin-bottom:8px"></div>
    <div id="dash-tab-overview" style="display:${_activeDashTab==='overview'?'block':'none'}">
      <div class="dash-grid" id="dash-overview-cards"></div>
      <div class="card" style="margin-top:16px">
        <div class="ch"><div class="ct">📋 Production Task Board</div>
          <button class="btn btn-sm" onclick="go('orders')">All Orders →</button>
        </div>
        <div id="dash-task-list"></div>
      </div>
    </div>
    <div id="dash-tab-factory" style="display:${_activeDashTab==='factory'?'block':'none'}">
      <div class="dash-grid" id="dash-factory-cards"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px" class="g2-dash">
        <div class="card"><div class="ch"><div class="ct">🏗️ Active Teams Today</div></div><div id="dash-teams"></div></div>
        <div class="card"><div class="ch"><div class="ct">📦 Stage Flow</div></div><div id="dash-stage-flow"></div></div>
      </div>
    </div>
    ${showMoney ? `
    <div id="dash-tab-money" style="display:${_activeDashTab==='money'?'block':'none'}">
      <div class="dash-grid" id="dash-money-cards"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px">
        <div class="card"><div class="ch"><div class="ct">📋 Recent Orders</div><button class="btn btn-sm" onclick="go('orders')">View all →</button></div><div id="dash-recent-orders"></div></div>
        <div class="card"><div class="ch"><div class="ct">💸 Today's P&L</div></div><div id="dash-pnl"></div></div>
      </div>
    </div>` : ''}
  `;

  // Wire tab switcher
  window.switchDashTab = (tab) => {
    _activeDashTab = tab;
    ['overview','factory','money'].forEach(t => {
      const el = document.getElementById('dash-tab-'+t);
      if (el) el.style.display = t===tab ? 'block' : 'none';
      const tabEl = document.querySelector(`[onclick="switchDashTab('${t}')"]`);
      if (tabEl) tabEl.classList.toggle('active', t===tab);
    });
  };

  renderAlerts(S);
  renderOverviewCards(S, role);
  renderFactoryCards(S);
  if (showMoney) renderMoneyCards(S);
  renderTaskBoard(S);
}

function renderAlerts(S) {
  const overdueOrds = S.orders.filter(o => isOverdue(o));
  const inProd = S.orders.filter(o => o.status === 'production');
  const rmLow = S.stock.filter(st => {
    if (!st.reorder) return false;
    const bal = getRMBalance(S, st.name);
    return bal <= st.reorder;
  }).length;

  let alerts = '';
  if (overdueOrds.length) alerts += `<div class="alert-banner danger">🚨 ${overdueOrds.length} order${overdueOrds.length>1?'s':''} overdue<span class="ab-action" onclick="go('orders')">View →</span></div>`;
  if (rmLow > 0) alerts += `<div class="alert-banner warn">📦 ${rmLow} RM material${rmLow>1?'s':''} low<span class="ab-action" onclick="go('stock')">Reorder →</span></div>`;
  if (inProd.length) alerts += `<div class="alert-banner ok">🏗️ ${inProd.length} order${inProd.length>1?'s':''} in production</div>`;

  const el = document.getElementById('dash-alerts');
  if (el) el.innerHTML = alerts ? `<div class="alert-row">${alerts}</div>` : '';
}

function getRMBalance(S, name) {
  const st = S.stock.find(s => s.name === name);
  if (!st) return 0;
  const purchased = (S.purchases||[]).filter(p=>p.name===name&&p.qty>0).reduce((a,p)=>a+p.qty,0);
  const usedH = S.ledger.reduce((a,d)=>a+(d.rawLog||[]).filter(r=>r.name===name).reduce((b,r)=>b+r.qty,0),0);
  const usedT = (S.rawLog||[]).filter(r=>r.name===name).reduce((a,r)=>a+r.qty,0);
  return st.opening + purchased - usedH - usedT;
}

function renderOverviewCards(S, role) {
  const present = S.lab.filter(l => l.present);
  const totalGoods = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  const totalUnits = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.qty,0),0),0);
  const activeOrders = S.orders.filter(o=>o.status!=='dispatched').length;
  const balanceDue = S.orders.filter(o=>o.status!=='dispatched').reduce((a,o)=>a+(o.amount-o.advance),0);
  const todayTransfers = (S.unitTransfers||[]).filter(t=>t.date===todayStr()).length;

  const el = document.getElementById('dash-overview-cards');
  if (!el) return;

  if (role === 'owner') {
    el.innerHTML = `
      <div class="dash-card c-jade" onclick="go('day')">
        <span class="dc-icon">🏭</span><div class="dc-label">Goods Value Today</div>
        <div class="dc-value green">${fmt(totalGoods)}</div><div class="dc-sub">${totalUnits} units</div>
      </div>
      <div class="dash-card c-amber" onclick="go('payments')">
        <span class="dc-icon">💸</span><div class="dc-label">Balance Due</div>
        <div class="dc-value amber">${fmt(balanceDue)}</div><div class="dc-sub">${activeOrders} active orders</div>
      </div>
      <div class="dash-card c-blue" onclick="go('att')">
        <span class="dc-icon">👷</span><div class="dc-label">Workers Present</div>
        <div class="dc-value">${present.length}</div><div class="dc-sub">of ${S.lab.length} total</div>
      </div>
      <div class="dash-card c-blue" onclick="go('transfers')">
        <span class="dc-icon">🔄</span><div class="dc-label">Unit 2 Transfers</div>
        <div class="dc-value">${todayTransfers}</div><div class="dc-sub">today</div>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div class="dash-card c-blue" onclick="go('att')">
        <span class="dc-icon">👷</span><div class="dc-label">Workers Present</div>
        <div class="dc-value">${present.length}</div><div class="dc-sub">of ${S.lab.length} total</div>
      </div>
      <div class="dash-card c-jade" onclick="go('day')">
        <span class="dc-icon">📦</span><div class="dc-label">Units Produced</div>
        <div class="dc-value">${totalUnits}</div><div class="dc-sub">value: ${fmt(totalGoods)}</div>
      </div>
    `;
  }
}

function renderFactoryCards(S) {
  // Teams display
  const teamsEl = document.getElementById('dash-teams');
  const allTeams = S.sessions.flatMap(ss=>(ss.teams||[]).map(t=>({...t,supName:ss.supName})));
  if (teamsEl) {
    teamsEl.innerHTML = allTeams.length
      ? allTeams.map(t => {
          const gv = t.production.reduce((a,p)=>a+p.value,0);
          return `<div class="tp">
            <div class="tph">
              <span class="tpn">${t.supName}</span>&nbsp;${spBadge(t.stage)}
              <span style="font-family:var(--mono);font-size:11px;color:var(--jade)">${fmt(gv)}</span>
            </div>
            <div style="font-size:11px;color:var(--text3)">${t.team.map(m=>m.name).join(', ')||'No workers'}</div>
          </div>`;
        }).join('')
      : '<div style="color:var(--text4);font-size:12px;padding:8px 0">No active teams yet.</div>';
  }

  // Stage flow
  const stageEl = document.getElementById('dash-stage-flow');
  if (stageEl) {
    const stageUnits = {};
    STAGES.forEach(s => stageUnits[s] = 0);
    S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>t.production.forEach(p=>{
      stageUnits[t.stage] = (stageUnits[t.stage]||0) + p.qty;
    })));
    stageEl.innerHTML = STAGES.filter(s=>s!=='Dispatch').map((s,i) =>
      `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        ${spBadge(s)}
        <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:${stageUnits[s]>0?'var(--jade)':'var(--text4)'}">
          ${stageUnits[s]} units
        </div>
      </div>`
    ).join('');
  }
}

function renderMoneyCards(S) {
  const present = S.lab.filter(l=>l.present);
  const bw = present.reduce((a,l)=>a+l.wage,0);
  const ot = present.filter(l=>l.doingOT).reduce((a,l)=>a+Math.round((l.wage/8)*(l.otHours||0)),0);
  const totalLab = bw + ot;
  const totalGoods = S.sessions.reduce((a,ss)=>a+(ss.teams||[]).reduce((b,t)=>b+t.production.reduce((c,p)=>c+p.value,0),0),0);
  const totalRM = (S.rawLog||[]).filter(r=>r.stage!=='Unit2-Transfer').reduce((a,r)=>a+r.cost,0);
  const net = totalGoods - totalLab - totalRM;
  const now = new Date();
  const monthEntries = S.ledger.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const monthProfit = monthEntries.reduce((a,e)=>a+e.netProfit,0);

  const el = document.getElementById('dash-money-cards');
  if (el) el.innerHTML = `
    <div class="dash-card c-jade" onclick="go('day')">
      <span class="dc-icon">💰</span><div class="dc-label">Net Profit Today</div>
      <div class="dc-value ${net>=0?'green':'red'}">${fmt(net)}</div>
      <div class="dc-sub">${totalGoods>0?Math.round(net/totalGoods*100)+'% margin':'no production'}</div>
    </div>
    <div class="dash-card c-blue" onclick="go('month')">
      <span class="dc-icon">📅</span><div class="dc-label">Month Profit</div>
      <div class="dc-value ${monthProfit>=0?'green':'red'}">${fmt(monthProfit)}</div>
      <div class="dc-sub">${monthEntries.length} days this month</div>
    </div>
    <div class="dash-card c-jade">
      <span class="dc-icon">🏭</span><div class="dc-label">Goods Value</div>
      <div class="dc-value green">${fmt(totalGoods)}</div>
    </div>
    <div class="dash-card c-ember">
      <span class="dc-icon">💸</span><div class="dc-label">Labour + RM</div>
      <div class="dc-value red">${fmt(totalLab+totalRM)}</div>
    </div>
  `;

  // P&L
  const pnlEl = document.getElementById('dash-pnl');
  if (pnlEl) pnlEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;padding:10px;background:var(--jade-l);border:1px solid var(--jade-b);border-radius:var(--r)">
        <span style="color:var(--jade)">🏭 Goods</span><span style="font-family:var(--mono);font-weight:700;color:var(--jade)">${fmt(totalGoods)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:var(--ember-l);border:1px solid var(--ember-b);border-radius:var(--r)">
        <span style="color:var(--ember)">👷 Labour</span><span style="font-family:var(--mono);font-weight:700;color:var(--ember)">−${fmt(totalLab)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:var(--ember-l);border:1px solid var(--ember-b);border-radius:var(--r)">
        <span style="color:var(--ember)">🧪 RM</span><span style="font-family:var(--mono);font-weight:700;color:var(--ember)">−${fmt(totalRM)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px;background:${net>=0?'var(--jade-l)':'var(--ember-l)'};border:1px solid ${net>=0?'var(--jade-b)':'var(--ember-b)'};border-radius:var(--r)">
        <span style="font-weight:700;color:${net>=0?'var(--jade)':'var(--ember)'}">💰 Net Profit</span>
        <span style="font-family:var(--mono);font-size:16px;font-weight:800;color:${net>=0?'var(--jade)':'var(--ember)'}">${fmt(net)}</span>
      </div>
    </div>
  `;

  // Recent orders
  const ordEl = document.getElementById('dash-recent-orders');
  if (ordEl) {
    const recent = S.orders.slice(0, 5);
    ordEl.innerHTML = recent.length
      ? recent.map(o=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:12px;font-weight:600">${o.customer}</div>
            <div style="font-size:10px;color:var(--text4);font-family:var(--mono)">${o.id} · ${o.status}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;font-weight:700;font-family:var(--mono)">${fmt(o.amount)}</div>
            <div style="font-size:10px;color:var(--ember);font-family:var(--mono)">Bal: ${fmt(o.amount-o.advance)}</div>
          </div>
        </div>`).join('')
      : '<div style="color:var(--text4);font-size:12px;padding:8px 0">No orders yet.</div>';
  }
}

function renderTaskBoard(S) {
  const el = document.getElementById('dash-task-list');
  if (!el) return;

  const activeOrders = (S.orders||[]).filter(o=>o.status==='pending'||o.status==='production'||o.status==='ready');
  if (!activeOrders.length) {
    el.innerHTML = '<div style="color:var(--text4);font-size:12px;padding:8px 0">No active orders.</div>';
    return;
  }

  // Build produced today (Packing only)
  const producedToday = {};
  S.sessions.forEach(ss=>(ss.teams||[]).forEach(t=>{
    if (t.stage !== 'Packing') return;
    t.production.forEach(p=>{
      const key = (p.baseName||p.name).toLowerCase().trim();
      producedToday[key] = (producedToday[key]||0) + p.qty;
    });
  }));

  el.innerHTML = activeOrders.map(o => {
    const od = isOverdue(o);
    const parsedItems = o.fgItems?.length
      ? o.fgItems
      : (o.items||'').split(/[,\n]/).map(s=>s.trim()).filter(Boolean).map(line=>{
          const m = line.match(/^(.+?)\s*[xX×]\s*(\d+)\s*$/);
          return m ? {name:m[1].trim(),qty:parseInt(m[2])} : {name:line,qty:null};
        });

    const statusColor = o.status==='ready'?'var(--jade)':o.status==='production'?'var(--blue)':'var(--amber)';
    return `<div style="border:1px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:10px;border-left:3px solid ${statusColor}">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
        <div>
          <div style="font-weight:700;font-size:14px">${o.customer} ${od?'🚨':''}</div>
          <div style="font-size:10px;color:var(--text4);font-family:var(--mono)">${o.id} · Due: ${o.requiredBy||'—'}</div>
        </div>
        <span style="font-size:10px;padding:2px 10px;border-radius:20px;background:${statusColor === 'var(--jade)' ? 'var(--jade-l)' : statusColor === 'var(--blue)' ? 'var(--blue-l)' : 'var(--amber-l)'};color:${statusColor};font-family:var(--mono);font-weight:700">${o.status.toUpperCase()}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${parsedItems.map(item=>{
          const key = item.name.toLowerCase().trim();
          const made = producedToday[key]||0;
          const needed = item.qty||1;
          const done = made >= needed;
          return `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:${done?'var(--jade-l)':'var(--surface2)'}">
            <span>${done?'✅':'⬜'}</span>
            <div style="flex:1"><div style="font-size:12px;font-weight:${done?'600':'400'};color:${done?'var(--jade)':'var(--text)'}">${item.name}</div></div>
            <div style="font-family:var(--mono);font-size:11px;color:${done?'var(--jade)':'var(--text3)'}">${item.qty?`${made}/${needed}`:'—'}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        ${o.status==='pending'?`<button class="btn btn-sm" style="background:var(--blue-l);color:var(--blue);border-color:var(--blue-b)" onclick="updateOrderStatus('${o.id}','production')">→ Start Production</button>`:''}
        ${o.status==='production'?`<button class="btn btn-sm" style="background:var(--jade-l);color:var(--jade);border-color:var(--jade-b)" onclick="updateOrderStatus('${o.id}','ready')">→ Mark Ready</button>`:''}
        ${o.status==='ready'?`<button class="btn btn-sm" onclick="updateOrderStatus('${o.id}','dispatched')">🚚 Dispatch</button>`:''}
      </div>
    </div>`;
  }).join('');
}
