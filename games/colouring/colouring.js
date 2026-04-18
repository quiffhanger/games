// Kids' colouring game — pick a stencil, pick a colour, tap a region to
// fill. Tools: fill (tap), pen (drag), erase, undo/redo, wipe.
// Fills are persisted per stencil so switching back and forth keeps your work.

import { STENCILS } from './stencils.js';

// ── 32 kid-friendly colours ────────────────────────────────────────────────
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
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch { /* */ }
}
function loadFills(id) {
  try { const raw = localStorage.getItem(FILLS_PREFIX + id); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function saveFills(id, fills) {
  try { localStorage.setItem(FILLS_PREFIX + id, JSON.stringify(fills)); } catch { /* */ }
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
let tool       = 'fill'; // 'fill' | 'pen' | 'erase'
let fills      = {};     // current stencil's region → colour map
let undoStack  = [];
let redoStack  = [];
const MAX_UNDO = 50;

// ── DOM refs ───────────────────────────────────────────────────────────────
const stage       = document.getElementById('stage');
const nameEl      = document.getElementById('stencil-name');
const prevBtn     = document.getElementById('prev-btn');
const nextBtn     = document.getElementById('next-btn');
const paletteEl   = document.getElementById('palette');
const toolFill    = document.getElementById('tool-fill');
const toolPen     = document.getElementById('tool-pen');
const toolErase   = document.getElementById('tool-erase');
const undoBtn     = document.getElementById('tool-undo');
const redoBtn     = document.getElementById('tool-redo');
const wipeBtn     = document.getElementById('tool-wipe');
const wipeOverlay = document.getElementById('wipe-confirm');
const wipeYes     = document.getElementById('wipe-yes');
const wipeNo      = document.getElementById('wipe-no');

// ── Undo / Redo ────────────────────────────────────────────────────────────
function pushUndo() {
  undoStack.push(JSON.parse(JSON.stringify(fills)));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
  syncUndoRedo();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.parse(JSON.stringify(fills)));
  fills = undoStack.pop();
  saveFills(STENCILS[stencilIdx].id, fills);
  applyFills();
  syncUndoRedo();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.parse(JSON.stringify(fills)));
  fills = redoStack.pop();
  saveFills(STENCILS[stencilIdx].id, fills);
  applyFills();
  syncUndoRedo();
}

function syncUndoRedo() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

// ── Fills helpers ──────────────────────────────────────────────────────────
function applyFills() {
  const svg = stage.querySelector('svg');
  if (!svg) return;
  svg.querySelectorAll('[data-region]').forEach((el) => {
    const id = el.getAttribute('data-region');
    el.setAttribute('fill', fills[id] || '#ffffff');
  });
}

function paintRegion(el) {
  const id = el.getAttribute('data-region');
  const paint = tool === 'erase' ? '#ffffff' : colour;
  el.setAttribute('fill', paint);
  fills[id] = paint;
  saveFills(STENCILS[stencilIdx].id, fills);
}

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
          aria-pressed="${c === colour && tool !== 'erase' ? 'true' : 'false'}"
        ></button>`
    )
    .join('');
  paletteEl.querySelectorAll('.col-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      colour = btn.dataset.colour;
      if (tool === 'erase') tool = 'fill';
      save(COLOUR_KEY, colour);
      syncToolButtons();
      syncPalette();
    });
  });
}

function syncPalette() {
  paletteEl.querySelectorAll('.col-swatch').forEach((btn) => {
    const active = tool !== 'erase' && btn.dataset.colour === colour;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

// ── Tools ──────────────────────────────────────────────────────────────────
function syncToolButtons() {
  toolFill.setAttribute('aria-pressed', tool === 'fill' ? 'true' : 'false');
  toolPen.setAttribute('aria-pressed', tool === 'pen' ? 'true' : 'false');
  toolErase.setAttribute('aria-pressed', tool === 'erase' ? 'true' : 'false');
}

function setTool(t) {
  tool = t;
  syncToolButtons();
  syncPalette();
}

toolFill.addEventListener('click', () => setTool('fill'));
toolPen.addEventListener('click', () => setTool('pen'));
toolErase.addEventListener('click', () => setTool('erase'));
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// ── Wipe (clear all with confirmation) ─────────────────────────────────────
wipeBtn.addEventListener('click', () => { wipeOverlay.hidden = false; });
wipeNo.addEventListener('click', () => { wipeOverlay.hidden = true; });
wipeYes.addEventListener('click', () => {
  wipeOverlay.hidden = true;
  pushUndo();
  fills = {};
  clearFills(STENCILS[stencilIdx].id);
  applyFills();
});

// ── Stencil rendering ──────────────────────────────────────────────────────
function renderStencil() {
  const s = STENCILS[stencilIdx];
  nameEl.textContent = s.name;
  stage.innerHTML = s.svg.trim();

  fills = loadFills(s.id);
  undoStack = [];
  redoStack = [];
  syncUndoRedo();

  const svg = stage.querySelector('svg');
  if (!svg) return;

  applyFills();

  // Fill / Erase: single tap fills a region.
  svg.querySelectorAll('[data-region]').forEach((region) => {
    region.addEventListener('click', (e) => {
      if (tool === 'pen') return; // pen uses drag, not click
      e.stopPropagation();
      pushUndo();
      paintRegion(region);
    });
    region.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // Pen tool: drag across regions to paint them.
  // The colour is locked for the duration of the stroke.
  let penActive = false;
  let penPainted = new Set();

  svg.addEventListener('pointerdown', (e) => {
    if (tool !== 'pen') return;
    e.preventDefault();
    penActive = true;
    penPainted.clear();
    pushUndo();
    svg.setPointerCapture(e.pointerId);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const region = el && el.closest ? el.closest('[data-region]') : null;
    if (region) {
      paintRegion(region);
      penPainted.add(region.getAttribute('data-region'));
    }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!penActive) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const region = el && el.closest ? el.closest('[data-region]') : null;
    if (region) {
      const id = region.getAttribute('data-region');
      if (!penPainted.has(id)) {
        paintRegion(region);
        penPainted.add(id);
      }
    }
  });

  const endPen = () => { penActive = false; };
  svg.addEventListener('pointerup', endPen);
  svg.addEventListener('pointercancel', endPen);
  svg.addEventListener('lostpointercapture', endPen);
}

// ── Stencil navigation ─────────────────────────────────────────────────────
function gotoStencil(i) {
  stencilIdx = ((i % STENCILS.length) + STENCILS.length) % STENCILS.length;
  save(LAST_KEY, String(stencilIdx));
  renderStencil();
}

prevBtn.addEventListener('click', () => gotoStencil(stencilIdx - 1));
nextBtn.addEventListener('click', () => gotoStencil(stencilIdx + 1));

// ── Start ──────────────────────────────────────────────────────────────────
renderPalette();
renderStencil();
syncToolButtons();
