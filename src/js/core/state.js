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
    // Set only while a closed day is deliberately open for editing.
    reopenDate: null,
    orders: [], stock: [], purchases: [],
    fgStock: {}, fgTransfers: [], fgAdjustments: [],
    // The opening-stock declaration: what the factory held on its go-live
    // date. `asOfDate` is what stops that quantity counting on days before it
    // was true; `locked` is the owner having confirmed the figures.
    fgOpening: { asOfDate: null, locked: false, lockedBy: null, lockedAt: null },
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
      const stored = merged.workDate || today;
      const closed = (d) => !!(d && (merged.ledger||[]).some(e => e.date === d));

      // The first day at or after `today` that has not been closed. Duplicated
      // from day-rollover.js rather than imported: that module imports this
      // one, and a cycle here runs during module init, before the functions
      // exist. Six lines is a cheaper price than the cycle.
      const firstOpenDay = () => {
        let d = today;
        for (let i = 0; i < 400 && closed(d); i++) {
          const n = new Date(d + 'T00:00:00');
          n.setDate(n.getDate() + 1);
          d = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
        }
        return d;
      };

      // ── WHICH DAY IS OPEN AFTER A RELOAD ──
      //
      // This decision used to be driven by two localStorage flags,
      // `_day_cleared_<date>` and `_last_saved_date`. Both are gone; the
      // ledger says whether a day is closed, and it is shared across devices
      // rather than being one device's private opinion.
      //
      // Three cases, and the old code got two of them wrong.
      if (merged.reopenDate && merged.reopenDate === stored && closed(stored)) {
        // 1. A day deliberately reopened for editing. It survives the reload —
        //    otherwise opening an old date and pressing refresh threw the user
        //    back to today, which is most of why editing an old date "stopped
        //    working".
      } else if (stored < today && !closed(stored)) {
        // 2. A past day that was never closed. LEAVE IT OPEN. The old code
        //    wiped its sessions and moved to today without writing a ledger
        //    row, so the day vanished from the app entirely: nothing in
        //    Monthly, and its production_sessions/attendance rows stranded in
        //    Postgres where no query ever asks for them again. An unsaved day
        //    still needs closing by hand.
        merged.reopenDate = null;
      } else if (stored !== today || closed(stored)) {
        // 3. The calendar rolled over, Save Day parked us on tomorrow, or the
        //    stored day has since been closed (possibly by another device).
        //    Start a clean day — and never land on a closed one, which is what
        //    put a closed day's production back under Today's Production.
        merged.sessions = [];
        merged.rawLog = [];
        if (merged.lab) merged.lab.forEach(l => { l.present = false; l.doingOT = false; l.otHours = 0; });
        merged.workDate = firstOpenDay();
        merged.reopenDate = null;
      }

      // ── MIGRATION: drop the retired day flags ──
      // `_day_cleared_<date>` was written once per closed day and never
      // removed, so an install accumulated one key per working day forever.
      // Nothing reads either flag now; clear them out so they stop growing.
      try {
        const dead = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.indexOf('_day_cleared_') === 0 || k === '_last_saved_date')) dead.push(k);
        }
        dead.forEach(k => localStorage.removeItem(k));
      } catch (e) {}

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

