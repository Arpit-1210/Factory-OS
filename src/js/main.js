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

// Shared logic and infrastructure first — app.js and the screens read
// these through the window bridge each module installs.
import './core/config.js';
import './core/format.js';
import './core/state.js';
import './core/calc.js';
import './core/session.js';
import './core/sheets-sync.js';
import './core/xlsx.js';
import './core/sync.js';
import './core/router.js';
import './core/auth.js';
import './core/day-rollover.js';
import './templates/index.js';
import './components/screen-error.js';
import './components/sidebar.js';

// Screens — each owns its render logic and handlers; its markup lives
// alongside in templates/screens/.
import './screens/att.js';
import './screens/bom.js';
import './screens/dashboard.js';
import './screens/day.js';
import './screens/dispatch.js';
import './screens/docs.js';
import './screens/exports.js';
import './screens/fgstock.js';
import './screens/inventory.js';
import './screens/month.js';
import './screens/orders.js';
import './screens/payments.js';
import './screens/production.js';
import './screens/raw.js';
import './screens/rmpurchase.js';
import './screens/salary.js';
import './screens/setup.js';
import './screens/sheets.js';
import './screens/stock.js';

import './supabase-db.js';
import './app.js';
