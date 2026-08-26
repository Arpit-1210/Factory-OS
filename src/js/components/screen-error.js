// ==================================================================
//  COMPONENT / SCREEN ERROR — Visible banner when a screen fails to render
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

export function screenErrorEl(name){
  return document.getElementById('screen-error-'+name);
}
export function clearScreenError(name){
  const el = screenErrorEl(name);
  if(el) el.remove();
}
// A banner is PREPENDED rather than replacing the screen: a renderer that
// throws half way through still leaves useful content on the page.
export function showScreenError(name, err){
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

