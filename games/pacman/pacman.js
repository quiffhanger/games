// Pac-Man entry: sets up the canvas, game loop, audio, and UI wiring.
// Three difficulty modes: easy (slow, no death), medium (normal, 3 lives),
// hard (normal speed, ghosts chase, 3 lives). Power pellets make ghosts
// edible for a duration that depends on difficulty.

import { COLS, ROWS, createMaze, drawMaze, TILE } from './maze.js';
import { PacMan, Ghost, DIR, dirFromName } from './entities.js';
import { bindInput } from './input.js';
import { getBest, setBest, getDiff, setDiff } from './storage.js';

// ── Difficulty config ─────────────────────────────────────────────────────
const DIFF = {
  easy: {
    pacSpeed: 2.25,
    ghostSpeed: 1.1,
    canDie: false,
    lives: 0,
    powerDuration: 30,
    ghostAI: 'random',
    ghostFlee: false,
  },
  medium: {
    pacSpeed: 4.5,
    ghostSpeed: 2.2,
    canDie: true,
    lives: 3,
    powerDuration: 10,
    ghostAI: 'random',
    ghostFlee: true,
  },
  hard: {
    pacSpeed: 4.5,
    ghostSpeed: 2.2,
    canDie: true,
    lives: 3,
    powerDuration: 5,
    ghostAI: 'chase',
    ghostFlee: true,
  },
};

// ── DOM refs ──────────────────────────────────────────────────────────────
const canvas       = document.getElementById('game');
const ctx          = canvas.getContext('2d');
const scoreEl      = document.getElementById('score');
const bestEl       = document.getElementById('best');
const livesEl      = document.getElementById('lives');
const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub   = document.getElementById('overlay-subtitle');
const diffBtns     = document.getElementById('diff-btns');
const tiltBtn      = document.getElementById('tilt-btn');

// ── Sizing ────────────────────────────────────────────────────────────────
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

// ── Audio (tiny WebAudio blips, no assets) ────────────────────────────────
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

// ── Game state ────────────────────────────────────────────────────────────
let state;

function initState(diffKey) {
  const d = DIFF[diffKey];
  const maze = createMaze();
  const pac = new PacMan(maze.pacSpawn.col, maze.pacSpawn.row, d.pacSpeed);
  pac.lives = d.lives;
  const ghosts = [
    new Ghost(maze.ghostSpawn.col, maze.ghostSpawn.row, '#ff77c6', d.ghostSpeed),
    new Ghost(maze.ghostSpawn.col + 1, maze.ghostSpawn.row, '#4fe3ff', d.ghostSpeed),
  ];
  return {
    grid: maze.grid,
    remaining: maze.totalDots,
    pac,
    ghosts,
    status: 'start', // 'start' | 'playing' | 'dying' | 'gameover' | 'won' | 'idle'
    confetti: [],
    winTimer: 0,
    deathTimer: 0,
    diff: d,
    diffKey,
    pacSpawn: maze.pacSpawn,
    ghostSpawn: maze.ghostSpawn,
  };
}

function newGame(diffKey) {
  setDiff(diffKey);
  state = initState(diffKey);
  state.status = 'playing';
  overlay.hidden = true;
  scoreEl.textContent = '0';
  bestEl.textContent = String(getBest(diffKey));
  renderLives();
}

// ── Lives display ─────────────────────────────────────────────────────────
function renderLives() {
  livesEl.innerHTML = '';
  if (!state.diff.canDie) return;
  for (let i = 0; i < state.pac.lives; i++) {
    const span = document.createElement('span');
    span.className = 'pac-life';
    livesEl.appendChild(span);
  }
}

// ── Overlay (difficulty selection, win, game-over) ────────────────────────
function showOverlay(title, subtitle) {
  overlayTitle.textContent = title;
  overlaySub.textContent = subtitle || '';
  overlaySub.hidden = !subtitle;
  overlay.hidden = false;
  const cur = state ? state.diffKey : getDiff();
  diffBtns.querySelectorAll('[data-diff]').forEach((btn) => {
    btn.classList.toggle('pac-diff-btn--active', btn.dataset.diff === cur);
  });
}

// ── Input wiring ──────────────────────────────────────────────────────────
const input = bindInput({
  canvas,
  onDir: (name) => {
    ensureAudio();
    if (!state || state.status !== 'playing') return;
    state.pac.queue(dirFromName(name));
  },
});

// ── Difficulty buttons ────────────────────────────────────────────────────
diffBtns.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-diff]');
  if (btn) newGame(btn.dataset.diff);
});

// ── Tilt toggle ───────────────────────────────────────────────────────────
let tiltOn = false;
tiltBtn.addEventListener('click', async () => {
  if (!tiltOn) {
    const granted = await input.enableTilt();
    if (!granted) return;
    tiltOn = true;
  } else {
    input.disableTilt();
    tiltOn = false;
  }
  tiltBtn.setAttribute('aria-pressed', tiltOn ? 'true' : 'false');
  document.body.classList.toggle('pacman-body--tilt', tiltOn);
});

// ── Collision ─────────────────────────────────────────────────────────────
function checkCollisions() {
  if (state.pac.invulnTimer > 0) return;
  const pc = state.pac.pixelCenter(TILE_PX);
  for (const g of state.ghosts) {
    if (g.eaten) continue;
    const gc = g.pixelCenter(TILE_PX);
    const dist = Math.hypot(pc.x - gc.x, pc.y - gc.y);
    if (dist < TILE_PX * 0.7) {
      if (g.frightened) {
        // Eat the ghost!
        g.eaten = true;
        g.frightened = false;
        g.frightenedTimer = 0;
        state.pac.score += 200;
        scoreEl.textContent = String(state.pac.score);
        blip(880, 0.15, 'triangle', 0.08);
        blip(1100, 0.12, 'triangle', 0.06);
      } else if (state.diff.canDie) {
        // Pac-Man loses a life
        state.pac.lives--;
        renderLives();
        if (state.pac.lives <= 0) {
          state.status = 'gameover';
          state.deathTimer = 0;
          blip(220, 0.3, 'sawtooth', 0.06);
          blip(140, 0.4, 'sawtooth', 0.05);
        } else {
          state.status = 'dying';
          state.deathTimer = 0;
          blip(220, 0.2, 'sine', 0.06);
          blip(140, 0.25, 'sine', 0.05);
        }
      } else {
        // Easy mode: bounce
        state.pac.bounce();
        g.reverse();
        blip(220, 0.18, 'sine', 0.06);
        blip(140, 0.22, 'sine', 0.06);
      }
      return;
    }
  }
}

// ── Respawn after losing a life ───────────────────────────────────────────
function respawn() {
  const { pac, pacSpawn, ghosts } = state;
  pac.col = pacSpawn.col;
  pac.row = pacSpawn.row;
  pac.tcol = pacSpawn.col;
  pac.trow = pacSpawn.row;
  pac.progress = 1;
  pac.dir = DIR.NONE;
  pac.nextDir = DIR.NONE;
  pac.invulnTimer = 1.5;

  for (const g of ghosts) {
    g.col = g.spawnCol;
    g.row = g.spawnRow;
    g.tcol = g.spawnCol;
    g.trow = g.spawnRow;
    g.progress = 1;
    g.dir = DIR.NONE;
    g.frightened = false;
    g.frightenedTimer = 0;
    g.eaten = false;
  }

  state.status = 'playing';
}

// ── Celebration / confetti ────────────────────────────────────────────────
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
    p.vy += 200 * dt;
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

// ── Game loop ─────────────────────────────────────────────────────────────
let lastTs = performance.now();

function frame(ts) {
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;

  if (state.status === 'playing') {
    // Update Pac-Man
    state.pac.update(dt, state.grid, (kind) => {
      state.remaining--;
      state.pac.score += kind === TILE.BIG ? 50 : 10;
      scoreEl.textContent = String(state.pac.score);

      if (kind === TILE.BIG) {
        // Power pellet: frighten all ghosts
        for (const g of state.ghosts) {
          g.frighten(state.diff.powerDuration);
        }
        blip(520, 0.15, 'sine', 0.06);
        blip(440, 0.2, 'sine', 0.04);
      } else {
        blip(760, 0.05, 'square', 0.04);
      }

      if (state.remaining <= 0) {
        state.status = 'won';
        state.winTimer = 0;
        const best = Math.max(getBest(state.diffKey), state.pac.score);
        setBest(state.diffKey, best);
        bestEl.textContent = String(best);
        spawnConfetti();
        setTimeout(() => blip(660, 0.12, 'triangle', 0.08), 0);
        setTimeout(() => blip(880, 0.12, 'triangle', 0.08), 120);
        setTimeout(() => blip(1100, 0.2, 'triangle', 0.08), 240);
      }
    });

    // Update ghosts
    const pacCol =
      state.pac.progress > 0.5 ? state.pac.tcol : state.pac.col;
    const pacRow =
      state.pac.progress > 0.5 ? state.pac.trow : state.pac.row;
    for (const g of state.ghosts) {
      g.update(
        dt,
        state.grid,
        pacCol,
        pacRow,
        state.diff.ghostAI,
        state.diff.ghostFlee
      );
    }

    checkCollisions();
  } else if (state.status === 'dying') {
    state.deathTimer += dt;
    if (state.deathTimer >= 1.2) respawn();
  } else if (state.status === 'gameover') {
    state.deathTimer += dt;
    if (state.deathTimer >= 1.5) {
      const best = Math.max(getBest(state.diffKey), state.pac.score);
      setBest(state.diffKey, best);
      bestEl.textContent = String(best);
      showOverlay('Game Over', `Score: ${state.pac.score}`);
      state.status = 'idle';
    }
  } else if (state.status === 'won') {
    state.winTimer += dt;
    updateConfetti(dt);
    if (state.winTimer > 0.6 && overlay.hidden) {
      showOverlay('Yay! You did it! 🎉', `Score: ${state.pac.score}`);
    }
  }
  // 'start' and 'idle': no updates, just render

  draw();
  requestAnimationFrame(frame);
}

function draw() {
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, 0, COLS * TILE_PX, ROWS * TILE_PX);
  drawMaze(ctx, state.grid, TILE_PX);

  for (const g of state.ghosts) g.draw(ctx, TILE_PX);

  // Pac-Man: fade during death animation
  if (state.status === 'dying' || state.status === 'gameover') {
    const t = Math.min(state.deathTimer / 0.8, 1);
    ctx.globalAlpha = Math.max(0, 1 - t);
  }
  state.pac.draw(ctx, TILE_PX);
  ctx.globalAlpha = 1;

  if (state.status === 'won') drawConfetti();
}

// ── Start ─────────────────────────────────────────────────────────────────
const initialDiff = getDiff();
state = initState(initialDiff);
bestEl.textContent = String(getBest(initialDiff));
showOverlay('Pac-Man');
requestAnimationFrame(frame);
