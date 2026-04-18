// Jet — kid-friendly fighter-jet flight sim.
//
// Top-down view. Jet fixed near bottom of canvas; world scrolls top to bottom.
// Phone tilt (or arrow keys) steers the jet left / right only. Tap (or Space)
// fires bullets straight up. Pop balloons for points, avoid mountains.
// Easy / Medium / Hard picked on start screen — only affects speeds.

// ── Logical canvas dimensions ──────────────────────────────────────────────

const W = 800;
const H = 450;

// ── Difficulty ─────────────────────────────────────────────────────────────
//
// mountainEvery = seconds between mountain spawns at t=0. Every 60s the
// spawn interval shrinks by 5% (i.e. ~5% more mountains per minute), which
// compounds slowly — a full minute of gentle play before any change is felt.
// balloonEvery is constant.

const DIFFICULTY = {
  easy:   { scroll:  40, mountainEvery: 9.0, balloonEvery: 1.8, jetSpeed: 180 },
  medium: { scroll: 100, mountainEvery: 5.5, balloonEvery: 1.3, jetSpeed: 260 },
  hard:   { scroll: 180, mountainEvery: 3.5, balloonEvery: 1.0, jetSpeed: 340 },
};

const MOUNTAIN_RAMP_PER_MIN = 0.05; // 5% more mountains every minute
const MOUNTAIN_INTERVAL_MIN = 0.6;  // safety floor (seconds)

// ── Tunables ───────────────────────────────────────────────────────────────

const JET_R        = 14;   // collision radius
const JET_Y        = H - 70;
const BULLET_VY    = -520;
const SHOT_COOLDOWN = 160; // ms
const BALLOON_R    = 18;
const MOUNTAIN_R_MIN = 50;
const MOUNTAIN_R_MAX = 110;

// ── DOM ────────────────────────────────────────────────────────────────────

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const startOv = document.getElementById('start');
const gameOverOv = document.getElementById('gameover');
const gameOverScore = document.getElementById('gameover-score');
const rotateOv = document.getElementById('rotate');
const againBtn = document.getElementById('again');

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  phase: 'start', // 'start' | 'playing' | 'crashed' | 'rotate'
  prevPhase: 'start',
  diff: DIFFICULTY.easy,
  score: 0,
  best: loadBest(),
  worldY: 0,
  jet: { x: W / 2, y: JET_Y },
  bullets: [],
  mountains: [],
  balloons: [],
  particles: [],
  crashT: 0,
  tilt: 0,
  keyDir: 0,
  lastShotAt: 0,
  lastMountain: 0,
  lastBalloon: 0,
  elapsed: 0,
};

bestEl.textContent = state.best;

// ── Setup ──────────────────────────────────────────────────────────────────

function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  // We draw in logical W×H coords and scale to the canvas bitmap.
  ctx.setTransform(
    canvas.width / W, 0,
    0, canvas.height / H,
    0, 0
  );
}

function loadBest() {
  const n = parseInt(localStorage.getItem('jet:best') || '0', 10);
  return Number.isFinite(n) ? n : 0;
}

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem('jet:best', String(state.best));
    bestEl.textContent = state.best;
  }
}

// ── Orientation guard ──────────────────────────────────────────────────────

function checkOrientation() {
  const portrait = window.innerHeight > window.innerWidth;
  if (portrait) {
    rotateOv.hidden = false;
    if (state.phase !== 'rotate') {
      state.prevPhase = state.phase;
      state.phase = 'rotate';
    }
  } else {
    rotateOv.hidden = true;
    if (state.phase === 'rotate') {
      state.phase = state.prevPhase;
    }
    resizeCanvas();
  }
}

// ── Input: tilt ────────────────────────────────────────────────────────────

function onOrient(e) {
  const angle = (screen.orientation && screen.orientation.angle) ||
                window.orientation || 0;
  let raw;
  if (angle === 90)               raw =  e.beta;   // landscape-primary
  else if (angle === -90 || angle === 270) raw = -e.beta; // landscape-secondary
  else                            raw =  e.gamma;  // portrait fallback
  if (raw == null) return;
  const dead = 3, max = 30;
  const sign = Math.sign(raw) || 0;
  const mag  = Math.max(0, Math.min(max, Math.abs(raw) - dead)) / (max - dead);
  state.tilt = sign * mag;
}

async function attachTilt() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') return;
    }
    window.addEventListener('deviceorientation', onOrient);
  } catch (_) {
    // Permission denied or unsupported — keyboard / touch still work.
  }
}

// ── Input: keyboard & touch ────────────────────────────────────────────────

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keyDir = -1;
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keyDir = 1;
  else if (e.key === ' ' || e.code === 'Space') {
    shoot();
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && state.keyDir === -1) state.keyDir = 0;
  else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && state.keyDir === 1) state.keyDir = 0;
});

canvas.addEventListener('pointerdown', (e) => {
  if (state.phase === 'playing') {
    shoot();
    e.preventDefault();
  }
});

// ── Start / end flow ───────────────────────────────────────────────────────

document.querySelectorAll('.jet-diff-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const diff = btn.dataset.diff;
    startGame(diff);
    attachTilt();
  });
});

againBtn.addEventListener('click', () => {
  gameOverOv.hidden = true;
  startOv.hidden = false;
  state.phase = 'start';
});

function startGame(diffKey) {
  state.diff = DIFFICULTY[diffKey] || DIFFICULTY.easy;
  state.score = 0;
  state.worldY = 0;
  state.jet.x = W / 2;
  state.jet.y = JET_Y;
  state.bullets.length = 0;
  state.mountains.length = 0;
  state.balloons.length = 0;
  state.particles.length = 0;
  state.crashT = 0;
  state.lastShotAt = 0;
  state.lastMountain = 0;
  state.lastBalloon = 0;
  state.elapsed = 0;
  scoreEl.textContent = 0;
  startOv.hidden = true;
  gameOverOv.hidden = true;
  state.phase = 'playing';
}

function crash() {
  state.phase = 'crashed';
  state.crashT = 0;
  // Big burst of particles.
  for (let i = 0; i < 28; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * 220;
    state.particles.push({
      x: state.jet.x, y: state.jet.y,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 0.8 + Math.random() * 0.6,
      age: 0,
      color: ['#ff9630', '#ffd600', '#ff4040', '#aa2222'][(Math.random() * 4) | 0],
      r: 2 + Math.random() * 3,
    });
  }
  saveBest();
}

function showGameOver() {
  gameOverScore.textContent = `You popped ${state.score} balloon${state.score === 1 ? '' : 's'}.`;
  gameOverOv.hidden = false;
}

// ── Firing ─────────────────────────────────────────────────────────────────

function shoot() {
  if (state.phase !== 'playing') return;
  const now = performance.now();
  if (now - state.lastShotAt < SHOT_COOLDOWN) return;
  state.lastShotAt = now;
  state.bullets.push({ x: state.jet.x, y: state.jet.y - 18, vy: BULLET_VY });
}

// ── Spawning ───────────────────────────────────────────────────────────────

function spawnMountain() {
  const r = MOUNTAIN_R_MIN + Math.random() * (MOUNTAIN_R_MAX - MOUNTAIN_R_MIN);
  const cx = r + Math.random() * (W - 2 * r);
  const cy = -r - 10;
  // Irregular polygon: 9 points around center with jittered radius.
  const n = 9;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const jitter = 0.7 + Math.random() * 0.55;
    pts.push({
      dx: Math.cos(a) * r * jitter,
      dy: Math.sin(a) * r * jitter,
    });
  }
  state.mountains.push({ cx, cy, r, pts });
}

function spawnBalloon() {
  const x = 30 + Math.random() * (W - 60);
  const hue = (Math.random() * 360) | 0;
  state.balloons.push({
    x, y: -BALLOON_R - 20, r: BALLOON_R,
    color: `hsl(${hue} 85% 55%)`,
    shadow: `hsl(${hue} 70% 35%)`,
  });
}

// ── Collision helpers ──────────────────────────────────────────────────────

function pointInPoly(px, py, m) {
  let inside = false;
  const pts = m.pts;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = m.cx + pts[i].dx, yi = m.cy + pts[i].dy;
    const xj = m.cx + pts[j].dx, yj = m.cy + pts[j].dy;
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function jetHitsMountain(m) {
  const dx = state.jet.x - m.cx;
  const dy = state.jet.y - m.cy;
  if (dx * dx + dy * dy > (m.r + JET_R) ** 2) return false;
  // Nose + two wingtips.
  const jx = state.jet.x, jy = state.jet.y;
  const tests = [
    [jx, jy - 14],         // nose
    [jx - 16, jy + 4],     // left wingtip
    [jx + 16, jy + 4],     // right wingtip
    [jx, jy + 6],          // tail
  ];
  for (const [tx, ty] of tests) {
    if (pointInPoly(tx, ty, m)) return true;
  }
  return false;
}

// ── Tick / update ──────────────────────────────────────────────────────────

function tick(dt) {
  if (state.phase === 'rotate') return;

  // Steering always responds during play (tilt + key)
  if (state.phase === 'playing') {
    const dir = state.keyDir !== 0 ? state.keyDir : state.tilt;
    state.jet.x += dir * state.diff.jetSpeed * dt;
    state.jet.x = Math.max(24, Math.min(W - 24, state.jet.x));

    // World scroll
    const s = state.diff.scroll;
    state.worldY += s * dt;
    state.elapsed += dt;

    // Mountains — spawn interval shrinks 5% per elapsed minute (compounded).
    const minutes = state.elapsed / 60;
    const rampFactor = Math.pow(1 - MOUNTAIN_RAMP_PER_MIN, minutes);
    const interval = Math.max(
      MOUNTAIN_INTERVAL_MIN,
      state.diff.mountainEvery * rampFactor,
    );
    state.lastMountain += dt;
    if (state.lastMountain >= interval) {
      state.lastMountain = 0;
      spawnMountain();
    }
    for (const m of state.mountains) m.cy += s * dt;
    state.mountains = state.mountains.filter((m) => m.cy - m.r < H + 20);

    // Balloons
    state.lastBalloon += dt;
    if (state.lastBalloon >= state.diff.balloonEvery) {
      state.lastBalloon = 0;
      spawnBalloon();
    }
    for (const b of state.balloons) b.y += s * dt;
    state.balloons = state.balloons.filter((b) => b.y - b.r < H + 20);

    // Bullets
    for (const b of state.bullets) b.y += b.vy * dt;
    state.bullets = state.bullets.filter((b) => b.y + 6 > 0);

    // Bullet vs balloon
    for (let i = state.balloons.length - 1; i >= 0; i--) {
      const ball = state.balloons[i];
      for (let j = state.bullets.length - 1; j >= 0; j--) {
        const bt = state.bullets[j];
        const dx = ball.x - bt.x, dy = ball.y - bt.y;
        if (dx * dx + dy * dy < (ball.r + 4) ** 2) {
          popBalloon(ball);
          state.balloons.splice(i, 1);
          state.bullets.splice(j, 1);
          break;
        }
      }
    }

    // Jet vs mountain
    for (const m of state.mountains) {
      if (jetHitsMountain(m)) {
        crash();
        break;
      }
    }
  }

  // Particles always update.
  for (const p of state.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 140 * dt; // slight gravity
  }
  state.particles = state.particles.filter((p) => p.age < p.life);

  if (state.phase === 'crashed') {
    state.crashT += dt;
    if (state.crashT >= 1.2 && gameOverOv.hidden) {
      showGameOver();
    }
  }
}

function popBalloon(ball) {
  state.score++;
  scoreEl.textContent = state.score;
  for (let i = 0; i < 10; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 60 + Math.random() * 140;
    state.particles.push({
      x: ball.x, y: ball.y,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 0.45 + Math.random() * 0.3,
      age: 0,
      color: ball.color,
      r: 2 + Math.random() * 2,
    });
  }
}

// ── Render ─────────────────────────────────────────────────────────────────

function render() {
  // Sky background
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#7bc0ff');
  grd.addColorStop(0.55, '#b6deff');
  grd.addColorStop(1, '#d7eeff');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Scrolling ground stripes (so speed is visible even with no obstacles)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  const stripeH = 40;
  const off = state.worldY % stripeH;
  for (let y = -stripeH + off; y < H; y += stripeH * 2) {
    ctx.fillRect(0, y, W, stripeH);
  }

  // Scattered cloud dots for parallax feel
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 20; i++) {
    const cx = ((i * 97 + (state.worldY * 0.5)) % (W + 120)) - 60;
    const cy = ((i * 53) % H);
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + (i % 3) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Balloons (behind mountains so mountains feel "in front")
  for (const b of state.balloons) drawBalloon(b);

  // Mountains
  for (const m of state.mountains) drawMountain(m);

  // Bullets
  ctx.fillStyle = '#ffe066';
  for (const b of state.bullets) {
    ctx.fillRect(b.x - 1.5, b.y - 6, 3, 12);
  }

  // Jet (hide during crash after half second for poof effect)
  if (state.phase !== 'crashed' || state.crashT < 0.35) drawJet();

  // Particles
  for (const p of state.particles) {
    const a = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawJet() {
  const x = state.jet.x, y = state.jet.y;
  ctx.save();
  ctx.translate(x, y);

  // Wings (behind body)
  ctx.fillStyle = '#8a94a6';
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.lineTo(-6, -2);
  ctx.lineTo(-4, 8);
  ctx.lineTo(-16, 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.lineTo(6, -2);
  ctx.lineTo(4, 8);
  ctx.lineTo(16, 10);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = '#c7ced9';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(6, 10);
  ctx.lineTo(0, 14);
  ctx.lineTo(-6, 10);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = '#37506f';
  ctx.beginPath();
  ctx.ellipse(0, -4, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail fin
  ctx.fillStyle = '#e94f4f';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(3, 14);
  ctx.lineTo(-3, 14);
  ctx.closePath();
  ctx.fill();

  // Nose tip accent
  ctx.fillStyle = '#e94f4f';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(2, -10);
  ctx.lineTo(-2, -10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawMountain(m) {
  // Shadow (slight offset)
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  const first = m.pts[0];
  ctx.moveTo(m.cx + first.dx + 4, m.cy + first.dy + 6);
  for (let i = 1; i < m.pts.length; i++) {
    ctx.lineTo(m.cx + m.pts[i].dx + 4, m.cy + m.pts[i].dy + 6);
  }
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = '#4b5560';
  ctx.beginPath();
  ctx.moveTo(m.cx + first.dx, m.cy + first.dy);
  for (let i = 1; i < m.pts.length; i++) {
    ctx.lineTo(m.cx + m.pts[i].dx, m.cy + m.pts[i].dy);
  }
  ctx.closePath();
  ctx.fill();

  // Snow cap — small triangle near the top point (first point is top)
  const capTop = { x: m.cx + first.dx, y: m.cy + first.dy };
  ctx.fillStyle = '#f4f8ff';
  ctx.beginPath();
  ctx.moveTo(capTop.x, capTop.y);
  ctx.lineTo(capTop.x + m.r * 0.35, capTop.y + m.r * 0.45);
  ctx.lineTo(capTop.x + m.r * 0.15, capTop.y + m.r * 0.55);
  ctx.lineTo(capTop.x - m.r * 0.18, capTop.y + m.r * 0.5);
  ctx.lineTo(capTop.x - m.r * 0.35, capTop.y + m.r * 0.4);
  ctx.closePath();
  ctx.fill();
}

function drawBalloon(b) {
  // Rope
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + b.r);
  ctx.lineTo(b.x, b.y + b.r + 8);
  ctx.stroke();

  // Basket
  ctx.fillStyle = '#6b4018';
  ctx.fillRect(b.x - 6, b.y + b.r + 8, 12, 7);

  // Balloon body (teardrop)
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, b.r * 0.9, b.r, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shading
  ctx.fillStyle = b.shadow;
  ctx.beginPath();
  ctx.ellipse(b.x + 4, b.y + 4, b.r * 0.35, b.r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(b.x - 5, b.y - 5, b.r * 0.22, b.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ── Main loop ──────────────────────────────────────────────────────────────

let lastT = performance.now();
function frame(now) {
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 0.05) dt = 0.05; // clamp huge deltas (tab switch)
  tick(dt);
  render();
  requestAnimationFrame(frame);
}

// ── Boot ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
resizeCanvas();
checkOrientation();
requestAnimationFrame(frame);
