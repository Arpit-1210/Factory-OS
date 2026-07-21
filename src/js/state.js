// ── STATE MANAGEMENT ──
// Single source of truth for all app data

import { LS_KEY, SHEETS_URL } from './config.js';
import { todayStr } from './utils.js';

function defaultState() {
  return {
    sheetsUrl: SHEETS_URL,
    rm: [],        // raw materials catalogue
    fg: [],        // finished goods catalogue
    lab: [],       // workers list
    sessions: [],  // today's production sessions
    rawLog: [],    // today's RM issues
    workDate: todayStr(),
    ledger: [],    // historical day entries
    orders: [],
    stock: [],     // RM stock levels
    purchases: [],
    fgStock: {},
    fgTransfers: [],
    fgAdjustments: [],
    dispatches: [],
    salaryAdj: {},
    bom: {},
    unitTransfers: [],
    orderReservations: [],
  };
}

// Load from localStorage
export function loadState() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = Object.assign(defaultState(), parsed);
      merged.sheetsUrl = SHEETS_URL;
      // Always reset workDate to today
      const today = todayStr();
      if (merged.workDate !== today) {
        merged.sessions = [];
        merged.rawLog = [];
        merged.lab.forEach(l => {
          l.present = false;
          l.doingOT = false;
          l.otHours = 0;
        });
        merged.workDate = today;
      }
      return merged;
    }
  } catch (e) {
    console.error('loadState error:', e);
  }
  return defaultState();
}

// Save to localStorage
export function persist(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('persist error:', e);
  }
}

// Unique ID generator
export function uid() {
  return Date.now() + Math.floor(Math.random() * 99999);
}
