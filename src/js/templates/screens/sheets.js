// Markup for the "sheets" screen (#sc-sheets). Static: no interpolation, no
// logic. The screen module fills it in at render time.

export default `      <div class="screen" id="sc-sheets">
        <div class="page-hero"><h1>Cloud <span>Sync</span></h1><p>Firebase real-time sync + Google Sheets backup</p></div>

        <!-- Firebase Status -->
        <div class="card" style="max-width:640px;margin-bottom:16px">
          <div class="ch">
            <div class="ct">🔥 Firebase Real-Time Sync</div>
            <div id="fb-status-badge" style="font-family:var(--mono);font-size:10px;padding:3px 10px;border-radius:20px;background:var(--jade-l);color:var(--jade);border:1px solid var(--jade-b)">✓ Connected</div>
          </div>
          <div class="mrow">
            <div class="met m-green"><div class="ml">Status</div><div class="mv g" style="font-size:14px">Live ✓</div></div>
            <div class="met m-blue"><div class="ml">Project</div><div class="mv b" style="font-size:12px">frp-factory-3e933</div></div>
            <div class="met m-green"><div class="ml">Offline Mode</div><div class="mv g" style="font-size:14px">✓ On</div></div>
            <div class="met m-blue"><div class="ml">Auto Backup</div><div class="mv b" style="font-size:14px">Daily ✓</div></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn btn-jade" onclick="runDailyBackup().then(()=>alert('✓ Backup saved'))">💾 Backup Now</button>
            <button class="btn btn-blue" onclick="restoreFromBackup()">📂 Restore from Backup</button>
            <button class="btn" onclick="pushToFirebase().then(()=>alert('✓ Synced'))">↑ Force Sync</button>
            <button class="btn btn-amber" onclick="emergencyPush()">🚨 Push Local Data to Firebase</button>
          </div>
          <div id="backup-list" style="margin-top:12px"></div>
        </div>

        <!-- Google Sheets -->
        <div class="card" style="max-width:640px">
          <div class="ch"><div class="ct">📊 Google Sheets Sync</div></div>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">1</div>
              <div style="flex:1"><div style="font-weight:600;margin-bottom:4px">Paste Apps Script</div>
                <div style="font-size:12px;color:var(--text3);margin-bottom:8px">Open your Google Sheet → Extensions → Apps Script → Delete all → Paste this → Save → Deploy as Web App</div>
                <textarea id="apps-script-code" readonly onclick="this.select()" style="width:100%;height:160px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:10px;font-family:var(--mono);font-size:10px;color:var(--text3);resize:vertical;outline:none"></textarea>
                <button class="btn btn-sm btn-blue" style="margin-top:6px" onclick="copyScript()">Copy Script</button>
                <span id="copy-confirm" style="font-family:var(--mono);font-size:10px;color:var(--jade);margin-left:8px;display:none">✓ Copied!</span>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">2</div>
              <div style="flex:1">
                <div style="font-weight:600;margin-bottom:8px">Paste Web App URL</div>
                <div class="fld"><label>Web App URL</label><input id="sheets-url" placeholder="https://script.google.com/macros/s/..." oninput="saveUrl()"></div>
                <button class="btn btn-sm btn-blue" style="margin-top:8px" onclick="testConnection()">🔗 Test Connection</button>
                <div id="conn-result" style="margin-top:10px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
