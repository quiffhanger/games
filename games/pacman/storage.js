// Thin wrapper around localStorage so failures (private mode, disabled storage)
// just silently no-op instead of throwing.

const KEY_DIFF = 'pacman.diff';
const KEY_BEST_PREFIX = 'pacman.best.';

export function getDiff() {
  try {
    const v = localStorage.getItem(KEY_DIFF);
    return v && ['easy', 'medium', 'hard'].includes(v) ? v : 'easy';
  } catch {
    return 'easy';
  }
}

export function setDiff(d) {
  try {
    localStorage.setItem(KEY_DIFF, d);
  } catch {
    /* ignore */
  }
}

export function getBest(diff) {
  try {
    const v = localStorage.getItem(KEY_BEST_PREFIX + diff);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setBest(diff, n) {
  try {
    localStorage.setItem(KEY_BEST_PREFIX + diff, String(n));
  } catch {
    /* ignore */
  }
}
