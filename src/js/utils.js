// ── UTILITIES ──

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function fmt(n) {
  if (!n && n !== 0) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

export function fmtN(n) {
  return Math.round(n || 0).toLocaleString('en-IN');
}

export function spBadge(s) {
  const stages = ['Moulding','Finishing','Painting','Packing','Dispatch'];
  const i = stages.indexOf(s);
  return `<span class="sp sp${i < 0 ? 0 : i}">${s}</span>`;
}

export function isOverdue(ord) {
  if (ord.status === 'dispatched' || !ord.requiredBy) return false;
  return new Date(ord.requiredBy + 'T00:00:00') < new Date();
}

export function orderStatusBg(s) {
  return s === 'pending'    ? 'var(--amber-l)' :
         s === 'production' ? 'var(--blue-l)'  :
         s === 'ready'      ? 'var(--jade-l)'  : 'var(--surface2)';
}

export function orderStatusColor(s) {
  return s === 'pending'    ? 'var(--amber)' :
         s === 'production' ? 'var(--blue)'  :
         s === 'ready'      ? 'var(--jade)'  : 'var(--text4)';
}

// Deep clone
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Debounce
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
