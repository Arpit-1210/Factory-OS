// ── MULTI-DEVICE SYNC ──
// Reported from the factory: user A edits salary or logs production on a
// phone, and other devices keep showing stale figures until someone reloads
// the browser — at which point they are dropped at the login screen and have
// to sign in again, and only then see the change.
//
// That is two independent faults, and both are covered here:
//
//   1. Realtime was subscribed but never enabled server-side. No table was in
//      the `supabase_realtime` publication, so Postgres streamed nothing. The
//      client still reported SUBSCRIBED, so the sync indicator said "Synced"
//      while every device was effectively isolated.
//
//   2. A reload dropped the user at the login screen even though Supabase had
//      a valid persisted session, because the app checked its own currentRole
//      (null on a fresh load) rather than asking FactoryDB, which had already
//      recovered the session during init().
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boot } from './harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── FAKE SUPABASE ───────────────────────────────────────────────────
function fakeSupabase({ session = null, role = null, active = true } = {}) {
  const subscribed = [];
  let onStatus = null;
  const client = {
    _subscribed: subscribed,
    _emit(status) { if (onStatus) onStatus(status); },
    from: (table) => {
      const q = {
        _f: [],
        select: () => q, eq: (c, v) => (q._f.push([c, v]), q), order: () => q,
        single: () => Promise.resolve(
          table === 'app_users' && role
            ? { data: { id: 'u1', role, name: 'Karan', active }, error: null }
            : { data: null, error: { message: 'not found' } }),
        maybeSingle: () => Promise.resolve(
          table === 'app_users' && role
            ? { data: { id: 'u1', role, name: 'Karan', active }, error: null }
            : { data: null, error: null }),
        not: () => q, update: () => q, delete: () => q,
        then: (r) => Promise.resolve({ data: [], error: null }).then(r),
        upsert: () => Promise.resolve({ data: null, error: null }),
      };
      return q;
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      signInWithPassword: () => Promise.resolve({ data: { user: { id: 'u1', email: 'karan@x.com' } }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: () => {
      const ch = {
        on: (_evt, cfg) => { subscribed.push(cfg.table); return ch; },
        subscribe: (cb) => { onStatus = cb; cb && cb('SUBSCRIBED'); return ch; },
      };
      return ch;
    },
    removeChannel: () => {},
  };
  return { createClient: () => client, _client: client };
}

describe('realtime is actually enabled server-side', () => {
  // The client half was never the problem; the publication was.
  // EVERY migration, not one named file. Pinning 0004 meant a table published
  // by a later migration read as unpublished — and, worse, that a table added
  // to the client's watch list with no migration at all would only be caught
  // if someone remembered to edit 0004 specifically.
  const MIGRATION = fs.readdirSync(path.join(ROOT, 'supabase/migrations'))
    .filter(f => f.endsWith('.sql'))
    .map(f => fs.readFileSync(path.join(ROOT, 'supabase/migrations', f), 'utf8'))
    .join('\n');

  const WATCHED = ['attendance', 'production_sessions', 'raw_log',
                   'fg_transfers', 'fg_stock', 'factory_doc',
                   // Closing a day writes one row, to this table. Unwatched,
                   // one device closing the day was invisible to the others.
                   'day_ledger'];

  test('every table the client subscribes to is added to the publication', async () => {
    const sb = fakeSupabase();
    const h = boot({ supabase: sb });
    await h.win.FactoryDB.init();
    h.win.FactoryDB.startSync(h.win.S, 'owner', () => {});

    const subscribed = sb._client._subscribed;
    assert.deepEqual(subscribed.slice().sort(), WATCHED.slice().sort(),
      'the client subscribes to exactly these tables');

    for (const t of subscribed) {
      assert.match(MIGRATION, new RegExp('(^|[^a-z_])' + t + '([^a-z_]|$)'),
        `${t} is subscribed but never added to supabase_realtime — ` +
        'the channel would report SUBSCRIBED and receive nothing');
    }
  });

  test('the migration adds to the publication and can be re-run', () => {
    assert.match(MIGRATION, /alter publication supabase_realtime add table/i);
    assert.match(MIGRATION, /duplicate_object/,
      'adding a published table twice raises 42710; re-running must be safe');
  });

  test('replica identity is set so RLS can evaluate update and delete events', () => {
    // With the default identity an UPDATE carries only the primary key, which
    // is not enough for a policy that reads other columns — those events are
    // filtered out and never arrive.
    assert.match(MIGRATION, /replica identity full/i);
  });
});

describe('a reload does not sign the user out', () => {
  const LIVE_SESSION = { user: { id: 'u1', email: 'karan@x.com' } };

  test('FactoryDB recovers the persisted session and its role', async () => {
    const h = boot({ supabase: fakeSupabase({ session: LIVE_SESSION, role: 'supervisor' }) });
    await h.win.FactoryDB.init();
    assert.equal(h.win.FactoryDB.role(), 'supervisor');
    assert.equal(h.win.FactoryDB.user().email, 'karan@x.com');
  });

  test('and the app puts that user back into the signed-in view', async () => {
    const h = boot({ supabase: fakeSupabase({ session: LIVE_SESSION, role: 'owner' }) });
    await h.win.FactoryDB.init();

    assert.equal(await h.win.restoreSession(), true);
    assert.equal(h.win.currentRole, 'owner', 'the app role is set from the session');
    assert.equal(h.document.getElementById('login-page').style.display, 'none',
      'the login page is dismissed');
    assert.equal(h.document.getElementById('app-shell').style.display, 'flex',
      'the app shell is shown');
  });

  test('the role tag names the signed-in user', async () => {
    const h = boot({ supabase: fakeSupabase({ session: LIVE_SESSION, role: 'owner' }) });
    await h.win.FactoryDB.init();
    await h.win.restoreSession();
    assert.match(h.document.getElementById('role-tag').textContent, /karan/i);
  });

  test('with no session, the login page stays up', async () => {
    const h = boot({ supabase: fakeSupabase({ session: null }) });
    await h.win.FactoryDB.init();
    assert.equal(await h.win.restoreSession(), false);
    assert.equal(h.win.currentRole, null);
  });

  test('a session whose account was deactivated is NOT restored', async () => {
    // fetchRole() returns null for an inactive account, so there is no role to
    // restore — the user must sign in again and be told why.
    const h = boot({ supabase: fakeSupabase({ session: LIVE_SESSION, role: 'owner', active: false }) });
    await h.win.FactoryDB.init();
    assert.equal(await h.win.restoreSession(), false);
    assert.equal(h.win.currentRole, null);
  });

  test('restoring is refused before the data layer is ready', async () => {
    const h = boot();   // no supabase global at all
    assert.equal(await h.win.restoreSession(), false);
  });
});

describe('a day closed on another device is acted on, not just received', () => {
  // day_ledger was added to the realtime watch list, but the callback
  // startFirebaseSync() registers did its own setS() and repaint and never
  // reconciled — so the event arrived, the pull ran, and nothing happened.
  // The table was watched to no purpose. This covers the callback itself.
  const captureCallback = async () => {
    const h = boot({ supabase: fakeSupabase({ role: 'owner' }) });
    await h.win.FactoryDB.init();
    h.win.setFbEnabled(true);
    h.win.setRole('owner');

    let onUpdate = null;
    h.win.FactoryDB.startSync = (_S, _role, cb) => { onUpdate = cb; };
    h.win.startFirebaseSync();
    assert.ok(onUpdate, 'startFirebaseSync must register a callback');
    return { h, onUpdate };
  };

  test('the open day flips to a closed day when its ledger row arrives', async () => {
    const { h, onUpdate } = await captureCallback();

    // What the pull produces after another device closed 2026-08-19: the
    // ledger row has arrived, and the day's operational rows are still there.
    onUpdate({
      workDate: '2026-08-19',
      ledger: [{
        date: '2026-08-19',
        sessions: [{ supId: 9, supName: 'Karan', supWage: 800, teams: [] }],
        attendance: [], rawLog: [],
      }],
      sessions: [
        { supId: 9, supName: 'Karan', date: '2026-08-19', teams: [] },
        { supId: 8, supName: 'Leftover', date: '2026-08-19', teams: [] },
      ],
      lab: [], rawLog: [], fgTransfers: [], fgStock: {},
    }, 'owner');

    const S = h.win.S;
    assert.equal(S.reopenDate, '2026-08-19',
      'the day is now a closed day being viewed, not today’s work');
    assert.deepEqual(S.sessions.map(s => s.supName), ['Karan'],
      'the ledger entry replaces the leftover operational rows');
  });

  test('an ordinary remote change leaves an open day alone', async () => {
    const { h, onUpdate } = await captureCallback();

    onUpdate({
      workDate: '2026-08-19',
      ledger: [],
      sessions: [{ supId: 9, supName: 'Karan', date: '2026-08-19', teams: [] }],
      lab: [], rawLog: [], fgTransfers: [], fgStock: {},
    }, 'owner');

    const S = h.win.S;
    assert.ok(!S.reopenDate);
    assert.equal(S.sessions.length, 1);
  });
});
