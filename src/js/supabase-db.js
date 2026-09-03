// ══════════════════════════════════════════════════════════════════
//  FACTORY OS — SUPABASE DATA LAYER
//
//  Replaces the Firebase block in app.js. Exposes a single global
//  `FactoryDB`. app.js keeps its existing persist() seam — every
//  screen, report and Excel export is untouched.
//
//  WHY THIS EXISTS (see git log for the pain it replaces):
//  Firestore stored the whole app state in ~4 documents, so two
//  supervisors editing different rows had to rewrite the same doc.
//  That produced last-writer-wins data loss, which was papered over
//  with a 5s echo guard, a 30s poll running alongside listeners, and
//  client-side de-duplication. Rows make all of that unnecessary:
//  a supervisor can only touch their own session row (enforced by
//  RLS), so concurrent writes cannot collide.
// ══════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  var SUPABASE_URL = 'https://oyeektdcndgetfhbohdo.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_uOz27fjW_36Enjf8POW2LQ_vTNjhP0p';

  var sb = null;
  var ready = false;
  var currentRole = null;
  var currentUser = null;
  var channels = [];
  var onRemoteChange = null;

  var OUTBOX_KEY = '_sb_outbox';
  var flushing = false;

  // Kept in the same order as the Promise.all in pull(), so a failed query can
  // be named in the log instead of vanishing into a `|| []`.
  var TABLES = ['workers', 'rm_catalogue', 'fg_catalogue', 'attendance',
                'production_sessions', 'raw_log', 'fg_transfers', 'fg_stock',
                'day_ledger', 'factory_doc'];

  // The worker ids the server actually has, as of the last successful pull.
  // null means "not known yet" — never "empty". push() uses it to avoid
  // sending attendance rows whose foreign key cannot resolve.
  var remoteWorkerIds = null;

  // Whether the last pull() actually got clean data. pull() cannot signal
  // failure through its return value — it returns S, and callers depend on
  // that — but onLoginSuccess() does `pull().then(push)`, so pushing after a
  // failed pull broadcasts whatever stale or wiped state the device happened
  // to hold over good rows on the server. That is one of the ways a whole
  // day's attendance turned into 161 `present: false` rows.
  var lastPullOk = false;

  // ── SYNC INDICATOR ──────────────────────────────────────────────
  function dot(status) {
    var d = document.getElementById('sync-status');
    var t = document.getElementById('sync-text');
    if (d) d.className = 'sync-dot ' + status;
    if (t) t.textContent = status === 'ok'      ? 'Synced'
                         : status === 'syncing' ? 'Syncing...'
                         : 'Offline';
  }

  // ── OFFLINE OUTBOX ──────────────────────────────────────────────
  // Supabase has no built-in offline queue (Firestore did). Writes that
  // fail while offline are parked here and replayed on reconnect, so a
  // supervisor on patchy factory wifi never silently loses an entry.
  function outbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function queue(op) {
    var q = outbox();
    q.push(Object.assign({ _queuedAt: Date.now() }, op));
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(q)); } catch (e) {}
    dot('err');
  }

  function saveOutbox(q) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(q)); } catch (e) {}
  }

  // ── PERMANENT vs TRANSIENT ──────────────────────────────────────
  // The outbox exists for patchy factory wifi: park the write, replay it when
  // the network is back. That is the right answer for a dropped connection and
  // exactly the wrong answer for a row Postgres will NEVER accept.
  //
  // Both used to be treated identically. A supervisor whose write was refused
  // by RLS (42501) or whose worker_id had no row in `workers` (23503) got the
  // op queued, retried on every `online` event and on every Force Sync,
  // failing every time, growing localStorage without bound — while the only
  // signal was the sync pill reading "3 unsynced", which reads as "bad signal",
  // not "the server rejected your data and always will".
  //
  // So: classify. A permanent rejection is reported once and dropped; only
  // genuinely transient failures are worth replaying.
  var PERMANENT = {
    '42501': 'permission denied by the database (your role may not write this)',
    '23503': 'refers to a record that does not exist on the server yet',
    '23505': 'duplicate key',
    '23514': 'failed a database check constraint',
    '22P02': 'malformed value',
    '42703': 'unknown column — the app and the database schema disagree',
    '42P01': 'unknown table — a migration has not been applied'
  };

  var lastWriteError = null;

  function isPermanent(err) {
    return !!(err && err.code && PERMANENT[err.code]);
  }

  function reportPermanent(table, err) {
    lastWriteError = {
      table: table, code: err.code,
      message: err.message,
      hint: PERMANENT[err.code],
      at: Date.now()
    };
    console.error('[FactoryDB] ' + table + ' PERMANENTLY rejected (' + err.code + ' — ' +
                  PERMANENT[err.code] + '): ' + err.message +
                  ' — dropped, not queued. Replaying it would never succeed.');
  }

  async function flushOutbox() {
    if (flushing || !ready || !navigator.onLine) return;
    var q = outbox();
    if (!q.length) return;

    flushing = true;
    dot('syncing');
    var remaining = [];

    for (var i = 0; i < q.length; i++) {
      var op = q[i];
      try {
        var res = await sb.from(op.table).upsert(op.rows, op.opts || {});
        if (res.error) {
          if (isPermanent(res.error)) reportPermanent(op.table, res.error);
          else remaining.push(op);
        }
      } catch (e) {
        remaining.push(op);
      }
    }

    saveOutbox(remaining);
    flushing = false;
    dot(remaining.length ? 'err' : 'ok');
    return remaining.length === 0;
  }

  // Every write goes through here so the offline path is never bypassed.
  async function write(table, rows, opts) {
    if (!rows || (Array.isArray(rows) && !rows.length)) return true;
    if (!ready || !navigator.onLine) {
      queue({ table: table, rows: rows, opts: opts });
      return false;
    }
    try {
      var res = await sb.from(table).upsert(rows, opts || {});
      if (res.error) {
        if (isPermanent(res.error)) {
          reportPermanent(table, res.error);
          dot('err');
          return false;
        }
        console.error('[FactoryDB] write ' + table + ':', res.error.message);
        queue({ table: table, rows: rows, opts: opts });
        return false;
      }
      return true;
    } catch (e) {
      queue({ table: table, rows: rows, opts: opts });
      return false;
    }
  }

  // Delete rows the user has removed locally.
  //
  // push() only ever upserted, so every local delete came straight back on the
  // next pull: removing a raw-material issue, a supervisor session, a worker or
  // a catalogue item looked like it worked and then silently undid itself.
  // Scoped deletes (by work date, or by explicit id list) keep the blast radius
  // to rows the caller can actually see.
  async function removeMissing(table, column, keep, scope) {
    if (!ready || !navigator.onLine) return false;

    // ONLY reconcile against a pull we know succeeded.
    //
    // "Delete every row that is not in my local list" is safe only when the
    // local list is known to mirror the server. If the last pull failed — or
    // never ran — this device's list can be empty for reasons that have
    // nothing to do with anyone deleting anything (loadState() clears the day
    // on a date rollover, for one), and an empty `keep` leaves the scope
    // filters as the entire predicate: it would delete the whole day.
    if (!lastPullOk) return false;
    try {
      var q = sb.from(table).delete();
      if (scope) Object.keys(scope).forEach(function (k) { q = q.eq(k, scope[k]); });
      // Postgrest needs a non-empty list for `not.in`; with nothing to keep,
      // the scope filters alone are the whole predicate.
      if (keep.length) q = q.not(column, 'in', '(' + keep.join(',') + ')');
      var res = await q;
      if (res.error) {
        console.warn('[FactoryDB] reconcile deletes on ' + table + ':', res.error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── INIT ────────────────────────────────────────────────────────
  async function init() {
    if (typeof global.supabase === 'undefined') {
      console.error('[FactoryDB] supabase-js not loaded');
      dot('err');
      return false;
    }
    sb = global.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    ready = true;

    global.addEventListener('online',  function () { dot('syncing'); flushOutbox(); });
    global.addEventListener('offline', function () { dot('err'); });

    var sess = await sb.auth.getSession();
    if (sess.data && sess.data.session) {
      currentUser = sess.data.session.user;
      var restored = await fetchRole(currentUser.id);
      currentRole = restored.role || null;
      if (!currentRole) console.warn('[FactoryDB] session restore:', restored.error);
    }
    return true;
  }

  // ── AUTH ────────────────────────────────────────────────────────
  // Role comes from app_users and is enforced by RLS in Postgres.
  // Editing it in DevTools now achieves nothing.
  //
  // WHY THIS RETURNS A REASON, NOT JUST A ROLE
  // It used to be `.single()` plus `if (r.error || !r.data || !r.data.active)
  // return null`, which collapsed FOUR different failures into one message —
  // "Account is not active. Ask the owner to enable it.":
  //
  //   · the network was down,
  //   · RLS refused the read (42501),
  //   · the sign-in worked but there is NO app_users row at all (PGRST116 —
  //     `.single()` 406s on zero rows), which is what happens to any account
  //     created before migration 0001 added the handle_new_user trigger, or
  //     created straight from the SQL editor,
  //   · the row really does say active = false.
  //
  // Only the last one matches the text we showed. A supervisor whose row was
  // simply never created was told to ask the owner to "enable" an account that
  // does not exist, which is why this was reported as a database error rather
  // than as missing setup. maybeSingle() treats zero rows as data:null instead
  // of an error, so the four cases stay distinguishable.
  async function fetchRole(uid) {
    var r = await sb.from('app_users').select('role,name,active').eq('id', uid).maybeSingle();
    if (r.error) {
      return { error: 'Could not read your account (' + (r.error.code || 'error') + '): ' +
                      r.error.message };
    }
    if (!r.data) {
      return { error: 'Your login works, but you have no factory account yet. ' +
                      'Ask the owner to add you on the Users screen.' };
    }
    if (!r.data.active) {
      return { error: 'Account is not active. Ask the owner to enable it.' };
    }
    return { role: r.data.role, name: r.data.name };
  }

  async function signIn(email, password) {
    var r = await sb.auth.signInWithPassword({ email: email, password: password });
    if (r.error) return { ok: false, message: r.error.message };

    var res = await fetchRole(r.data.user.id);
    if (!res.role) {
      await sb.auth.signOut();
      return { ok: false, message: res.error };
    }
    currentUser = r.data.user;
    currentRole = res.role;
    return { ok: true, role: res.role, user: currentUser };
  }

  async function signOut() {
    stopSync();
    try { await sb.auth.signOut(); } catch (e) {}
    currentUser = null;
    currentRole = null;
  }

  // ── SHAPE HELPERS ───────────────────────────────────────────────
  // Postgres rows <-> the shapes app.js already expects, so no screen
  // or report needs to change.
  // app.js keys opening stock as S.fgStock[STAGE][PRODUCT] everywhere — see
  // getFGBalance() (app.js:3544) and the dashboard packing tile (app.js:1633).
  // These two mappers used to read it the other way round, so fg_stock.product
  // held "Packing" and fg_stock.stage held "Chair A". The app never noticed
  // because both mappers inverted identically and the round trip cancelled
  // out, but the rows in Postgres were wrong for anything reading that table
  // in SQL. Migration 0003 swaps the rows written before this fix.
  function rowsToFgStock(rows) {
    var out = {};
    (rows || []).forEach(function (r) {
      if (!out[r.stage]) out[r.stage] = {};
      out[r.stage][r.product] = Number(r.qty) || 0;
    });
    return out;
  }

  // The snapshot's own state, read off the rows. Every row of one declaration
  // carries the same as_of_date and locked flag, so the first row that has
  // them speaks for the set; `locked` is true only if EVERY row is locked, so
  // a half-written snapshot never reads as settled.
  function rowsToFgOpening(rows) {
    var list = rows || [];
    if (!list.length) return { asOfDate: null, locked: false, lockedBy: null, lockedAt: null };
    var dated = list.find(function (r) { return r.as_of_date; }) || {};
    return {
      asOfDate: dated.as_of_date ? String(dated.as_of_date).slice(0, 10) : null,
      locked:   list.every(function (r) { return !!r.locked; }),
      lockedBy: dated.locked_by || null,
      lockedAt: dated.locked_at || null
    };
  }

  function fgStockToRows(obj) {
    var rows = [];
    Object.keys(obj || {}).forEach(function (stage) {
      var products = obj[stage] || {};
      Object.keys(products).forEach(function (product) {
        rows.push({ product: product, stage: stage, qty: Number(products[product]) || 0 });
      });
    });
    return rows;
  }

  // `createdBy` is carried through deliberately. sessions_read lets a
  // supervisor SELECT every supervisor's row for the day, but
  // sessions_sup_update only lets them UPDATE their own — so push() has to
  // know which of the rows it just read actually belong to this user. Dropping
  // the column here is what made push() stamp its own uid onto everyone's row.
  //
  // `date` is projected for a reason that cost a day of production data. Every
  // guard that decides whether a session belongs to the OPEN day or to a
  // CLOSED one keys off this field — isDaySaved(s.date) in day-rollover.js
  // above all. Dropping it here made `s.date` undefined on every session that
  // had been through a pull, so isDaySaved(undefined) answered "not saved",
  // and the midnight rollover carried a closed day's production into the new
  // day and re-stamped it. The ledger then held the same production twice.
  function sessionRowToState(r) {
    return {
      date:      r.work_date,
      supId:     r.sup_id,
      supName:   r.sup_name,
      supWage:   Number(r.sup_wage) || 0,
      supOT:     Number(r.sup_ot) || 0,
      teams:     r.teams || [],
      createdBy: r.created_by || null
    };
  }

  // ── PULL ────────────────────────────────────────────────────────
  async function pull(S) {
    if (!ready) return S;
    lastPullOk = false;
    var workDate = S.workDate || new Date().toISOString().slice(0, 10);

    try {
      var res = await Promise.all([
        sb.from('workers').select('*').eq('active', true).order('name'),
        sb.from('rm_catalogue').select('*').order('name'),
        sb.from('fg_catalogue').select('*').order('name'),
        sb.from('attendance').select('*').eq('work_date', workDate),
        sb.from('production_sessions').select('*').eq('work_date', workDate),
        sb.from('raw_log').select('*').eq('work_date', workDate),
        // NOT filtered by work_date. FG stock is cumulative: getFGBalance()
        // subtracts transfers from all-time production, so fetching only the
        // open day's transfers made every past transfer-out disappear from
        // the balance and stage stock inflated a little more each day.
        sb.from('fg_transfers').select('*'),
        sb.from('fg_stock').select('*'),
        sb.from('day_ledger').select('*').order('work_date'),
        sb.from('factory_doc').select('*')
      ]);

      // WHY THIS LOOP EXISTS
      // postgrest-js never rejects: a network failure, an RLS refusal and an
      // genuinely empty table all arrive as a resolved { data: null, error }.
      // pull() read `res[N].data || []` and never once looked at `.error`, so
      // a failed query was indistinguishable from an empty table — and it
      // still called dot('ok') at the end. That is how a device could sit
      // there reading "Synced" while showing nobody as present.
      //
      // factory_doc is the one expected refusal: RLS deliberately returns
      // nothing to a supervisor for the owner-only keys, which is not an error.
      var failed = res.map(function (r, i) {
        if (!r.error) return null;
        if (TABLES[i] === 'factory_doc' && currentRole !== 'owner') return null;
        return TABLES[i] + ': ' + r.error.message;
      }).filter(Boolean);

      var workers = res[0].data || [];
      var att     = {};
      (res[3].data || []).forEach(function (a) { att[a.worker_id] = a; });

      // push() needs this to avoid sending attendance for a worker the
      // `workers` table has never heard of — see the FK guard there.
      remoteWorkerIds = workers.length
        ? workers.reduce(function (set, w) { set[w.id] = true; return set; }, {})
        : null;

      // FIRST-RUN GUARD.
      // On a fresh database every catalogue query returns []. Without this,
      // the first login would wipe the local worker list, RM list and
      // product list — i.e. destroy the data we are trying to migrate.
      // An empty remote catalogue never overwrites a populated local one;
      // the subsequent push() seeds the tables from local instead.
      function adopt(key, remote, mapper) {
        var local = S[key] || [];
        if (!remote.length && local.length) {
          console.warn('[FactoryDB] ' + key + ' empty remotely — keeping ' +
                       local.length + ' local rows for seeding');
          return local;
        }
        return remote.map(mapper);
      }

      S.lab = adopt('lab', workers, function (w) {
        var a = att[w.id] || {};
        return {
          id: w.id, name: w.name, role: w.role,
          wage: Number(w.wage) || 0,
          isSup: !!w.is_supervisor,
          present:  !!a.present,
          doingOT:  !!a.doing_ot,
          otHours:  Number(a.ot_hours) || 0
        };
      });

      S.rm = adopt('rm', res[1].data || [], function (r) {
        return { id: r.id, name: r.name, unit: r.unit, price: Number(r.price) || 0 };
      });
      S.fg = adopt('fg', res[2].data || [], function (r) {
        return { id: r.id, name: r.name, price: Number(r.price) || 0 };
      });

      // MERGE, DO NOT REPLACE.
      // enterSup() creates a session in memory the moment a supervisor taps
      // their card. Any realtime event — most often the owner marking
      // attendance on another device — used to land here and replace
      // S.sessions wholesale, deleting that not-yet-pushed session.
      //
      // The Production screen is deliberately never repainted from a remote
      // event (sync.js), so the supervisor kept looking at a live team screen
      // whose handlers had all started returning early: "+ Add New Team" did
      // nothing, tapping a worker did nothing, with no error anywhere. That is
      // the "cannot create or assign the team" report.
      //
      // logProd() already improvised a self-heal for exactly this ("if a
      // background sync wiped the session while this screen was open, rebuild
      // it"). Keeping the local row here fixes it for every handler at once.
      var remoteSessions = res[4].error ? (S.sessions || [])
                                       : (res[4].data || []).map(sessionRowToState);
      var remoteSupIds = remoteSessions.reduce(function (set, ss) {
        set[ss.supId] = true; return set;
      }, {});
      var localOnly = (S.sessions || []).filter(function (ss) {
        return !remoteSupIds[ss.supId];
      });
      S.sessions = remoteSessions.concat(localOnly);

      // Each of these is guarded on `!res[N].error` for the same reason the
      // ledger is: postgrest resolves a failed query as { data: null, error },
      // so `.data || []` silently turned a 500, an expired JWT or an RLS
      // refusal into "the table is empty" — and blanked live, in-progress work
      // on the strength of it.
      if (!res[5].error) S.rawLog = (res[5].data || []).map(function (r) {
        return {
          id: r.id, date: r.work_date, stage: r.stage, name: r.rm_name, unit: r.unit,
          qty: Number(r.qty) || 0,
          unitPrice: Number(r.unit_price) || 0,
          cost: Number(r.cost) || 0,
          loggedBy: r.logged_by || null
        };
      });

      if (!res[6].error) S.fgTransfers = (res[6].data || []).map(function (r) {
        return {
          id: r.id, date: r.work_date, product: r.product, from: r.from_stage,
          to: r.to_stage, qty: Number(r.qty) || 0,
          loggedBy: r.logged_by || null
        };
      });

      if (!res[7].error) {
        S.fgStock   = rowsToFgStock(res[7].data);
        S.fgOpening = rowsToFgOpening(res[7].data);
      }

      // SAME FIRST-RUN GUARD AS THE CATALOGUES, AND FOR THE SAME REASON.
      // This used to overwrite S.ledger unconditionally. day_ledger is written
      // by exactly one call (saveDay) and is never re-pushed, so the moment
      // that one write failed — or the read was refused — the next pull
      // replaced a full local month with []. Closing a day would appear to
      // work, and the Monthly screen would be empty after the next login.
      // An empty remote ledger never erases a populated local one.
      if (res[8].error) {
        console.warn('[FactoryDB] day_ledger read failed — keeping the local ledger');
      } else {
        var remoteLedger = (res[8].data || []).map(function (r) {
          // work_date LAST, so it wins. It used to be first, which let a stale
          // or differently-formatted `payload.date` override the column the
          // row is actually keyed by — and month.js filters on that date, so
          // such an entry is stored correctly in Postgres and invisible in the
          // UI, with no error anywhere.
          return Object.assign({}, r.payload || {}, { date: r.work_date });
        });
        if (remoteLedger.length || !(S.ledger || []).length) {
          S.ledger = remoteLedger;
        } else {
          console.warn('[FactoryDB] day_ledger empty remotely — keeping ' +
                       S.ledger.length + ' local day(s) for re-saving');
        }
      }

      // Owner-only documents. RLS returns nothing here for supervisors,
      // so guard with `!== undefined` rather than clobbering with {}.
      (res[9].data || []).forEach(function (d) {
        var map = {
          orders: 'orders', dispatches: 'dispatches', salary_adj: 'salaryAdj',
          bom: 'bom', unit_transfers: 'unitTransfers',
          order_reservations: 'orderReservations',
          rm_stock: 'stock', purchases: 'purchases',
          fg_adjustments: 'fgAdjustments'
        };
        var key = map[d.key];
        if (key && d.data !== undefined && d.data !== null) S[key] = d.data;
      });

      if (failed.length) {
        console.error('[FactoryDB] pull errors:', failed);
        dot('err');
      } else {
        lastPullOk = true;
        dot(outbox().length ? 'err' : 'ok');
      }
    } catch (e) {
      console.error('[FactoryDB] pull:', e);
      dot('err');
    }
    return S;
  }

  // ── PUSH ────────────────────────────────────────────────────────
  // Routed by role. Each role writes only what it owns — anything else
  // is rejected by RLS, not by trusting the client.
  async function push(S, role) {
    if (!ready) return;
    role = role || currentRole;
    var workDate = S.workDate || new Date().toISOString().slice(0, 10);
    var uid = currentUser ? currentUser.id : null;
    dot('syncing');

    // ── CATALOGUES FIRST ──
    // attendance.worker_id and production_sessions.sup_id are foreign keys
    // into workers(id). Writing those before the catalogue exists fails with
    // 23503 on a fresh database and dumps everything into the outbox, so the
    // catalogue must land first.
    if (role === 'owner') {
      await write('workers', (S.lab || []).map(function (l) {
        return {
          id: l.id, name: l.name, role: l.role,
          wage: Number(l.wage) || 0, is_supervisor: !!l.isSup, active: true
        };
      }), { onConflict: 'id' });

      await write('rm_catalogue', (S.rm || []).map(function (r) {
        return { id: r.id, name: r.name, unit: r.unit, price: Number(r.price) || 0 };
      }), { onConflict: 'id' });

      await write('fg_catalogue', (S.fg || []).map(function (f) {
        return { id: f.id, name: f.name, price: Number(f.price) || 0 };
      }), { onConflict: 'id' });

      // ── CATALOGUE DELETIONS ──
      // delLab/delRM/delFG removed the item from S only, so pull() restored it
      // on the next sync and deleting a worker looked like it silently failed.
      //
      // Only run when the local list is non-empty. An empty list here is far
      // more likely to be a device that has not loaded yet than an owner who
      // really means "remove every worker in the factory" — the same reasoning
      // as the first-run guard in pull(), and the stakes are higher in this
      // direction because this one destroys rows.
      //
      // Workers are DEACTIVATED rather than deleted: attendance.worker_id is
      // `on delete cascade`, so a hard delete would take that worker's
      // attendance history with it. pull() already filters on active = true.
      if ((S.lab || []).length) {
        var keepIds = S.lab.map(function (l) { return l.id; });
        try {
          var r = await sb.from('workers').update({ active: false })
                    .not('id', 'in', '(' + keepIds.join(',') + ')').eq('active', true);
          if (r.error) console.warn('[FactoryDB] deactivate workers:', r.error.message);
        } catch (e) {}
      }
      if ((S.rm || []).length) {
        await removeMissing('rm_catalogue', 'id', S.rm.map(function (r) { return r.id; }));
      }
      if ((S.fg || []).length) {
        await removeMissing('fg_catalogue', 'id', S.fg.map(function (f) { return f.id; }));
      }
    }

    if (role === 'supervisor' || role === 'owner') {
      // ── FOREIGN KEY GUARD ──
      // attendance.worker_id references workers(id), and only the owner may
      // write `workers`. On a database whose catalogue has never been seeded,
      // pull()'s first-run guard deliberately KEEPS the local seed list — so a
      // supervisor's device holds ~160 workers that Postgres has never heard
      // of. Every one of those attendance rows fails the FK with 23503, and
      // because it is one INSERT statement, the whole batch fails: nobody is
      // marked present, on any device, and the only clue is the sync pill.
      //
      // A supervisor cannot fix that themselves, so say so plainly instead of
      // filling the outbox with rows that can never land.
      var lab = S.lab || [];
      if (role !== 'owner' && remoteWorkerIds) {
        var unknown = lab.filter(function (l) { return !remoteWorkerIds[l.id]; });
        if (unknown.length) {
          console.error('[FactoryDB] ' + unknown.length + ' worker(s) on this device are ' +
                        'not in the server catalogue, so their attendance cannot be saved. ' +
                        'The owner needs to sign in once to publish the worker list.');
          lab = lab.filter(function (l) { return remoteWorkerIds[l.id]; });
        }
      }

      // ── ONLY PUSH THE WORKERS THIS DEVICE ACTUALLY MARKED ──
      // Every device used to push a row for EVERY worker, upserting on
      // (work_date, worker_id). attendance is multi-writer — two supervisors
      // mark their own lines — so the last device to push simply overwrote the
      // other's marks with its own stale view: one phone that had been in a
      // pocket since morning set the whole factory absent for the day.
      //
      // A device may only assert attendance for workers it has touched since
      // its last push. Everyone else's rows are left exactly as they are. An
      // unmarked worker has no row at all, which already means absent, so
      // nothing is lost by staying quiet about them.
      var touched = readDirty(workDate);
      var attLab = lab.filter(function (l) { return touched[l.id]; });
      var attRows = attLab.map(function (l) {
        return {
          work_date: workDate, worker_id: l.id,
          present: !!l.present, doing_ot: !!l.doingOT,
          ot_hours: Number(l.otHours) || 0, marked_by: uid
        };
      });
      if (attRows.length) {
        await write('attendance', attRows, { onConflict: 'work_date,worker_id' });
        // Cleared only after the write, not on pull: a mark made between a
        // pull and a push must not be forgotten before it has landed.
        var left = readDirty(workDate);
        attLab.forEach(function (l) { delete left[l.id]; });
        writeDirty(workDate, left);
      }

      // ── ONLY PUSH SESSIONS THIS USER MAY WRITE ──
      // sessions_read lets a supervisor SELECT every session row for the day,
      // so pull() hands S.sessions rows belonging to other supervisors and to
      // the owner. This then mapped ALL of them back with `created_by: uid`,
      // i.e. it tried to take ownership of other people's rows.
      //
      // sessions_sup_update requires `created_by = auth.uid()`, so those rows
      // fail the RLS check with 42501 — and since PostgREST sends the batch as
      // a single INSERT ... ON CONFLICT statement, the failure aborts the whole
      // statement INCLUDING this supervisor's own row. The result: on any day
      // where a second person already had a session, a supervisor's production
      // never reached Postgres at all. It fired on the very first push after
      // login, because onLoginSuccess() pulls and then immediately pushes.
      var ownSessions = (S.sessions || []).filter(function (ss) {
        return role === 'owner' || !ss.createdBy || ss.createdBy === uid;
      });
      var skipped = (S.sessions || []).length - ownSessions.length;
      if (skipped) {
        console.warn('[FactoryDB] not pushing ' + skipped + ' session(s) owned by ' +
                     'another user — they are theirs to write, not ours.');
      }

      var sessRows = ownSessions.map(function (ss) {
        return {
          work_date: workDate, sup_id: ss.supId, sup_name: ss.supName,
          sup_wage: Number(ss.supWage) || 0, sup_ot: Number(ss.supOT) || 0,
          teams: ss.teams || [], created_by: ss.createdBy || uid
        };
      });
      await write('production_sessions', sessRows, { onConflict: 'work_date,sup_id' });

      // A session removed with delSess() has to be removed on the server too,
      // or the next pull brings it straight back.
      //
      // Scoped to created_by for a supervisor, NOT left to RLS. RLS would in
      // fact filter other people's rows out of the DELETE, but a delete whose
      // safety depends on a policy elsewhere is one policy edit away from
      // wiping the day. State the intent in the query.
      var sessScope = { work_date: workDate };
      if (role !== 'owner') sessScope.created_by = uid;
      await removeMissing('production_sessions', 'sup_id',
        ownSessions.map(function (ss) { return ss.supId; })
                   .filter(function (id) { return typeof id === 'number'; }),
        sessScope);
    }

    if (role === 'supervisor' || role === 'rm' || role === 'owner') {
      // ── EACH ROW CARRIES ITS OWN DATE ──
      // These two tables upsert on `id`, so stamping a single global
      // `workDate` onto every row did not merely mislabel them — it MOVED an
      // existing row from the day it was recorded on to the day the device
      // happened to be showing, deleting it from the first. Falling back to
      // workDate keeps rows created in this session (which have no date yet)
      // on the open day.
      var rawRows = (S.rawLog || []).map(function (r) {
        return {
          id: r.id, work_date: r.date || workDate, stage: r.stage, rm_name: r.name,
          unit: r.unit, qty: Number(r.qty) || 0,
          unit_price: Number(r.unitPrice) || 0,
          cost: Number(r.cost) || 0, logged_by: r.loggedBy || uid
        };
      });
      await write('raw_log', rawRows, { onConflict: 'id' });

      var xferRows = (S.fgTransfers || []).map(function (t) {
        return {
          id: t.id, work_date: t.date || workDate, product: t.product,
          from_stage: t.from, to_stage: t.to,
          qty: Number(t.qty) || 0, logged_by: t.loggedBy || uid
        };
      });
      await write('fg_transfers', xferRows, { onConflict: 'id' });

      // fg_stock is NOT pushed here any more.
      //
      // Opening stock is a one-time declaration by the owner, not shop-floor
      // data. Re-pushing the whole table from every device on every sync meant
      // a supervisor's phone — holding whatever it last pulled, possibly
      // stale — could overwrite the owner's figures at any moment. It is now
      // written only by saveOpeningStock(), and only by an owner (RLS).

      // delRaw() and the transfer screens remove rows from S only. push() was
      // upsert-only, so the row stayed in Postgres and the next pull put it
      // straight back — a delete that undid itself a few seconds later.
      // Scoped to the work date, so an older day's rows are never touched.
      //
      // Scoped to logged_by as well as the work date. raw_log and fg_transfers
      // are multi-writer tables: without the author filter, a device that
      // pushed before someone else's new row had reached it would read that
      // row's absence as a deletion and remove it. A device may only retract
      // what it wrote itself.
      var mine = function (r) { return (r.logged_by || uid) === uid; };
      await removeMissing('raw_log', 'id',
        rawRows.filter(mine).map(function (r) { return r.id; }),
        { work_date: workDate, logged_by: uid });
      await removeMissing('fg_transfers', 'id',
        xferRows.filter(mine).map(function (r) { return r.id; }),
        { work_date: workDate, logged_by: uid });
    }

    if (role === 'owner') {
      var docs = [
        ['orders', S.orders], ['dispatches', S.dispatches],
        ['salary_adj', S.salaryAdj], ['bom', S.bom],
        ['unit_transfers', S.unitTransfers],
        ['order_reservations', S.orderReservations],
        ['rm_stock', S.stock], ['purchases', S.purchases],
        ['fg_adjustments', S.fgAdjustments]
      ].filter(function (d) { return d[1] !== undefined; })
       .map(function (d) { return { key: d[0], data: d[1], updated_by: uid }; });

      await write('factory_doc', docs, { onConflict: 'key' });
    }

    dot(outbox().length ? 'err' : 'ok');
  }

  // ── WHOSE ATTENDANCE THIS DEVICE MAY SPEAK FOR ──
  // Worker ids marked on this device and not yet pushed, scoped to the day
  // they were marked on.
  //
  // Held in localStorage, not in a variable: a supervisor who marks the line
  // present and then reloads (or is reloaded by the PWA) would otherwise lose
  // the claim while the marks themselves survive in the state blob, and those
  // marks would never reach Postgres.
  var ATT_DIRTY_KEY = '_att_dirty';
  function readDirty(workDate) {
    try {
      var raw = global.localStorage.getItem(ATT_DIRTY_KEY);
      if (!raw) return {};
      var box = JSON.parse(raw);
      // Scoped to a date so yesterday's claims cannot be asserted against today.
      if (!box || box.date !== workDate) return {};
      return box.ids || {};
    } catch (e) { return {}; }
  }
  function writeDirty(workDate, ids) {
    try {
      global.localStorage.setItem(ATT_DIRTY_KEY,
        JSON.stringify({ date: workDate, ids: ids }));
    } catch (e) {}
  }
  function markAttendanceDirty(id, workDate) {
    if (id === undefined || id === null) return;
    var d = workDate || null;
    var ids = readDirty(d);
    ids[id] = true;
    writeDirty(d, ids);
  }

  // ── IS THIS DEVICE'S CLOCK RIGHT? ──────────────────────────────
  // Every work_date the app writes comes from the DEVICE clock, and lands in a
  // Postgres `date` column that the monthly reports group by. A phone with the
  // wrong date files a real shift under the wrong day and nothing says so.
  //
  // The app cannot fix the clock, so it reports the disagreement instead.
  // Null when the check could not run (offline, or the function is not
  // deployed yet) — never guessed, because a wrong "all clear" is worse than
  // no answer.
  var clockSkew = null;
  async function checkClock(deviceToday) {
    if (!ready) return null;
    try {
      var res = await sb.rpc('server_today');
      if (res.error || !res.data) return null;
      var server = String(res.data).slice(0, 10);
      clockSkew = (server === deviceToday) ? null : { device: deviceToday, server: server };
      if (clockSkew) {
        console.error('[FactoryDB] this device thinks today is ' + deviceToday +
                      ', the server says ' + server +
                      ' — work would be filed under the wrong day');
      }
      return clockSkew;
    } catch (e) { return null; }
  }

  // ── OPENING STOCK ───────────────────────────────────────────────
  // The owner's declaration of what the factory held on its go-live date.
  // Written only here, and only by an owner — RLS refuses anyone else, and a
  // trigger refuses everyone once the snapshot is locked.
  //
  // `replace` is deliberate: the screen submits the WHOLE table, so a product
  // whose quantity was cleared to zero has to lose its row rather than keep
  // the old figure. Zero rows are dropped, which is what makes "leave blank
  // for nothing" mean the same as typing 0.
  async function saveOpeningStock(fgStock, asOfDate, lock) {
    if (!ready) return false;
    var rows = fgStockToRows(fgStock).filter(function (r) { return r.qty > 0; });

    // ONE call, not a delete followed by an insert.
    //
    // Replacing a declaration means removing the old rows and writing the new
    // ones, and a product dropped from the table has to lose its row — an
    // upsert cannot express that. Done as two requests there was a window in
    // which the factory's opening stock did not exist, and an insert that
    // failed after the delete had succeeded left it that way: gone from
    // Postgres, with the only copy in whichever browser tab was still open.
    //
    // save_opening_stock() does both inside one transaction, re-checks that
    // the caller is an owner (definer rights mean the table's policy no longer
    // applies), and refuses to overwrite a locked declaration — leaving the
    // existing figures untouched when it does.
    try {
      var res = await sb.rpc('save_opening_stock', {
        rows_in: rows, as_of: asOfDate || null, lock_it: !!lock
      });
      if (res.error) {
        lastWriteError = {
          table: 'fg_stock', code: res.error.code, message: res.error.message,
          hint: 'opening stock was not saved', at: Date.now()
        };
        console.error('[FactoryDB] opening stock:', res.error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[FactoryDB] opening stock:', e);
      return false;
    }
  }

  /** Unlock the snapshot for editing. Owner only; the trigger enforces it. */
  async function setOpeningLock(locked) {
    if (!ready) return false;
    try {
      var res = await sb.from('fg_stock').update({ locked: !!locked }).not('product', 'is', null);
      if (res.error) {
        console.error('[FactoryDB] opening stock lock:', res.error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[FactoryDB] opening stock lock:', e);
      return false;
    }
  }

  // ── SAVE DAY ────────────────────────────────────────────────────
  // One row per day. No 1 MiB ceiling, unlike the old ledger[] array.
  async function saveDay(workDate, payload) {
    return write('day_ledger', [{
      work_date: workDate, payload: payload,
      saved_by: currentUser ? currentUser.id : null
    }], { onConflict: 'work_date' });
  }

  // ── REALTIME ────────────────────────────────────────────────────
  // Postgres change feed. No echo guard needed: a supervisor's own row
  // is the only row they can write, so an incoming event for someone
  // else's row can be applied unconditionally.
  function startSync(S, role, onUpdate) {
    if (!ready) return;
    stopSync();
    onRemoteChange = onUpdate;

    // day_ledger is watched too. Without it, one device closing the day was
    // invisible everywhere else: the other devices kept the day open, kept
    // accepting production against it, and kept pushing rows for a day the
    // factory had already closed and reported.
    var watch = ['attendance', 'production_sessions', 'raw_log',
                 'fg_transfers', 'fg_stock', 'factory_doc', 'day_ledger'];

    var ch = sb.channel('factory-live');
    watch.forEach(function (table) {
      ch.on('postgres_changes',
        { event: '*', schema: 'public', table: table },
        function () { refresh(S, role); });
    });
    ch.subscribe(function (status) {
      if (status !== 'SUBSCRIBED') { dot('syncing'); return; }
      // Never claim "Synced" while writes are still queued offline.
      dot(outbox().length ? 'err' : 'ok');
    });
    channels.push(ch);
  }

  // Coalesce bursts — a supervisor saving 10 rows fires 10 events.
  var refreshTimer = null;
  function refresh(S, role) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async function () {
      await pull(S);
      if (onRemoteChange) onRemoteChange(S, role);
    }, 400);
  }

  function stopSync() {
    channels.forEach(function (c) { try { sb.removeChannel(c); } catch (e) {} });
    channels = [];
    clearTimeout(refreshTimer);
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  global.FactoryDB = {
    init: init,
    signIn: signIn,
    signOut: signOut,
    pull: pull,
    push: push,
    saveDay: saveDay,
    saveOpeningStock: saveOpeningStock,
    setOpeningLock: setOpeningLock,
    startSync: startSync,
    stopSync: stopSync,
    flushOutbox: flushOutbox,
    pendingWrites: function () { return outbox().length; },
    lastPullOk: function () { return lastPullOk; },
    checkClock: checkClock,
    clockSkew: function () { return clockSkew; },
    lastWriteError: function () { return lastWriteError; },
    isReady: function () { return ready; },
    role: function () { return currentRole; },
    user: function () { return currentUser; },
    client: function () { return sb; },
    setSyncDot: dot,
    markAttendanceDirty: markAttendanceDirty
  };

})(window);
