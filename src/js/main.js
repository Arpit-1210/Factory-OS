// ══════════════════════════════════════════════════════════════════
//  FACTORY OS — ENTRY POINT
//
//  index.html loads only this file, as type="module". Everything else is
//  reached through imports from here.
//
//  WHY THE ORDER MATTERS
//  app.js calls FactoryDB at boot (initFirebase, near the bottom of the
//  file), so the data layer has to be evaluated first. Module imports are
//  evaluated in source order, which makes that ordering explicit here
//  instead of implicit in two <script> tags.
//
//  ON MODULE SCOPE
//  As classic scripts, every top-level `function` in app.js became a global,
//  which is what the 114 inline onclick/onchange handlers in the markup rely
//  on. Under modules those declarations are module-scoped instead, so the
//  handlers survive ONLY because app.js explicitly assigns them to `window`.
//  tests/inline-handlers.test.mjs enforces that every handler called from
//  markup is exported, so this can never silently regress.
//
//  This file is deliberately thin. It is the seam that the screen, component
//  and shared-logic modules will be hung off as app.js is broken up.
// ══════════════════════════════════════════════════════════════════

import './supabase-db.js';
import './app.js';
