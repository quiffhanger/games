// Thin wrapper around localStorage so failures (private mode, disabled storage)
// just silently no-op instead of throwing.

const KEY_BEST = 'pacman.best';

export function getBest() {
  try {
    const v = localStorage.getItem(KEY_BEST);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setBest(n) {
  try {
    localStorage.setItem(KEY_BEST, String(n));
  } catch {
    /* ignore */
  }
}
