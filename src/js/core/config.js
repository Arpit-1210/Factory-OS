// ══════════════════════════════════════════════════════════════════
//  CORE / CONFIG — constants shared across every screen
//
//  TRANSITIONAL BRIDGE
//  app.js is still one large file and is loaded as a module WITHOUT import
//  statements, so it cannot `import` from here. Until it is broken up, each
//  value is also published on `window`; a bare `STAGES` inside app.js then
//  resolves through the global object exactly as it did when these were
//  top-level `const`s in that file.
//
//  As screens move into src/js/screens/, they import from here properly and
//  the window assignments below get deleted.
// ══════════════════════════════════════════════════════════════════

export const LS_KEY = 'frp_factory_v5';

// Dispatch is an exit, not a stock-bearing stage — FG_STAGES is what the
// stock screens iterate, STAGES is what the badges and pipelines use.
export const STAGES    = ['Moulding', 'Finishing', 'Painting', 'Packing', 'Dispatch'];
export const FG_STAGES = ['Moulding', 'Finishing', 'Painting', 'Packing'];
export const SPC       = ['sp0', 'sp1', 'sp2', 'sp3', 'sp4'];

export const MNAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

export const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwsVDnWwv1lH5EqwYLLPyu7GXLobPAAjfa7vL1Oc6t8Cezd9GiMNbhINwr4iFx5FhG4/exec';

// The master-password map that used to live here is gone. Every value was an
// empty string, so `pwd === PASSWORDS[role]` was true for a blank password —
// anyone could sign in as owner. Auth is Supabase email/password now, with
// roles enforced by RLS in Postgres.
//
// This map is navigation only. It decides which sidebar entries exist and
// which routes go() will open; it is NOT a security boundary.
export const ROLE_ACCESS = {
  owner: ['dashboard','setup','sheets','att','sup','raw','day','month','orders',
          'payments','dispatch','transfers','salary','inventory','stock',
          'rmpurchase','fgstock','docs','bom','export'],
  supervisor: ['dashboard','att','sup','raw','day'],
  rm: ['dashboard','raw','stock','rmpurchase','inventory'],
};

export const ROLE_HOME = { owner: 'dashboard', supervisor: 'sup', rm: 'raw' };

// The Apps Script the owner pastes into Google Sheets to enable backup.
// Shipped as a string so the Sheets screen can offer a copy button.
export const APPS_SCRIPT_CODE = `function doGet(e){try{var sheet=SpreadsheetApp.getActiveSpreadsheet();var action=e.parameter.action||'';var cb=e.parameter.callback||'';var data=e.parameter.payload?JSON.parse(decodeURIComponent(e.parameter.payload)):{};if(action==='summary'){var ledger=sheet.getSheetByName('Daily Ledger')||sheet.insertSheet('Daily Ledger');if(ledger.getLastRow()===0)ledger.appendRow(['Date','Supervisor','Stage','Workers','Goods','Labour','OT','RM','Net Profit','Margin %']);ledger.appendRow([data.date,data.sup||'',data.stage||'',data.workers,data.goods,data.labour,data.ot||0,data.rm,data.net,data.margin||0]);}else if(action==='prod'){var prod=sheet.getSheetByName('Production')||sheet.insertSheet('Production');if(prod.getLastRow()===0)prod.appendRow(['Date','Supervisor','Stage','Product','Qty','Unit Value','Total']);prod.appendRow([data.date,data.sup||'',data.stage||'',data.name,data.qty,data.uv,data.val]);}else if(action==='rm'){var rm=sheet.getSheetByName('Raw Materials')||sheet.insertSheet('Raw Materials');if(rm.getLastRow()===0)rm.appendRow(['Date','Stage','Material','Qty','Unit','Unit Price','Total Cost']);rm.appendRow([data.date,data.stage,data.name,data.qty,data.unit,data.up,data.cost]);}else if(action==='monthlySalary'){var sal=sheet.getSheetByName('Monthly Salary')||sheet.insertSheet('Monthly Salary');if(sal.getLastRow()===0){sal.appendRow(['Month','Worker','Role','Days Present','OT Days','Daily Wage','Gross Pay','Advance','Deduction','Net Pay']);var sh=sal.getRange(1,1,1,10);sh.setFontWeight('bold');sh.setBackground('#1967D2');sh.setFontColor('#ffffff');}(data.workers||[]).forEach(function(w){sal.appendRow([data.month,w.name,w.role,w.days,w.otDays,w.wage,w.gross,w.advance,w.deduction,w.net]);});}else if(action==='unitTransfer'){var ut=sheet.getSheetByName('Unit Transfers')||sheet.insertSheet('Unit Transfers');if(ut.getLastRow()===0){ut.appendRow(['Date','Direction','Type','Item','Qty','Unit','Note','Logged By']);var uh=ut.getRange(1,1,1,8);uh.setFontWeight('bold');uh.setBackground('#059669');uh.setFontColor('#ffffff');}ut.appendRow([data.date,data.direction,data.type,data.item,data.qty,data.unit,data.note||'',data.loggedBy||'Owner']);}else if(action==='order'){var orders=sheet.getSheetByName('Orders')||sheet.insertSheet('Orders');if(orders.getLastRow()===0){orders.appendRow(['Date','Order ID','Customer','Phone','City','Required By','Priority','Items','Amount','Advance','Balance','Status']);var h=orders.getRange(1,1,1,12);h.setFontWeight('bold');h.setBackground('#1967D2');h.setFontColor('#ffffff');}var lastRow=orders.getLastRow();var found=false;if(lastRow>1){var ids=orders.getRange(2,2,lastRow-1,1).getValues();for(var i=0;i<ids.length;i++){if(ids[i][0]===data.id){orders.getRange(i+2,11).setValue(data.balance);orders.getRange(i+2,12).setValue(data.status);found=true;break;}}}if(!found){orders.appendRow([data.date,data.id,data.customer,data.phone||'',data.city||'',data.requiredBy||'',data.priority,data.items||'',data.amount,data.advance,data.balance,data.status]);}}else if(action==='getOrders'){var ordSheet=sheet.getSheetByName('Orders');if(!ordSheet||ordSheet.getLastRow()<2){var out=JSON.stringify({orders:[]});return ContentService.createTextOutput(cb?cb+'('+out+')':out).setMimeType(cb?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);}var rows=ordSheet.getRange(2,1,ordSheet.getLastRow()-1,12).getValues();var result=rows.filter(function(r){return r[2];}).map(function(r){return{date:r[0]?new Date(r[0]).toISOString().slice(0,10):'',id:r[1]||'',customer:r[2]||'',phone:r[3]||'',city:r[4]||'',requiredBy:r[5]?new Date(r[5]).toISOString().slice(0,10):'',priority:r[6]||'normal',items:r[7]||'',amount:parseFloat(r[8])||0,advance:parseFloat(r[9])||0,balance:parseFloat(r[10])||0,status:r[11]||'pending'};});var out2=JSON.stringify({orders:result});return ContentService.createTextOutput(cb?cb+'('+out2+')':out2).setMimeType(cb?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);}return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);}catch(err){return ContentService.createTextOutput(JSON.stringify({status:'error',message:err.toString()})).setMimeType(ContentService.MimeType.JSON);}}`;

// ── bridge (delete once app.js is fully split) ──
Object.assign(window, {
  LS_KEY, STAGES, FG_STAGES, SPC, MNAMES, SHEETS_URL, ROLE_ACCESS, ROLE_HOME,
  APPS_SCRIPT_CODE,
});
