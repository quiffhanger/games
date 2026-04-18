// School Run — main game module.
// A 2D side-scrolling platformer themed on the Bristol school run.
// Ties together level, physics, sprites, input, and storage.

import {
  TILE_SIZE, TILE, LEVEL_W, LEVEL_H,
  SPAWN, FINISH, getTile, setTile,
  ENEMY_SPAWNS, ITEM_SPAWNS, COIN_SPAWNS, RAINBOW_POSITIONS,
  drawBackground, drawTiles, getZone,
} from './level.js';
import {
  createPlayer, updatePlayer,
  STOMP_BOUNCE, RAINBOW_BOUNCE,
  overlaps, stompCheck,
} from './physics.js';
import {
  drawPlayer, drawEnemy, drawItem, drawCoin,
  drawFinishGate, drawRainbowTrail, drawZoneBanner, drawConfetti,
} from './sprites.js';
import { bindInput } from './input.js';
import {
  getDiff, setDiff, getCharacter, setCharacter, getBest, setBest,
} from './storage.js';

// ── Difficulty config ─────────────────────────────────────────────────────
const DIFF = {
  easy: {
    canDie: false,
    lives: 0,
    enemySpeedMul: 0.6,
    enemySmart: false,
    creeperExplodes: false,
    extraItems: true,
  },
  medium: {
    canDie: true,
    lives: 3,
    enemySpeedMul: 1.0,
    enemySmart: false,
    creeperExplodes: false,
    extraItems: false,
  },
  hard: {
    canDie: true,
    lives: 3,
    enemySpeedMul: 1.3,
    enemySmart: true,
    creeperExplodes: true,
    extraItems: false,
  },
};

// ── DOM refs ──────────────────────────────────────────────────────────────
const canvas       = document.getElementById('game');
const ctx          = canvas.getContext('2d');
const scoreEl      = document.getElementById('score');
const bestEl       = document.getElementById('best');
const livesEl      = document.getElementById('lives');
const coinsEl      = document.getElementById('coins');
const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub   = document.getElementById('overlay-sub');
const diffBtns     = document.getElementById('diff-btns');
const charBtns     = document.getElementById('char-btns');

// ── Canvas sizing (fill landscape viewport) ───────────────────────────────
const VIEW_W = 800;
const VIEW_H = 450;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Audio (WebAudio blips) ────────────────────────────────────────────────
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { audioCtx = null; }
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
let input;
let currentCharacter = getCharacter();
let currentDiff = getDiff();

function createEnemy(spawn, diffCfg) {
  const speed = (40 + Math.random() * 30) * diffCfg.enemySpeedMul;
  return {
    type: spawn.type,
    x: spawn.col * TILE_SIZE,
    y: spawn.row * TILE_SIZE - 30,
    w: spawn.type === 'spider' ? 30 : 24,
    h: spawn.type === 'spider' ? 20 : 30,
    vx: (Math.random() > 0.5 ? 1 : -1) * speed,
    vy: 0,
    speed,
    facing: 1,
    phase: Math.random() * Math.PI * 2,
    alive: true,
    dying: false,
    deathTimer: 0,
    flashTimer: 0,
    patrolLeft: (spawn.col - 4) * TILE_SIZE,
    patrolRight: (spawn.col + 4) * TILE_SIZE,
  };
}

function createItem(spawn) {
  return {
    type: spawn.type,
    x: spawn.col * TILE_SIZE,
    y: spawn.row * TILE_SIZE,
    w: 28, h: 28,
    collected: false,
  };
}

function createCoin(spawn) {
  return {
    x: spawn.col * TILE_SIZE + 4,
    y: spawn.row * TILE_SIZE + 4,
    w: 20, h: 20,
    collected: false,
  };
}

function initState(diffKey, character) {
  const d = DIFF[diffKey];
  const player = createPlayer(SPAWN.x, SPAWN.y);
  player.lives = d.canDie ? d.lives : 99;
  player._onBreakBrick = () => {
    blip(220, 0.08, 'square', 0.06);
    blip(330, 0.06, 'square', 0.04);
  };

  const enemies = ENEMY_SPAWNS.map((s) => createEnemy(s, d));
  const items = ITEM_SPAWNS.map((s) => createItem(s));
  const coins = COIN_SPAWNS.map((s) => createCoin(s));

  return {
    player,
    enemies,
    items,
    coins,
    diff: d,
    diffKey,
    character,
    camX: 0,
    camY: 0,
    status: 'menu', // 'menu' | 'playing' | 'dying' | 'gameover' | 'won' | 'idle'
    deathTimer: 0,
    winTimer: 0,
    rainbowParticles: [],
    confetti: [],
    zoneName: '',
    zoneBannerAlpha: 0,
    lastZone: '',
  };
}

function newGame() {
  setDiff(currentDiff);
  setCharacter(currentCharacter);
  state = initState(currentDiff, currentCharacter);
  state.status = 'playing';
  overlay.hidden = true;
  scoreEl.textContent = '0';
  coinsEl.textContent = '0';
  bestEl.textContent = String(getBest(currentDiff));
  renderLives();
}

// ── Lives display ─────────────────────────────────────────────────────────
function renderLives() {
  livesEl.innerHTML = '';
  if (!state.diff.canDie) { livesEl.textContent = '∞'; return; }
  for (let i = 0; i < state.player.lives; i++) {
    const span = document.createElement('span');
    span.className = 'sr-life';
    livesEl.appendChild(span);
  }
}

// ── Overlay ───────────────────────────────────────────────────────────────
function showOverlay(title, subtitle) {
  overlayTitle.textContent = title;
  overlaySub.textContent = subtitle || '';
  overlaySub.hidden = !subtitle;
  overlay.hidden = false;
  // Highlight current selections
  diffBtns.querySelectorAll('[data-diff]').forEach((btn) => {
    btn.classList.toggle('sr-btn--active', btn.dataset.diff === currentDiff);
  });
  charBtns.querySelectorAll('[data-char]').forEach((btn) => {
    btn.classList.toggle('sr-btn--active', btn.dataset.char === currentCharacter);
  });
}

// ── Input wiring ──────────────────────────────────────────────────────────
input = bindInput();

// ── UI button events ──────────────────────────────────────────────────────
diffBtns.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-diff]');
  if (!btn) return;
  currentDiff = btn.dataset.diff;
  diffBtns.querySelectorAll('[data-diff]').forEach((b) => {
    b.classList.toggle('sr-btn--active', b.dataset.diff === currentDiff);
  });
});

charBtns.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-char]');
  if (!btn) return;
  currentCharacter = btn.dataset.char;
  charBtns.querySelectorAll('[data-char]').forEach((b) => {
    b.classList.toggle('sr-btn--active', b.dataset.char === currentCharacter);
  });
});

document.getElementById('play-btn').addEventListener('click', () => {
  ensureAudio();
  newGame();
});

// ── Enemy AI / update ─────────────────────────────────────────────────────
function updateEnemies(dt) {
  const p = state.player;
  for (const e of state.enemies) {
    if (!e.alive && !e.dying) continue;

    if (e.dying) {
      e.deathTimer += dt;
      if (e.deathTimer > 0.5) { e.dying = false; }
      continue;
    }

    e.phase += dt * 3;

    // Patrol movement
    e.x += e.vx * dt;
    e.facing = e.vx > 0 ? 1 : -1;

    // Reverse at patrol bounds or if hitting a wall
    if (e.x <= e.patrolLeft || e.x + e.w >= e.patrolRight) {
      e.vx = -e.vx;
    }
    // Also check tile collision for the enemy
    const checkCol = e.vx > 0
      ? Math.floor((e.x + e.w) / TILE_SIZE)
      : Math.floor(e.x / TILE_SIZE);
    const checkRow = Math.floor((e.y + e.h - 2) / TILE_SIZE);
    const tileAhead = getTile(checkCol, checkRow);
    if (tileAhead === TILE.GROUND || tileAhead === TILE.BRICK) {
      e.vx = -e.vx;
      e.x += e.vx * dt;
    }
    // Don't walk off edges
    const belowCol = e.vx > 0
      ? Math.floor((e.x + e.w) / TILE_SIZE)
      : Math.floor(e.x / TILE_SIZE);
    const belowRow = Math.floor((e.y + e.h + 4) / TILE_SIZE);
    const tileBelow = getTile(belowCol, belowRow);
    if (tileBelow !== TILE.GROUND && tileBelow !== TILE.BRICK && tileBelow !== TILE.PLATFORM) {
      e.vx = -e.vx;
    }

    // Spider: jump toward player on hard mode
    if (e.type === 'spider' && state.diff.enemySmart) {
      const dx = p.x - e.x;
      const dist = Math.abs(dx);
      if (dist < 200 && dist > 40) {
        e.vx = (dx > 0 ? 1 : -1) * e.speed * 1.5;
      }
    }

    // Creeper: flash when close on hard mode
    if (e.type === 'creeper' && state.diff.creeperExplodes) {
      const dist = Math.hypot(p.x - e.x, p.y - e.y);
      if (dist < 80) {
        e.flashTimer += dt;
        if (e.flashTimer > 1.5) {
          // Explode: knockback player
          e.alive = false;
          e.dying = true;
          e.deathTimer = 0;
          const kx = p.x > e.x ? 200 : -200;
          p.vx = kx;
          p.vy = -300;
          if (state.diff.canDie && p.shieldTimer <= 0 && p.invulnTimer <= 0) {
            p.lives--;
            p.invulnTimer = 1.5;
            renderLives();
            blip(220, 0.3, 'sawtooth', 0.06);
          }
        }
      } else {
        e.flashTimer = Math.max(0, e.flashTimer - dt * 2);
      }
    }
  }
}

// ── Collision detection (player vs enemies, items, coins, rainbow) ───────
function checkCollisions() {
  const p = state.player;
  if (p.dead || p.invulnTimer > 0) return;

  // Enemies
  for (const e of state.enemies) {
    if (!e.alive || e.dying) continue;

    if (stompCheck(p, e)) {
      // Stomp!
      e.alive = false;
      e.dying = true;
      e.deathTimer = 0;
      p.vy = STOMP_BOUNCE;
      p.score += 100;
      scoreEl.textContent = String(p.score);
      blip(880, 0.1, 'triangle', 0.07);
      continue;
    }

    if (overlaps(p, e)) {
      if (p.strongTimer > 0) {
        // Smash through with broccoli power
        e.alive = false;
        e.dying = true;
        e.deathTimer = 0;
        p.score += 150;
        scoreEl.textContent = String(p.score);
        blip(660, 0.12, 'triangle', 0.06);
      } else if (p.shieldTimer > 0) {
        // Shield absorbs hit, bounce
        p.vx = p.x > e.x ? 180 : -180;
        p.vy = -250;
        p.invulnTimer = 0.5;
        blip(440, 0.15, 'sine', 0.06);
      } else if (state.diff.canDie) {
        // Take damage
        p.lives--;
        p.invulnTimer = 1.5;
        p.vx = p.x > e.x ? 180 : -180;
        p.vy = -300;
        renderLives();
        blip(220, 0.25, 'sawtooth', 0.06);
        if (p.lives <= 0) {
          state.status = 'dying';
          state.deathTimer = 0;
          p.dead = true;
        }
      } else {
        // Easy mode: just bounce off
        p.vx = p.x > e.x ? 200 : -200;
        p.vy = -250;
        p.invulnTimer = 0.5;
        blip(330, 0.15, 'sine', 0.04);
      }
    }
  }

  // Items (powerups)
  for (const item of state.items) {
    if (item.collected) continue;
    if (overlaps(p, item)) {
      item.collected = true;
      applyPowerup(item.type, p);
    }
  }

  // Coins
  for (const coin of state.coins) {
    if (coin.collected) continue;
    if (overlaps(p, coin)) {
      coin.collected = true;
      p.coins++;
      p.score += 10;
      coinsEl.textContent = String(p.coins);
      scoreEl.textContent = String(p.score);
      blip(1200, 0.04, 'square', 0.03);
    }
  }

  // Rainbow trampolines
  for (const rb of RAINBOW_POSITIONS) {
    const rbx = rb.col * TILE_SIZE;
    const rby = rb.row * TILE_SIZE;
    const rbBox = { x: rbx, y: rby, w: TILE_SIZE, h: TILE_SIZE };
    if (overlaps(p, rbBox) && p.vy > 0) {
      p.vy = RAINBOW_BOUNCE;
      p.onGround = false;
      spawnRainbowTrail(p.x + p.w / 2, p.y + p.h);
      blip(660, 0.12, 'sine', 0.07);
      blip(880, 0.1, 'sine', 0.05);
      blip(1100, 0.08, 'sine', 0.04);
    }
  }

  // Finish gate
  const finishBox = { x: FINISH.x, y: FINISH.y - TILE_SIZE * 3, w: TILE_SIZE * 2, h: TILE_SIZE * 3 };
  if (overlaps(p, finishBox)) {
    state.status = 'won';
    state.winTimer = 0;
    const best = Math.max(getBest(state.diffKey), p.score);
    setBest(state.diffKey, best);
    bestEl.textContent = String(best);
    spawnWinConfetti();
    blip(660, 0.12, 'triangle', 0.08);
    setTimeout(() => blip(880, 0.12, 'triangle', 0.08), 120);
    setTimeout(() => blip(1100, 0.2, 'triangle', 0.08), 240);
  }
}

function applyPowerup(type, p) {
  switch (type) {
    case 'broccoli':
      p.strongTimer = 8;
      blip(440, 0.15, 'triangle', 0.08);
      blip(660, 0.12, 'triangle', 0.06);
      break;
    case 'carrot':
      p.speedTimer = 8;
      blip(550, 0.12, 'sine', 0.06);
      blip(770, 0.1, 'sine', 0.05);
      break;
    case 'apple':
      p.lives++;
      renderLives();
      blip(880, 0.15, 'triangle', 0.08);
      blip(1100, 0.12, 'triangle', 0.06);
      break;
    case 'banana':
      p.shieldTimer = 6;
      blip(660, 0.15, 'sine', 0.07);
      blip(440, 0.12, 'sine', 0.05);
      break;
    case 'grapes':
      p.doubleJumpTimer = 10;
      blip(550, 0.12, 'triangle', 0.06);
      blip(880, 0.1, 'triangle', 0.05);
      break;
  }
  p.score += 50;
  scoreEl.textContent = String(p.score);
}

// ── Rainbow trail particles ──────────────────────────────────────────────
function spawnRainbowTrail(x, y) {
  for (let i = 0; i < 20; i++) {
    state.rainbowParticles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + Math.random() * 10,
      vx: (Math.random() - 0.5) * 100,
      vy: Math.random() * 50 + 30,
      r: 2 + Math.random() * 3,
      colorIdx: i % 6,
      life: 0.8 + Math.random() * 0.4,
      maxLife: 0.8 + Math.random() * 0.4,
    });
  }
}

function updateRainbowParticles(dt) {
  for (const p of state.rainbowParticles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.rainbowParticles = state.rainbowParticles.filter((p) => p.life > 0);
}

// ── Win confetti ──────────────────────────────────────────────────────────
function spawnWinConfetti() {
  const colors = ['#ffd600', '#ff77c6', '#4fe3ff', '#8aff80', '#ff8a5c', '#b388ff'];
  for (let i = 0; i < 80; i++) {
    state.confetti.push({
      x: VIEW_W / 2 + (Math.random() - 0.5) * VIEW_W,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 200,
      vy: 80 + Math.random() * 200,
      w: 4 + Math.random() * 6,
      h: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 3 + Math.random() * 2,
    });
  }
}

function updateConfetti(dt) {
  for (const p of state.confetti) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.99;
    p.life -= dt;
  }
  state.confetti = state.confetti.filter((p) => p.life > 0);
}

// ── Camera ────────────────────────────────────────────────────────────────
function updateCamera() {
  const p = state.player;
  // Look-ahead: offset camera in facing direction
  const lookAhead = p.facing * 80;
  const targetX = p.x + p.w / 2 - VIEW_W / 2 + lookAhead;
  const targetY = p.y + p.h / 2 - VIEW_H * 0.55;

  // Smooth follow
  state.camX += (targetX - state.camX) * 0.08;
  state.camY += (targetY - state.camY) * 0.06;

  // Clamp
  state.camX = Math.max(0, Math.min(state.camX, LEVEL_W * TILE_SIZE - VIEW_W));
  state.camY = Math.max(0, Math.min(state.camY, LEVEL_H * TILE_SIZE - VIEW_H));
}

// ── Zone banner ───────────────────────────────────────────────────────────
function updateZoneBanner(dt) {
  const col = Math.floor((state.player.x + state.player.w / 2) / TILE_SIZE);
  const zone = getZone(col);
  if (zone.name !== state.lastZone) {
    state.lastZone = zone.name;
    state.zoneName = zone.name;
    state.zoneBannerAlpha = 1.5; // stays for 1.5s then fades
  }
  if (state.zoneBannerAlpha > 0) {
    state.zoneBannerAlpha -= dt * 0.5;
  }
}

// ── Game loop ─────────────────────────────────────────────────────────────
let lastTs = performance.now();

function frame(ts) {
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.08) dt = 0.08;

  input.update(dt);

  if (state.status === 'playing') {
    updatePlayer(state.player, dt, input, state.diff.canDie);
    updateEnemies(dt);
    checkCollisions();
    updateCamera();
    updateZoneBanner(dt);
    updateRainbowParticles(dt);
  } else if (state.status === 'dying') {
    state.deathTimer += dt;
    if (state.deathTimer >= 1.5) {
      state.status = 'idle';
      const best = Math.max(getBest(state.diffKey), state.player.score);
      setBest(state.diffKey, best);
      bestEl.textContent = String(best);
      showOverlay('Game Over!', `Score: ${state.player.score}`);
    }
  } else if (state.status === 'won') {
    state.winTimer += dt;
    updateConfetti(dt);
    if (state.winTimer > 0.8 && overlay.hidden) {
      showOverlay('You made it to school! 🎉', `Score: ${state.player.score} ⭐ ${state.player.coins}`);
    }
  }

  draw();
  requestAnimationFrame(frame);
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  const { camX, camY } = state;

  // Background (sky, clouds, landmarks, houses)
  drawBackground(ctx, camX, camY, VIEW_W, VIEW_H);

  // Tiles
  drawTiles(ctx, camX, camY, VIEW_W, VIEW_H);

  // Finish gate
  drawFinishGate(ctx, FINISH.x, FINISH.y, camX, camY);

  // Coins
  for (const coin of state.coins) {
    if (!coin.collected) drawCoin(ctx, coin, camX, camY);
  }

  // Items (powerups)
  for (const item of state.items) {
    if (!item.collected) drawItem(ctx, item, camX, camY);
  }

  // Enemies
  for (const e of state.enemies) {
    if (e.alive || e.dying) drawEnemy(ctx, e, camX, camY);
  }

  // Rainbow particles
  if (state.rainbowParticles.length > 0) {
    drawRainbowTrail(ctx, state.rainbowParticles, camX, camY);
  }

  // Player
  if (state.status !== 'menu') {
    // Fade during death
    if (state.status === 'dying') {
      const t = Math.min(state.deathTimer / 1.0, 1);
      ctx.globalAlpha = 1 - t;
    }
    drawPlayer(ctx, state.player, state.character, camX, camY);
    ctx.globalAlpha = 1;
  }

  // Win confetti
  if (state.confetti.length > 0) {
    drawConfetti(ctx, state.confetti);
  }

  // Zone banner
  drawZoneBanner(ctx, state.zoneName, Math.min(state.zoneBannerAlpha, 1), VIEW_W);

  // Powerup indicators (HUD)
  drawPowerupHUD(ctx);
}

function drawPowerupHUD(ctx) {
  const p = state.player;
  const indicators = [];
  if (p.strongTimer > 0)     indicators.push({ label: '🥦', time: p.strongTimer, color: '#4caf50' });
  if (p.speedTimer > 0)      indicators.push({ label: '🥕', time: p.speedTimer, color: '#ff9800' });
  if (p.shieldTimer > 0)     indicators.push({ label: '🍌', time: p.shieldTimer, color: '#fdd835' });
  if (p.doubleJumpTimer > 0) indicators.push({ label: '🍇', time: p.doubleJumpTimer, color: '#7b1fa2' });

  let ix = 10;
  for (const ind of indicators) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(ix, VIEW_H - 30, 50, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${ind.label} ${ind.time.toFixed(1)}`, ix + 4, VIEW_H - 14);
    // Timer bar
    ctx.fillStyle = ind.color;
    const barW = Math.max(0, (ind.time / 10) * 46);
    ctx.fillRect(ix + 2, VIEW_H - 10, barW, 3);
    ix += 56;
  }
}

// ── Start ─────────────────────────────────────────────────────────────────
state = initState(currentDiff, currentCharacter);
bestEl.textContent = String(getBest(currentDiff));
showOverlay('School Run! 🏃');
requestAnimationFrame(frame);
