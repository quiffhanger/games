// Security Invaders — a Space Invaders riff where the enemies are rival
// cybersecurity vendors and the player is Sophos. Complete FY27 (Q1→Q4) by
// clearing the board each quarter to win.

// ── Canvas setup ───────────────────────────────────────────────────────────

const W = 420;
const H = 640;

const canvas   = document.getElementById('game');
const ctx      = canvas.getContext('2d');
const scoreEl  = document.getElementById('score');
const livesEl  = document.getElementById('lives');
const quarterEl= document.getElementById('quarter');
const overlay  = document.getElementById('gameover');
const titleEl  = document.getElementById('gameover-title');
const msgEl    = document.getElementById('gameover-msg');
const againBtn = document.getElementById('again');

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

function beep({ freq = 440, dur = 0.1, type = 'square', vol = 0.08, slide = 0 } = {}) {
  const a = ensureAC();
  if (!a) return;
  if (a.state === 'suspended') a.resume();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
  gain.gain.setValueAtTime(vol, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur + 0.02);
}

const sndShoot   = () => beep({ freq: 720, dur: 0.08, type: 'square', vol: 0.05, slide: -400 });
const sndHit     = () => beep({ freq: 240, dur: 0.14, type: 'sawtooth', vol: 0.09, slide: -160 });
const sndPlayerHit = () => { beep({ freq: 180, dur: 0.3, type: 'sawtooth', vol: 0.12, slide: -120 }); };
const sndQuarter = () => {
  beep({ freq: 520, dur: 0.12, type: 'triangle', vol: 0.1 });
  setTimeout(() => beep({ freq: 660, dur: 0.12, type: 'triangle', vol: 0.1 }), 110);
  setTimeout(() => beep({ freq: 880, dur: 0.22, type: 'triangle', vol: 0.1 }), 220);
};
const sndWin = () => {
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => setTimeout(() => beep({ freq: f, dur: 0.22, type: 'triangle', vol: 0.1 }), i * 140));
};
const sndLose = () => beep({ freq: 120, dur: 0.6, type: 'sawtooth', vol: 0.14, slide: -80 });

// ── Enemy vendor logos ─────────────────────────────────────────────────────
// Each "vendor" draws its own stylised logo into a 42×42 cell. We avoid
// trademark marks and keep them recognisable-but-stylised. Points awarded
// per kill also live here.

const ENEMY_SIZE = 42;

const VENDORS = [
  {
    name: 'CrowdStrike',
    points: 30,
    bg: '#e40000',
    fg: '#ffffff',
    // Stylised falcon head silhouette.
    draw(c, x, y, s) {
      c.save();
      c.translate(x, y);
      c.fillStyle = this.bg;
      roundRect(c, 0, 0, s, s, 6);
      c.fill();
      c.fillStyle = this.fg;
      c.beginPath();
      // Beak + head
      c.moveTo(s * 0.18, s * 0.32);
      c.quadraticCurveTo(s * 0.40, s * 0.20, s * 0.72, s * 0.22);
      c.quadraticCurveTo(s * 0.90, s * 0.30, s * 0.86, s * 0.52);
      c.quadraticCurveTo(s * 0.74, s * 0.68, s * 0.55, s * 0.66);
      c.lineTo(s * 0.40, s * 0.84);
      c.lineTo(s * 0.36, s * 0.60);
      c.quadraticCurveTo(s * 0.22, s * 0.52, s * 0.18, s * 0.32);
      c.closePath();
      c.fill();
      // Eye
      c.fillStyle = this.bg;
      c.beginPath();
      c.arc(s * 0.62, s * 0.40, s * 0.045, 0, Math.PI * 2);
      c.fill();
      c.restore();
    },
  },
  {
    name: 'Palo Alto',
    points: 20,
    bg: '#fa582d',
    fg: '#ffffff',
    // Abstract "P"-style wordmark.
    draw(c, x, y, s) {
      c.save();
      c.translate(x, y);
      c.fillStyle = this.bg;
      roundRect(c, 0, 0, s, s, 6);
      c.fill();
      c.fillStyle = this.fg;
      c.font = `bold ${s * 0.64}px -apple-system, system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('P', s / 2, s / 2 + s * 0.02);
      // Small cone
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath();
      c.moveTo(s * 0.2, s * 0.85);
      c.lineTo(s * 0.5, s * 0.55);
      c.lineTo(s * 0.8, s * 0.85);
      c.closePath();
      c.fill();
      c.restore();
    },
  },
  {
    name: 'SentinelOne',
    points: 25,
    bg: '#6b0aea',
    fg: '#ffffff',
    // Stylised shield.
    draw(c, x, y, s) {
      c.save();
      c.translate(x, y);
      c.fillStyle = this.bg;
      roundRect(c, 0, 0, s, s, 6);
      c.fill();
      c.fillStyle = this.fg;
      c.beginPath();
      c.moveTo(s / 2, s * 0.15);
      c.lineTo(s * 0.82, s * 0.30);
      c.lineTo(s * 0.82, s * 0.55);
      c.quadraticCurveTo(s * 0.82, s * 0.80, s / 2, s * 0.88);
      c.quadraticCurveTo(s * 0.18, s * 0.80, s * 0.18, s * 0.55);
      c.lineTo(s * 0.18, s * 0.30);
      c.closePath();
      c.fill();
      c.fillStyle = this.bg;
      c.font = `bold ${s * 0.42}px -apple-system, system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('S1', s / 2, s / 2 + s * 0.04);
      c.restore();
    },
  },
  {
    name: 'Microsoft',
    points: 15,
    bg: '#ffffff',
    // Four-square tile.
    draw(c, x, y, s) {
      c.save();
      c.translate(x, y);
      c.fillStyle = '#0e0e12';
      roundRect(c, 0, 0, s, s, 6);
      c.fill();
      const pad = s * 0.18;
      const half = (s - pad * 2) / 2 - 2;
      c.fillStyle = '#f25022';
      c.fillRect(pad, pad, half, half);
      c.fillStyle = '#7fba00';
      c.fillRect(pad + half + 4, pad, half, half);
      c.fillStyle = '#00a4ef';
      c.fillRect(pad, pad + half + 4, half, half);
      c.fillStyle = '#ffb900';
      c.fillRect(pad + half + 4, pad + half + 4, half, half);
      c.restore();
    },
  },
  {
    name: 'Fortinet',
    points: 20,
    bg: '#ee3124',
    fg: '#ffffff',
    // Stylised "F" + upward tick.
    draw(c, x, y, s) {
      c.save();
      c.translate(x, y);
      c.fillStyle = this.bg;
      roundRect(c, 0, 0, s, s, 6);
      c.fill();
      c.fillStyle = this.fg;
      c.font = `bold ${s * 0.66}px -apple-system, system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('F', s / 2, s / 2 + s * 0.04);
      // Small chevron
      c.strokeStyle = this.fg;
      c.lineWidth = s * 0.08;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(s * 0.70, s * 0.78);
      c.lineTo(s * 0.82, s * 0.64);
      c.stroke();
      c.restore();
    },
  },
  {
    name: 'Cisco',
    points: 15,
    bg: '#1ba0d7',
    fg: '#ffffff',
    // Five vertical bars evoking the bridge wordmark.
    draw(c, x, y, s) {
      c.save();
      c.translate(x, y);
      c.fillStyle = this.bg;
      roundRect(c, 0, 0, s, s, 6);
      c.fill();
      c.fillStyle = this.fg;
      const barW = s * 0.06;
      const gap  = s * 0.08;
      const total = 5 * barW + 4 * gap;
      const startX = (s - total) / 2;
      const heights = [0.35, 0.55, 0.78, 0.55, 0.35];
      for (let i = 0; i < 5; i++) {
        const h = s * heights[i];
        const bx = startX + i * (barW + gap);
        c.fillRect(bx, (s - h) / 2, barW, h);
      }
      c.restore();
    },
  },
];

// ── Player (Sophos) ────────────────────────────────────────────────────────

const PLAYER_W = 44;
const PLAYER_H = 28;

function drawSophosShip(c, x, y) {
  // Teal/cyan shield-shaped ship with "S" glyph — evokes Sophos branding.
  c.save();
  c.translate(x, y);

  // Wings / hull
  c.fillStyle = '#0ea5b8';
  c.beginPath();
  c.moveTo(0, PLAYER_H * 0.75);
  c.lineTo(PLAYER_W * 0.12, PLAYER_H * 0.4);
  c.lineTo(PLAYER_W * 0.35, PLAYER_H * 0.4);
  c.lineTo(PLAYER_W * 0.5, PLAYER_H * 0.1);
  c.lineTo(PLAYER_W * 0.65, PLAYER_H * 0.4);
  c.lineTo(PLAYER_W * 0.88, PLAYER_H * 0.4);
  c.lineTo(PLAYER_W, PLAYER_H * 0.75);
  c.lineTo(PLAYER_W * 0.82, PLAYER_H);
  c.lineTo(PLAYER_W * 0.18, PLAYER_H);
  c.closePath();
  c.fill();

  // Cockpit dome
  c.fillStyle = '#e0f7fb';
  c.beginPath();
  c.arc(PLAYER_W / 2, PLAYER_H * 0.55, PLAYER_W * 0.16, Math.PI, 0, false);
  c.fill();

  // Sophos "S"
  c.fillStyle = '#ffffff';
  c.font = `bold ${PLAYER_H * 0.55}px -apple-system, system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('S', PLAYER_W / 2, PLAYER_H * 0.78);

  // Glow underline
  c.fillStyle = 'rgba(79, 227, 255, 0.55)';
  c.fillRect(PLAYER_W * 0.15, PLAYER_H - 2, PLAYER_W * 0.7, 2);

  c.restore();
}

// ── Game state ─────────────────────────────────────────────────────────────

const PLAYER_SPEED = 260;
const BULLET_SPEED = 520;
const ENEMY_BULLET_SPEED = 220;
const FIRE_COOLDOWN = 0.32;

const ROWS = 4;   // number of enemy rows (quarter varies which vendors)
const COLS = 7;
const ENEMY_HGAP = 8;
const ENEMY_VGAP = 10;
const GRID_START_Y = 70;

const LIVES_START = 3;

const QUARTER_CONFIG = [
  // FY27 Q1 → Q4. Each quarter pulls different vendor rows. Final quarter
  // packs the board with the heavyweights.
  { name: 'Q1 FY27', rows: [1, 5, 3, 5], stepMs: 700, descendPx: 18, shootRate: 0.45 },
  { name: 'Q2 FY27', rows: [2, 4, 1, 3], stepMs: 620, descendPx: 20, shootRate: 0.7  },
  { name: 'Q3 FY27', rows: [0, 2, 4, 1], stepMs: 540, descendPx: 22, shootRate: 1.0  },
  { name: 'Q4 FY27', rows: [0, 2, 0, 4], stepMs: 460, descendPx: 24, shootRate: 1.4  },
];

let player, bullets, enemies, enemyBullets, particles;
let enemyDir, enemyStepTimer, enemyShootTimer;
let score, lives, status, fireCooldown;
let quarterIdx;
let quarterBannerTimer = 0;
let gameOverTimer = 0;
let shakeTimer = 0;
let flashTimer = 0;

function newGame() {
  score = 0;
  lives = LIVES_START;
  quarterIdx = 0;
  scoreEl.textContent = '0';
  livesEl.textContent = String(lives);
  status = 'playing';
  overlay.hidden = true;
  startQuarter();
}

function startQuarter() {
  const cfg = QUARTER_CONFIG[quarterIdx];
  quarterEl.textContent = cfg.name;
  quarterBannerTimer = 2.0;

  player = {
    x: W / 2 - PLAYER_W / 2,
    y: H - PLAYER_H - 18,
  };
  bullets = [];
  enemyBullets = [];
  particles = [];
  fireCooldown = 0;

  enemyDir = 1;
  enemyStepTimer = cfg.stepMs / 1000;
  enemyShootTimer = 1.2;

  // Build grid.
  enemies = [];
  const gridW = COLS * ENEMY_SIZE + (COLS - 1) * ENEMY_HGAP;
  const startX = (W - gridW) / 2;
  for (let r = 0; r < ROWS; r++) {
    const vendorIdx = cfg.rows[r];
    for (let c = 0; c < COLS; c++) {
      enemies.push({
        x: startX + c * (ENEMY_SIZE + ENEMY_HGAP),
        y: GRID_START_Y + r * (ENEMY_SIZE + ENEMY_VGAP),
        vendor: VENDORS[vendorIdx],
        alive: true,
        row: r,
      });
    }
  }

  sndQuarter();
}

// ── Input ──────────────────────────────────────────────────────────────────

const keys = { left: false, right: false, fire: false };

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    keys.fire = true;
    ensureAC();
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.fire = false;
});

function bindPad(id, onDown, onUp) {
  const el = document.getElementById(id);
  const down = (e) => { e.preventDefault(); ensureAC(); onDown(); };
  const up   = (e) => { e.preventDefault(); onUp(); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
}
bindPad('btn-left',  () => keys.left = true,  () => keys.left = false);
bindPad('btn-right', () => keys.right = true, () => keys.right = false);
bindPad('btn-fire',  () => keys.fire = true,  () => keys.fire = false);

// Tap/drag anywhere on the canvas to move + fire (mobile friendly).
let dragActive = false;
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  ensureAC();
  if (status !== 'playing') return;
  dragActive = true;
  movePlayerToClientX(e.clientX);
  keys.fire = true;
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragActive) return;
  movePlayerToClientX(e.clientX);
});
const endDrag = () => { dragActive = false; keys.fire = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', endDrag);

function movePlayerToClientX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const fx = (clientX - rect.left) / rect.width;
  const px = Math.max(0, Math.min(W - PLAYER_W, fx * W - PLAYER_W / 2));
  player.x = px;
}

againBtn.addEventListener('click', newGame);

// ── Update ─────────────────────────────────────────────────────────────────

function update(dt) {
  if (quarterBannerTimer > 0) quarterBannerTimer -= dt;
  if (shakeTimer > 0) shakeTimer -= dt;
  if (flashTimer > 0) flashTimer -= dt;

  // Player movement
  if (keys.left)  player.x -= PLAYER_SPEED * dt;
  if (keys.right) player.x += PLAYER_SPEED * dt;
  if (player.x < 0) player.x = 0;
  if (player.x + PLAYER_W > W) player.x = W - PLAYER_W;

  // Fire
  fireCooldown -= dt;
  if (keys.fire && fireCooldown <= 0) {
    bullets.push({ x: player.x + PLAYER_W / 2 - 2, y: player.y - 4, w: 4, h: 12 });
    fireCooldown = FIRE_COOLDOWN;
    sndShoot();
  }

  // Move player bullets
  for (const b of bullets) b.y -= BULLET_SPEED * dt;
  bullets = bullets.filter((b) => b.y + b.h > 0);

  // Enemy step
  const cfg = QUARTER_CONFIG[quarterIdx];
  const aliveCount = enemies.filter((e) => e.alive).length;
  // Speed ramps up as enemies die.
  const speedBoost = Math.max(0.25, aliveCount / (ROWS * COLS));
  enemyStepTimer -= dt;
  if (enemyStepTimer <= 0) {
    stepEnemies();
    enemyStepTimer = (cfg.stepMs / 1000) * speedBoost;
  }

  // Enemy shooting
  enemyShootTimer -= dt * cfg.shootRate;
  if (enemyShootTimer <= 0) {
    enemyShoot();
    enemyShootTimer = 0.45 + Math.random() * 0.9;
  }

  // Move enemy bullets
  for (const b of enemyBullets) b.y += ENEMY_BULLET_SPEED * dt;
  enemyBullets = enemyBullets.filter((b) => b.y < H);

  // Collisions: player bullets vs enemies
  for (const b of bullets) {
    if (b._dead) continue;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (b.x < e.x + ENEMY_SIZE && b.x + b.w > e.x &&
          b.y < e.y + ENEMY_SIZE && b.y + b.h > e.y) {
        e.alive = false;
        b._dead = true;
        score += e.vendor.points;
        scoreEl.textContent = String(score);
        burst(e.x + ENEMY_SIZE / 2, e.y + ENEMY_SIZE / 2, e.vendor.bg === '#ffffff' ? '#4fe3ff' : e.vendor.bg);
        sndHit();
        break;
      }
    }
  }
  bullets = bullets.filter((b) => !b._dead);

  // Collisions: enemy bullets vs player
  for (const b of enemyBullets) {
    if (b.x < player.x + PLAYER_W && b.x + b.w > player.x &&
        b.y < player.y + PLAYER_H && b.y + b.h > player.y) {
      b._dead = true;
      hitPlayer();
      break;
    }
  }
  enemyBullets = enemyBullets.filter((b) => !b._dead);

  // Enemy reaches the player line → instant loss of life.
  for (const e of enemies) {
    if (e.alive && e.y + ENEMY_SIZE >= player.y) {
      hitPlayer(true);
      break;
    }
  }

  // Particles
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);

  // Quarter cleared?
  if (enemies.every((e) => !e.alive)) {
    if (quarterIdx >= QUARTER_CONFIG.length - 1) {
      winGame();
    } else {
      quarterIdx++;
      startQuarter();
    }
  }
}

function stepEnemies() {
  const cfg = QUARTER_CONFIG[quarterIdx];
  const alive = enemies.filter((e) => e.alive);
  if (!alive.length) return;

  const minX = Math.min(...alive.map((e) => e.x));
  const maxX = Math.max(...alive.map((e) => e.x + ENEMY_SIZE));
  const stepPx = 10;

  let descend = false;
  if (enemyDir > 0 && maxX + stepPx > W - 6) { enemyDir = -1; descend = true; }
  else if (enemyDir < 0 && minX - stepPx < 6) { enemyDir = 1; descend = true; }

  for (const e of enemies) {
    if (!e.alive) continue;
    if (descend) e.y += cfg.descendPx;
    else e.x += enemyDir * stepPx;
  }
}

function enemyShoot() {
  // Pick a random column's lowest alive enemy to fire.
  const byCol = new Map();
  for (const e of enemies) {
    if (!e.alive) continue;
    const col = Math.round((e.x - 6) / (ENEMY_SIZE + ENEMY_HGAP));
    const cur = byCol.get(col);
    if (!cur || e.y > cur.y) byCol.set(col, e);
  }
  const shooters = [...byCol.values()];
  if (!shooters.length) return;
  const s = shooters[Math.floor(Math.random() * shooters.length)];
  enemyBullets.push({
    x: s.x + ENEMY_SIZE / 2 - 2,
    y: s.y + ENEMY_SIZE,
    w: 4,
    h: 12,
    color: s.vendor.bg === '#ffffff' ? '#ffd600' : s.vendor.bg,
  });
}

function hitPlayer(crash = false) {
  lives--;
  livesEl.textContent = String(lives);
  shakeTimer = 0.35;
  flashTimer = 0.25;
  sndPlayerHit();
  burst(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, '#4fe3ff');

  if (lives <= 0 || crash) {
    if (lives <= 0) return loseGame(crash ? 'overrun' : 'zeroLives');
    // Otherwise just keep going with remaining lives.
  }
}

function winGame() {
  status = 'won';
  gameOverTimer = 0;
  sndWin();
  titleEl.textContent = 'FY27 Complete!';
  msgEl.innerHTML = `Sophos crushed the competition for all four quarters.<br>Final score: <strong>${score}</strong>`;
}

function loseGame(reason) {
  status = 'lost';
  gameOverTimer = 0;
  sndLose();
  titleEl.textContent = reason === 'overrun' ? 'Breach! 🚨' : 'Quarter Missed';
  const cur = QUARTER_CONFIG[quarterIdx]?.name || 'FY27';
  msgEl.innerHTML = `The competition overran ${cur}.<br>Final score: <strong>${score}</strong>`;
}

function burst(cx, cy, color) {
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
    const spd   = 50 + Math.random() * 140;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 40,
      r:  2 + Math.random() * 3,
      color,
      life: 0.55,
    });
  }
}

// ── Render ─────────────────────────────────────────────────────────────────

let starLayer = null;
function ensureStars() {
  if (starLayer) return;
  starLayer = [];
  for (let i = 0; i < 60; i++) {
    starLayer.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.6 + 0.2,
      tw: Math.random() * 2,
    });
  }
}
ensureStars();

let tAccum = 0;

function render(dt) {
  tAccum += dt;
  const sx = shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
  const sy = shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;

  ctx.save();
  ctx.translate(sx, sy);

  // Background with subtle gradient.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#050820');
  g.addColorStop(1, '#0b1026');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (const s of starLayer) {
    const a = s.a * (0.6 + 0.4 * Math.sin(tAccum * 2 + s.tw * 3));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    e.vendor.draw(ctx, e.x, e.y, ENEMY_SIZE);
  }

  // Player bullets
  ctx.fillStyle = '#4fe3ff';
  for (const b of bullets) {
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // Glow
    ctx.shadowColor = '#4fe3ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.shadowBlur = 0;
  }

  // Enemy bullets
  for (const b of enemyBullets) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  // Player
  drawSophosShip(ctx, player.x, player.y);

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Flash on hit
  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 50, 50, ${flashTimer * 0.6})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Quarter banner
  if (quarterBannerTimer > 0) {
    const t = Math.min(1, quarterBannerTimer / 2.0);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(0,0,0,${0.5 * t})`;
    ctx.fillRect(0, H / 2 - 44, W, 88);
    ctx.font = 'bold 34px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = `rgba(79, 227, 255, ${t})`;
    ctx.fillText(QUARTER_CONFIG[quarterIdx].name, W / 2, H / 2 - 8);
    ctx.font = 'bold 15px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = `rgba(255,255,255,${t * 0.9})`;
    ctx.fillText('Hit the target.', W / 2, H / 2 + 22);
    ctx.restore();
  }

  ctx.restore();
}

// ── Main loop ──────────────────────────────────────────────────────────────

let lastTs = performance.now();
function frame(ts) {
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.1) dt = 0.1;

  if (status === 'playing') {
    update(dt);
  } else {
    gameOverTimer += dt;
    if (gameOverTimer > 0.4) overlay.hidden = false;
    // Still animate particles on game-over.
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  render(dt);
  requestAnimationFrame(frame);
}

// ── Utils ──────────────────────────────────────────────────────────────────

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

newGame();
requestAnimationFrame(frame);
