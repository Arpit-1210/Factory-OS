# Tests

```bash
npm test
```

No dependencies to install — this uses Node's built-in test runner (Node 18+).
`npm run test:watch` re-runs on change.

## How it works

`src/js/app.js` and `src/js/supabase-db.js` are classic browser scripts, not ES
modules: `index.html` loads them with plain `<script>` tags and `app.js` hangs
every function off `window`. So rather than adding jsdom and a bundler, the
harness evaluates both files inside a `node:vm` context against a small DOM
stub, then calls the real functions off the window they built.

- `dom-stub.mjs` — the fake `document` / `localStorage`. Every `getElementById`
  returns a memoised stub element, so code that writes a value and reads it back
  works. Rendered markup goes nowhere; these tests assert logic, not HTML.
- `harness.mjs` — boots the scripts in `index.html` order and returns the
  window. Timers are captured rather than scheduled, so tests are deterministic
  and the process exits.
  - `boot()` — the whole app.
  - `bootDb()` — only the data layer. `app.js` calls `initFirebase()` at load
    (`src/js/app.js:5009`), which inits `FactoryDB` and replays the offline
    outbox before a test gets a look in; `bootDb()` avoids that.
  - `resetState(ctx, patch)` — installs a clean fixture. `app.js` keeps state in
    a top-level `let S`, a lexical binding that can be read from outside but not
    reassigned, so this mutates the live object in place.
  - `call(ctx, expr)` — evaluates an expression with that lexical scope intact.

## Suites

| File | Covers |
| --- | --- |
| `money.test.mjs` | `calcOT`, rupee formatting, `todayStr`, `isOverdue`, `uid` |
| `salary.test.mjs` | `computeSalaryMonth` — the figures that get paid |
| `inventory.test.mjs` | `getFGBalance` — opening stock, production, transfers, adjustments |
| `day-cycle.test.mjs` | `buildPayload`, `saveDay`, and the overnight rollover |
| `supabase-sync.test.mjs` | `FactoryDB` against a fake supabase-js: auth, per-role writes, offline outbox, pull mapping |

## Regression guards

Three defects were found by this suite and have since been fixed. The tests
that caught them are now ordinary passing tests — do not weaken them:

1. **`uid()` collisions** (`money.test.mjs`) — the old formula ADDED randomness
   to the clock, collapsing the id space into a ~100s band (~22 collisions per
   2,000 draws). These ids are Postgres primary keys and the upsert conflict
   target for `raw_log` and `fg_transfers`, so a collision silently overwrote
   another row. Now a shifted timestamp plus a per-millisecond counter.
2. **`fg_stock` column swap** (`supabase-sync.test.mjs`, plus the end-to-end
   suite in `inventory.test.mjs`) — rows were written with `product` and
   `stage` reversed. Invisible to the app because both mappers inverted
   identically, so the unit tests on either side pass either way; the
   end-to-end test row -> state -> `getFGBalance` is what actually pins it.
   Existing rows are corrected by `supabase/migrations/0003_fix_fg_stock_axis.sql`.
3. **`adoptWorkDate` flag erasure** (`day-cycle.test.mjs`) — it wrote
   `_day_cleared_<savedDate>` then filtered through `isDaySaved()` while
   `S.workDate` was still the old date, hitting the "open day is never saved"
   branch that deletes that flag, and carrying already-saved production into
   the new day where `getFGBalance()` counted it twice.
