// ==================================================================
//  COMPONENT / SCREEN ERROR — Visible banner when a screen fails to render
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

function screenErrorEl(name){
  return document.getElementById('screen-error-'+name);
}
function clearScreenError(name){
  const el = screenErrorEl(name);
  if(el) el.remove();
}
// A banner is PREPENDED rather than replacing the screen: a renderer that
// throws half way through still leaves useful content on the page.
function showScreenError(name, err){
  console.error('[screen:'+name+']', err);
  const sc = document.getElementById('sc-'+name);
  if(!sc) return;
  clearScreenError(name);
  const box = document.createElement('div');
  box.id = 'screen-error-'+name;
  box.style.cssText =
    'margin:12px 0;padding:14px 16px;border-radius:10px;'+
    'border:1px solid #FCA5A5;background:#FEF2F2;color:#991B1B;'+
    'font-size:13px;line-height:1.5';
  box.innerHTML =
    '<div style="font-weight:700;margin-bottom:4px">⚠ This screen failed to load</div>'+
    '<div style="margin-bottom:6px">Your saved data is safe — this is a display fault, '+
    'not a sync problem. Please report it with the detail below.</div>'+
    '<code style="display:block;font-family:var(--mono);font-size:11px;'+
    'background:rgba(0,0,0,.05);padding:6px 8px;border-radius:6px;overflow-x:auto">'+
    String((err && err.message) || err)+'</code>';
  sc.insertBefore(box, sc.firstChild);
}

// ── bridge (delete once every caller imports instead) ──
Object.assign(window, {
  screenErrorEl,
  clearScreenError,
  showScreenError,
});
