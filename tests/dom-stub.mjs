// ── MINIMAL DOM STUB ──
// app.js is a classic browser script: it writes into #app-root at load and
// assigns every function onto `window`. Rather than pull in jsdom, we give it
// just enough DOM to evaluate, then read the real functions off the window it
// built. Anything it renders into is a sink — we test logic, not markup.

export function createElement(tag = 'div') {
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
    appendChild(c) { this.children.push(c); if (c) c.parentNode = this; return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    remove() {}, focus() {}, blur() {}, click() {}, select() {},
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
  const doc = {
    hidden: false,
    // Every lookup resolves to a live stub and is memoised, so code that does
    // `getElementById('x').value = 1` then reads it back sees its own write.
    getElementById(id) {
      if (!byId.has(id)) { const el = createElement(); el.id = id; byId.set(id, el); }
      return byId.get(id);
    },
    _has(id) { return byId.has(id); },
    _reset() { byId.clear(); },
    createElement: (t) => createElement(t),
    createTextNode: (t) => ({ textContent: t }),
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementsByTagName() { return []; },
    addEventListener() {}, removeEventListener() {},
    execCommand() { return true; },
    write() {}, close() {}, open() {},
  };
  doc.head = createElement('head');
  doc.body = createElement('body');
  doc.documentElement = createElement('html');
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
