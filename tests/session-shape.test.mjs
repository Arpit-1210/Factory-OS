// ── SESSION SHAPE ──
// Sessions moved from a flat {team, stage, production} to teams[] in the
// multi-team rework. enterSup() migrates a legacy session when it is OPENED,
// so any screen rendering a session nobody has opened — one logged on another
// device — sees the un-migrated shape. Reading ss.team / ss.production
// directly throws there, and it took out two whole screens before anyone
// traced it: the Production active-session list and the Raw Material screen.
//
// Both now read through sessionTeams/sessionMembers/sessionProduction. These
// tests pin the helpers and then the two screens that were crashing.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx, win } = boot();
const json = (v) => JSON.stringify(v);

const current = {
  supId: 9, supName: 'Karan', supWage: 800, supOT: 0,
  teams: [
    { teamId: 1, stage: 'Moulding',  team: [{ id: 1, name: 'Ramesh', wage: 400 }], production: [{ name: 'Chair A', qty: 2, value: 2000 }] },
    { teamId: 2, stage: 'Finishing', team: [{ id: 2, name: 'Suresh', wage: 500 }], production: [{ name: 'Chair A', qty: 3, value: 3000 }] },
  ],
};
const legacy = {
  supId: 9, supName: 'Karan', supWage: 800, stage: 'Moulding',
  team: [{ id: 1, name: 'Ramesh', wage: 400 }],
  production: [{ name: 'Chair A', qty: 4, value: 4000 }],
};

describe('sessionTeams / sessionMembers / sessionProduction', () => {
  test('reads a current-shape session', () => {
    resetState(ctx);
    assert.equal(call(ctx, `sessionTeams(${json(current)}).length`), 2);
    assert.deepEqual(call(ctx, `sessionMembers(${json(current)}).map(m=>m.name)`).join(), 'Ramesh,Suresh');
    assert.equal(call(ctx, `sessionProduction(${json(current)}).length`), 2);
  });

  test('normalises a legacy session into one team', () => {
    resetState(ctx);
    assert.equal(call(ctx, `sessionTeams(${json(legacy)}).length`), 1);
    assert.equal(call(ctx, `sessionTeams(${json(legacy)})[0].stage`), 'Moulding');
    assert.equal(call(ctx, `sessionProduction(${json(legacy)})[0].qty`), 4);
    assert.equal(call(ctx, `sessionMembers(${json(legacy)})[0].name`), 'Ramesh');
  });

  test('a session with neither shape yields empty arrays, not a throw', () => {
    resetState(ctx);
    assert.equal(call(ctx, `sessionTeams({supId:1,supName:'X'}).length`), 0);
    assert.equal(call(ctx, `sessionProduction({supId:1}).length`), 0);
    assert.equal(call(ctx, `sessionMembers({supId:1}).length`), 0);
  });

  test('null and undefined are tolerated', () => {
    resetState(ctx);
    assert.equal(call(ctx, 'sessionTeams(null).length'), 0);
    assert.equal(call(ctx, 'sessionProduction(undefined).length'), 0);
  });

  test('a team missing its arrays does not break aggregation', () => {
    resetState(ctx);
    const partial = { supId: 1, teams: [{ teamId: 1, stage: 'Moulding' }] };
    assert.equal(call(ctx, `sessionProduction(${json(partial)}).length`), 0);
    assert.equal(call(ctx, `sessionMembers(${json(partial)}).length`), 0);
  });
});

describe('Raw Material screen — crashed on every current-shape session', () => {
  const setup = (sessions) => {
    const S = resetState(ctx, { workDate: '2026-08-19' });
    S.rm = [{ id: 1, name: 'FRP Resin', unit: 'kg', price: 220 }];
    S.rawLog = [{ id: 1, stage: 'Moulding', name: 'FRP Resin', unit: 'kg', qty: 2, unitPrice: 220, cost: 440 }];
    S.sessions = sessions;
    return S;
  };

  test('renderRawPnL survives a current-shape session', () => {
    setup([JSON.parse(json(current))]);
    assert.doesNotThrow(() => call(ctx, 'renderRawPnL()'));
  });

  test('renderRaw — the whole screen — survives it too', () => {
    // renderRawPnL threw from inside renderRaw, so the entire RM supervisor
    // screen died whenever any production session existed.
    setup([JSON.parse(json(current))]);
    assert.doesNotThrow(() => call(ctx, 'renderRaw()'));
  });

  test('totals goods across every team, not just the first', () => {
    setup([JSON.parse(json(current))]);
    call(ctx, 'renderRawPnL()');
    const html = win.document.getElementById('raw-pnl').innerHTML;
    assert.match(html, /₹5,000/, 'goods = 2000 + 3000 across both teams');
    assert.match(html, /₹440/, 'RM cost');
    assert.match(html, /₹4,560/, 'net = 5000 - 440');
  });

  test('still totals a legacy session correctly', () => {
    setup([JSON.parse(json(legacy))]);
    call(ctx, 'renderRawPnL()');
    assert.match(win.document.getElementById('raw-pnl').innerHTML, /₹4,000/);
  });

  test('a negative net is reported rather than hidden', () => {
    const S = setup([]);
    S.rawLog = [{ id: 1, stage: 'Moulding', name: 'FRP Resin', unit: 'kg', qty: 10, unitPrice: 220, cost: 2200 }];
    call(ctx, 'renderRawPnL()');
    assert.match(win.document.getElementById('raw-pnl').innerHTML, /₹-2,200/);
  });

  test('renderRawLog shows a real stage badge, not leaked template source', () => {
    // The stage was interpolated with a botched string concat left inside a
    // template literal, so it printed the characters `" + r.stage + "`.
    setup([]);
    call(ctx, 'renderRawLog()');
    const html = win.document.getElementById('raw-log').innerHTML;
    assert.doesNotMatch(html, /\+ r\.stage \+/, 'must not print its own source');
    assert.match(html, /<span class="sp sp0">Moulding<\/span>/);
    assert.match(html, /FRP Resin/);
  });

  test('an empty raw log says so instead of rendering an empty table', () => {
    const S = setup([]);
    S.rawLog = [];
    call(ctx, 'renderRawLog()');
    assert.match(win.document.getElementById('raw-log').innerHTML, /Nothing issued yet/);
  });
});
