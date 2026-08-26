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
  const MIGRATION = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/0004_enable_realtime.sql'), 'utf8');

  const WATCHED = ['attendance', 'production_sessions', 'raw_log',
                   'fg_transfers', 'fg_stock', 'factory_doc'];

  test('every table the client subscribes to is added to the publication', async () => {
    const sb = fakeSupabase();
    const h = boot({ supabase: sb });
    await h.win.FactoryDB.init();
    h.win.FactoryDB.startSync(h.win.S, 'owner', () => {});

    const subscribed = sb._client._subscribed;
    assert.deepEqual(subscribed.slice().sort(), WATCHED.slice().sort(),
      'the client subscribes to exactly these tables');

    for (const t of subscribed) {
      assert.match(MIGRATION, new RegExp(`'${t}'`),
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
