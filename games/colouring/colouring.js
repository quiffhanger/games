// Kids' colouring game — pick a stencil, pick a colour, tap a region to
// fill. Eraser sets a region back to white. Fills are persisted per
// stencil so switching back and forth keeps your work.

import { STENCILS } from './stencils.js';

// ── 32 kid-friendly colours ────────────────────────────────────────────────
// Ordered by rough hue groups: neutrals → warm → cool → pink/purple.
const COLOURS = [
  '#000000', '#424242', '#9e9e9e', '#e0e0e0', '#ffffff', '#4e342e', '#8d6e63', '#c9a27b',
  '#ffcc99', '#8b0000', '#f44336', '#ff7043', '#ff9800', '#ffb300', '#ffeb3b', '#fff59d',
  '#cddc39', '#81c784', '#4caf50', '#1b5e20', '#009688', '#00bcd4', '#4fc3f7', '#2196f3',
  '#0d47a1', '#3f51b5', '#7e57c2', '#9c27b0', '#e91e63', '#ff77c6', '#f8bbd0', '#c2185b',
];

// ── Storage ────────────────────────────────────────────────────────────────
const LAST_KEY     = 'colouring.last';
const COLOUR_KEY   = 'colouring.colour';
const FILLS_PREFIX = 'colouring.fills.';

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch { /* */ }
}

function loadFills(id) {
  try {
    const raw = localStorage.getItem(FILLS_PREFIX + id);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveFills(id, fills) {
  try { localStorage.setItem(FILLS_PREFIX + id, JSON.stringify(fills)); }
  catch { /* */ }
}
function clearFills(id) {
  try { localStorage.removeItem(FILLS_PREFIX + id); } catch { /* */ }
}

// ── State ──────────────────────────────────────────────────────────────────
const initialIdx = (() => {
  const n = parseInt(load(LAST_KEY, '0'), 10);
  return Number.isFinite(n) && n >= 0 && n < STENCILS.length ? n : 0;
})();
const initialColour = (() => {
  const c = load(COLOUR_KEY, '#f44336');
  return COLOURS.includes(c) ? c : '#f44336';
})();

let stencilIdx = initialIdx;
let colour     = initialColour;
let tool       = 'fill'; // 'fill' | 'erase'

// ── DOM refs ───────────────────────────────────────────────────────────────
const stage     = document.getElementById('stage');
const nameEl    = document.getElementById('stencil-name');
const prevBtn   = document.getElementById('prev-btn');
const nextBtn   = document.getElementById('next-btn');
const clearBtn  = document.getElementById('clear-btn');
const paletteEl = document.getElementById('palette');
const toolFill  = document.getElementById('tool-fill');
const toolErase = document.getElementById('tool-erase');

// ── Palette ────────────────────────────────────────────────────────────────
function renderPalette() {
  paletteEl.innerHTML = COLOURS
    .map(
      (c) => `
        <button
          class="col-swatch"
          type="button"
          data-colour="${c}"
          style="background:${c}"
          aria-label="Colour ${c}"
          aria-pressed="${c === colour && tool === 'fill' ? 'true' : 'false'}"
        ></button>`
    )
    .join('');
  paletteEl.querySelectorAll('.col-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      colour = btn.dataset.colour;
      tool = 'fill';
      save(COLOUR_KEY, colour);
      syncToolButtons();
      syncPalette();
    });
  });
}

function syncPalette() {
  paletteEl.querySelectorAll('.col-swatch').forEach((btn) => {
    const active = tool === 'fill' && btn.dataset.colour === colour;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

// ── Tools ──────────────────────────────────────────────────────────────────
function syncToolButtons() {
  toolFill.setAttribute('aria-pressed', tool === 'fill' ? 'true' : 'false');
  toolErase.setAttribute('aria-pressed', tool === 'erase' ? 'true' : 'false');
}

toolFill.addEventListener('click', () => {
  tool = 'fill';
  syncToolButtons();
  syncPalette();
});
toolErase.addEventListener('click', () => {
  tool = 'erase';
  syncToolButtons();
  syncPalette();
});

// ── Stencil rendering ──────────────────────────────────────────────────────
function renderStencil() {
  const s = STENCILS[stencilIdx];
  nameEl.textContent = s.name;
  stage.innerHTML = s.svg.trim();

  const fills = loadFills(s.id);
  const svg = stage.querySelector('svg');
  if (!svg) return;

  svg.querySelectorAll('[data-region]').forEach((region) => {
    const id = region.getAttribute('data-region');
    if (fills[id]) {
      region.setAttribute('fill', fills[id]);
    }
    // Paint on tap. Using click is fine — the browser already dispatches
    // it on tap-up for touch and click for mouse, and we don't need drag.
    region.addEventListener('click', (e) => {
      e.stopPropagation();
      const paint = tool === 'erase' ? '#ffffff' : colour;
      region.setAttribute('fill', paint);
      fills[id] = paint;
      saveFills(s.id, fills);
    });
    // Prevent iOS's long-press text selection / callout on SVG regions.
    region.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}

// ── Stencil navigation ─────────────────────────────────────────────────────
function gotoStencil(i) {
  stencilIdx = ((i % STENCILS.length) + STENCILS.length) % STENCILS.length;
  save(LAST_KEY, String(stencilIdx));
  renderStencil();
}

prevBtn.addEventListener('click', () => gotoStencil(stencilIdx - 1));
nextBtn.addEventListener('click', () => gotoStencil(stencilIdx + 1));
clearBtn.addEventListener('click', () => {
  const s = STENCILS[stencilIdx];
  clearFills(s.id);
  renderStencil();
});

// ── Start ──────────────────────────────────────────────────────────────────
renderPalette();
renderStencil();
syncToolButtons();
