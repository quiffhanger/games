// Piano Tiles — kid-friendly version.
//
// Design:
//   • 4 coloured columns, one tile visible per lane at a time.
//   • Tap the tile as it falls through the tap zone at the bottom.
//   • Each column plays a distinct piano note via WebAudio.
//   • 3 hearts — lose one per missed tile (tile exits bottom untouched).
//   • Slow start speed that gently increases every 8 tiles.
//   • Very generous hit window so a 4-year-old can succeed.

// ── Constants ──────────────────────────────────────────────────────────────

const COLS = 4;
const W = 360;   // logical canvas width
const H = 640;   // logical canvas height

const TILE_W = W / COLS;      // 90 px per column
const TILE_H = 130;           // tall so they're easy to hit
const GAP = 6;                // gap between tile and column edge

// Tile is hittable once its bottom crosses this y (generous — bottom 65 %).
const HIT_ENTRY_Y = H * 0.35;
// Miss: tile top passes this y (a little below the bottom edge).
const MISS_Y = H + TILE_H * 0.25;

const START_SPEED  = 190;   // px / s
const SPEED_STEP   = 14;    // added every TILES_PER_STEP tiles tapped
const TILES_PER_STEP = 8;
const MAX_SPEED    = 520;

// Space between consecutive tile tops (px). As speed rises, tiles come faster.
const SPAWN_INTERVAL_PX = TILE_H * 1.85;

const LIVES = 3;

// Colours and notes per column (C4, E4, G4, C5 — pleasing chord).
const COL_COLORS  = ['#ff77c6', '#ffd600', '#4fe3ff', '#8aff80'];
const COL_SHADOW  = ['#c2005a', '#c79a00', '#0097b8', '#2d9900'];
const COL_NOTES   = [261.63, 329.63, 392.00, 523.25];

// Tap-zone stripe at the bottom of the canvas.
const ZONE_H = 110;
const ZONE_Y = H - ZONE_H;

// ── DOM refs ───────────────────────────────────────────────────────────────

const canvas    = document.getElementById('game');
const ctx       = canvas.getContext('2d');
const scoreEl   = document.getElementById('score');
const bestEl    = document.getElementById('best');
const livesEl   = document.getElementById('lives');
const overlay   = document.getElementById('gameover');
const titleEl   = document.getElementById('gameover-title');
const finalEl   = document.getElementById('gameover-score');
const againBtn  = document.getElementById('again');

// ── Canvas setup ───────────────────────────────────────────────────────────

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.aspectRatio = `${W} / ${H}`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupCanvas();

// ── Audio ──────────────────────────────────────────────────────────────────

let ac = null;
function ensureAC() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { ac = null; }
  }
  return ac;
}

function playNote(hz, vol = 0.18) {
  const a = ensureAC();
  if (!a) return;
  if (a.state === 'suspended') a.resume();

  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = 'triangle';
  osc.frequency.value = hz;
  gain.gain.setValueAtTime(vol, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.7);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + 0.75);
}

function playMiss() {
  const a = ensureAC();
  if (!a) return;
  if (a.state === 'suspended') a.resume();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, a.currentTime + 0.25);
  gain.gain.setValueAtTime(0.09, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.25);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + 0.3);
}

// ── LocalStorage ───────────────────────────────────────────────────────────

const BEST_KEY = 'piano-tiles.best';
function getBest() {
  try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; }
  catch { return 0; }
}
function setBest(n) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* */ }
}

// ── Game state ──────────────────────────────────────────────────────────────

let tiles, score, lives, speed, status;
let spawnOffset; // tracks how many px have scrolled since last spawn
let tilesHit;    // total tapped this game, drives speed increases
let prevCol;     // avoid spawning same column twice in a row
let particles;   // hit-burst particles
let gameOverTimer;
let shakeTimer;  // screen-shake on miss

function newGame() {
  tiles       = [];
  score       = 0;
  lives       = LIVES;
  speed       = START_SPEED;
  status      = 'playing';
  spawnOffset = 0;
  tilesHit    = 0;
  prevCol     = -1;
  particles   = [];
  gameOverTimer = 0;
  shakeTimer  = 0;

  overlay.hidden = true;
  scoreEl.textContent = '0';
  bestEl.textContent  = String(getBest());
  renderLives();

  // Spawn first tile immediately so there's something to tap.
  spawnTile();
}

function renderLives() {
  livesEl.innerHTML = Array.from({ length: LIVES }, (_, i) =>
    `<span class="pt-heart${i < lives ? '' : ' pt-heart--lost'}">&#10084;</span>`
  ).join('');
}

// ── Tile management ─────────────────────────────────────────────────────────

function pickCol() {
  let c;
  // Avoid same column twice in a row to prevent unplayable streaks.
  do { c = Math.floor(Math.random() * COLS); } while (c === prevCol);
  prevCol = c;
  return c;
}

function spawnTile() {
  tiles.push({
    col:   pickCol(),
    y:     -TILE_H,           // starts just above the canvas
    state: 'falling',         // 'falling' | 'hit' | 'missed'
    hitAnim: 0,               // 0..1 for brief flash on hit
  });
  spawnOffset = 0;
}

// ── Particles ───────────────────────────────────────────────────────────────

function burst(cx, cy, color) {
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
    const spd   = 40 + Math.random() * 110;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 30,
      r:  3 + Math.random() * 4,
      color,
      life: 0.55,
    });
  }
}

// ── Hit detection ───────────────────────────────────────────────────────────

function tryHit(col) {
  // Find the lowest falling tile in this column that's hittable.
  let best = null;
  for (const t of tiles) {
    if (t.col !== col || t.state !== 'falling') continue;
    const bottom = t.y + TILE_H;
    if (bottom < HIT_ENTRY_Y) continue; // not far enough down yet
    if (!best || t.y > best.y) best = t;
  }
  if (!best) return false;

  best.state  = 'hit';
  best.hitAnim = 1;
  score++;
  tilesHit++;
  scoreEl.textContent = String(score);
  if (score > getBest()) setBest(score);
  bestEl.textContent = String(getBest());

  // Speed bump every TILES_PER_STEP tiles.
  if (tilesHit % TILES_PER_STEP === 0) {
    speed = Math.min(speed + SPEED_STEP, MAX_SPEED);
  }

  // Play note and burst.
  playNote(COL_NOTES[col]);
  const cx = col * TILE_W + TILE_W / 2;
  const cy = best.y + TILE_H / 2;
  burst(cx, cy, COL_COLORS[col]);
  return true;
}

// ── Input ───────────────────────────────────────────────────────────────────

function colFromX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const fracX = (clientX - rect.left) / rect.width;
  return Math.min(COLS - 1, Math.max(0, Math.floor(fracX * COLS)));
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  ensureAC();
  if (status !== 'playing') return;
  const col = colFromX(e.clientX);
  tryHit(col);
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  ensureAC();
  if (status !== 'playing') return;
  for (const t of e.changedTouches) {
    tryHit(colFromX(t.clientX));
  }
}, { passive: false });

againBtn.addEventListener('click', newGame);

// ── Game loop ────────────────────────────────────────────────────────────────

let lastTs = performance.now();

function frame(ts) {
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.1) dt = 0.1;

  if (status === 'playing') {
    update(dt);
  } else if (status === 'gameover') {
    gameOverTimer += dt;
    if (gameOverTimer > 0.45) overlay.hidden = false;
    updateParticles(dt);
  }

  render();
  requestAnimationFrame(frame);
}

function update(dt) {
  const dy = speed * dt;

  // Move tiles.
  for (const t of tiles) {
    if (t.state === 'falling') t.y += dy;
    if (t.state === 'hit') {
      t.y += dy;
      t.hitAnim = Math.max(0, t.hitAnim - dt * 5);
    }
  }

  // Check for missed tiles (still falling, past the miss line).
  for (const t of tiles) {
    if (t.state === 'falling' && t.y > MISS_Y) {
      t.state = 'missed';
      lives--;
      renderLives();
      playMiss();
      shakeTimer = 0.25;
      if (lives <= 0) {
        status = 'gameover';
        titleEl.textContent = score >= 5 ? 'Amazing! 🎉' : 'Oh no! 💔';
        finalEl.textContent = `You tapped ${score} tile${score !== 1 ? 's' : ''}!`;
      }
    }
  }

  // Remove tiles that are off-screen and resolved.
  tiles = tiles.filter((t) => t.y < H + TILE_H * 2 && t.state !== 'missed');

  // Spawn new tile when enough distance has scrolled since last spawn.
  spawnOffset += dy;
  if (spawnOffset >= SPAWN_INTERVAL_PX) spawnTile();

  updateParticles(dt);

  if (shakeTimer > 0) shakeTimer -= dt;
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

// ── Rendering ────────────────────────────────────────────────────────────────

function render() {
  // Screen shake on miss.
  const sx = shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
  const sy = shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
  ctx.save();
  ctx.translate(sx, sy);

  // Background.
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, 0, W, H);

  // Column lanes — subtle alternating tint.
  for (let c = 0; c < COLS; c++) {
    ctx.fillStyle = c % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(c * TILE_W, 0, TILE_W, H);
  }

  // Column dividers.
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE_W, 0);
    ctx.lineTo(c * TILE_W, H);
    ctx.stroke();
  }

  // Tap zone — glowing band at the bottom.
  const zoneGrad = ctx.createLinearGradient(0, ZONE_Y - 20, 0, H);
  zoneGrad.addColorStop(0, 'rgba(255,255,255,0)');
  zoneGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
  ctx.fillStyle = zoneGrad;
  ctx.fillRect(0, ZONE_Y - 20, W, H - ZONE_Y + 20);

  // Tap zone top line.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ZONE_Y);
  ctx.lineTo(W, ZONE_Y);
  ctx.stroke();

  // Tiles.
  for (const t of tiles) {
    drawTile(t);
  }

  // Particles.
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawTile(t) {
  const x = t.col * TILE_W + GAP;
  const y = t.y;
  const tw = TILE_W - GAP * 2;
  const th = TILE_H;
  const rad = 14;
  const color = COL_COLORS[t.col];
  const shadow = COL_SHADOW[t.col];

  if (t.state === 'missed') return;

  // Glow / shadow behind the tile.
  ctx.shadowColor = color;
  ctx.shadowBlur = t.state === 'hit' ? 30 + t.hitAnim * 20 : 16;

  // Hit flash: tile brightens then fades.
  const alpha = t.state === 'hit' ? 0.3 + t.hitAnim * 0.7 : 1;
  ctx.globalAlpha = alpha;

  // Tile body.
  roundRect(ctx, x, y + 4, tw, th - 4, rad);
  ctx.fillStyle = shadow;
  ctx.fill();

  roundRect(ctx, x, y, tw, th - 6, rad);
  ctx.fillStyle = color;
  ctx.fill();

  // Inner highlight.
  if (t.state !== 'hit') {
    const hiGrad = ctx.createLinearGradient(x, y, x, y + th * 0.45);
    hiGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
    hiGrad.addColorStop(1, 'rgba(255,255,255,0)');
    roundRect(ctx, x + 4, y + 4, tw - 8, (th - 6) * 0.5, rad - 2);
    ctx.fillStyle = hiGrad;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.lineTo(x + w - rr, y);
  c.quadraticCurveTo(x + w, y, x + w, y + rr);
  c.lineTo(x + w, y + h - rr);
  c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  c.lineTo(x + rr, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - rr);
  c.lineTo(x, y + rr);
  c.quadraticCurveTo(x, y, x + rr, y);
  c.closePath();
}

// ── Start ────────────────────────────────────────────────────────────────────

newGame();
requestAnimationFrame(frame);
