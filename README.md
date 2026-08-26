# Factory OS — Manufacturing Intelligence System
**Propskart & Urban Pebbles · Ranchi, Jharkhand**

## Tech Stack
- **Frontend:** Vite + vanilla JS, one ES module graph entered through `src/js/main.js`
- **Backend:** Supabase (Postgres), with row level security enforcing roles
- **Auth:** Supabase email/password; the role lives in `app_users`, not in the browser
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Backup:** Postgres point-in-time recovery, plus optional Google Sheets export

> Earlier versions of this README described a Firebase/Firestore backend and a
> set of `VITE_FIREBASE_*` variables. None of that exists any more — Firestore
> was replaced by Supabase, and following those instructions configures nothing.

---

## Project Structure
```
factory-os/
├── index.html                  # Shell; loads supabase-js + XLSX, then main.js
├── src/
│   ├── js/
│   │   ├── main.js             # Entry point — imports everything, in order
│   │   ├── supabase-db.js      # `FactoryDB`: auth, pull, push, outbox, realtime
│   │   ├── app.js              # Boot sequence and the remaining un-split logic
│   │   ├── core/               # config, state, session, sync, router, actions,
│   │   │                       #   auth, calc, format, day-rollover, xlsx
│   │   ├── screens/            # One module per screen; owns its render + handlers
│   │   ├── templates/          # The markup for each screen
│   │   └── components/         # sidebar, assign-modal, screen-error
│   └── css/style.css
├── supabase/migrations/        # Schema, RLS policies, realtime, repairs
├── tests/                      # node --test; no install needed
└── vite.config.js
```

### How the UI is wired
There is **no `window` bridge**. Markup names an action and `core/actions.js`
resolves it through a real import:

```html
<button data-click="delRaw" data-args="[123]">✕</button>
```

A module therefore has to `import` anything it calls from another module.
`tests/free-identifiers.test.mjs` fails the build on any name that is neither
declared nor imported — that check exists because nineteen such names shipped
at once, and the worst of them aborted Save Day before it could write.

---

## Setup

```bash
git clone <repo> && cd factory-os
npm install
npm run dev          # http://localhost:5173
npm test             # 200+ tests, Node's built-in runner
npm run build        # -> dist/
```

The Supabase URL and publishable key are in `src/js/supabase-db.js`. The
publishable key is meant to be public; every access decision is made by row
level security in Postgres, not by the client.

`VITE_SHEETS_URL` in `src/js/core/config.js` points at the optional Google
Apps Script backup. The Sheets screen has a copy button for the script itself.

---

## Database

Apply the migrations in `supabase/migrations/` in order, via `supabase db push`
or the SQL editor.

| Migration | What it does |
| --- | --- |
| `0001_initial_schema` | Tables, RLS policies, `auth_role()`/`is_owner()`, the new-user trigger |
| `0002_harden_function_privileges` | Revokes REST access to trigger-only functions |
| `0003_fix_fg_stock_axis` | Un-swaps `fg_stock.product` / `fg_stock.stage` |
| `0004_enable_realtime` | Publishes the watched tables and sets `replica identity full` |
| `0005_repair_accounts_and_ledger_writes` | Repairs NULL token columns in `auth.users`, backfills missing `app_users` rows, lets a supervisor close their own day |

### Roles
`owner`, `supervisor`, `rm` — stored in `app_users.role`. `ROLE_ACCESS` in
`core/config.js` decides which screens the sidebar offers; it is **navigation
only, not a security boundary**. What a role may read and write is decided by
the policies in `0001_initial_schema.sql`.

### Adding a user
Create the account through the Supabase dashboard's Auth section or the Auth
Admin API — **never** with a raw `insert into auth.users`, which leaves the
token columns NULL and makes every future sign-in fail with "Database error
querying schema" for that account alone. The `handle_new_user` trigger then
creates the `app_users` row at role `supervisor`; promote from there.

---

## Which data lives where

Only data with **multiple concurrent writers** is normalised into rows;
single-writer data stays as jsonb documents.

| Contended (rows) | Single writer (jsonb in `factory_doc`) |
| --- | --- |
| `attendance`, `production_sessions`, `raw_log`, `fg_transfers`, `fg_stock` | orders, dispatches, salary adjustments, BOM, purchases, stock |

`day_ledger` holds one row per closed day. It is written only when a day is
closed, and — because it is the sole source for the Monthly report, monthly
payroll, consumed-RM history and every Excel export — `pull()` will never
replace a populated local ledger with an empty or unreadable remote one.

---

## Adding a new screen

1. Create `src/js/screens/myscreen.js` exporting a `render` function and its handlers.
2. Create `src/js/templates/screens/myscreen.js` for its markup, and add it to `templates/index.js`.
3. Import the screen namespace in `core/actions.js` so its exports become actions.
4. Register the route in `core/router.js` and add it to `ROLE_ACCESS` in `core/config.js`.
5. Add a sidebar entry in `components/sidebar.js`.

---

## Tests

```bash
npm test
npm run test:watch
```

`tests/harness.mjs` bundles the real entry point and runs it in a `node:vm`
against a small DOM stub. It also installs every module export on the sandbox's
`window` so tests can reach internals — which is convenient and is exactly why
`free-identifiers.test.mjs` exists as a separate, bundle-free static check: the
harness would otherwise resolve a missing import that a browser cannot.

See `tests/README.md` for the suite-by-suite breakdown and the regression
guards that must not be weakened.
