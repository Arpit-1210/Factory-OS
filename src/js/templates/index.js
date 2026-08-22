// ══════════════════════════════════════════════════════════════════
//  TEMPLATES — the app document, assembled from per-screen markup
//
//  This was one 1,069-line template literal sitting at the top of app.js,
//  a thousand lines from any of the code that drives it. It is entirely
//  static — no interpolation anywhere — so splitting it per screen is
//  mechanical, and it is what lets a screen own its own markup.
// ══════════════════════════════════════════════════════════════════

import shell from './shell.js';
import tpl_dashboard from './screens/dashboard.js';
import tpl_setup from './screens/setup.js';
import tpl_sheets from './screens/sheets.js';
import tpl_att from './screens/att.js';
import tpl_sup from './screens/sup.js';
import tpl_raw from './screens/raw.js';
import tpl_day from './screens/day.js';
import tpl_month from './screens/month.js';
import tpl_orders from './screens/orders.js';
import tpl_payments from './screens/payments.js';
import tpl_inventory from './screens/inventory.js';
import tpl_stock from './screens/stock.js';
import tpl_rmpurchase from './screens/rmpurchase.js';
import tpl_fgstock from './screens/fgstock.js';
import tpl_salary from './screens/salary.js';
import tpl_dispatch from './screens/dispatch.js';
import tpl_bom from './screens/bom.js';
import tpl_export from './screens/export.js';
import tpl_transfers from './screens/transfers.js';
import tpl_docs from './screens/docs.js';

// Prefixed bindings: several screen names ("export", "import") are reserved
// words and cannot be used as identifiers.
const SCREENS = { dashboard: tpl_dashboard, setup: tpl_setup, sheets: tpl_sheets, att: tpl_att, sup: tpl_sup, raw: tpl_raw, day: tpl_day, month: tpl_month, orders: tpl_orders, payments: tpl_payments, inventory: tpl_inventory, stock: tpl_stock, rmpurchase: tpl_rmpurchase, fgstock: tpl_fgstock, salary: tpl_salary, dispatch: tpl_dispatch, bom: tpl_bom, export: tpl_export, transfers: tpl_transfers, docs: tpl_docs };

/** The whole app document: login page, shell, and every screen. */
export function appHtml() {
  return shell.replace(/__SCREEN__([a-z]+)/g, (_, name) => SCREENS[name]);
}

