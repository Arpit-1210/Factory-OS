// ==================================================================
//  CORE / XLSX — SheetJS availability and download
//
//  Handlers are republished on `window` because the markup wires them with
//  inline onclick=, which resolves against the global object and nothing
//  else. Screens also still call each other as globals; those calls become
//  imports as the remaining screens move out of app.js.
// ==================================================================

function checkXLSX(){
  if(typeof XLSX==='undefined'){alert('Excel export unavailable — check internet connection.');return false;}
  return true;
}
function downloadXLSX(wb, filename){
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

// ── bridge (delete once every caller imports instead) ──
Object.assign(window, {
  checkXLSX,
  downloadXLSX,
});
