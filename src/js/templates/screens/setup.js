// Markup for the "setup" screen (#sc-setup). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-setup">
        <div class="page-hero"><h1>Setup <span style="color:var(--amber)">Catalogue</span></h1><p>Raw materials, finished goods & labour register</p></div>
        <div class="g2">
          <div>
            <div class="card">
              <div class="ch"><div class="ct">Raw Materials <span class="badge b-amber">Upload Excel</span></div></div>
              <div class="ibox" style="font-size:11px">A: Material Name &nbsp;|&nbsp; B: Unit &nbsp;|&nbsp; C: ₹/unit &nbsp;&nbsp;<a href="#" data-click="dlSampleRM" style="color:var(--amber)">⬇ Sample</a></div>
              <div class="upz" data-click="pickRMFile"><div class="ui">📊</div><div class="ut">Upload Raw Materials Excel</div><div class="uh">.xlsx only</div></div>
              <input type="file" id="f-rm" accept=".xlsx" data-change="uploadRM">
              <div id="rm-st"></div>
              <div class="div"></div>
              <div class="fg fg3">
                <div class="fld"><label>Material</label><input id="rm-n" placeholder="e.g. FRP Resin"></div>
                <div class="fld"><label>Unit</label><select id="rm-u"><option>kg</option><option>litre</option><option>gram</option><option>metre</option><option>piece</option><option>roll</option><option>bucket</option></select></div>
                <div class="fld"><label>₹/unit</label><input id="rm-p" type="number" placeholder="0"></div>
              </div>
              <button class="btn btn-amber btn-sm" data-click="addRM">+ Add Material</button>
              <div style="max-height:200px;overflow-y:auto;margin-top:12px">
                <table class="tbl"><thead><tr><th>#</th><th>Material</th><th>Unit</th><th class="num">₹/unit</th><th></th></tr></thead><tbody id="tb-rm"></tbody></table>
              </div>
            </div>
            <div class="card">
              <div class="ch"><div class="ct">Finished Goods Catalogue</div></div>
              <input type="text" id="fg-search" placeholder="🔍 Search 380 products..." data-input="renderSetup" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);color:var(--text);padding:8px 12px;font-size:12px;outline:none;margin-bottom:10px">
              <div class="fg fg3">
                <div class="fld"><label>Product Name</label><input id="fg-n" placeholder="New product"></div>
                <div class="fld"><label>Selling ₹/unit</label><input id="fg-p" type="number" placeholder="0"></div>
                <div class="fld" style="display:flex;align-items:flex-end"><button class="btn btn-amber" style="width:100%" data-click="addFG">+ Add</button></div>
              </div>
              <div style="max-height:220px;overflow-y:auto">
                <table class="tbl"><thead><tr><th>#</th><th>Product</th><th class="num">S.No</th><th class="num">₹/unit</th><th></th></tr></thead><tbody id="tb-fg"></tbody></table>
              </div>
            </div>
          </div>
          <div>
            <div class="card">
              <div class="ch"><div class="ct">Labour Register <span class="badge b-amber">Upload Excel</span></div></div>
              <div class="ibox" style="font-size:11px">A: Name &nbsp;|&nbsp; B: Role &nbsp;|&nbsp; C: Wage ₹ &nbsp;|&nbsp; D: Supervisor? &nbsp;&nbsp;<a href="#" data-click="dlSampleLab" style="color:var(--amber)">⬇ Sample</a></div>
              <div class="upz" data-click="pickLabFile"><div class="ui">👷</div><div class="ut">Upload Labour Excel</div><div class="uh">.xlsx only</div></div>
              <input type="file" id="f-lab" accept=".xlsx" data-change="uploadLab">
              <div id="lab-st"></div>
              <div class="div"></div>
              <div class="fg fg5">
                <div class="fld"><label>Name</label><input id="lab-n" placeholder="Worker name"></div>
                <div class="fld"><label>Role</label><select id="lab-r"><option>Floor worker</option><option>Senior worker</option><option>Supervisor</option></select></div>
                <div class="fld"><label>Wage ₹/day</label><input id="lab-w" type="number" placeholder="0"></div>
                <div class="fld"><label>OT Hours</label><input id="lab-ot" type="number" placeholder="e.g. 2"></div>
                <div class="fld"><label>Supervisor?</label><select id="lab-s"><option value="0">No</option><option value="1">Yes</option></select></div>
              </div>
              <button class="btn btn-amber btn-sm" data-click="addLab">+ Add Person</button>
              <div style="max-height:380px;overflow-y:auto;margin-top:12px">
                <table class="tbl"><thead><tr><th>#</th><th>Name</th><th>Role</th><th class="num">Wage ₹</th><th class="num">OT hrs</th><th>Sup</th><th></th></tr></thead><tbody id="tb-lab"></tbody></table>
              </div>
            </div>
          </div>
        </div>
      </div>`;
