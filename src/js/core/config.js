// ══════════════════════════════════════════════════════════════════
//  CORE / CONFIG — constants shared across every screen
//
//  TRANSITIONAL BRIDGE
//  app.js is still one large file and is loaded as a module WITHOUT import
//  statements, so it cannot `import` from here. Until it is broken up, each
//  value is also published on `window`; a bare `STAGES` inside app.js then
//  resolves through the global object exactly as it did when these were
//  top-level `const`s in that file.
//
//  As screens move into src/js/screens/, they import from here properly and
//  the window assignments below get deleted.
// ══════════════════════════════════════════════════════════════════

export const LS_KEY = 'frp_factory_v5';

// Dispatch is an exit, not a stock-bearing stage — FG_STAGES is what the
// stock screens iterate, STAGES is what the badges and pipelines use.
export const STAGES    = ['Moulding', 'Finishing', 'Painting', 'Packing', 'Dispatch'];
export const FG_STAGES = ['Moulding', 'Finishing', 'Painting', 'Packing'];
export const SPC       = ['sp0', 'sp1', 'sp2', 'sp3', 'sp4'];

export const MNAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

export const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwsVDnWwv1lH5EqwYLLPyu7GXLobPAAjfa7vL1Oc6t8Cezd9GiMNbhINwr4iFx5FhG4/exec';

// The master-password map that used to live here is gone. Every value was an
// empty string, so `pwd === PASSWORDS[role]` was true for a blank password —
// anyone could sign in as owner. Auth is Supabase email/password now, with
// roles enforced by RLS in Postgres.
//
// This map is navigation only. It decides which sidebar entries exist and
// which routes go() will open; it is NOT a security boundary.
export const ROLE_ACCESS = {
  owner: ['dashboard','setup','sheets','att','sup','raw','day','month','orders',
          'payments','dispatch','transfers','salary','inventory','stock',
          'rmpurchase','fgstock','docs','bom','export'],
  supervisor: ['dashboard','att','sup','raw','day'],
  rm: ['dashboard','raw','stock','rmpurchase','inventory'],
};

export const ROLE_HOME = { owner: 'dashboard', supervisor: 'sup', rm: 'raw' };

// ── bridge (delete once app.js is fully split) ──
Object.assign(window, {
  LS_KEY, STAGES, FG_STAGES, SPC, MNAMES, SHEETS_URL, ROLE_ACCESS, ROLE_HOME,
});
