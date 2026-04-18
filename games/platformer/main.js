import { drawSprite, getSpriteDims, drawPowerup } from './characters.js';
import {
  LEVEL, LEVEL_WIDTH, GROUND_Y, CANVAS_W, CANVAS_H,
  drawBackground, drawPlatforms, drawTrampolines,
  drawCheckpoints, drawGoal,
} from './level.js';

// ---- Constants -------------------------------------------------------------
const SCALE = 3;
const PLAYER_W = 12 * SCALE;
const PLAYER_H_SEB = 22 * SCALE;
const PLAYER_H_ISLA = 24 * SCALE;
const STOMP_BOUNCE = -8;
const TRAMPOLINE_VY = -18;
const COYOTE_MS = 120;
const JUMP_BUFFER_MS = 120;
const ITEM_SIZE = 32;
const HIT_FLASH_MS = 1500;
const POWERUP_DURATION = {
  broccoli: 15000, carrot: 12000, banana: 12000, blueberry: 8000,
};
const POWERUP_LABELS = {
  broccoli: 'STRONG!', carrot: 'SPEED!', banana: 'SUPER JUMP!',
  blueberry: 'SHIELD!', strawberry: '+1 LIFE!', apple: 'HEALED!',
  star: '+100', chocolate: 'SECRET CHOCOLATE! +500',
};
const DIFF = {
  easy:   { lives: 99, speedMul: 0.5, enemyMul: 0.5, gravity: 0.3,  jumpV: -9,  invincible: true,  allCheckpoints: true },
  medium: { lives: 5,  speedMul: 1.0, enemyMul: 1.0, gravity: 0.6,  jumpV: -12, invincible: false, allCheckpoints: true },
  hard:   { lives: 3,  speedMul: 1.0, enemyMul: 1.3, gravity: 0.6,  jumpV: -12, invincible: false, allCheckpoints: false },
};

// ---- Canvas setup ----------------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
ctx.imageSmoothingEnabled = false;

// ---- DOM refs --------------------------------------------------------------
const $menu     = document.getElementById('menu');
const $hud      = document.getElementById('hud');
const $controls = document.getElementById('controls');
const $hudLives = document.getElementById('hud-lives');
const $hudScore = document.getElementById('hud-score');
const $hudPower = document.getElementById('hud-power');
const $rotate   = document.getElementById('rotate');

// ---- Game state ------------------------------------------------------------
let state = 'menu';        // menu | playing | dead | gameover | win
let hero = 'seb';          // seb | isla
let difficulty = 'easy';
let diff = DIFF.easy;
let player, cam, enemies, items, score, lives, activeCheckpoint;
let activePower, powerTimer, hitTimer, deadTimer;
let punchActive, punchTimer, punchFacing;
let frameCount = 0;
let pickupPopups = [];     // {text, x, y, timer}

// ---- Input -----------------------------------------------------------------
const keys = {};
const touches = { left: false, right: false, jump: false, action: false };

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (state === 'playing' && (e.code === 'KeyP' || e.code === 'Escape')) togglePause();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function isLeft()   { return keys['ArrowLeft']  || keys['KeyA'] || touches.left; }
function isRight()  { return keys['ArrowRight'] || keys['KeyD'] || touches.right; }
function isJump()   { return keys['Space']      || keys['ArrowUp'] || keys['KeyW'] || touches.jump; }
function isAction() { return keys['KeyZ']       || keys['KeyX'] || touches.action; }

// Touch controls
document.querySelectorAll('.pf-btn').forEach(btn => {
  const ctrl = btn.dataset.ctrl;
  const setOn  = () => { touches[ctrl] = true; };
  const setOff = () => { touches[ctrl] = false; };
  btn.addEventListener('pointerdown', e => { e.preventDefault(); setOn(); });
  btn.addEventListener('pointerup',   setOff);
  btn.addEventListener('pointerleave', setOff);
  btn.addEventListener('pointercancel', setOff);
});

// Prevent default on control area to stop scrolling
$controls.addEventListener('touchstart', e => e.preventDefault(), { passive: false });

// ---- Orientation lock overlay ----------------------------------------------
function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  $rotate.classList.toggle('pf-rotate--show', isPortrait);
}
window.addEventListener('resize', checkOrientation);
checkOrientation();

// ---- Pause -----------------------------------------------------------------
let paused = false;
function togglePause() {
  paused = !paused;
}

// ---- Menu ------------------------------------------------------------------
function showMenu() {
  state = 'menu';
  $hud.classList.add('pf-hud--hidden');
  $controls.classList.add('pf-controls--hidden');
  $menu.classList.remove('pf-menu--hidden');
  $menu.innerHTML = `
    <div class="pf-menu__card">
      <h1 class="pf-menu__title">The School Run</h1>
      <p class="pf-menu__sub">Redland to Clifton High!</p>
      <div class="pf-menu__section">
        <p class="pf-menu__label">Choose your hero</p>
        <div class="pf-menu__heroes">
          <button class="pf-hero-btn ${hero === 'seb' ? 'pf-hero-btn--active' : ''}" data-hero="seb">
            <canvas class="pf-hero-preview" data-preview="seb" width="48" height="72"></canvas>
            <span>Seb</span>
          </button>
          <button class="pf-hero-btn ${hero === 'isla' ? 'pf-hero-btn--active' : ''}" data-hero="isla">
            <canvas class="pf-hero-preview" data-preview="isla" width="48" height="72"></canvas>
            <span>Isla</span>
          </button>
        </div>
      </div>
      <div class="pf-menu__section">
        <p class="pf-menu__label">Difficulty</p>
        <div class="pf-menu__diffs">
          <button class="pf-diff-btn ${difficulty === 'easy'   ? 'pf-diff-btn--active' : ''}" data-diff="easy">Easy<br><small>Invincible + floaty</small></button>
          <button class="pf-diff-btn ${difficulty === 'medium' ? 'pf-diff-btn--active' : ''}" data-diff="medium">Medium<br><small>5 lives</small></button>
          <button class="pf-diff-btn ${difficulty === 'hard'   ? 'pf-diff-btn--active' : ''}" data-diff="hard">Hard<br><small>3 lives, fast enemies</small></button>
        </div>
      </div>
      <button class="pf-play-btn" id="play-btn">PLAY!</button>
    </div>
  `;
  // Draw hero previews
  document.querySelectorAll('.pf-hero-preview').forEach(c => {
    const pc = c.getContext('2d');
    pc.imageSmoothingEnabled = false;
    const who = c.dataset.preview;
    drawSprite(pc, `${who}_idle`, 6, 2, SCALE, 1);
  });
  // Hero select
  document.querySelectorAll('.pf-hero-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      hero = btn.dataset.hero;
      showMenu();
    });
  });
  // Diff select
  document.querySelectorAll('.pf-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      difficulty = btn.dataset.diff;
      showMenu();
    });
  });
  // Play
  document.getElementById('play-btn').addEventListener('click', startGame);
}

// ---- Game init -------------------------------------------------------------
function startGame() {
  diff = DIFF[difficulty];
  state = 'playing';
  paused = false;
  $menu.classList.add('pf-menu--hidden');
  $hud.classList.remove('pf-hud--hidden');
  $controls.classList.remove('pf-controls--hidden');

  const ph = hero === 'seb' ? PLAYER_H_SEB : PLAYER_H_ISLA;
  player = {
    x: LEVEL.spawn.x, y: LEVEL.spawn.y,
    vx: 0, vy: 0,
    w: PLAYER_W, h: ph,
    onGround: false, facing: 1,
    lastGroundTime: 0, jumpBufferTime: 0,
    walkFrame: 0, walkTimer: 0,
  };
  cam = { x: 0 };
  score = 0;
  lives = diff.lives;
  activeCheckpoint = -1;
  activePower = null;
  powerTimer = 0;
  hitTimer = 0;
  deadTimer = 0;
  punchActive = false;
  punchTimer = 0;
  pickupPopups = [];

  enemies = LEVEL.enemies.map(e => ({
    ...e,
    spawnX: e.x, spawnY: e.y,
    vx: (e.type === 'zombie' ? 0.4 : e.type === 'slime' ? 0.6 : e.type === 'pigeon' ? 1.0 : 0.8) * diff.enemyMul,
    dir: 1, alive: true, hp: e.type === 'zombie' ? 2 : 1,
    frame: 0, bounceY: 0,
  }));
  items = LEVEL.items.map(i => ({ ...i, collected: false }));

  updateHUD();
}

// ---- Physics & update ------------------------------------------------------
function update(now) {
  if (state !== 'playing' || paused) return;
  frameCount++;
  const dt = diff.speedMul;

  // --- Player movement ---
  const accel = 0.5 * dt;
  const maxSpeed = (activePower === 'carrot' ? 5.5 : 3.5) * dt;
  const friction = 0.82;
  const gravity = diff.gravity * dt;
  const jumpV = (activePower === 'banana' ? diff.jumpV * 1.4 : diff.jumpV) * dt;

  if (isLeft())  { player.vx -= accel; player.facing = -1; }
  if (isRight()) { player.vx += accel; player.facing = 1; }
  player.vx *= friction;
  if (Math.abs(player.vx) < 0.1) player.vx = 0;
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  player.vy += gravity;
  if (player.vy > 12 * dt) player.vy = 12 * dt;

  // Jump with coyote time + buffer
  if (isJump()) player.jumpBufferTime = now;
  const canCoyote = (now - player.lastGroundTime) < COYOTE_MS;
  const hasBuffer = (now - player.jumpBufferTime) < JUMP_BUFFER_MS;
  if (hasBuffer && (player.onGround || canCoyote) && player.vy >= 0) {
    player.vy = jumpV;
    player.onGround = false;
    player.lastGroundTime = 0;
    player.jumpBufferTime = 0;
    playBlip(600, 0.08, 0.06);
  }
  // Variable jump height
  if (!isJump() && player.vy < jumpV * 0.4) {
    player.vy = jumpV * 0.4;
  }

  // Action / punch
  if (isAction() && activePower === 'broccoli' && !punchActive) {
    punchActive = true;
    punchTimer = 300;
    punchFacing = player.facing;
    playBlip(200, 0.12, 0.08);
  }
  if (punchActive) {
    punchTimer -= 16;
    if (punchTimer <= 0) punchActive = false;
  }

  // Move X
  player.x += player.vx;
  player.x = clamp(player.x, 0, LEVEL_WIDTH - player.w);
  resolveCollisionsX();

  // Move Y
  player.onGround = false;
  player.y += player.vy;
  resolveCollisionsY(now);

  // Trampoline check
  for (const tr of LEVEL.trampolines) {
    if (player.vy > 0 &&
        player.x + player.w > tr.x && player.x < tr.x + tr.w &&
        player.y + player.h > tr.y && player.y + player.h < tr.y + 24) {
      player.vy = TRAMPOLINE_VY * dt;
      player.onGround = false;
      playBlip(800, 0.15, 0.12);
    }
  }

  // Fell into pit
  if (player.y > CANVAS_H + 40) {
    if (diff.invincible) {
      respawnAtCheckpoint();
    } else {
      playerDie();
    }
  }

  // Walk animation
  if (Math.abs(player.vx) > 0.3) {
    player.walkTimer++;
    if (player.walkTimer > (12 / dt)) {
      player.walkTimer = 0;
      player.walkFrame = 1 - player.walkFrame;
    }
  } else {
    player.walkFrame = 0;
    player.walkTimer = 0;
  }

  // Camera
  const targetCamX = player.x - CANVAS_W / 3;
  cam.x += (targetCamX - cam.x) * 0.1;
  cam.x = clamp(cam.x, 0, LEVEL_WIDTH - CANVAS_W);

  // --- Enemies ---
  for (const e of enemies) {
    if (!e.alive) continue;
    const espeed = e.vx * dt;

    if (e.type === 'pigeon') {
      e.x += espeed * e.dir;
      e.bounceY = Math.sin(frameCount * 0.04 * dt) * 30;
      if (e.x <= e.range[0] || e.x >= e.range[1]) e.dir *= -1;
    } else if (e.type === 'slime') {
      e.x += espeed * e.dir;
      e.bounceY = Math.abs(Math.sin(frameCount * 0.06 * dt)) * -20;
      if (e.x <= e.range[0] || e.x >= e.range[1]) e.dir *= -1;
    } else {
      e.x += espeed * e.dir;
      if (e.x <= e.range[0] || e.x >= e.range[1]) e.dir *= -1;
    }

    // Collision with player
    const ew = 12 * SCALE;
    const eh = (e.type === 'zombie' || e.type === 'skeleton') ? 20 * SCALE : (e.type === 'pigeon' ? 10 * SCALE : 14 * SCALE);
    const ey = (e.type === 'pigeon' ? e.y + e.bounceY : (e.type === 'slime' ? e.y + e.bounceY : e.y));
    const ex = e.x;

    if (aabb(player.x, player.y, player.w, player.h, ex, ey, ew, eh)) {
      const stompZone = ey + eh * 0.3;
      if (player.vy > 0 && player.y + player.h < stompZone + 8) {
        // Stomp!
        e.hp--;
        if (e.hp <= 0) {
          e.alive = false;
          score += 200;
        }
        player.vy = STOMP_BOUNCE * dt;
        playBlip(300, 0.1, 0.05);
        addPopup(e.type === 'zombie' && e.hp > 0 ? 'BONK!' : 'POW!', ex, ey - 10);
      } else if (punchActive) {
        e.hp--;
        if (e.hp <= 0) {
          e.alive = false;
          score += 200;
        }
        addPopup('POW!', ex, ey - 10);
        playBlip(200, 0.12, 0.06);
      } else if (diff.invincible) {
        // Easy mode: bounce off
        player.vx = player.x < ex ? -3 : 3;
        player.vy = -5 * dt;
      } else if (activePower === 'blueberry') {
        // Shield absorbs
        player.vx = player.x < ex ? -3 : 3;
      } else if (hitTimer <= 0) {
        // Damage
        lives--;
        hitTimer = HIT_FLASH_MS;
        player.vx = player.x < ex ? -4 : 4;
        player.vy = -6 * dt;
        playBlip(150, 0.15, 0.1);
        if (lives <= 0) {
          state = 'gameover';
          showOverlay('gameover');
          return;
        }
        updateHUD();
      }
    }
  }

  // --- Items ---
  for (const item of items) {
    if (item.collected) continue;
    if (aabb(player.x, player.y, player.w, player.h, item.x, item.y, ITEM_SIZE, ITEM_SIZE)) {
      item.collected = true;
      applyPowerup(item.type, item.x, item.y);
    }
  }

  // --- Checkpoints ---
  for (let i = 0; i < LEVEL.checkpoints.length; i++) {
    const cp = LEVEL.checkpoints[i];
    if (i > activeCheckpoint && player.x > cp.x - 20) {
      activeCheckpoint = i;
      playBlip(500, 0.08, 0.1);
    }
  }

  // --- Goal ---
  if (player.x + player.w > LEVEL.goal.x) {
    state = 'win';
    const best = localStorage.getItem(`schoolrun_best_${hero}_${difficulty}`) || 0;
    if (score > best) localStorage.setItem(`schoolrun_best_${hero}_${difficulty}`, score);
    showOverlay('win');
    return;
  }

  // --- Timers ---
  if (hitTimer > 0) hitTimer -= 16;
  if (powerTimer > 0) {
    powerTimer -= 16;
    if (powerTimer <= 0) { activePower = null; updateHUD(); }
  }
  // Popups
  pickupPopups = pickupPopups.filter(p => { p.timer -= 16; p.y -= 0.8; return p.timer > 0; });

  updateHUD();
}

// ---- Collisions ------------------------------------------------------------
function resolveCollisionsX() {
  for (const p of LEVEL.platforms) {
    if (!aabb(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) continue;
    if (player.vx > 0) {
      player.x = p.x - player.w;
    } else if (player.vx < 0) {
      player.x = p.x + p.w;
    }
    player.vx = 0;
  }
}

function resolveCollisionsY(now) {
  for (const p of LEVEL.platforms) {
    if (!aabb(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) continue;
    if (player.vy > 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.lastGroundTime = now;
    } else if (player.vy < 0) {
      player.y = p.y + p.h;
      player.vy = 0;
    }
  }
}

// ---- Powerups --------------------------------------------------------------
function applyPowerup(type, x, y) {
  const label = POWERUP_LABELS[type] || type;
  addPopup(label, x, y - 10);
  playBlip(700, 0.1, 0.08);

  switch (type) {
    case 'star':
      score += 100;
      break;
    case 'chocolate':
      score += 500;
      break;
    case 'strawberry':
      lives++;
      break;
    case 'apple':
      // heal visual only (would need HP system; for now +1 life)
      if (!diff.invincible) lives = Math.min(lives + 1, diff.lives + 2);
      break;
    case 'broccoli':
    case 'carrot':
    case 'banana':
    case 'blueberry':
      activePower = type;
      powerTimer = POWERUP_DURATION[type];
      break;
  }
  updateHUD();
}

// ---- Death / respawn -------------------------------------------------------
function playerDie() {
  lives--;
  if (lives <= 0) {
    state = 'gameover';
    showOverlay('gameover');
  } else {
    respawnAtCheckpoint();
    updateHUD();
  }
}

function respawnAtCheckpoint() {
  let sx = LEVEL.spawn.x, sy = LEVEL.spawn.y;
  if (activeCheckpoint >= 0) {
    const cp = LEVEL.checkpoints[activeCheckpoint];
    sx = cp.x + 20;
    sy = cp.y;
  }
  player.x = sx;
  player.y = sy;
  player.vx = 0;
  player.vy = 0;
  hitTimer = HIT_FLASH_MS;
}

// ---- Overlays (win / gameover) ---------------------------------------------
function showOverlay(type) {
  $controls.classList.add('pf-controls--hidden');
  const best = localStorage.getItem(`schoolrun_best_${hero}_${difficulty}`) || 0;
  $menu.classList.remove('pf-menu--hidden');
  if (type === 'win') {
    $menu.innerHTML = `
      <div class="pf-menu__card">
        <h1 class="pf-menu__title">You made it to school!</h1>
        <p class="pf-menu__sub">Score: ${score} | Best: ${Math.max(score, +best)}</p>
        <button class="pf-play-btn" id="btn-again">Play Again</button>
        <button class="pf-play-btn pf-play-btn--alt" id="btn-menu">Menu</button>
      </div>`;
  } else {
    $menu.innerHTML = `
      <div class="pf-menu__card">
        <h1 class="pf-menu__title">Oh no!</h1>
        <p class="pf-menu__sub">You ran out of lives</p>
        <button class="pf-play-btn" id="btn-again">Try Again</button>
        <button class="pf-play-btn pf-play-btn--alt" id="btn-menu">Menu</button>
      </div>`;
  }
  document.getElementById('btn-again').addEventListener('click', startGame);
  document.getElementById('btn-menu').addEventListener('click', showMenu);
}

// ---- HUD -------------------------------------------------------------------
function updateHUD() {
  // Lives
  let livesStr = '';
  const showLives = diff.invincible ? 1 : Math.min(lives, 10);
  for (let i = 0; i < showLives; i++) livesStr += '<span class="pf-heart"></span>';
  if (diff.invincible) livesStr += ' <small>INV</small>';
  $hudLives.innerHTML = livesStr;

  $hudScore.textContent = `★ ${score}`;

  // Active powerup
  if (activePower && powerTimer > 0) {
    const secs = Math.ceil(powerTimer / 1000);
    const icon = { broccoli: '🥦', carrot: '🥕', banana: '🍌', blueberry: '🫐' }[activePower] || '';
    $hudPower.textContent = `${icon} ${secs}s`;
    $hudPower.classList.remove('pf-hud__power--hidden');
  } else {
    $hudPower.textContent = '';
    $hudPower.classList.add('pf-hud__power--hidden');
  }
}

// ---- Render ----------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  if (state === 'menu') {
    drawBackground(ctx, { x: frameCount * 0.3 % LEVEL_WIDTH }, frameCount);
    return;
  }

  // Background
  drawBackground(ctx, cam, frameCount);

  // Platforms
  drawPlatforms(ctx, cam);

  // Trampolines
  drawTrampolines(ctx, cam, frameCount);

  // Checkpoints
  drawCheckpoints(ctx, cam, activeCheckpoint);

  // Goal
  drawGoal(ctx, cam, frameCount);

  // Items
  for (const item of items) {
    if (item.collected) continue;
    const ix = item.x - cam.x;
    if (ix < -ITEM_SIZE || ix > CANVAS_W + ITEM_SIZE) continue;
    drawPowerup(ctx, item.type, ix, item.y, ITEM_SIZE, frameCount * 0.05);
    // Label below item
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    const name = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    ctx.fillText(name, ix + ITEM_SIZE / 2, item.y + ITEM_SIZE + 12);
    ctx.textAlign = 'left';
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const ex = e.x - cam.x;
    if (ex < -60 || ex > CANVAS_W + 60) continue;
    const ey = e.type === 'pigeon' ? e.y + e.bounceY : (e.type === 'slime' ? e.y + e.bounceY : e.y);
    drawSprite(ctx, e.type === 'pigeon' ? 'pigeon' : e.type, ex, ey, SCALE, e.dir);
  }

  // Player
  if (state === 'playing' || state === 'dead') {
    const flash = hitTimer > 0 && Math.floor(hitTimer / 80) % 2;
    if (!flash) {
      const spriteSuffix = !player.onGround ? 'jump' : (player.walkFrame ? 'walk' : 'idle');
      const spriteName = `${hero}_${spriteSuffix}`;
      const px = player.x - cam.x;

      // Powerup glow
      if (activePower) {
        const glowColor = {
          broccoli: 'rgba(118,184,42,0.3)',
          carrot: 'rgba(255,143,43,0.3)',
          banana: 'rgba(255,216,74,0.3)',
          blueberry: 'rgba(63,95,184,0.4)',
        }[activePower];
        if (glowColor) {
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.arc(px + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawSprite(ctx, spriteName, px, player.y, SCALE, player.facing);

      // Punch effect
      if (punchActive) {
        const punchX = px + (punchFacing > 0 ? player.w : -20);
        ctx.fillStyle = 'rgba(255,200,0,0.6)';
        ctx.beginPath();
        ctx.arc(punchX + 10, player.y + player.h / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px system-ui';
        ctx.fillText('POW!', punchX - 2, player.y + player.h / 2 - 18);
      }
    }
  }

  // Pickup popups
  for (const p of pickupPopups) {
    const px = p.x - cam.x;
    const alpha = Math.min(1, p.timer / 400);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.strokeText(p.text, px, p.y);
    ctx.fillText(p.text, px, p.y);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // Pause overlay
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 10);
    ctx.font = '16px system-ui';
    ctx.fillText('Press P to resume', CANVAS_W / 2, CANVAS_H / 2 + 20);
    ctx.textAlign = 'left';
  }
}

// ---- Helpers ---------------------------------------------------------------
function aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function addPopup(text, x, y) {
  pickupPopups.push({ text, x, y, timer: 1200 });
}

// ---- Simple audio (WebAudio blips, no files) --------------------------------
let audioCtx;
function playBlip(freq, vol, dur) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (_) {}
}

// ---- Main loop -------------------------------------------------------------
let lastTime = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!lastTime) lastTime = ts;
  const now = performance.now();

  if (state === 'playing' && !paused) {
    update(now);
  }
  render();
  frameCount++;
}

// ---- Boot ------------------------------------------------------------------
showMenu();
requestAnimationFrame(loop);
