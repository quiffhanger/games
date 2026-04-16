const COLS = 20;
const ROWS = 20;
const SPEED_MS = 150;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');
const startBtn = document.getElementById('start-btn');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

let cellSize, snake, dir, nextDir, food, score, best, running, rafId, lastTick;

function resize() {
  const main = canvas.parentElement;
  const dpadSpace = window.matchMedia('(hover: none), (pointer: coarse)').matches ? 160 : 0;
  const size = Math.min(main.clientWidth - 16, main.clientHeight - 16 - dpadSpace);
  cellSize = Math.floor(size / COLS);
  canvas.width = cellSize * COLS;
  canvas.height = cellSize * ROWS;
}

function initGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = '0';
  placeFood();
}

function placeFood() {
  const empty = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!snake.some(s => s.x === x && s.y === y)) empty.push({ x, y });
    }
  }
  food = empty[Math.floor(Math.random() * empty.length)];
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver();
  if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem('snake-best', best);
    }
    placeFood();
  } else {
    snake.pop();
  }
}

function draw() {
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(canvas.width, y * cellSize); ctx.stroke();
  }

  // Food
  const fr = cellSize * 0.35;
  ctx.fillStyle = '#ff4f4f';
  ctx.beginPath();
  ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, fr, 0, Math.PI * 2);
  ctx.fill();

  // Snake
  const pad = 1;
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#8aff80' : '#4fe340';
    ctx.beginPath();
    ctx.roundRect(seg.x * cellSize + pad, seg.y * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2, 3);
    ctx.fill();
  });
}

function loop(ts) {
  if (!running) return;
  if (ts - lastTick >= SPEED_MS) {
    step();
    lastTick = ts;
  }
  if (running) draw();
  rafId = requestAnimationFrame(loop);
}

function startGame() {
  overlay.classList.add('hidden');
  initGame();
  running = true;
  lastTick = performance.now();
  rafId = requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  cancelAnimationFrame(rafId);
  overlayTitle.textContent = score > 0 ? `Score: ${score}` : 'Game Over';
  overlaySub.textContent = score > 0
    ? `You ate ${score} apple${score > 1 ? 's' : ''}. Play again?`
    : "You crashed. Try again!";
  startBtn.textContent = 'Play Again';
  overlay.classList.remove('hidden');
}

// Input: keyboard
const DIRS = {
  ArrowUp:    { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown:  { x: 0, y:  1 }, s: { x: 0, y:  1 },
  ArrowLeft:  { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y:  0 }, d: { x:  1, y: 0 },
};
document.addEventListener('keydown', e => {
  const d = DIRS[e.key];
  if (!d) return;
  e.preventDefault();
  if (d.x === -dir.x && d.y === -dir.y) return;
  nextDir = d;
});

// Input: d-pad buttons
document.querySelectorAll('.snake-dpad__btn').forEach(btn => {
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    const map = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 } };
    const d = map[btn.dataset.dir];
    if (d && !(d.x === -dir.x && d.y === -dir.y)) nextDir = d;
  });
});

// Input: swipe
let touchStart = null;
canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive: true });
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.clientX;
  const dy = e.changedTouches[0].clientY - touchStart.clientY;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
  let d;
  if (Math.abs(dx) > Math.abs(dy)) d = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
  else d = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
  if (!(d.x === -dir.x && d.y === -dir.y)) nextDir = d;
  touchStart = null;
}, { passive: true });

// Init
best = parseInt(localStorage.getItem('snake-best') || '0', 10);
bestEl.textContent = best;

resize();
window.addEventListener('resize', () => { resize(); if (!running) draw(); });

startBtn.addEventListener('click', startGame);

// Draw initial state so canvas isn't blank before game starts
initGame();
draw();
