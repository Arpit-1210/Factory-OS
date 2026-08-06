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
        if (res.error) remaining.push(op);
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
      currentRole = await fetchRole(currentUser.id);
    }
    return true;
  }

  // ── AUTH ────────────────────────────────────────────────────────
  // Role comes from app_users and is enforced by RLS in Postgres.
  // Editing it in DevTools now achieves nothing.
  async function fetchRole(uid) {
    var r = await sb.from('app_users').select('role,name,active').eq('id', uid).single();
    if (r.error || !r.data || !r.data.active) return null;
    return r.data.role;
  }

  async function signIn(email, password) {
    var r = await sb.auth.signInWithPassword({ email: email, password: password });
    if (r.error) return { ok: false, message: r.error.message };

    var role = await fetchRole(r.data.user.id);
    if (!role) {
      await sb.auth.signOut();
      return { ok: false, message: 'Account is not active. Ask the owner to enable it.' };
    }
    currentUser = r.data.user;
    currentRole = role;
    return { ok: true, role: role, user: currentUser };
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
  function rowsToFgStock(rows) {
    var out = {};
    (rows || []).forEach(function (r) {
      if (!out[r.product]) out[r.product] = {};
      out[r.product][r.stage] = Number(r.qty) || 0;
    });
    return out;
  }

  function fgStockToRows(obj) {
    var rows = [];
    Object.keys(obj || {}).forEach(function (product) {
      var stages = obj[product] || {};
      Object.keys(stages).forEach(function (stage) {
        rows.push({ product: product, stage: stage, qty: Number(stages[stage]) || 0 });
      });
    });
    return rows;
  }

  function sessionRowToState(r) {
    return {
      supId:   r.sup_id,
      supName: r.sup_name,
      supWage: Number(r.sup_wage) || 0,
      supOT:   Number(r.sup_ot) || 0,
      teams:   r.teams || []
    };
  }

  // ── PULL ────────────────────────────────────────────────────────
  async function pull(S) {
    if (!ready) return S;
    var workDate = S.workDate || new Date().toISOString().slice(0, 10);

    try {
      var res = await Promise.all([
        sb.from('workers').select('*').eq('active', true).order('name'),
        sb.from('rm_catalogue').select('*').order('name'),
        sb.from('fg_catalogue').select('*').order('name'),
        sb.from('attendance').select('*').eq('work_date', workDate),
        sb.from('production_sessions').select('*').eq('work_date', workDate),
        sb.from('raw_log').select('*').eq('work_date', workDate),
        sb.from('fg_transfers').select('*').eq('work_date', workDate),
        sb.from('fg_stock').select('*'),
        sb.from('day_ledger').select('*').order('work_date'),
        sb.from('factory_doc').select('*')
      ]);

      var workers = res[0].data || [];
      var att     = {};
      (res[3].data || []).forEach(function (a) { att[a.worker_id] = a; });

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

      S.sessions = (res[4].data || []).map(sessionRowToState);

      S.rawLog = (res[5].data || []).map(function (r) {
        return {
          id: r.id, stage: r.stage, name: r.rm_name, unit: r.unit,
          qty: Number(r.qty) || 0,
          unitPrice: Number(r.unit_price) || 0,
          cost: Number(r.cost) || 0
        };
      });

      S.fgTransfers = (res[6].data || []).map(function (r) {
        return {
          id: r.id, product: r.product, from: r.from_stage,
          to: r.to_stage, qty: Number(r.qty) || 0
        };
      });

      S.fgStock = rowsToFgStock(res[7].data);
      S.ledger  = (res[8].data || []).map(function (r) {
        return Object.assign({ date: r.work_date }, r.payload || {});
      });

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

      dot('ok');
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
    }

    if (role === 'supervisor' || role === 'owner') {
      var attRows = (S.lab || []).map(function (l) {
        return {
          work_date: workDate, worker_id: l.id,
          present: !!l.present, doing_ot: !!l.doingOT,
          ot_hours: Number(l.otHours) || 0, marked_by: uid
        };
      });
      await write('attendance', attRows, { onConflict: 'work_date,worker_id' });

      var sessRows = (S.sessions || []).map(function (ss) {
        return {
          work_date: workDate, sup_id: ss.supId, sup_name: ss.supName,
          sup_wage: Number(ss.supWage) || 0, sup_ot: Number(ss.supOT) || 0,
          teams: ss.teams || [], created_by: uid
        };
      });
      await write('production_sessions', sessRows, { onConflict: 'work_date,sup_id' });
    }

    if (role === 'supervisor' || role === 'rm' || role === 'owner') {
      var rawRows = (S.rawLog || []).map(function (r) {
        return {
          id: r.id, work_date: workDate, stage: r.stage, rm_name: r.name,
          unit: r.unit, qty: Number(r.qty) || 0,
          unit_price: Number(r.unitPrice) || 0,
          cost: Number(r.cost) || 0, logged_by: uid
        };
      });
      await write('raw_log', rawRows, { onConflict: 'id' });

      var xferRows = (S.fgTransfers || []).map(function (t) {
        return {
          id: t.id, work_date: workDate, product: t.product,
          from_stage: t.from, to_stage: t.to,
          qty: Number(t.qty) || 0, logged_by: uid
        };
      });
      await write('fg_transfers', xferRows, { onConflict: 'id' });
      await write('fg_stock', fgStockToRows(S.fgStock), { onConflict: 'product,stage' });
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

    var watch = ['attendance', 'production_sessions', 'raw_log',
                 'fg_transfers', 'fg_stock', 'factory_doc'];

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
    startSync: startSync,
    stopSync: stopSync,
    flushOutbox: flushOutbox,
    pendingWrites: function () { return outbox().length; },
    isReady: function () { return ready; },
    role: function () { return currentRole; },
    user: function () { return currentUser; },
    client: function () { return sb; },
    setSyncDot: dot
  };

})(window);
