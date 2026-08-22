// ==================================================================
//  SCREEN / PRODUCTION — Supervisor teams and production logging
//
//  Markup: src/js/templates/screens/production.js
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

import { calcOT, getFGBalance, sessionMembers, sessionProduction, sessionTeams } from '../core/calc.js';
import { SPC, STAGES } from '../core/config.js';
import { fmt, fmtN, spBadge, todayStr } from '../core/format.js';
import { S, uid } from '../core/state.js';
import { openAssignModal } from '../components/assign-modal.js';
import { persist } from '../core/sync.js';

// ── screen state ──
let activeSupId = null;
let activeTeamId = null;

export function renderSupLogin(){
  // Show pending/in-production orders as task list for supervisors
  const ob = document.getElementById('sup-orders-banner');
  if(ob){
    const activeOrds = (S.orders||[]).filter(o=>o.status==='pending'||o.status==='production');
    if(activeOrds.length){
      ob.innerHTML=`<div class="card" style="border-left:3px solid var(--amber);margin-bottom:16px">
        <div class="ch"><div class="ct">📋 Orders to Produce (${activeOrds.length})</div></div>
        ${activeOrds.map(o=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:6px">
          <div>
            <div style="font-weight:600;font-size:13px">${o.customer} <span style="font-family:var(--mono);font-size:9px;color:var(--text4)">${o.id}</span></div>
            <div style="font-size:12px;color:var(--text3)">${o.items||'—'} ${o.requiredBy?' · Due: '+new Date(o.requiredBy+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</div>
          </div>
          <span style="font-size:10px;padding:2px 10px;border-radius:20px;font-family:var(--mono);font-weight:600;background:${o.status==='production'?'var(--blue-l)':'var(--amber-l)'};color:${o.status==='production'?'#1E40AF':'#92400E'}">${o.status==='production'?'IN PRODUCTION':'PENDING'}</span>
        </div>`).join('')}
      </div>`;
    } else {
      ob.innerHTML='';
    }
  }
  const sups=S.lab.filter(l=>l.isSup&&l.present);
  const g=document.getElementById('sup-cards');
  if(!sups.length){g.innerHTML='<div class="wbox">No supervisors marked present. Go to Attendance first.</div>';document.getElementById('sup-sess-list').innerHTML='';return;}
  g.innerHTML=sups.map(s=>{const h=!!S.sessions.find(ss=>ss.supId===s.id);return`<div class="sc ${h?'has-s':''}" data-click="enterSup" data-args="[${s.id}]"><div class="sc-ic">👷</div><div class="sc-nm">${s.name}</div><div class="sc-rl">${s.role} · ${fmt(s.wage)}/day</div><div class="sc-st" style="color:${h?'var(--jade)':'var(--fog)'}">${h?'✓ Session active':'Tap to start'}</div></div>`;}).join('');
  const sl=document.getElementById('sup-sess-list');
  if(!S.sessions.length){sl.innerHTML='<div style="color:#6B7280;font-size:12px">No active sessions yet.</div>';return;}
  sl.innerHTML=S.sessions.map(ss=>{
    const teams   = sessionTeams(ss);
    const members = sessionMembers(ss);
    const prod    = sessionProduction(ss);
    const lc      = members.reduce((a,m)=>a+(m.wage||0),0)+(ss.supWage||0);
    const gv      = prod.reduce((a,p)=>a+(p.value||0),0);
    const stages  = [...new Set(teams.map(t=>t.stage).filter(Boolean))];
    return`<div class="tp"><div class="tph"><div><span class="tpn">${ss.supName}</span>&nbsp;${stages.map(spBadge).join(' ')}</div><div style="display:flex;gap:6px;align-items:center"><span style="font-family:var(--mono);font-size:10px;color:var(--dust)">${members.length} workers · ${fmt(lc)}/day</span><button class="btn btn-ember btn-xs" data-click="delSess" data-args="[${ss.supId}]">✕</button></div></div><div style="font-size:11px;color:var(--dust)">Team: ${members.map(m=>m.name).join(', ')||'—'}</div>${prod.length?`<div style="font-size:11px;color:var(--jade);margin-top:4px;font-family:var(--mono)">Produced: ${prod.map(p=>`${p.qty}× ${p.name}`).join(' | ')} = ${fmt(gv)}</div>`:'<div style="font-size:11px;color:var(--fog);margin-top:4px">No production logged yet</div>'}</div>`;}).join('');
}
export function delSess(id){
  if(!confirm('Remove this supervisor session?')) return;
  S.sessions=S.sessions.filter(ss=>ss.supId!==id);
  persist();renderSupLogin();
}
export function enterSup(supId){
  const sup=S.lab.find(l=>l.id===supId);activeSupId=supId;
  let sess=S.sessions.find(ss=>ss.supId===supId);
  if(!sess){
    sess={supId,supName:sup.name,supWage:sup.wage,supOT:calcOT(sup),teams:[]};
    S.sessions.push(sess);
  }
  // Migrate old format sessions
  if(sess.team!==undefined&&sess.teams===undefined){
    sess.teams=[{teamId:1,stage:sess.stage||'Moulding',team:sess.team||[],production:sess.production||[]}];
    delete sess.team; delete sess.stage; delete sess.production;
  }
  document.getElementById('sup-login').style.display='none';
  document.getElementById('sup-work').style.display='block';
  document.getElementById('sw-name').textContent=sup.name;
  document.getElementById('sw-meta').textContent=sup.role+' · '+fmt(sup.wage)+'/day'+(sup.doingOT?` + ${fmt(calcOT(sup))} OT`:'');
  activeTeamId=null;
  renderSupWork();
}
export function renderSupWork(){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess) return;
  if(!sess.teams) sess.teams=[];

  // If no team selected yet, show team overview
  if(activeTeamId===null){
    renderSupTeamOverview(sess);
    return;
  }

  // Show specific team work screen
  const team=sess.teams.find(t=>t.teamId===activeTeamId);
  if(!team){ activeTeamId=null; renderSupWork(); return; }
  renderSupTeamWork(sess, team);
}
export function renderSupTeamOverview(sess){
  const totalGoods=sess.teams.reduce((a,t)=>a+t.production.reduce((b,p)=>b+p.value,0),0);
  const totalMembers=sess.teams.reduce((a,t)=>a+t.team.length,0);

  document.getElementById('sw-name').textContent=sess.supName;

  // Build overview HTML
  let html2=`<div style="margin-bottom:14px">
    <div class="mrow">
      <div class="met m-blue"><div class="ml">Teams</div><div class="mv w">${sess.teams.length}</div></div>
      <div class="met m-blue"><div class="ml">Workers</div><div class="mv w">${totalMembers}</div></div>
      <div class="met m-green"><div class="ml">Total Goods</div><div class="mv g">${fmt(totalGoods)}</div></div>
    </div>
  </div>`;

  if(sess.teams.length===0){
    html2+=`<div class="ibox">No teams yet. Click <b>+ Add New Team</b> to create your first team.</div>`;
  } else {
    html2+=sess.teams.map(t=>{
      const gv=t.production.reduce((a,p)=>a+p.value,0);
      const lc=t.team.reduce((a,m)=>a+m.wage,0);
      return`<div class="card" style="border-left:3px solid #F59E0B;cursor:pointer" data-click="selectTeam" data-args="[${t.teamId}]">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-family:var(--display);font-size:15px;font-weight:700;color:#111827">Team ${t.teamId}</span>
              <span class="sp ${SPC[STAGES.indexOf(t.stage)]}">${t.stage}</span>
            </div>
            <div style="font-size:12px;color:#6B7280">${t.team.length} workers: ${t.team.map(m=>m.name).join(', ')||'No workers yet'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:#065F46">${fmt(gv)}</div>
            <div style="font-size:10px;color:#9CA3AF">${t.production.length} item${t.production.length!==1?'s':''} logged</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-amber btn-sm" data-click="selectTeam" data-args="[${t.teamId}]">✏️ Edit Team ${t.teamId}</button>
          <button class="btn btn-ember btn-xs" data-click="deleteTeam" data-args="[${t.teamId}]">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  html2+=`<div style="margin-top:12px"><button class="btn btn-amber" data-click="addNewTeam">+ Add New Team</button></div>`;

  document.getElementById('sw-overview').innerHTML=html2;
  document.getElementById('sw-overview').style.display='block';
  document.getElementById('sw-teamwork').style.display='none';
}
export function addNewTeam(){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess) return;
  const newId=(sess.teams.length>0?Math.max(...sess.teams.map(t=>t.teamId)):0)+1;
  sess.teams.push({teamId:newId, stage:'Moulding', team:[], production:[]});
  persist();
  activeTeamId=newId;
  renderSupWork();
}
export function selectTeam(teamId){
  activeTeamId=teamId;
  renderSupWork();
}
export function deleteTeam(teamId){
  if(!confirm('Delete Team '+teamId+'? All production logged by this team will be lost.')) return;
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(sess) sess.teams=sess.teams.filter(t=>t.teamId!==teamId);
  persist();
  activeTeamId=null;
  renderSupWork();
}
export function renderSupTeamWork(sess, team){
  document.getElementById('sw-overview').style.display='none';
  document.getElementById('sw-teamwork').style.display='block';
  // Show stage tabs
  document.getElementById('sw-stages').innerHTML=STAGES.map(s=>
    `<div class="tab ${team.stage===s?'active':''}" data-click="swStage" data-args="[&quot;${s}&quot;]">${s}</div>`).join('');
  // Show colour field only for Painting stage
  const cfld=document.getElementById('sw-color-field');
  if(cfld){
    cfld.style.display=(team.stage==='Painting')?'block':'none';
    if(team.stage!=='Painting'){const cv=document.getElementById('sw-color-val');if(cv)cv.value='';}
  }

  // Labour cost
  const lc=team.team.reduce((a,m)=>a+m.wage,0)+(team.team.reduce((a,m)=>a+calcOT(m),0));
  document.getElementById('sw-lab-cost').textContent=team.team.length?`Team ${team.teamId} Labour: ${fmt(lc)}/day`:'';

  // Back button in team section
  const myTeam=new Set(team.team.map(m=>m.id));
  const otherAssigned=new Set(S.sessions.flatMap(ss=>ss.teams.flatMap(t=>t.teamId!==team.teamId||ss.supId!==activeSupId?t.team.map(m=>m.id):[])));
  const pool=S.lab.filter(l=>l.present&&!l.isSup&&!otherAssigned.has(l.id));

  document.getElementById('sw-team').innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <button class="btn btn-sm" data-click="clearTeamSelection">← All Teams</button>
      <span style="font-family:var(--display);font-size:14px;font-weight:700;color:#111827">Team ${team.teamId}</span>
      <span class="sp ${SPC[STAGES.indexOf(team.stage)]}">${team.stage}</span>
    </div>
    ${team.team.length?`<div style="display:flex;flex-wrap:wrap;gap:6px">${team.team.map(m=>`
      <div class="wc inteam" data-click="swTogTeam" data-args="[${m.id}]" style="cursor:pointer">
        <div><div class="wn">${m.name}</div><div class="ws">${fmt(m.wage)}/day${m.doingOT?' ⏰':''}</div></div>
        <div style="color:#EF4444;font-size:13px">−</div>
      </div>`).join('')}</div>`:'<div style="font-size:12px;color:#9CA3AF">Tap workers below to add to Team '+team.teamId+'.</div>'}`;

  document.getElementById('sw-pool').innerHTML=pool.length
    ?pool.map(l=>`<div class="wc ${myTeam.has(l.id)?'inteam':'present'}" data-click="swTogTeam" data-args="[${l.id}]">
      <div><div class="wn">${l.name}</div><div class="ws">${l.role} · ${fmt(l.wage)}${l.doingOT?' ⏰':''}</div></div>
      <div style="font-size:13px">${myTeam.has(l.id)?'−':'+'}</div>
    </div>`).join('')
    :'<div style="font-size:12px;color:#9CA3AF">No available workers.</div>';

  // Show prod form
  const prodForm=document.querySelector('.fg.fg5');
  if(prodForm) prodForm.style.display='grid';

  // Product dropdown - populate with ALL products sorted by name
  const sel=document.getElementById('sw-prod');
  const cur=sel.value;
  const q=document.getElementById('fg-search')?.value?.toLowerCase()||'';
  sel.innerHTML='<option value="">— select product —</option>'+
    S.fg.map(f=>`<option value="${f.id}" data-price="${f.price}">[#${f.id}] ${f.name} — ${fmt(f.price)}</option>`).join('');
  if(cur) sel.value=cur;

  // Add live search for product dropdown
  const prodCard=document.getElementById('sw-prod')?.closest('.card');
  if(prodCard&&!prodCard.querySelector('#sw-prod-search')){
    const searchInput=document.createElement('input');
    searchInput.id='sw-prod-search';
    searchInput.type='text';
    searchInput.placeholder='🔍 Search products...';
    searchInput.style.cssText='width:100%;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;color:#111827;padding:7px 10px;font-family:var(--body);font-size:12px;margin-bottom:8px;outline:none';
    searchInput.oninput=function(){
      const q=this.value.toLowerCase();
      const sel=document.getElementById('sw-prod');
      sel.innerHTML='<option value="">— select product —</option>'+
        S.fg.filter(f=>!q||f.name.toLowerCase().includes(q)).map(f=>`<option value="${f.id}" data-price="${f.price}">[#${f.id}] ${f.name} — ${fmt(f.price)}</option>`).join('');
    };
    sel.parentNode.insertBefore(searchInput, sel);
  }

  // Production table
  const pt=document.getElementById('sw-prod-tbl');
  if(!team.production.length){pt.innerHTML='';return;}
  const tv=team.production.reduce((a,p)=>a+p.value,0);
  const lc2=team.team.reduce((a,m)=>a+m.wage,0)+team.team.reduce((a,m)=>a+calcOT(m),0);
  pt.innerHTML=`<table class="tbl"><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Wt/pc</th><th class="num">Total Wt</th><th class="num">₹/kg</th><th class="num">₹/unit</th><th class="num">Total</th><th></th></tr></thead>
  <tbody>${team.production.map((p,i)=>{const wt=p.weightPerPc||0;const tw=p.totalWeight||0;const rpkg=wt>0?Math.round(p.unitVal/wt):0;
    return`<tr><td style="font-weight:500;color:#111827">${p.name}</td><td class="num">${p.qty}</td><td class="num">${wt||'—'}</td><td class="num">${tw?fmtN(tw)+' kg':'—'}</td><td class="num" style="color:#B45309">${rpkg?fmt(rpkg):'—'}</td><td class="num">${fmtN(p.unitVal)}</td><td class="num">${fmtN(p.value)}</td><td><button class="btn btn-ember btn-xs" data-click="delProd" data-args="[${i}]">✕</button></td></tr>`;}).join('')}
  </tbody></table>
  <div style="display:flex;justify-content:flex-end;gap:16px;font-family:var(--mono);font-size:11px;margin-top:9px;padding-top:9px;border-top:1px solid #F3F4F6">
    <span>Goods: <span style="color:#065F46">${fmt(tv)}</span></span>
    <span>Labour: <span style="color:#B91C1C">${fmt(lc2)}</span></span>
    <span>Net: <span style="color:${tv-lc2>=0?'#065F46':'#B91C1C'}">${fmt(tv-lc2)}</span></span>
  </div>`;
}
export function swStage(s){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(sess&&activeTeamId!==null){
    const team=sess.teams.find(t=>t.teamId===activeTeamId);
    if(team){team.stage=s;persist();}
  }
  renderSupWork();
}
export function swTogTeam(id){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess||activeTeamId===null) return;
  const team=sess.teams.find(t=>t.teamId===activeTeamId);
  if(!team) return;
  const idx=team.team.findIndex(m=>m.id===id);
  if(idx>=0) team.team.splice(idx,1);
  else team.team.push(S.lab.find(l=>l.id===id));
  persist();renderSupWork();
}
export function swFill(){const sel=document.getElementById('sw-prod');const opt=sel.options[sel.selectedIndex];const p=opt?.dataset?.price||'';document.getElementById('sw-price').value=p;document.getElementById('sw-ph').textContent=p?`Catalogue: ${fmt(parseFloat(p))}/unit`:''}
export function logProd(){
  let sess=S.sessions.find(ss=>ss.supId===activeSupId);
  // Self-heal: if a background sync wiped the session while this screen was open, rebuild it
  if(!sess && activeSupId){
    const sup=S.lab.find(l=>l.id===activeSupId);
    sess={supId:activeSupId,supName:sup?sup.name:'',date:S.workDate||todayStr(),teams:[]};
    S.sessions.push(sess);
  }
  if(!sess){alert('Please select a team first.');return;}
  if(!sess.teams) sess.teams=[];
  let team=(activeTeamId!==null)?sess.teams.find(t=>t.teamId===activeTeamId):null;
  // If the selected team vanished but exactly one team exists, use it; if none exist, rebuild from the on-screen UI state
  if(!team && sess.teams.length===1){team=sess.teams[0];activeTeamId=team.teamId;}
  if(!team){
    team={teamId:(sess.teams.reduce((m,t)=>Math.max(m,t.teamId||0),0)+1),stage:'Moulding',team:[],production:[]};
    sess.teams.push(team);activeTeamId=team.teamId;
  }
  const sel=document.getElementById('sw-prod');
  const fg=S.fg.find(f=>f.id===parseInt(sel.value));
  const qty=parseFloat(document.getElementById('sw-qty').value)||0;
  const uv=parseFloat(document.getElementById('sw-price').value)||0;
  const wt=parseFloat(document.getElementById('sw-weight')?.value)||0;
  if(!fg||!qty||!uv){alert('Select a product and enter quantity.');return;}

  const currentStage = team.stage||'Moulding';

  // Colour — optional text field shown only for Painting stage
  let colour = '';
  if(currentStage==='Painting'){
    colour = (document.getElementById('sw-color-val')?.value||'').trim();
  }

  // Product name: "Garden Pot L — Orange" for Painting, normal for others
  const prodName = (currentStage==='Painting' && colour) ? fg.name+' — '+colour : fg.name;

  // Auto-transfer from previous stage
  const PREV_STAGE = {Finishing:'Moulding',Painting:'Finishing',Packing:'Painting'};
  const prevStage = PREV_STAGE[currentStage];

  if(prevStage){
    if(!S.fgTransfers) S.fgTransfers=[];
    // For Painting, check against the base product name (without colour) in Finishing
    const checkName = currentStage==='Painting' ? fg.name : prodName;
    const available = getFGBalance(checkName, prevStage);
    if(available < qty){
      const proceed = confirm('Only '+available+' in '+prevStage+'. Produce '+qty+' in '+currentStage+'?');
      if(!proceed) return;
    }
    S.fgTransfers.push({
      id:uid(), date:S.workDate||todayStr(),
      from:prevStage, to:currentStage,
      product:checkName,
      productOut: checkName,
      productIn: prodName,
      qty:qty,
      note:'Auto — '+sess.supName+' (Team '+team.teamId+')'+(colour?' → '+colour:''),
      auto:true, colour:colour
    });
    const badge=document.getElementById('sw-transfer-badge');
    if(badge){
      badge.textContent='✓ Auto-transferred: −'+qty+' '+checkName+' from '+prevStage+' → +'+qty+' '+prodName+' in '+currentStage;
      badge.style.display='block';
      setTimeout(()=>badge.style.display='none',5000);
    }
  }

  team.production.push({
    name:prodName, baseName:fg.name, colour:colour,
    qty,unitVal:uv,value:qty*uv,weightPerPc:wt,totalWeight:wt*qty
  });

  // If Packing stage — offer to assign to order
  if(currentStage==='Packing'){
    const packingQty = qty;
    const packingProd = prodName;
    setTimeout(()=>{
      if(confirm(`✓ Logged ${qty}× ${prodName} in Packing.\n\nAssign to a customer order now?`)){
        openAssignModal(packingProd, getFGBalance(packingProd,'Packing'), 'sup');
      }
    }, 300);
  }

  // Reset fields
  document.getElementById('sw-qty').value='';
  if(document.getElementById('sw-weight')) document.getElementById('sw-weight').value='';
  if(document.getElementById('sw-color-val')) document.getElementById('sw-color-val').value='';
  persist();
  renderSupWork();
}
export function delProd(i){
  const sess=S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess||activeTeamId===null) return;
  const team=sess.teams.find(t=>t.teamId===activeTeamId);
  if(team){team.production.splice(i,1);persist();renderSupWork();}
}
export function saveSup(){
  activeTeamId=null;
  persist();
  alert('All teams saved ✓');
  exitSup();
}
export function exitSup(){
  activeSupId=null;
  activeTeamId=null;
  document.getElementById('sup-login').style.display='block';
  document.getElementById('sup-work').style.display='none';
  renderSupLogin();
}
export function updateColorFieldVisibility(){
  const sess = S.sessions.find(ss=>ss.supId===activeSupId);
  if(!sess) return;
  const team = sess.teams ? sess.teams.find(t=>t.teamId===activeTeamId) : null;
  const stage = team ? team.stage : (sess.stage||'Moulding');
  const colorField = document.getElementById('sw-color-field');
  if(colorField){
    colorField.style.display = stage==='Painting' ? 'block' : 'none';
    if(stage!=='Painting'){
      const cv = document.getElementById('sw-color-val');
      if(cv) cv.value='';
    }
  }
}


// ── "NEW DATA" BADGE ──
// Lives here rather than in the sync layer because it reads activeSupId:
// a window mirror cannot track a module-scoped variable that keeps changing,
// so the badge has to share lexical scope with the screen it refreshes.
// Everywhere else a remote change simply re-renders the screen. Production
// cannot: a repaint mid-entry resets the selected team and wipes half-typed
// inputs. So we compare what the screen last drew against what is now in
// state, and offer the update instead of swallowing it.
var _prodSeen = null;

// Identity of the production data as far as the user can see it. Sessions and
// teams are sorted because the rows come back from Postgres in no guaranteed
// order, and an order change alone must not look like new data.
export function prodFingerprint(){
  try{
    return JSON.stringify(
      (S.sessions||[]).slice()
        .sort(function(a,b){ return (a.supId||0)-(b.supId||0); })
        .map(function(ss){
          return [ss.supId, (ss.teams||[]).slice()
            .sort(function(a,b){ return (a.teamId||0)-(b.teamId||0); })
            .map(function(t){
              return [t.teamId, t.stage, (t.team||[]).length,
                      (t.production||[]).map(function(p){
                        return [p.name, p.qty, p.value];
                      })];
            })];
        }));
  }catch(e){ return ''; }
}
// Call wherever the user has just been shown the current production state.
// persist() covers every local edit, and go() covers every navigation, so a
// badge can only survive when the change genuinely came from another device.
export function markProdSeen(){
  _prodSeen = prodFingerprint();
  var b = document.getElementById('prod-refresh');
  if(b) b.style.display = 'none';
}
/** The fingerprint the screen last drew. Read by tests and diagnostics. */
export function lastSeenFingerprint(){ return _prodSeen; }

export function showProdRefresh(){
  var b = document.getElementById('prod-refresh');
  if(!b){
    b = document.createElement('div');
    b.id = 'prod-refresh';
    b.setAttribute('onclick','applyProdRefresh()');
    b.style.cssText =
      'position:fixed;left:50%;transform:translateX(-50%);'+
      'bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:9999;'+
      'display:flex;align-items:center;gap:8px;cursor:pointer;'+
      'padding:10px 16px;border-radius:999px;border:none;'+
      'background:var(--jade,#059669);color:#fff;font-size:13px;font-weight:600;'+
      'box-shadow:0 6px 20px rgba(0,0,0,.22)';
    b.innerHTML = '<span>🔄</span><span>New production data — tap to refresh</span>';
    document.body.appendChild(b);
  }
  b.style.display = 'flex';
}
// Repaint the production screen WITHOUT kicking the user back to the
// supervisor picker, unless the session they were in has gone away remotely.
export function applyProdRefresh(){
  var sess = activeSupId !== null &&
             (S.sessions||[]).find(function(ss){ return ss.supId === activeSupId; });
  if(sess) renderSupWork(); else exitSup();
  markProdSeen();
}


// The "← All Teams" button used to be inline markup that assigned
// `activeTeamId=null` directly. Under module scope that wrote the stale
// window mirror, never the module variable, so the button was dead: the
// team view simply re-rendered itself. Only a function in this scope can
// clear it.
export function clearTeamSelection(){
  activeTeamId = null;
  renderSupWork();
}

