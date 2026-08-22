// ══════════════════════════════════════════════════════════════════
//  CORE / ACTIONS — the event delegation layer
//
//  WHY THIS EXISTS
//  The app used ~230 inline on-attribute handlers. The browser
//  evaluates those against `window` and nothing else, which is the only
//  reason every module had to publish its functions there. That global
//  surface was not merely untidy — it produced real bugs, because markup
//  could also ASSIGN to it:
//
//      onclick=[activeTeamId=null; renderSupWork()]
//
//  Under module scope that wrote a stale `window` mirror, never the module's
//  own `activeTeamId`, so the Production screen's "← All Teams" button did
//  nothing at all. Markup cannot reach module state any more; it can only
//  name an action.
//
//  HOW IT WORKS
//  Markup carries `data-click`, `data-change`, `data-input` or `data-keydown`
//  naming an action, and optionally `data-args` holding a JSON array:
//
//      <button data-click="delRaw" data-args="[123]">✕</button>
//
//  One listener per event type sits on the document, finds the nearest
//  element carrying that attribute, and calls the registered function with
//  the decoded arguments plus the event as a trailing argument.
//
//  Delegation also means dynamically rendered rows need no wiring: a screen
//  can replace its innerHTML freely and the buttons keep working.
//
//  Nesting is handled for free. A row that is itself clickable can contain a
//  delete button; `closest()` finds the innermost action, so the outer one
//  does not also fire. That is what the old `event.stopPropagation()` calls
//  in the markup were compensating for.
// ══════════════════════════════════════════════════════════════════

import * as att from '../screens/att.js';
import * as bom from '../screens/bom.js';
import * as dashboard from '../screens/dashboard.js';
import * as day from '../screens/day.js';
import * as dispatchScreen from '../screens/dispatch.js';
import * as docs from '../screens/docs.js';
import * as exportsScreen from '../screens/exports.js';
import * as fgstock from '../screens/fgstock.js';
import * as inventory from '../screens/inventory.js';
import * as month from '../screens/month.js';
import * as orders from '../screens/orders.js';
import * as payments from '../screens/payments.js';
import * as production from '../screens/production.js';
import * as raw from '../screens/raw.js';
import * as rmpurchase from '../screens/rmpurchase.js';
import * as salary from '../screens/salary.js';
import * as setup from '../screens/setup.js';
import * as sheets from '../screens/sheets.js';
import * as stock from '../screens/stock.js';
import * as transfers from '../screens/transfers.js';

import * as assignModal from '../components/assign-modal.js';
import * as sidebar from '../components/sidebar.js';

import * as auth from './auth.js';
import * as router from './router.js';
import * as sync from './sync.js';
import * as sheetsSync from './sheets-sync.js';

/**
 * Every function the markup is allowed to name. Assembled from module
 * namespaces rather than a hand-written list, so a screen exporting a new
 * handler is reachable immediately and one that stops exporting fails loudly
 * on the next click instead of silently doing nothing.
 */
const ACTIONS = Object.assign(
  Object.create(null),
  att, bom, dashboard, day, dispatchScreen, docs, exportsScreen, fgstock, inventory,
  month, orders, payments, production, raw, rmpurchase, salary, setup, sheets,
  stock, transfers,
  assignModal, sidebar,
  auth, router, sync, sheetsSync,
);

/** Names the markup can reference. Exported so tests can audit coverage. */
export function actionNames() {
  return Object.keys(ACTIONS).filter(k => typeof ACTIONS[k] === 'function').sort();
}

export function hasAction(name) {
  return typeof ACTIONS[name] === 'function';
}

/** Run a named action directly. Used by tests and by code paths without an event. */
export function runAction(name, args = [], ev = null) {
  const fn = ACTIONS[name];
  if (typeof fn !== 'function') {
    console.error('[actions] no such action:', name);
    return undefined;
  }
  return fn(...args, ev);
}

function decodeArgs(el) {
  const raw = el.getAttribute('data-args');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error('[actions] bad data-args on', el.getAttribute('data-click') || el, raw);
    return [];
  }
}

function dispatchAction(attr, ev) {
  const target = ev.target;
  if (!target || typeof target.closest !== 'function') return;
  const el = target.closest('[' + attr + ']');
  if (!el) return;
  const name = el.getAttribute(attr);
  const fn = ACTIONS[name];
  if (typeof fn !== 'function') {
    // Loud on purpose: a renamed or unexported handler is a dead control, and
    // that class of fault used to be invisible until a user reported it.
    console.error('[actions] no such action:', name);
    return;
  }
  fn(...decodeArgs(el), ev);
}

const EVENTS = {
  click: 'data-click',
  change: 'data-change',
  input: 'data-input',
  keydown: 'data-keydown',
};

let installed = false;

/** Attach the delegated listeners. Idempotent. */
export function installActions(root = document) {
  if (installed) return;
  installed = true;
  for (const [type, attr] of Object.entries(EVENTS)) {
    root.addEventListener(type, (ev) => dispatchAction(attr, ev));
  }
}

installActions();
