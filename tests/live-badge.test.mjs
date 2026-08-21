// ── "NEW DATA" BADGE ON THE PRODUCTION SCREEN ──
// Every other screen re-renders on a remote change. Production must not — a
// repaint mid-entry resets the selected team and wipes half-typed inputs — so
// it compares a fingerprint of what was last drawn against what is now in
// state, and offers the update instead of swallowing it.
//
// The fingerprint is the whole trust model here: too sensitive and the badge
// cries wolf on the user's own typing, too blunt and a colleague's entry is
// silently lost. These pin both edges.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx, win } = boot();
const fingerprint = () => call(ctx, 'prodFingerprint()');

const session = (supId, supName, teams) => ({
  supId, supName, supWage: 800, supOT: 0, teams,
});
const team = (teamId, stage, members, production) =>
  ({ teamId, stage, team: members, production });

describe('prodFingerprint — what counts as new data', () => {
  test('is stable when nothing has changed', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [], [{ name: 'Chair A', qty: 5, value: 5000 }])])];
    assert.equal(fingerprint(), fingerprint());
  });

  test('changes when another supervisor logs production', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [], [])])];
    const before = fingerprint();

    S.sessions[0].teams[0].production.push({ name: 'Chair A', qty: 5, value: 5000 });
    assert.notEqual(fingerprint(), before, 'a new production line must raise the badge');
  });

  test('changes when a quantity is edited, not just when a line is added', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [], [{ name: 'Chair A', qty: 5, value: 5000 }])])];
    const before = fingerprint();

    S.sessions[0].teams[0].production[0].qty = 8;
    assert.notEqual(fingerprint(), before);
  });

  test('changes when a whole new supervisor session appears', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [])];
    const before = fingerprint();

    S.sessions.push(session(8, 'Rahul', [team(1, 'Painting', [], [])]));
    assert.notEqual(fingerprint(), before);
  });

  test('changes when a team gains a worker', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [{ id: 1, name: 'A', wage: 400 }], [])])];
    const before = fingerprint();

    S.sessions[0].teams[0].team.push({ id: 2, name: 'B', wage: 400 });
    assert.notEqual(fingerprint(), before);
  });

  test('is NOT disturbed by row order — the real false-positive risk', () => {
    // production_sessions comes back from Postgres with no ORDER BY, so the
    // same data can arrive in a different order on every pull. If ordering
    // moved the fingerprint, the badge would appear on every sync forever.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [
      session(9, 'Karan', [team(1, 'Moulding', [], []), team(2, 'Packing', [], [])]),
      session(8, 'Rahul', [team(1, 'Painting', [], [])]),
    ];
    const before = fingerprint();

    S.sessions.reverse();
    S.sessions.forEach(ss => ss.teams.reverse());
    assert.equal(fingerprint(), before, 'reordering alone is not new data');
  });

  test('survives sessions with missing teams or production arrays', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [{ supId: 9, supName: 'Karan' }, session(8, 'R', [{ teamId: 1, stage: 'Moulding' }])];
    assert.doesNotThrow(fingerprint);
    assert.equal(typeof fingerprint(), 'string');
  });

  test('an empty factory has a stable, non-throwing fingerprint', () => {
    resetState(ctx, { workDate: '2026-08-19' });
    assert.equal(fingerprint(), fingerprint());
  });
});

describe('markProdSeen — the badge only survives a genuinely remote change', () => {
  test('records the current state as seen', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [], [])])];
    call(ctx, 'markProdSeen()');
    assert.equal(call(ctx, '_prodSeen'), fingerprint());
  });

  test('persist() marks seen, so the user’s own edit never raises a badge', () => {
    // A local edit repaints the screen anyway. Without this hook, the echo of
    // the user's own write would come back and look like somebody else's.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [], [])])];
    call(ctx, 'markProdSeen()');

    S.sessions[0].teams[0].production.push({ name: 'Chair A', qty: 2, value: 2000 });
    call(ctx, 'persist()');

    assert.equal(call(ctx, '_prodSeen'), fingerprint(), 'local edits are seen by definition');
  });

  test('a remote change leaves the fingerprint diverged, which is what shows the badge', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [], [])])];
    call(ctx, 'markProdSeen()');

    // Simulate what pull() does: another device's row lands in S directly.
    S.sessions.push(session(8, 'Rahul', [team(1, 'Painting', [], [{ name: 'Chair A', qty: 3, value: 3000 }])]));

    assert.notEqual(fingerprint(), call(ctx, '_prodSeen'));
  });

  test('hides the badge element when it exists', () => {
    resetState(ctx, { workDate: '2026-08-19' });
    call(ctx, 'showProdRefresh()');
    assert.equal(win.document.getElementById('prod-refresh').style.display, 'flex');

    call(ctx, 'markProdSeen()');
    assert.equal(win.document.getElementById('prod-refresh').style.display, 'none');
  });
});

describe('showProdRefresh — the badge itself', () => {
  test('creates one badge and reuses it rather than stacking duplicates', () => {
    resetState(ctx, { workDate: '2026-08-19' });
    win.document.markAbsent('prod-refresh');
    call(ctx, 'showProdRefresh()');
    const first = win.document.getElementById('prod-refresh');
    call(ctx, 'showProdRefresh()');
    call(ctx, 'showProdRefresh()');
    assert.equal(win.document.getElementById('prod-refresh'), first, 'must not append a second badge');
  });

  test('is wired to applyProdRefresh, which is reachable from the inline handler', () => {
    resetState(ctx, { workDate: '2026-08-19' });
    win.document.markAbsent('prod-refresh');
    call(ctx, 'showProdRefresh()');
    assert.equal(win.document.getElementById('prod-refresh').onclick, 'applyProdRefresh()');
    // Inline onclick resolves against window, so the export is load-bearing.
    assert.equal(typeof win.applyProdRefresh, 'function');
  });

  test('says what it is offering', () => {
    resetState(ctx, { workDate: '2026-08-19' });
    win.document.markAbsent('prod-refresh');
    call(ctx, 'showProdRefresh()');
    assert.match(win.document.getElementById('prod-refresh').innerHTML, /tap to refresh/i);
  });
});

describe('applyProdRefresh — taking the update', () => {
  test('marks the new state as seen and dismisses the badge', () => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [{ id: 9, name: 'Karan', wage: 800, isSup: true, present: true }];
    S.sessions = [session(9, 'Karan', [team(1, 'Moulding', [], [])])];
    call(ctx, 'showProdRefresh()');

    call(ctx, 'applyProdRefresh()');

    assert.equal(call(ctx, '_prodSeen'), fingerprint());
    assert.equal(win.document.getElementById('prod-refresh').style.display, 'none');
  });

  test('falls back to the supervisor picker if the open session vanished remotely', () => {
    // Another device deleted the session being edited. Re-rendering the team
    // view would leave the screen frozen on data that no longer exists.
    //
    // activeSupId is module-scoped inside screens/production.js now, so this
    // drives the real entry point (enterSup) and asserts what the user sees,
    // rather than poking the variable. That is the better test regardless: the
    // observable outcome is the picker coming back, not a null in a closure.
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [{ id: 9, name: 'Karan', role: 'Supervisor', wage: 800, isSup: true, present: true }];
    S.sessions = [];
    call(ctx, 'enterSup(9)');                     // opens a session for Karan
    assert.equal(S.sessions.length, 1, 'precondition: a session is open');

    S.sessions.length = 0;                        // the remote pull removed it
    assert.doesNotThrow(() => call(ctx, 'applyProdRefresh()'));

    assert.equal(win.document.getElementById('sup-login').style.display, 'block',
      'the supervisor picker is shown again');
    assert.equal(win.document.getElementById('sup-work').style.display, 'none',
      'and the dead team view is hidden');
  });
});

// ── REGRESSION: renderSupLogin and the session shape ──
// Sessions moved to teams[] in the multi-team rework, but this list still read
// the legacy ss.team / ss.production. It threw on every current-shape session,
// which took down the whole "active sessions" list on the Production screen —
// the list a supervisor uses to see what another device has logged.
describe('renderSupLogin — active session list', () => {
  const withSup = (patch) => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.lab = [{ id: 9, name: 'Karan', role: 'Supervisor', wage: 800, isSup: true, present: true }];
    Object.assign(S, patch);
    return S;
  };
  const listHtml = () => win.document.getElementById('sup-sess-list').innerHTML;

  test('renders a current-shape session instead of throwing', () => {
    withSup({ sessions: [session(9, 'Karan', [
      team(1, 'Moulding', [{ id: 1, name: 'Ramesh', wage: 400 }], [{ name: 'Chair A', qty: 5, value: 5000 }]),
    ])] });

    assert.doesNotThrow(() => call(ctx, 'renderSupLogin()'));
    const html = listHtml();
    assert.match(html, /Karan/);
    assert.match(html, /Ramesh/);
    assert.match(html, /5× Chair A/);
  });

  test('totals labour and goods ACROSS teams, not just the first', () => {
    withSup({ sessions: [session(9, 'Karan', [
      team(1, 'Moulding',  [{ id: 1, name: 'A', wage: 400 }], [{ name: 'Chair A', qty: 2, value: 2000 }]),
      team(2, 'Finishing', [{ id: 2, name: 'B', wage: 500 }], [{ name: 'Chair A', qty: 3, value: 3000 }]),
    ])] });
    call(ctx, 'renderSupLogin()');

    const html = listHtml();
    assert.match(html, /2 workers/);
    assert.match(html, /1,700\/day/);            // 400 + 500 + 800 supervisor
    assert.match(html, /₹5,000/);                // 2000 + 3000
  });

  test('still renders a legacy single-team session', () => {
    // Old rows can still arrive from a device that has not opened them yet.
    withSup({ sessions: [{
      supId: 9, supName: 'Karan', supWage: 800, stage: 'Moulding',
      team: [{ id: 1, name: 'Ramesh', wage: 400 }],
      production: [{ name: 'Chair A', qty: 4, value: 4000 }],
    }] });

    assert.doesNotThrow(() => call(ctx, 'renderSupLogin()'));
    assert.match(listHtml(), /Ramesh/);
    assert.match(listHtml(), /4× Chair A/);
  });

  test('shows the stage as a badge, not as broken template text', () => {
    // The stage was interpolated with a botched string concat left inside a
    // template literal, so it rendered the literal characters `" + ss.stage + "`.
    withSup({ sessions: [session(9, 'Karan', [team(1, 'Painting', [], [])])] });
    call(ctx, 'renderSupLogin()');

    const html = listHtml();
    assert.doesNotMatch(html, /\+ ss\.stage \+/, 'template literal must not leak its own source');
    assert.match(html, /<span class="sp sp2">Painting<\/span>/);
  });

  test('a session with no production says so rather than breaking', () => {
    withSup({ sessions: [session(9, 'Karan', [team(1, 'Moulding', [], [])])] });
    call(ctx, 'renderSupLogin()');
    assert.match(listHtml(), /No production logged yet/);
  });
});
