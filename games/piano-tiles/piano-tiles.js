// Piano Tiles — kid-friendly version.
//
// Design:
//   • 4 coloured columns, one tile visible per lane at a time.
//   • Tap the tile as it falls through the tap zone at the bottom.
//   • Each tap plays the next note of a classical melody. Once a melody
//     finishes, the next one begins — so the player "performs" recognisable
//     pieces (Ode to Joy, Für Elise, Spring from Four Seasons, etc.).
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

// Visible "tap here" line. Tile is hittable once its bottom has reached
// (or passed) this y — so the tile visibly touches the line before it's
// valid to tap. Kids can see exactly when to act.
const LINE_Y = H * 0.55;      // 352 px from top
// Miss: tile top passes this y (a little below the bottom edge).
const MISS_Y = H + TILE_H * 0.25;

// Difficulty presets — chosen from the settings modal and persisted in
// localStorage. Each preset tunes the speed ramp:
//   startSpeed:    initial tile fall speed in px/s
//   speedStep:     px/s added every `tilesPerStep` successful taps
//   tilesPerStep:  how many taps between speed bumps
//   maxSpeed:      cap on the fall speed
const DIFFICULTIES = {
  easy:   { label: 'Easy',   startSpeed: 170, speedStep: 10, tilesPerStep: 8, maxSpeed: 330 },
  normal: { label: 'Normal', startSpeed: 200, speedStep: 20, tilesPerStep: 5, maxSpeed: 560 },
  fast:   { label: 'Fast',   startSpeed: 240, speedStep: 30, tilesPerStep: 4, maxSpeed: 720 },
  crazy:  { label: 'Crazy',  startSpeed: 280, speedStep: 40, tilesPerStep: 3, maxSpeed: 900 },
};
const DEFAULT_DIFFICULTY = 'normal';
const DIFF_KEY = 'piano-tiles.difficulty';

// Space between consecutive tile tops (px). As speed rises, tiles come faster.
const SPAWN_INTERVAL_PX = TILE_H * 1.85;

const LIVES = 3;

// Colours per column (visual only now; the note played comes from the
// current classical melody).
const COL_COLORS  = ['#ff77c6', '#ffd600', '#4fe3ff', '#8aff80'];
const COL_SHADOW  = ['#c2005a', '#c79a00', '#0097b8', '#2d9900'];

// Pulse timer for the tap line's glow.
let linePulse = 0;

// ── Classical melodies ─────────────────────────────────────────────────────
// Each note is a MIDI note number (60 = middle C). Kids "play" each melody
// one note per tap; when the list runs out we advance to the next piece.

const MELODIES = [
  {
    name: 'Ode to Joy',
    notes: [
      // First statement of the theme (A).
      64, 64, 65, 67, 67, 65, 64, 62,
      60, 60, 62, 64, 64, 62, 62,
      64, 64, 65, 67, 67, 65, 64, 62,
      60, 60, 62, 64, 62, 60, 60,
      // Middle section (B) that leads back home.
      62, 62, 64, 60, 62, 64, 65, 64,
      60, 62, 64, 65, 64, 62, 60, 62,
      // Return of the theme to close it out.
      64, 64, 65, 67, 67, 65, 64, 62,
      60, 60, 62, 64, 62, 60, 60,
    ],
  },
  {
    name: 'Twinkle Twinkle',
    notes: [
      60, 60, 67, 67, 69, 69, 67,
      65, 65, 64, 64, 62, 62, 60,
      // "Up above the world so high" / "Like a diamond in the sky".
      67, 67, 65, 65, 64, 64, 62,
      67, 67, 65, 65, 64, 64, 62,
    ],
  },
  {
    name: 'Für Elise',
    notes: [
      76, 75, 76, 75, 76, 71, 74, 72, 69,
      60, 64, 69, 71, 64, 68, 71, 72,
      // The answering phrase — recurring rondo figure.
      64, 72, 71, 69, 64, 64, 72, 71, 69,
      76, 75, 76, 75, 76, 71, 74, 72, 69,
    ],
  },
  {
    name: 'Eine kleine Nachtmusik',
    notes: [
      67, 62, 67, 62, 67, 62, 67, 71, 74, 72, 71, 69, 67,
      67, 62, 67, 62, 67, 62, 67, 71, 74, 72, 71, 69, 67,
    ],
  },
  {
    name: 'Spring (Vivaldi)',
    notes: [
      76, 76, 76, 71, 71, 71, 76, 76, 76, 71, 71, 71,
      76, 79, 78, 76, 75, 76, 71,
      76, 76, 76, 71, 71, 71, 76, 76, 76, 71, 71, 71,
      76, 79, 78, 76, 75, 76, 71,
    ],
  },
  {
    name: 'Swan Lake',
    notes: [
      71, 69, 68, 69, 71, 73, 74, 73, 71, 69, 68, 69, 71,
      // Rising restatement — the theme climbs before settling back.
      73, 75, 76, 74, 73, 71, 74, 73, 71, 69, 68, 69, 71,
    ],
  },
  {
    name: 'Dance of the Reed Flutes',
    notes: [
      74, 76, 78, 76, 74, 76, 78, 76, 74, 74, 76, 78,
      // Higher echo of the phrase.
      78, 81, 79, 78, 76, 78, 81, 79, 78, 76, 78, 74,
    ],
  },
  {
    name: 'William Tell',
    notes: [
      67, 67, 67, 64, 60, 67, 67, 67, 64, 60,
      67, 67, 67, 72, 67, 64, 60,
      67, 67, 67, 64, 60, 67, 67, 67, 64, 60,
      72, 72, 72, 72, 67, 64, 60,
    ],
  },
  {
    name: 'Canon in D',
    notes: [
      // Pachelbel's ground bass — the piece is built from repetitions of
      // this figure, so doubling it is literally what the original does.
      74, 69, 71, 66, 67, 62, 67, 69,
      74, 69, 71, 66, 67, 62, 67, 69,
    ],
  },
];

function midiToHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

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
const settingsBtn   = document.getElementById('settings-btn');
const settingsEl    = document.getElementById('settings');
const settingsClose = document.getElementById('settings-close');
const diffBtnsEl    = document.getElementById('diff-btns');

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

function loadDifficulty() {
  try {
    const v = localStorage.getItem(DIFF_KEY);
    return DIFFICULTIES[v] ? v : DEFAULT_DIFFICULTY;
  } catch { return DEFAULT_DIFFICULTY; }
}
function saveDifficulty(k) {
  try { localStorage.setItem(DIFF_KEY, k); } catch { /* */ }
}

let currentDiff = loadDifficulty();

// ── Game state ──────────────────────────────────────────────────────────────

let tiles, score, lives, speed, status;
let spawnOffset; // tracks how many px have scrolled since last spawn
let tilesHit;    // total tapped this game, drives speed increases
let prevCol;     // avoid spawning same column twice in a row
let particles;   // hit-burst particles
let gameOverTimer;
let shakeTimer;  // screen-shake on miss
let melodyIdx;   // which melody we're currently "playing"
let noteIdx;     // position inside that melody
let melodyBannerTimer; // seconds remaining for the melody-name flash

function newGame() {
  const diff = DIFFICULTIES[currentDiff];
  tiles       = [];
  score       = 0;
  lives       = LIVES;
  speed       = diff.startSpeed;
  status      = 'playing';
  spawnOffset = 0;
  tilesHit    = 0;
  prevCol     = -1;
  particles   = [];
  gameOverTimer = 0;
  shakeTimer  = 0;
  // Start each game on a random melody so it feels fresh.
  melodyIdx   = Math.floor(Math.random() * MELODIES.length);
  noteIdx     = 0;
  melodyBannerTimer = 2.2;

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
  // Hittable = tile's bottom has reached or passed the tap line.
  let best = null;
  for (const t of tiles) {
    if (t.col !== col || t.state !== 'falling') continue;
    if (t.y + TILE_H < LINE_Y) continue; // not touching the line yet
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

  // Speed bump every `tilesPerStep` tiles, from the chosen difficulty.
  const diff = DIFFICULTIES[currentDiff];
  if (tilesHit % diff.tilesPerStep === 0) {
    speed = Math.min(speed + diff.speedStep, diff.maxSpeed);
  }

  // Play the next note from the current classical melody.
  const melody = MELODIES[melodyIdx];
  playNote(midiToHz(melody.notes[noteIdx]));
  noteIdx++;
  if (noteIdx >= melody.notes.length) {
    // Advance to the next piece and flash its name.
    melodyIdx = (melodyIdx + 1) % MELODIES.length;
    noteIdx = 0;
    melodyBannerTimer = 2.2;
  }

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

// ── Settings modal ─────────────────────────────────────────────────────────

function syncDiffButtons() {
  for (const btn of diffBtnsEl.querySelectorAll('[data-diff]')) {
    btn.dataset.selected = btn.dataset.diff === currentDiff ? 'true' : 'false';
  }
}
syncDiffButtons();

function openSettings() {
  syncDiffButtons();
  settingsEl.hidden = false;
}
function closeSettings() {
  settingsEl.hidden = true;
}

settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsEl.addEventListener('click', (e) => {
  // Click on the dimmed backdrop (but not the card) closes the modal.
  if (e.target === settingsEl) closeSettings();
});

diffBtnsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-diff]');
  if (!btn) return;
  const key = btn.dataset.diff;
  if (!DIFFICULTIES[key]) return;
  currentDiff = key;
  saveDifficulty(key);
  syncDiffButtons();
  // Restart so the new speed takes effect immediately.
  newGame();
  closeSettings();
});

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
  if (melodyBannerTimer > 0) melodyBannerTimer -= dt;
  linePulse += dt;
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

  // Tap line — a bright pulsing "tap here" line. Tiles are hittable once
  // their bottom edge has reached or passed this line.
  drawTapLine();

  // Tiles.
  for (const t of tiles) {
    drawTile(t);
  }

  // Melody title banner (drawn on top of tiles so it stays legible).
  drawMelodyBanner();

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

function drawTapLine() {
  // Soft pulsing opacity so it catches the eye.
  const pulse = 0.65 + Math.sin(linePulse * 3.2) * 0.25;

  // Glow underlay.
  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, LINE_Y);
  ctx.lineTo(W, LINE_Y);
  ctx.stroke();
  ctx.restore();

  // Down-pointing arrows above the line, one per column, inviting the kid
  // to tap each lane when a tile reaches it.
  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * pulse + 0.15})`;
  for (let c = 0; c < COLS; c++) {
    const cx = c * TILE_W + TILE_W / 2;
    const tipY = LINE_Y - 10;
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - 9, tipY - 14);
    ctx.lineTo(cx + 9, tipY - 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMelodyBanner() {
  const name = MELODIES[melodyIdx].name;

  // Normal steady label: small, centred near the top.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (melodyBannerTimer > 0) {
    // Flash: fade in for first 0.25s, hold, fade out over last 0.5s.
    const t = melodyBannerTimer;
    const hold = Math.max(0, Math.min(1, t / 2.0));
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    // Drop shadow for legibility over tiles.
    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * hold})`;
    ctx.fillText(name, W / 2 + 2, 40 + 2);
    ctx.fillStyle = `rgba(255, 214, 0, ${hold})`;
    ctx.fillText(name, W / 2, 40);
  } else {
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText(name, W / 2, 22);
  }
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
