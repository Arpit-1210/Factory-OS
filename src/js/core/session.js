// ══════════════════════════════════════════════════════════════════
//  CORE / SESSION — who is signed in, and whether the cloud is up
//
//  Two flags that outlive any one screen and are read from several:
//
//    currentRole  the signed-in role ('owner' | 'supervisor' | 'rm'). The
//                 sidebar, the router and the dashboard all branch on it.
//                 NOT a security boundary — Postgres RLS is. This only
//                 decides what the UI offers.
//    fbEnabled    true once FactoryDB has initialised. Screens check it
//                 before offering anything that needs the cloud.
//
//  WHY SETTERS RATHER THAN PLAIN EXPORTS
//  Screens are bundled modules and read these through the `window` bridge, and
//  a bridge cannot track a module-scoped variable that keeps changing — the
//  mirror would freeze at its initial value. Routing every write through a
//  setter means there is exactly one writer, so the mirror is always true.
//
//  This is the same trap that made the production badge read a stale
//  activeSupId; that one was fixed by moving the badge into the screen that
//  owns the variable. These two have no single owning screen, so they get a
//  module of their own instead.
// ══════════════════════════════════════════════════════════════════

export let currentRole = null;
export let fbEnabled = false;

export function setRole(role) {
  currentRole = role || null;
  window.currentRole = currentRole;
  return currentRole;
}

export function setFbEnabled(on) {
  fbEnabled = !!on;
  window.fbEnabled = fbEnabled;
  return fbEnabled;
}

// ── window bridge ──
// Two things still need these on the global object:
//   1. ~188 inline onclick=/onchange= handlers in the markup, which resolve
//      against `window` and nothing else;
//   2. app.js, which has no import statements of its own yet.
// Modules no longer rely on it — screens/ and components/ import from core/
// directly. Removing the rest means converting the markup to
// addEventListener, which is its own piece of work.
window.currentRole = currentRole;
window.fbEnabled = fbEnabled;
Object.assign(window, { setRole, setFbEnabled });
