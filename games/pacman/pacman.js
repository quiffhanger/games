// Pac-Man entry: sets up the canvas, game loop, audio, and UI wiring.

import { COLS, ROWS, createMaze, drawMaze, TILE } from './maze.js';
import { PacMan, Ghost, dirFromName } from './entities.js';
import { bindInput } from './input.js';
import { getBest, setBest } from './storage.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const winEl = document.getElementById('win');
const againBtn = document.getElementById('again');

// --- Sizing ------------------------------------------------------------
// Render at a fixed logical tile size, then scale via CSS. This keeps the
// game crisp on high-DPI screens because we also respect devicePixelRatio
// for the internal buffer size.
const TILE_PX = 42;
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = COLS * TILE_PX * dpr;
  canvas.height = ROWS * TILE_PX * dpr;
  canvas.style.aspectRatio = `${COLS} / ${ROWS}`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- Audio (tiny WebAudio blips, no assets) ---------------------------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audioCtx = null;
    }
  }
  return audioCtx;
}
function blip(freq = 660, duration = 0.08, type = 'square', gain = 0.05) {
  const ac = ensureAudio();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration + 0.02);
}

// --- Game state -------------------------------------------------------
let state;

function newGame() {
  const maze = createMaze();
  const pac = new PacMan(maze.pacSpawn.col, maze.pacSpawn.row);
  const ghosts = [
    new Ghost(maze.ghostSpawn.col, maze.ghostSpawn.row, '#ff77c6'),
    new Ghost(maze.ghostSpawn.col + 1, maze.ghostSpawn.row, '#4fe3ff'),
  ];
  // Filter out ghosts that can't spawn because the tile is a wall.
  // (In our maze both spawn positions are open floor.)
  state = {
    grid: maze.grid,
    remaining: maze.totalDots,
    pac,
    ghosts,
    status: 'playing', // 'playing' | 'won'
    confetti: [],
    winTimer: 0,
  };
  winEl.hidden = true;
  scoreEl.textContent = '0';
  bestEl.textContent = String(getBest());
}

// --- Input wiring -----------------------------------------------------
bindInput({
  canvas,
  onDir: (name) => {
    ensureAudio(); // Unlock audio on first user gesture
    if (state.status !== 'playing') return;
    state.pac.queue(dirFromName(name));
  },
});

againBtn.addEventListener('click', () => {
  newGame();
});

// --- Collision -------------------------------------------------------
function checkCollisions() {
  if (state.pac.invulnTimer > 0) return;
  const pc = state.pac.pixelCenter(TILE_PX);
  for (const g of state.ghosts) {
    const gc = g.pixelCenter(TILE_PX);
    const dx = pc.x - gc.x;
    const dy = pc.y - gc.y;
    const dist = Math.hypot(dx, dy);
    if (dist < TILE_PX * 0.7) {
      state.pac.bounce();
      g.reverse();
      blip(220, 0.18, 'sine', 0.06);
      blip(140, 0.22, 'sine', 0.06);
      return;
    }
  }
}

// --- Celebration / confetti ------------------------------------------
function spawnConfetti() {
  const cx = (COLS * TILE_PX) / 2;
  const cy = (ROWS * TILE_PX) / 2;
  const colors = ['#ffd600', '#ff77c6', '#4fe3ff', '#8aff80', '#ff8a5c'];
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 60 + Math.random() * 160;
    state.confetti.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      r: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.8,
    });
  }
}

function updateConfetti(dt) {
  for (const p of state.confetti) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt; // gravity
    p.life -= dt;
  }
  state.confetti = state.confetti.filter((p) => p.life > 0);
}

function drawConfetti() {
  for (const p of state.confetti) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// --- Game loop --------------------------------------------------------
let lastTs = performance.now();
function frame(ts) {
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08; // clamp big pauses (tab switch)

  if (state.status === 'playing') {
    state.pac.update(dt, state.grid, (kind) => {
      state.remaining--;
      scoreEl.textContent = String(state.pac.dotsEaten);
      blip(kind === TILE.BIG ? 520 : 760, 0.05, 'square', 0.04);
      if (state.remaining <= 0) {
        state.status = 'won';
        const best = Math.max(getBest(), state.pac.dotsEaten);
        setBest(best);
        bestEl.textContent = String(best);
        spawnConfetti();
        // Happy chime
        setTimeout(() => blip(660, 0.12, 'triangle', 0.08), 0);
        setTimeout(() => blip(880, 0.12, 'triangle', 0.08), 120);
        setTimeout(() => blip(1100, 0.2, 'triangle', 0.08), 240);
      }
    });
    for (const g of state.ghosts) g.update(dt, state.grid);
    checkCollisions();
  } else if (state.status === 'won') {
    state.winTimer += dt;
    if (state.winTimer > 0.4) winEl.hidden = false;
    updateConfetti(dt);
  }

  draw();
  requestAnimationFrame(frame);
}

function draw() {
  // Background (fills the logical canvas area; actual CSS size is bigger
  // with the DPR transform).
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, 0, COLS * TILE_PX, ROWS * TILE_PX);

  drawMaze(ctx, state.grid, TILE_PX);

  for (const g of state.ghosts) g.draw(ctx, TILE_PX);
  state.pac.draw(ctx, TILE_PX);

  if (state.status === 'won') drawConfetti();
}

newGame();
requestAnimationFrame(frame);
