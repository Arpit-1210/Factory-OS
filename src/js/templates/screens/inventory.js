// Markup for the "inventory" screen (#sc-inventory). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-inventory">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div class="page-hero" style="margin-bottom:0"><h1>Inventory <span style="color:var(--amber)">Stock</span></h1><p style="color:var(--text4);font-family:var(--mono)" id="inv-date-label">All-time cumulative stock</p></div>
          <div style="display:flex;gap:8px"><button class="btn btn-sm" onclick="window.print()">🖨️ Print</button><button class="btn btn-amber btn-sm" onclick="renderInventory()">↻ Refresh</button></div>
        </div>
        <div style="margin-bottom:16px">
          <input type="text" id="inv-search" placeholder="🔍 Search any product or material..." oninput="renderInventory()"
            style="width:100%;max-width:480px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);color:var(--text);padding:10px 14px;font-family:var(--body);font-size:13px;outline:none;transition:all .2s"
            onfocus="this.style.borderColor='var(--amber)'" onblur="this.style.borderColor='var(--border)'">
        </div>
        <div class="mrow" id="inv-health"></div>
        <div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">🧪</span><span style="font-family:var(--display);font-size:16px;font-weight:700">Raw Material Stock</span></div><div id="inv-rm"></div></div>
        <div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">🔄</span><span style="font-family:var(--display);font-size:16px;font-weight:700">Stage Transitions</span></div><div id="inv-transitions"></div></div>
        <div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:18px">📦</span><span style="font-family:var(--display);font-size:16px;font-weight:700">Finished Goods — Stage-wise</span></div><div id="inv-fg"></div></div>
        <div id="inv-alerts"></div>
      </div>`;
