// ── MINIMAL DOM STUB ──
// app.js is a classic browser script: it writes into #app-root at load and
// assigns every function onto `window`. Rather than pull in jsdom, we give it
// just enough DOM to evaluate, then read the real functions off the window it
// built. Anything it renders into is a sink — we test logic, not markup.

// `doc` lets an element register its children with the document, so anything
// inserted into the tree becomes findable by getElementById — as in a real
// DOM. Without it, code that appends an element and later looks it up by id
// (the screen error boundary does exactly that) could never be tested.
export function createElement(tag = 'div', doc = null) {
  const el = {
    tagName: String(tag).toUpperCase(),
    innerHTML: '', outerHTML: '', textContent: '', value: '', src: '',
    className: '', id: '', checked: false, selectedIndex: -1,
    style: {}, dataset: {}, options: [], children: [], childNodes: [],
    files: [], parentNode: null, disabled: false,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); },
      contains(c) { return this._s.has(c); },
    },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) {
      this.children.push(c);
      if (c) { c.parentNode = this; if (doc) doc._register(c); }
      return c;
    },
    removeChild(c) {
      this.children = this.children.filter(x => x !== c);
      if (c) { c.parentNode = null; if (doc) doc._unregister(c); }
      return c;
    },
    insertBefore(c) {
      this.children.unshift(c);
      if (c) { c.parentNode = this; if (doc) doc._register(c); }
      return c;
    },
    // Real detachment, not a no-op: the screen error boundary removes its own
    // banner before re-rendering, and a stub that silently kept it would let
    // duplicate/stale banners pass unnoticed.
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    focus() {}, blur() {}, click() {}, select() {},
    setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k] ?? null; },
    removeAttribute(k) { delete this[k]; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementsByTagName() { return []; },
    scrollIntoView() {}, closest() { return null; },
  };
  return el;
}

export function createDocument() {
  const byId = new Map();
  const absent = new Set();
  const doc = {
    hidden: false,
    // Every lookup resolves to a live stub and is memoised, so code that does
    // `getElementById('x').value = 1` then reads it back sees its own write.
    // app.js reads hundreds of ids it never guards, so auto-creating is what
    // lets it boot at all.
    //
    // markAbsent() opts one id out of that. Code that CREATES an element
    // ("does it exist yet? no — build it and append it") can only be tested if
    // the first lookup honestly returns null; appending an element with that
    // id makes it exist again, exactly as in a real document.
    getElementById(id) {
      if (absent.has(id)) return null;
      if (!byId.has(id)) { const el = createElement('div', doc); el.id = id; byId.set(id, el); }
      return byId.get(id);
    },
    markAbsent(id) { byId.delete(id); absent.add(id); },
    _register(el) {
      if (el && el.id) { absent.delete(el.id); byId.set(el.id, el); }
    },
    _unregister(el) { if (el && el.id && byId.get(el.id) === el) byId.delete(el.id); },
    _has(id) { return byId.has(id); },
    _reset() { byId.clear(); absent.clear(); },
    createElement: (t) => createElement(t, doc),
    createTextNode: (t) => ({ textContent: t }),
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementsByTagName() { return []; },
    addEventListener() {}, removeEventListener() {},
    execCommand() { return true; },
    write() {}, close() {}, open() {},
  };
  doc.head = createElement('head', doc);
  doc.body = createElement('body', doc);
  doc.documentElement = createElement('html', doc);
  return doc;
}

export function createLocalStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(String(k)); },
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
    _dump: () => Object.fromEntries(map),
  };
}
