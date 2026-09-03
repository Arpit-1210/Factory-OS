// ══════════════════════════════════════════════════════════════════
//  END-TO-END: does the work survive a refresh and a re-login?
//
//  The REAL application bundle, the REAL supabase-js client, the REAL
//  Postgres database, a real sign-in and real RLS. Only the DOM is stubbed —
//  and persistence is about rows, not pixels.
//
//  "Refresh" and "re-login" are modelled the way a browser does them: a fresh
//  boot of the whole module graph. The first carries the session but deletes
//  the app's cached state, so everything on screen must come from Postgres;
//  the second starts from an empty localStorage, as a different device would.
//
//  WHAT THIS FILE CANNOT CATCH
//  It runs through tests/harness.mjs, which installs every module export on
//  the sandbox's `window`. A browser has no such bridge. So the defect that
//  originally broke Save Day — `persist()` called without being imported,
//  throwing a ReferenceError before the write — RESOLVES here and the day
//  saves fine. Running this against the pre-fix commit therefore still passes
//  step 4.
//
//  That is not a gap in coverage, it is a division of labour: missing imports
//  are caught statically by tests/free-identifiers.test.mjs, which parses each
//  module on its own with no bundle and no window. This file's job is the
//  other half — proving that a write really lands in Postgres and really comes
//  back on a fresh device. Do not "fix" this by weakening either one.
// ══════════════════════════════════════════════════════════════════

import { boot, call, getState } from './harness.mjs';

// Not part of `npm test` — it needs credentials and a network, and it WRITES
// TO THE REAL DATABASE. Run it deliberately:
//
//   npm install --no-save @supabase/supabase-js ws
//   E2E_EMAIL=... E2E_PASSWORD=... node tests/e2e-live.mjs
//
// It writes attendance and a production session for TODAY, closes the day, and
// leaves a row in day_ledger. Step 5 also REPLACES fg_stock — the factory's
// opening-stock declaration — and leaves it unlocked. Snapshot those tables
// first if the day or the declaration matters, or run it against an account
// and date you do not mind disturbing.
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('Set E2E_EMAIL and E2E_PASSWORD. This run writes to the real database.');
  process.exit(2);
}

// The real client, constructed in Node's realm where it has every global it
// needs, and handed to the app through the exact seam index.html uses:
// a `supabase` global with createClient().
import { createClient } from '@supabase/supabase-js';
import { createLocalStorage } from './dom-stub.mjs';
import WebSocket from 'ws';

let pass = 0, fail = 0;
const ok = (cond, label, detail) => {
  if (cond) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + (detail ? '\n          ' + detail : '')); }
};
const step = (n) => console.log('\n=== ' + n + ' ===');

/**
 * One browser page-load.
 *
 * The supabase client's session storage is bound to THIS boot's localStorage,
 * which is what makes a "refresh" faithful: carry the localStorage across and
 * the signed-in session comes with it, exactly as it does in a browser.
 *
 * Getting this wrong is worth recording. With the client's own
 * `persistSession: false`, the second boot was never authenticated — so it
 * read nothing from Postgres, the attendance assertions passed against
 * localStorage alone, and the day_ledger write was refused as anonymous. The
 * run looked like a product bug and was a test-fidelity bug.
 */
function launch(seed) {
  const ls = createLocalStorage(seed || {});
  const storage = {
    getItem: (k) => ls.getItem(k),
    setItem: (k, v) => ls.setItem(k, v),
    removeItem: (k) => ls.removeItem(k),
  };
  const supabaseGlobal = {
    createClient: (url, key, opts) => createClient(url, key, {
      ...opts,
      auth: {
        ...(opts && opts.auth),
        persistSession: true,
        autoRefreshToken: false,
        storage,
      },
      // Node 20 has no global WebSocket and the client builds its socket
      // eagerly. Realtime is not what this run tests — whether a write
      // survives being fetched back is HTTP — but the constructor needs one.
      realtime: { transport: WebSocket, params: { eventsPerSecond: 1 } },
    }),
  };
  const h = boot({
    supabase: supabaseGlobal,
    globals: { fetch: (...a) => fetch(...a), localStorage: ls },
    quiet: true,
  });
  h.localStorage = ls;      // the one the app and the client actually share
  return h;
}

// persist() debounces its push by 2s and the harness captures timers rather
// than scheduling them. Fire them, then let the network settle.
async function flush(h, rounds = 3) {
  for (let i = 0; i < rounds; i++) {
    const pending = h.timers.timeouts.splice(0);
    for (const t of pending) { try { await t.fn(); } catch (e) { /* screen repaint */ } }
    await new Promise(r => setTimeout(r, 700));
  }
}

const today = new Date();
const ISO = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

// A supervisor plus two floor workers. Real ids from the workers table.
const SUP_ID = 205;          // PIYUSH TIWARI
const WORKERS = [1, 2];      // Ajay, Ajay Karmali

// ── 1. SIGN IN AND MARK ATTENDANCE ────────────────────────────────
step('1. sign in, mark attendance, log production');
const a = launch();
await call(a.ctx, 'initFirebase()');
const signIn = await call(a.ctx, `FactoryDB.signIn(${JSON.stringify(EMAIL)}, ${JSON.stringify(PASSWORD)})`);
ok(signIn.ok === true, 'signs in against the real database', JSON.stringify(signIn.message || ''));
ok(signIn.role === 'owner', 'resolves the role from app_users, got ' + signIn.role);

call(a.ctx, 'setRole("owner")');
await call(a.ctx, 'pullFromFirebase()');
const S0 = getState(a.ctx);
ok(S0.lab.length > 100, 'pulled the worker catalogue (' + S0.lab.length + ' workers)');
S0.workDate = ISO;

// ── ISOLATION ─────────────────────────────────────────────────────
// A previous run leaves both a session and a closed day on the server, and
// the pull above brings them back. Without clearing them the run is not
// idempotent and, worse, step 4 would find the PREVIOUS run's ledger row and
// pass even when this run never wrote one — which is exactly how the first
// version of this file reported a pass against code that could not save at all.
if (S0.sessions.some(s => s.supId === SUP_ID)) {
  call(a.ctx, `delSess(${SUP_ID})`);
  await call(a.ctx, 'pushToFirebase()');
}
// Deleted through the app's own authenticated client, so this needs no
// privilege the signed-in owner does not already have.
const wiped = await call(a.ctx,
  `FactoryDB.client().from('day_ledger').delete().eq('work_date', ${JSON.stringify(ISO)})`);
ok(!wiped.error, 'cleared any earlier run\'s closed day', wiped.error && wiped.error.message);
getState(a.ctx).ledger = getState(a.ctx).ledger.filter(e => e.date !== ISO);

// Everyone absent first, so the assertions below are about what WE mark.
call(a.ctx, 'markAll(false)');
for (const id of [SUP_ID, ...WORKERS]) call(a.ctx, `togAtt(${id})`);

const marked = getState(a.ctx).lab.filter(l => l.present).map(l => l.id).sort((x, y) => x - y);
ok(JSON.stringify(marked) === JSON.stringify([1, 2, 205]),
   'three workers marked present locally', JSON.stringify(marked));

// Start a production session with a team, as a supervisor would.
call(a.ctx, `enterSup(${SUP_ID})`);
call(a.ctx, 'addNewTeam()');
const sess0 = getState(a.ctx).sessions.find(s => s.supId === SUP_ID);
ok(!!sess0 && sess0.teams.length === 1, 'a session with one team exists locally');
sess0.teams[0].team = getState(a.ctx).lab.filter(l => WORKERS.includes(l.id));
sess0.teams[0].production = [{ name: 'E2E Widget', qty: 3, unitVal: 100, value: 300 }];
call(a.ctx, 'persist()');
await flush(a);

// ── 2. REFRESH, WITH THE LOCAL COPY DELETED ───────────────────────
//
// A plain reload would keep both the session and the app's own cached state
// in localStorage, and would prove very little — the data could come straight
// back off the cache without Postgres being consulted at all. That is exactly
// the trap the first version of this file fell into.
//
// So: carry the SESSION across, as a browser does, and delete the app's cached
// state (frp_factory_v5). Now everything on screen has to have come from the
// database, which is the actual claim being tested.
step('2. refresh, with the local cache deleted — everything must come from Postgres');
const carried = a.localStorage._dump();
delete carried.frp_factory_v5;
ok(Object.keys(carried).some(k => /auth-token/.test(k)),
   'the signed-in session is carried across the reload',
   'keys: ' + JSON.stringify(Object.keys(carried)));

const b = launch(carried);
await call(b.ctx, 'initFirebase()');
await flush(b, 3);
ok(call(b.ctx, 'currentRole') === 'owner', 'the session is restored without signing in again');

const S1 = getState(b.ctx);
const present1 = S1.lab.filter(l => l.present).map(l => l.id).sort((x, y) => x - y);
ok(JSON.stringify(present1) === JSON.stringify([1, 2, 205]),
   'ATTENDANCE SURVIVES THE REFRESH', 'present after refresh: ' + JSON.stringify(present1));

const sup1 = S1.lab.filter(l => l.isSup && l.present);
ok(sup1.length === 1 && sup1[0].id === SUP_ID,
   'START PRODUCTION has a present supervisor to show', JSON.stringify(sup1.map(s => s.name)));

const sess1 = S1.sessions.find(s => s.supId === SUP_ID);
ok(!!sess1, 'PRODUCTION ENTRY still has the session');
ok(!!sess1 && (sess1.teams || []).length === 1, 'the team survived');
const prod1 = sess1 && sess1.teams[0] && sess1.teams[0].production;
ok(!!prod1 && prod1.length === 1 && prod1[0].qty === 3,
   'the logged production survived', JSON.stringify(prod1));

// ── 3. CLOSE THE DAY ──────────────────────────────────────────────
step('3. close the day');
getState(b.ctx).workDate = ISO;
const saved = await call(b.ctx, 'saveDay()');
ok(saved === true, 'saveDay() reports success');
const alerts = b.logs.log.filter(x => x[0] === 'alert').map(x => String(x[1]));
ok(alerts.some(m => /Day saved/i.test(m)), 'and says so', JSON.stringify(alerts));
const S2 = getState(b.ctx);
ok(S2.ledger.some(e => e.date === ISO), 'the day is in the local ledger');
await flush(b, 2);

// ── 4. RE-LOGIN ON A CLEAN DEVICE ─────────────────────────────────
step('4. log out and back in, from an EMPTY localStorage');
const c = launch({});                       // nothing carried over at all
await call(c.ctx, 'initFirebase()');
const signIn2 = await call(c.ctx, `FactoryDB.signIn(${JSON.stringify(EMAIL)}, ${JSON.stringify(PASSWORD)})`);
ok(signIn2.ok === true, 'signs back in');
call(c.ctx, 'setRole("owner")');
await call(c.ctx, 'pullFromFirebase()');
await flush(c, 2);

const S3 = getState(c.ctx);
const entry = S3.ledger.find(e => e.date === ISO);
ok(!!entry, 'MONTHLY DATA IS STILL THERE AFTER RE-LOGIN',
   'ledger dates: ' + JSON.stringify(S3.ledger.map(e => e.date)));
ok(!!entry && entry.goodsValue === 300, 'and carries the right figures',
   entry ? 'goodsValue=' + entry.goodsValue : '');
ok(!!entry && (entry.productLog || []).length === 1, 'including the production log');

console.log('\n────────────────────────────────');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
