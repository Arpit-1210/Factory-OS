// ── PAINT COLOUR ──
// A product logged at Painting is logged in a colour. From that point the
// colour is part of what the factory holds: stock lists "Chair A — Red" as its
// own line, and paint never changes what the product is worth.
//
// The two counting bugs this file pins down were both silent. Ten chairs
// carried through the pipeline were reported as twenty, because logging at a
// stage writes BOTH a production row and an auto transfer into that stage and
// each was credited. Painted stock then doubled again, because a coloured row
// answers to "Chair A — Red" AND to "Chair A", and the stock screen listed
// both names — so ten painted chairs read as forty units of stock.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boot, resetState, call } from './harness.mjs';

const { ctx, document, logs } = boot();

const bal = (p, st) => call(ctx, `getFGBalance(${JSON.stringify(p)}, ${JSON.stringify(st)})`);
// Serialised across the vm boundary: an object built inside the sandbox has a
// different Array/Object prototype, which deepStrictEqual refuses to match.
const breakdown = (base, st) => JSON.parse(call(ctx,
  `JSON.stringify(fgVariantBreakdown(${JSON.stringify(base)}, ${JSON.stringify(st)}))`));
const STAGES = ['Moulding', 'Finishing', 'Painting', 'Packing'];

/**
 * Every unit the factory believes it holds, counted the way the stock screen
 * counts it: per catalogue product, split into colours, across all four stages.
 */
function unitsOnHand() {
  const names = JSON.parse(call(ctx, 'JSON.stringify(getAllFGProducts())'));
  let n = 0;
  for (const st of STAGES) {
    for (const name of names) {
      const { variants, plain } = breakdown(name, st);
      n += plain + variants.reduce((a, v) => a + v.qty, 0);
    }
  }
  return n;
}

function setField(id, value) { document.getElementById(id).value = value; }

/**
 * Add a team working `stage`, and select it.
 *
 * One team per stage, which is how the floor runs and how the screen expects
 * it: a team's stage is a property of the TEAM, so moving the tab moves
 * everything that team has already logged along with it.
 */
function newTeamAt(stage) {
  call(ctx, 'addNewTeam()');
  call(ctx, `swStage(${JSON.stringify(stage)})`);
}

/** Start a supervisor session with one team parked on `stage`. */
function team(stage) {
  const S = resetState(ctx);
  S.fg = [{ id: 1, name: 'Chair A', price: 900 }, { id: 2, name: 'Table B', price: 400 }];
  S.lab = [{ id: 1, name: 'Karan', role: 'Supervisor', wage: 800, isSup: true, present: true }];
  call(ctx, 'enterSup(1)');
  newTeamAt(stage);
  return S;
}

/** Log production the way a supervisor does: pick, type, tap. */
function log({ product = '1', qty = 10, colour = null, price = '900' } = {}) {
  setField('sw-prod', product);
  setField('sw-qty', String(qty));
  setField('sw-price', price);
  if (colour !== null) setField('sw-color-val', colour);
  call(ctx, 'logProd()');
}

const rows = (S) => S.sessions[0].teams[S.sessions[0].teams.length - 1].production;

describe('logging a painted product', () => {
  test('records the colour in the product name, keeping the catalogue name', () => {
    const S = team('Painting');
    log({ colour: 'Red' });

    assert.equal(rows(S).length, 1);
    assert.equal(rows(S)[0].name, 'Chair A — Red');
    assert.equal(rows(S)[0].baseName, 'Chair A', 'the catalogue product it came from');
    assert.equal(rows(S)[0].colour, 'Red');
  });

  test('refuses to log painted stock with no colour', () => {
    const S = team('Painting');
    const before = logs.log.length;
    log({ colour: '' });

    assert.equal(rows(S).length, 0, 'nothing is logged');
    assert.match(String(logs.log.slice(before)), /colour/i, 'and it says why');
  });

  test('asks for a colour at Painting and nowhere else', () => {
    team('Painting');
    assert.equal(document.getElementById('sw-color-field').style.display, 'block');

    newTeamAt('Packing');
    assert.equal(document.getElementById('sw-color-field').style.display, 'none');
  });
});

describe('paint does not change the price', () => {
  test('values painted goods at the catalogue price, whatever is in the box', () => {
    const S = team('Painting');
    log({ colour: 'Red', price: '5000' });   // a stale or fat-fingered rate

    assert.equal(rows(S)[0].unitVal, 900, 'the catalogue price of a Chair A');
    assert.equal(rows(S)[0].value, 9000);
  });

  test('holds the rate box read-only while painting, and releases it after', () => {
    team('Painting');
    assert.equal(document.getElementById('sw-price').readOnly, true);

    newTeamAt('Moulding');
    assert.equal(document.getElementById('sw-price').readOnly, false,
      'other stages still price their own work');
  });
});

describe('painted stock in the stock screen', () => {
  test('shows the colour as its own line', () => {
    team('Painting');
    log({ colour: 'Red' });

    const { variants, plain } = breakdown('Chair A', 'Painting');
    assert.deepEqual(variants.map(v => [v.name, v.colour, v.qty]),
      [['Chair A — Red', 'Red', 10]]);
    assert.equal(plain, 0, 'none of it is uncoloured any more');
  });

  test('keeps two colours of the same product apart', () => {
    team('Painting');
    log({ colour: 'Red', qty: 6 });
    log({ colour: 'Blue', qty: 4 });

    const { variants } = breakdown('Chair A', 'Painting');
    assert.deepEqual(variants.map(v => [v.name, v.qty]),
      [['Chair A — Red', 6], ['Chair A — Blue', 4]]);
  });

  test('counts ten painted chairs once, not four times', () => {
    // The whole point. Before this, the production row and its auto transfer
    // both credited Painting, and the result was then listed under both the
    // plain and the coloured name.
    team('Painting');
    log({ colour: 'Red' });

    assert.equal(bal('Chair A — Red', 'Painting'), 10);
    const { variants, plain } = breakdown('Chair A', 'Painting');
    assert.equal(variants.reduce((a, v) => a + v.qty, 0) + plain, 10,
      'the stock screen shows ten units in total');
  });

  test('leaves uncoloured stock of the same product on its own line', () => {
    const S = team('Painting');
    log({ colour: 'Red', qty: 4 });
    // Six more Chair A sitting in Painting that nobody painted.
    S.fgTransfers.push({ id: 99, date: S.workDate, from: 'Finishing', to: 'Painting',
                         product: 'Chair A', qty: 6 });

    const { variants, plain } = breakdown('Chair A', 'Painting');
    assert.deepEqual(variants.map(v => [v.name, v.qty]), [['Chair A — Red', 4]]);
    assert.equal(plain, 6);
  });
});

describe('the stock screen as it renders', () => {
  test('lists the colour and prices it at the catalogue rate', () => {
    team('Painting');
    log({ colour: 'Red' });
    call(ctx, 'renderFGStock()');

    const html = document.getElementById('fg-stock-content').innerHTML;
    assert.match(html, /Chair A — Red/, 'the colour is on the stock line');

    // The Painting card, up to the start of the next stage card.
    const painting = html.slice(html.indexOf('PAINTING'));
    const card = painting.slice(0, painting.indexOf('PACKING') + 1 || undefined);
    assert.match(card, /1 products · 10 units/, 'ten units on one line, not twenty on two');
    assert.doesNotMatch(card.replace(/Chair A — Red/g, ''), /Chair A/,
      'the plain product is not listed alongside its own paint');
    assert.match(card, /₹\s*9,000/, 'valued at 10 × the catalogue price of a Chair A');
  });
});

describe('painted stock moves on', () => {
  test('drains from Painting when it is packed', () => {
    const S = team('Painting');
    log({ colour: 'Red' });
    assert.equal(breakdown('Chair A', 'Painting').variants[0].qty, 10);

    // Packing is logged against the catalogue product, as the screen writes it.
    newTeamAt('Packing');
    log({ price: '900' });

    assert.equal(breakdown('Chair A', 'Painting').variants.length, 0,
      'the paint left Painting with the goods');
    assert.equal(bal('Chair A', 'Packing'), 10);
    assert.equal(unitsOnHand(), 10, 'and nothing was created on the way');
  });

  test('the oldest paint leaves first', () => {
    team('Painting');
    log({ colour: 'Red', qty: 6 });
    log({ colour: 'Blue', qty: 4 });

    newTeamAt('Packing');
    log({ qty: 6, price: '900' });

    const { variants } = breakdown('Chair A', 'Painting');
    assert.deepEqual(variants.map(v => [v.name, v.qty]), [['Chair A — Blue', 4]],
      'the six red ones were packed, the blue are still waiting');
  });
});

describe('the colour survives packing', () => {
  test('offers the colours waiting in the stage before this one', () => {
    team('Painting');
    log({ colour: 'Red', qty: 6 });

    newTeamAt('Packing');
    const opts = document.getElementById('sw-prod').innerHTML;
    assert.match(opts, /In Painting now/, 'grouped as what is waiting to be worked on');
    assert.match(opts, /value="Chair A — Red"[^>]*>Chair A — Red — ₹\s*900 · 6 waiting/);
  });

  test('packs the colour rather than losing it', () => {
    const S = team('Painting');
    log({ colour: 'Red' });

    newTeamAt('Packing');
    log({ product: 'Chair A — Red' });          // picked from the group above

    assert.equal(rows(S)[0].name, 'Chair A — Red', 'packed as the colour it is');
    assert.equal(rows(S)[0].baseName, 'Chair A');
    const { variants } = breakdown('Chair A', 'Packing');
    assert.deepEqual(variants.map(v => [v.name, v.qty]), [['Chair A — Red', 10]]);
    assert.equal(breakdown('Chair A', 'Painting').variants.length, 0, 'and it left Painting');
    assert.equal(unitsOnHand(), 10);
  });

  test('an order for the catalogue product is still fillable by a painted one', () => {
    team('Painting');
    log({ colour: 'Red' });
    newTeamAt('Packing');
    log({ product: 'Chair A — Red' });

    // The exact check updateOrderStatus() runs before it lets a dispatch through:
    // the order says "Chair A", and ten red ones must answer for it.
    assert.equal(bal('Chair A', 'Packing'), 10);
  });

  test('repainting does not stack colours on the name', () => {
    const S = team('Painting');
    log({ colour: 'Red' });

    newTeamAt('Painting');
    log({ product: 'Chair A — Red', colour: 'Blue' });

    assert.equal(rows(S)[0].name, 'Chair A — Blue', 'not "Chair A — Red — Blue"');
  });
});

describe('a production row stays at the stage it was logged at', () => {
  test('moving the tab on does not drag what is already logged with it', () => {
    const S = team('Painting');
    log({ colour: 'Red' });

    // Same team, tab moved on — answering "no, the team is moving on".
    call(ctx, 'window.confirm = () => false');
    call(ctx, 'swStage("Packing")');

    assert.equal(rows(S)[0].stage, 'Painting', 'the row keeps its own stage');
    assert.equal(breakdown('Chair A', 'Painting').variants[0].qty, 10,
      'still painted, still in Painting');
    assert.equal(bal('Chair A', 'Packing'), 0, 'and nothing was restated as packed');
    call(ctx, 'window.confirm = () => true');
  });

  test('but a mis-set tab can still be corrected', () => {
    const S = team('Moulding');
    log({});
    // confirm() answers yes in the harness: "the tab was wrong, move them".
    call(ctx, 'swStage("Finishing")');

    assert.equal(rows(S)[0].stage, 'Finishing');
    assert.equal(bal('Chair A', 'Finishing'), 10);
    assert.equal(bal('Chair A', 'Moulding'), 0, 'it was never moulded under this tab');
  });
});

describe('colours reach the inventory screen and the export', () => {
  test('the inventory table lists each colour under its product', () => {
    team('Painting');
    log({ colour: 'Red', qty: 6 });
    log({ colour: 'Blue', qty: 4 });
    call(ctx, 'renderInventory()');

    const html = document.getElementById('inv-fg').innerHTML;
    assert.match(html, /↳ Chair A — Red/);
    assert.match(html, /↳ Chair A — Blue/);

    // The product row carries the full ten — that is what an order draws on —
    // and "Ever Made" counts the colours as the product they are made of.
    const row = html.slice(html.indexOf('>Chair A<'));
    const cells = [...row.matchAll(/>([0-9,]+|—)</g)].slice(0, 6).map(m => m[1]);
    assert.deepEqual(cells, ['—', '—', '10', '—', '10', '10'],
      'Moulding, Finishing, Painting, Packing, Total, Ever Made');
  });

  test('the finished-goods export carries the colours', () => {
    team('Painting');
    log({ colour: 'Red', qty: 6 });

    const rows2 = JSON.parse(call(ctx, `JSON.stringify((() => {
      const out = [];
      getAllFGProducts().forEach(name => {
        out.push([name, ...['Moulding','Finishing','Painting','Packing'].map(st => getFGBalance(name, st))]);
        ['Moulding','Finishing','Painting','Packing'].forEach((st, i) => {
          fgVariantBreakdown(name, st).variants.forEach(v => out.push(['    ' + v.name, st, v.qty]));
        });
      });
      return out;
    })())`));

    assert.deepEqual(rows2[0], ['Chair A', 0, 0, 6, 0]);
    assert.deepEqual(rows2[1], ['    Chair A — Red', 'Painting', 6]);
  });
});

describe('the pipeline conserves stock', () => {
  test('ten moulded, finished, painted and packed stay ten throughout', () => {
    team('Moulding');
    log({});
    assert.equal(unitsOnHand(), 10, 'moulded');

    newTeamAt('Finishing');
    log({});
    assert.equal(unitsOnHand(), 10, 'finished');

    newTeamAt('Painting');
    log({ colour: 'Red' });
    assert.equal(unitsOnHand(), 10, 'painted');

    newTeamAt('Packing');
    log({});
    assert.equal(unitsOnHand(), 10, 'packed');

    assert.equal(bal('Chair A', 'Packing'), 10, 'all of it ready to dispatch');
  });
});
