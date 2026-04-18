// Thin wrapper around localStorage for the School Run game.
// Keys are namespaced with 'school-run.' prefix.

const PREFIX = 'school-run.';

function get(key) {
  try { return localStorage.getItem(PREFIX + key); }
  catch { return null; }
}

function set(key, val) {
  try { localStorage.setItem(PREFIX + key, val); }
  catch { /* ignore */ }
}

export function getDiff() {
  const v = get('diff');
  return v && ['easy', 'medium', 'hard'].includes(v) ? v : 'easy';
}

export function setDiff(d) { set('diff', d); }

export function getCharacter() {
  const v = get('character');
  return v && ['seb', 'isla'].includes(v) ? v : 'seb';
}

export function setCharacter(c) { set('character', c); }

export function getBest(diff) {
  const v = get('best.' + diff);
  return v ? parseInt(v, 10) || 0 : 0;
}

export function setBest(diff, n) { set('best.' + diff, String(n)); }
