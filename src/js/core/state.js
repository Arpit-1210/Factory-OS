// ══════════════════════════════════════════════════════════════════
//  CORE / STATE — the single app state object and its lifecycle
//
//  `S` is the whole app state: catalogues, today's attendance and production,
//  the day ledger, orders, stock. Every screen reads it and most screens
//  mutate it.
//
//  OWNERSHIP
//  This module owns `S`. It is exported as a live binding, so importers always
//  observe the current object — but an importer cannot REASSIGN it, which is
//  the point: replacing the whole state is a real event (a fresh pull from
//  Postgres), and it goes through setS() so the window bridge stays in step.
//
//  There is exactly one such reassignment in the app: the realtime callback in
//  app.js, when a remote change arrives and the state is rebuilt from rows.
//  Everything else mutates S in place and calls persist().
//
//  See config.js for why these are also published on `window` during the split.
// ══════════════════════════════════════════════════════════════════

import { LS_KEY, SHEETS_URL } from './config.js';
import { todayStr } from './format.js';
import { RM_SEED, FG_SEED, LAB_SEED } from './seed-data.js';

/** A brand new install: seeded catalogues, nothing recorded yet. */
export function defaultState() {
  return {
    sheetsUrl: SHEETS_URL,
    rm:  RM_SEED.map(r => ({ ...r })),
    fg:  FG_SEED.map(f => ({ ...f })),
    lab: LAB_SEED.map(l => ({ ...l })),
    sessions: [], rawLog: [], workDate: todayStr(), ledger: [],
    orders: [], stock: [], purchases: [],
    fgStock: {}, fgTransfers: [], fgAdjustments: [],
    dispatches: [], salaryAdj: {}, bom: {}, unitTransfers: [],
  };
}

/**
 * Rehydrate from localStorage, merged over defaults so a state saved by an
 * older build gains any keys added since.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const merged = Object.assign(defaultState(), JSON.parse(raw));
      merged.sheetsUrl = SHEETS_URL;

      const today = todayStr();
      const thisDateCleared = localStorage.getItem('_day_cleared_' + (merged.workDate || today));
      const lastSavedDate = localStorage.getItem('_last_saved_date');

      // Start a clean day if the date rolled over, the day was saved, or it
      // was explicitly cleared. Carrying yesterday's sessions forward would
      // re-count that production against today.
      if (merged.workDate !== today || thisDateCleared || lastSavedDate === merged.workDate) {
        merged.sessions = [];
        merged.rawLog = [];
        if (merged.lab) merged.lab.forEach(l => { l.present = false; l.doingOT = false; l.otHours = 0; });
        merged.workDate = today;
      }

      // ── ONE-TIME MIGRATION: legacy OT field ──
      // `ot` used to hold a flat rupee-per-day amount. OT is now paid per hour
      // at (wage / 8) and read exclusively from `otHours`. A stale rupee value
      // left in `ot` would render as bogus "hours" in the worker table.
      if (merged.lab) merged.lab.forEach(l => {
        if (l.ot !== undefined) delete l.ot;
        if (typeof l.otHours !== 'number') l.otHours = 0;
      });

      return merged;
    }
  } catch (e) {
    console.error('[state] loadState:', e);
  }
  return defaultState();
}

export let S = loadState();

/** Replace the entire state. Only the realtime pull should need this. */
export function setS(next) {
  S = next;
  window.S = S;      // bridge: app.js reads `S` through the global object
  return S;
}

// ── ID GENERATION ──
// These ids are bigint PRIMARY KEYs in Postgres and the `onConflict` target
// for raw_log and fg_transfers, so a duplicate silently OVERWRITES another row
// instead of inserting.
//
// The old formula ADDED the random part to the clock
// (`Date.now() + random*99999`), collapsing the whole id space into a ~100s
// band: an id minted now was indistinguishable from one minted up to 99,998 ms
// earlier with a different draw. 2,000 ids in a tight loop produced ~22
// collisions.
//
// Shifting instead of adding gives the timestamp its own range, so ids from
// different milliseconds can never collide. 2048 stays inside
// Number.MAX_SAFE_INTEGER until the year 2109 (2^53 / 2048 ms since epoch).
// Legacy ids (~1.7e12) sit far below the new range, so old and new cannot
// collide either.
//
// 11 bits of pure randomness would still collide inside a single millisecond
// (a bulk Excel import mints hundreds per ms), so the low bits are a counter,
// not a fresh draw: a new millisecond seeds it randomly in the lower half so
// two devices start from different offsets; repeat calls within that
// millisecond increment, which is collision-free on this device by
// construction; overflowing the 2048 slots borrows from the next millisecond
// rather than wrapping onto an id already issued.
let _uidMs = 0, _uidSeq = 0;
export function uid() {
  const t = Date.now();
  if (t > _uidMs) { _uidMs = t; _uidSeq = Math.floor(Math.random() * 1024); }
  else if (++_uidSeq >= 2048) { _uidMs++; _uidSeq = Math.floor(Math.random() * 1024); }
  return _uidMs * 2048 + _uidSeq;
}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
Object.assign(window, { defaultState, loadState, setS, uid, S });
