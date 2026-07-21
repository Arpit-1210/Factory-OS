// ── FIREBASE MODULE ──
// Handles Auth + Firestore sync
// Roles enforced via Firebase Auth custom claims (server-side)

import { FIREBASE_CONFIG } from './config.js';
import { todayStr } from './utils.js';

let db = null;
let auth = null;
let fbEnabled = false;
let fbUnsubscribe = null;
let _lastLocalWrite = 0;
let _isSyncing = false;
let _currentSupDocId = null;
let _pollInterval = null;

// ── INIT ──
export async function initFirebase(onStateUpdate) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db   = firebase.firestore();
    auth = firebase.auth();

    // Offline persistence
    try {
      await db.enablePersistence({ synchronizeTabs: true });
    } catch (e) {
      console.warn('Persistence:', e.code);
    }

    fbEnabled = true;
    updateSyncDot('syncing');

    return { db, auth, fbEnabled };
  } catch (e) {
    console.error('Firebase init error:', e);
    fbEnabled = false;
    updateSyncDot('err');
    return { db: null, auth: null, fbEnabled: false };
  }
}

// ── ROLE SECURITY ──
// Roles stored as Firebase Auth custom claims — cannot be faked via DevTools
export async function getUserRole(user) {
  if (!user) return null;
  try {
    const token = await user.getIdTokenResult(true); // force refresh
    return token.claims.role || null;
  } catch (e) {
    console.error('getUserRole error:', e);
    return null;
  }
}

// Admin sets roles via Firebase Admin SDK (Firestore-based fallback for now)
export async function getRoleFromFirestore(uid) {
  try {
    const doc = await db.doc(`users/${uid}`).get();
    if (doc.exists) return doc.data().role || null;
  } catch (e) {}
  return null;
}

// ── SUPERVISOR DOC ──
function getSupDocId() {
  if (!_currentSupDocId) {
    let devId = localStorage.getItem('_sup_device_id');
    if (!devId) {
      devId = 'sup_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      localStorage.setItem('_sup_device_id', devId);
    }
    _currentSupDocId = devId;
  }
  return _currentSupDocId;
}

function getMyDoc(role) {
  if (role === 'supervisor') return 'supervisors/' + getSupDocId();
  if (role === 'rm')         return 'factory/rm';
  return 'factory/owner';
}

// ── PUSH TO FIREBASE ──
export async function pushToFirebase(state, role) {
  if (!fbEnabled || !db || _isSyncing) return;
  _isSyncing = true;
  _lastLocalWrite = Date.now();
  updateSyncDot('syncing');

  try {
    const docPath = getMyDoc(role);
    const base = {
      _updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      _updatedBy: role,
      _date: state.workDate || todayStr(),
    };

    if (role === 'supervisor') {
      await db.doc(docPath).set({
        ...base,
        sessions:    state.sessions    || [],
        fgTransfers: state.fgTransfers || [],
        rawLog:      state.rawLog      || [],
      }, { merge: false });

    } else if (role === 'rm') {
      await db.doc(docPath).set({
        ...base,
        stock:     state.stock     || [],
        purchases: state.purchases || [],
        rawLog:    state.rawLog    || [],
        fgStock:   state.fgStock   || {},
      }, { merge: true });

    } else {
      // Owner
      await db.doc(docPath).set({
        ...base,
        orders:           state.orders           || [],
        ledger:           state.ledger           || [],
        dispatches:       state.dispatches       || [],
        salaryAdj:        state.salaryAdj        || {},
        bom:              state.bom              || {},
        unitTransfers:    state.unitTransfers    || [],
        fgAdjustments:    state.fgAdjustments    || [],
        orderReservations:state.orderReservations|| [],
      }, { merge: true });

      await db.doc('factory/shared').set({
        ...base,
        fg:          state.fg          || [],
        lab:         state.lab         || [],
        rm:          state.rm          || [],
        fgStock:     state.fgStock     || {},
        fgTransfers: state.fgTransfers || [],
      }, { merge: true });
    }

    updateSyncDot('ok');
  } catch (e) {
    console.error('Firebase push:', e);
    updateSyncDot('err');
  } finally {
    _isSyncing = false;
  }
}

// ── PULL FROM FIREBASE ──
export async function pullFromFirebase(state, role) {
  if (!fbEnabled || !db) return state;
  try {
    const today = todayStr();
    const paths = ['factory/owner', 'factory/rm', 'factory/shared'];
    const docs  = await Promise.all(paths.map(p => db.doc(p).get().catch(() => null)));

    // Never pull sessions/rawLog — supervisor-local only
    docs.forEach(snap => {
      if (!snap || !snap.exists) return;
      const data = snap.data();
      Object.keys(data)
        .filter(k => !k.startsWith('_') && k !== 'sessions' && k !== 'rawLog')
        .forEach(k => { if (data[k] !== undefined) state[k] = data[k]; });
    });

    // Pull supervisor sessions (owner only, today only)
    if (role === 'owner') {
      if (!localStorage.getItem('_day_cleared_' + today)) {
        const supSnaps = await db.collection('supervisors').get();
        const allSessions = [];
        supSnaps.forEach(doc => {
          const data = doc.data();
          if (data._date === today && !data._dayCleared && data.sessions?.length > 0) {
            data.sessions.forEach(ss => {
              if (!allSessions.find(x => x.supId === ss.supId)) allSessions.push(ss);
            });
          }
        });
        if (allSessions.length > 0) state.sessions = allSessions;
      }
    }

    return state;
  } catch (e) {
    console.error('Firebase pull:', e);
    return state;
  }
}

// ── START SYNC ──
export function startFirebaseSync(state, role, onUpdate) {
  if (!fbEnabled || !db) return;
  stopFirebaseSync();

  const unsubs = [];

  // Owner listens to non-session docs
  if (role === 'owner') {
    ['factory/owner', 'factory/shared', 'factory/rm'].forEach(path => {
      unsubs.push(db.doc(path).onSnapshot(snap => {
        if (!snap.exists || Date.now() - _lastLocalWrite < 5000) return;
        const data = snap.data(); if (!data) return;
        Object.keys(data)
          .filter(k => !k.startsWith('_') && k !== 'sessions' && k !== 'rawLog')
          .forEach(k => { if (data[k] !== undefined) state[k] = data[k]; });
        onUpdate(state, ['orders', 'payments', 'month', 'salary']);
      }, () => updateSyncDot('err')));
    });

    // Poll supervisor sessions every 30 seconds
    function pollSessions() {
      const today = todayStr();
      if (localStorage.getItem('_day_cleared_' + today)) return;
      db.collection('supervisors').get().then(snap => {
        const all = [];
        snap.forEach(doc => {
          const d = doc.data();
          if (d._date === today && !d._dayCleared && d.sessions?.length > 0) {
            d.sessions.forEach(ss => {
              if (!all.find(x => x.supId === ss.supId)) all.push(ss);
            });
          }
        });
        if (all.length > 0) {
          state.sessions = all;
          onUpdate(state, ['dashboard']);
        }
      }).catch(() => {});
    }
    pollSessions();
    _pollInterval = setInterval(pollSessions, 30000);
  }

  // Supervisor/RM listen to shared catalogue only
  if (role === 'supervisor' || role === 'rm') {
    unsubs.push(db.doc('factory/shared').onSnapshot(snap => {
      if (!snap.exists || Date.now() - _lastLocalWrite < 5000) return;
      const data = snap.data(); if (!data) return;
      ['fg', 'lab', 'rm'].forEach(k => {
        if (data[k] !== undefined) state[k] = data[k];
      });
      onUpdate(state, []);
    }, () => {}));
  }

  fbUnsubscribe = () => unsubs.forEach(u => u());
}

export function stopFirebaseSync() {
  if (fbUnsubscribe) { fbUnsubscribe(); fbUnsubscribe = null; }
  if (_pollInterval)  { clearInterval(_pollInterval); _pollInterval = null; }
}

// ── CLEAR SUPERVISOR DOC (Save Day) ──
export async function clearSupervisorDoc(nextDate) {
  if (!fbEnabled || !db) return;
  try {
    await db.doc('supervisors/' + getSupDocId()).set({
      sessions: [], rawLog: [], fgTransfers: [],
      _updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      _updatedBy: 'supervisor',
      _date: nextDate,
      _dayCleared: true,
    }, { merge: false });
  } catch (e) {
    console.error('clearSupervisorDoc:', e);
  }
}

// ── BACKUP ──
export async function runDailyBackup(state) {
  if (!fbEnabled || !db) return;
  try {
    const today = todayStr();
    await db.collection('backups').doc(today).set({
      ...state,
      _backedUpAt: firebase.firestore.FieldValue.serverTimestamp(),
      _date: today,
    });
    console.log('Backup saved:', today);
    // Cleanup old backups (>30 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const old = await db.collection('backups').where('_date', '<', cutoffStr).get();
    old.forEach(doc => doc.ref.delete());
  } catch (e) {
    console.error('Backup failed:', e);
  }
}

// ── SYNC DOT UI ──
function updateSyncDot(status) {
  const dot = document.getElementById('sync-status');
  const txt = document.getElementById('sync-text');
  if (dot) dot.className = 'sync-dot ' + status;
  if (txt) txt.textContent = status === 'ok' ? 'Synced' : status === 'syncing' ? 'Syncing...' : 'Offline';
}

export { fbEnabled, db, auth, updateSyncDot };
