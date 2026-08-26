// ==================================================================
//  CORE / XLSX — SheetJS availability and download
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

export function checkXLSX(){
  if(typeof XLSX==='undefined'){alert('Excel export unavailable — check internet connection.');return false;}
  return true;
}
export function downloadXLSX(wb, filename){
  try{
    const wbout=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    const blob=new Blob([wbout],{type:'application/octet-stream'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
  }catch(e){ XLSX.writeFile(wb,filename); }
}

