// Level data + simple Bristol-themed background rendering.
// Graphics are kept deliberately simple: coloured rectangles, a few arcs,
// and text labels — no fancy procedural art. Fast to draw, readable for kids.

export const LEVEL_WIDTH = 7000;
export const GROUND_Y = 480;
export const CANVAS_W = 960;
export const CANVAS_H = 540;

// Platforms: solid rectangles the player stands on.
// { x, y, w, h, type } — type just picks a colour.
const platforms = [
  // Ground (with two pits)
  { x: 0,     y: GROUND_Y, w: 2600, h: 60, type: 'pavement' },
  { x: 2700,  y: GROUND_Y, w: 900,  h: 60, type: 'pavement' },
  { x: 3700,  y: GROUND_Y, w: 1000, h: 60, type: 'bridge'   }, // over the Avon
  { x: 4800,  y: GROUND_Y, w: 2200, h: 60, type: 'pavement' },

  // Redland hop blocks
  { x: 600,  y: 400, w: 80, h: 20, type: 'brick' },
  { x: 760,  y: 340, w: 80, h: 20, type: 'brick' },
  { x: 920,  y: 400, w: 80, h: 20, type: 'brick' },

  // Cotham Hill crate stack
  { x: 1250, y: 420, w: 60, h: 60, type: 'crate' },
  { x: 1310, y: 360, w: 60, h: 60, type: 'crate' },
  { x: 1500, y: 380, w: 120, h: 20, type: 'brick' },
  { x: 1720, y: 320, w: 120, h: 20, type: 'brick' },

  // Clifton Down station platforms
  { x: 2250, y: 410, w: 200, h: 20, type: 'platform' },
  { x: 2500, y: 360, w: 160, h: 20, type: 'platform' },

  // Suspension-bridge mid-span (suspension platforms over pit)
  { x: 2600, y: 360, w: 80,  h: 16, type: 'rope' },
  { x: 2460, y: 300, w: 80,  h: 16, type: 'rope' },
  { x: 3620, y: 360, w: 80,  h: 16, type: 'rope' },
  { x: 3460, y: 300, w: 80,  h: 16, type: 'rope' },

  // Over-the-bridge floating platforms
  { x: 4100, y: 380, w: 120, h: 16, type: 'rope' },
  { x: 4300, y: 320, w: 120, h: 16, type: 'rope' },
  { x: 4500, y: 380, w: 120, h: 16, type: 'rope' },

  // Clifton village
  { x: 5250, y: 400, w: 80, h: 20, type: 'brick' },
  { x: 5400, y: 350, w: 80, h: 20, type: 'brick' },
  { x: 5550, y: 400, w: 80, h: 20, type: 'brick' },

  // Clifton High approach
  { x: 6300, y: 380, w: 120, h: 20, type: 'brick' },
  { x: 6500, y: 340, w: 120, h: 20, type: 'brick' },

  // Secret rainbow platform (reached by big trampoline bounce at x:6100)
  { x: 6080, y: 180, w: 140, h: 16, type: 'secret' },
];

const trampolines = [
  { x: 500,  y: 460, w: 80 },
  { x: 1100, y: 460, w: 80 },
  { x: 1850, y: 460, w: 80 },
  { x: 2000, y: 460, w: 80 },
  { x: 3050, y: 460, w: 80 },
  { x: 3900, y: 460, w: 80 },
  { x: 4700, y: 460, w: 80 },
  { x: 5100, y: 460, w: 80 },
  { x: 5800, y: 460, w: 80 },
  { x: 6100, y: 460, w: 80, secret: true },
];

// Enemies placed on OPEN ground — not under any platform
const enemies = [
  { x:  300, y: GROUND_Y - 42, type: 'creeper', range: [200,  550] },
  { x: 1050, y: GROUND_Y - 42, type: 'creeper', range: [980,  1200] },
  { x: 1650, y: GROUND_Y - 42, type: 'zombie',  range: [1600, 1850] },
  { x: 2550, y: 260,           type: 'pigeon',  range: [2300, 2900] },
  { x: 2850, y: GROUND_Y - 42, type: 'creeper', range: [2750, 3050] },
  { x: 4250, y: 260,           type: 'pigeon',  range: [4000, 4600] },
  { x: 4950, y: GROUND_Y - 42, type: 'zombie',  range: [4850, 5100] },
  { x: 5700, y: GROUND_Y - 30, type: 'slime',   range: [5650, 5900] },
  { x: 6600, y: GROUND_Y - 42, type: 'creeper', range: [6550, 6850] },
];

const items = [
  { x:  700, y: 300, type: 'star' },
  { x:  950, y: 360, type: 'star' },
  { x: 1150, y: 400, type: 'broccoli' },
  { x: 1560, y: 340, type: 'star' },
  { x: 1780, y: 280, type: 'star' },
  { x: 2100, y: 420, type: 'carrot' },
  { x: 2520, y: 320, type: 'star' },
  { x: 2650, y: 310, type: 'star' },
  { x: 3100, y: 400, type: 'banana' },
  { x: 4150, y: 340, type: 'star' },
  { x: 4350, y: 280, type: 'blueberry' },
  { x: 4550, y: 340, type: 'star' },
  { x: 5300, y: 420, type: 'apple' },
  { x: 5600, y: 420, type: 'strawberry' },
  { x: 6350, y: 340, type: 'star' },
  { x: 6550, y: 300, type: 'star' },
  // Secret chocolate on the hidden platform (reached by trampoline at 6100)
  { x: 6130, y: 160, type: 'chocolate' },
];

const checkpoints = [
  { x: 2200, y: GROUND_Y - 60 },
  { x: 4000, y: GROUND_Y - 60 },
  { x: 5200, y: GROUND_Y - 60 },
];

const goal = { x: 6900, y: GROUND_Y - 120 };

export const LEVEL = {
  width: LEVEL_WIDTH,
  spawn: { x: 80, y: GROUND_Y - 80 },
  platforms,
  trampolines,
  enemies,
  items,
  checkpoints,
  goal,
};

// ---- Background drawing (simple shapes) ------------------------------------

const PLATFORM_COLORS = {
  pavement: '#7a7a82',
  bridge:   '#b08b5c',
  brick:    '#c96a3a',
  crate:    '#a87448',
  platform: '#5a6780',
  rope:     '#d0b280',
  secret:   '#ffd84a',
};

const PLATFORM_TOPS = {
  pavement: '#9a9aa2',
  bridge:   '#d0a47a',
  brick:    '#e0895a',
  crate:    '#c79060',
  platform: '#7a8ba5',
  rope:     '#efd099',
  secret:   '#ffe88a',
};

export function drawPlatforms(ctx, cam) {
  for (const p of platforms) {
    if (p.x + p.w < cam.x || p.x > cam.x + CANVAS_W) continue;
    const x = p.x - cam.x;
    ctx.fillStyle = PLATFORM_COLORS[p.type] || '#888';
    ctx.fillRect(x, p.y, p.w, p.h);
    ctx.fillStyle = PLATFORM_TOPS[p.type] || '#aaa';
    ctx.fillRect(x, p.y, p.w, 4);
    if (p.type === 'crate') {
      ctx.strokeStyle = '#5a3a22';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, p.y + 1, p.w - 2, p.h - 2);
      ctx.beginPath();
      ctx.moveTo(x + 1, p.y + 1);
      ctx.lineTo(x + p.w - 1, p.y + p.h - 1);
      ctx.moveTo(x + p.w - 1, p.y + 1);
      ctx.lineTo(x + 1, p.y + p.h - 1);
      ctx.stroke();
    }
    if (p.type === 'brick') {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let bx = x; bx < x + p.w; bx += 20) {
        ctx.beginPath();
        ctx.moveTo(bx, p.y);
        ctx.lineTo(bx, p.y + p.h);
        ctx.stroke();
      }
    }
  }
}

export function drawTrampolines(ctx, cam, t) {
  for (const tr of trampolines) {
    if (tr.x + tr.w < cam.x || tr.x > cam.x + CANVAS_W) continue;
    const x = tr.x - cam.x;
    const y = tr.y;
    // base springs
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 4, y + 12, tr.w - 8, 6);
    // rainbow arc
    const bands = ['#ff4a4a', '#ff9a2b', '#ffd84a', '#57d25b', '#3aa3ff', '#8d5bff'];
    const pulse = 1 + Math.sin(t / 180) * 0.05;
    for (let i = 0; i < bands.length; i++) {
      ctx.strokeStyle = bands[i];
      ctx.lineWidth = 4;
      ctx.beginPath();
      const r = (tr.w / 2 - i * 4) * pulse;
      ctx.arc(x + tr.w / 2, y + 14, Math.max(r, 6), Math.PI, 0);
      ctx.stroke();
    }
  }
}

export function drawCheckpoints(ctx, cam, activeIdx) {
  checkpoints.forEach((c, i) => {
    if (c.x < cam.x - 40 || c.x > cam.x + CANVAS_W + 40) return;
    const x = c.x - cam.x;
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(x - 2, c.y, 4, 60);
    ctx.fillStyle = i <= activeIdx ? '#57d25b' : '#cccccc';
    ctx.beginPath();
    ctx.moveTo(x + 2, c.y + 4);
    ctx.lineTo(x + 26, c.y + 12);
    ctx.lineTo(x + 2, c.y + 20);
    ctx.closePath();
    ctx.fill();
  });
}

export function drawGoal(ctx, cam, t) {
  if (goal.x < cam.x - 80 || goal.x > cam.x + CANVAS_W + 80) return;
  const x = goal.x - cam.x;
  // pole
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(x - 2, goal.y, 4, 120);
  // flag waving
  const wave = Math.sin(t / 120) * 4;
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(x + 2, goal.y + 4);
  ctx.lineTo(x + 44 + wave, goal.y + 16);
  ctx.lineTo(x + 2, goal.y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.fillText('SCHOOL!', x + 6, goal.y + 20);
}

// ---- Parallax background (very simple) -------------------------------------

export function drawBackground(ctx, cam, t) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#8ecbff');
  sky.addColorStop(1, '#ffe3b6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Slow-parallax clouds
  drawClouds(ctx, cam, t);

  // Far parallax: rolling hills + river
  drawHills(ctx, cam);

  // Zone-specific landmarks (mid-parallax)
  drawLandmarks(ctx, cam, t);

  // Grass strip in front of the ground
  ctx.fillStyle = '#4ea84b';
  ctx.fillRect(0, GROUND_Y - 6, CANVAS_W, 10);
}

function drawClouds(ctx, cam, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const offset = (cam.x * 0.15 + t * 0.02) % 400;
  for (let i = -1; i < 6; i++) {
    const cx = i * 400 - offset;
    const cy = 70 + (i % 2) * 30;
    cloud(ctx, cx, cy, 60);
    cloud(ctx, cx + 200, cy + 20, 40);
  }
}

function cloud(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.8, y - r * 0.3, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x + r * 1.6, y, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x + r * 0.6, y + r * 0.2, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx, cam) {
  const off = cam.x * 0.3;
  ctx.fillStyle = '#8ab86a';
  for (let i = -1; i < 10; i++) {
    const hx = i * 500 - (off % 500);
    ctx.beginPath();
    ctx.moveTo(hx, GROUND_Y);
    ctx.quadraticCurveTo(hx + 250, 320, hx + 500, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#6ba050';
  for (let i = -1; i < 8; i++) {
    const hx = i * 700 - (off % 700) - 200;
    ctx.beginPath();
    ctx.moveTo(hx, GROUND_Y);
    ctx.quadraticCurveTo(hx + 350, 370, hx + 700, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
}

// Landmarks anchored to world x, drawn with mid-parallax (0.6x)
const LANDMARKS = [
  { x: 200,  draw: redlandTerraces, label: 'Redland' },
  { x: 1200, draw: cothamShops,     label: 'Cotham Hill' },
  { x: 2300, draw: cliftonStation,  label: 'Clifton Down Stn' },
  { x: 3400, draw: suspensionBridge,label: 'Suspension Bridge', wide: true },
  { x: 5200, draw: observatory,     label: 'Clifton Village' },
  { x: 6400, draw: cliftonHigh,     label: 'Clifton High' },
];

function drawLandmarks(ctx, cam, t) {
  const p = cam.x * 0.6;
  for (const lm of LANDMARKS) {
    const screenX = lm.x - p;
    if (screenX < -800 || screenX > CANVAS_W + 200) continue;
    ctx.save();
    ctx.translate(screenX, 0);
    lm.draw(ctx, t);
    // subtle label
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText(lm.label, 8, 24);
    ctx.restore();
  }
}

function redlandTerraces(ctx) {
  // Row of Victorian terraces — 4 houses, cream with bay windows
  const baseY = 300;
  const colors = ['#e9d2a8', '#d9b98a', '#c99f70', '#e4c69a'];
  for (let i = 0; i < 4; i++) {
    const x = i * 120;
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, baseY, 110, 180);
    // roof
    ctx.fillStyle = '#5d4a3a';
    ctx.fillRect(x - 4, baseY - 14, 118, 16);
    // bay window
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(x + 10, baseY + 30, 50, 60);
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 10, baseY + 30, 50, 60);
    ctx.beginPath();
    ctx.moveTo(x + 10, baseY + 60);
    ctx.lineTo(x + 60, baseY + 60);
    ctx.moveTo(x + 35, baseY + 30);
    ctx.lineTo(x + 35, baseY + 90);
    ctx.stroke();
    // door
    ctx.fillStyle = ['#2e5fa0', '#9a2b2b', '#2b6a3a', '#6b3a8a'][i];
    ctx.fillRect(x + 75, baseY + 100, 26, 80);
    // chimney
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(x + 80, baseY - 30, 14, 18);
  }
}

function cothamShops(ctx) {
  const baseY = 340;
  const shops = [
    { c: '#e8504f', name: 'Bakery' },
    { c: '#4aa3d9', name: 'Books'  },
    { c: '#57b661', name: 'Greens' },
    { c: '#f0a93b', name: 'Cafe'   },
  ];
  shops.forEach((s, i) => {
    const x = i * 100;
    ctx.fillStyle = s.c;
    ctx.fillRect(x, baseY, 92, 140);
    // awning
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 4, baseY - 8, 100, 12);
    ctx.fillStyle = s.c;
    for (let k = 0; k < 10; k++) {
      if (k % 2) ctx.fillRect(x - 4 + k * 10, baseY - 8, 10, 12);
    }
    // window
    ctx.fillStyle = '#fff8d0';
    ctx.fillRect(x + 8, baseY + 20, 76, 60);
    // sign
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + 4, baseY + 6, 84, 14);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.fillText(s.name, x + 10, baseY + 17);
    // door
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x + 34, baseY + 90, 24, 50);
  });
}

function cliftonStation(ctx) {
  const baseY = 310;
  // Station building — pale stone with arched entrances
  ctx.fillStyle = '#e7dfc9';
  ctx.fillRect(0, baseY, 360, 170);
  // roof
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(-8, baseY - 16, 376, 18);
  // arches
  ctx.fillStyle = '#3a2f22';
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 80;
    ctx.beginPath();
    ctx.moveTo(x, baseY + 140);
    ctx.lineTo(x, baseY + 60);
    ctx.quadraticCurveTo(x + 25, baseY + 20, x + 50, baseY + 60);
    ctx.lineTo(x + 50, baseY + 140);
    ctx.closePath();
    ctx.fill();
  }
  // clock
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(180, baseY - 4, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(180, baseY - 4);
  ctx.lineTo(180, baseY - 14);
  ctx.moveTo(180, baseY - 4);
  ctx.lineTo(188, baseY - 4);
  ctx.stroke();
}

function suspensionBridge(ctx, t) {
  // The iconic twin towers + suspension cables, anchored below groundline
  const baseY = GROUND_Y;
  const span = 900;
  // river / gorge water shimmer below (only visible over pit areas; decorative here)
  ctx.fillStyle = 'rgba(60, 120, 170, 0.35)';
  ctx.fillRect(0, baseY + 6, span, 60);
  // towers
  ctx.fillStyle = '#d6cfa8';
  // left tower
  ctx.fillRect(80, 180, 60, baseY - 180);
  // right tower
  ctx.fillRect(span - 140, 180, 60, baseY - 180);
  // tower tops (slightly pointed)
  ctx.fillStyle = '#b9b087';
  ctx.fillRect(74, 170, 72, 14);
  ctx.fillRect(span - 146, 170, 72, 14);
  // archway cutouts
  ctx.fillStyle = '#8ecbff';
  ctx.fillRect(94, 260, 32, 50);
  ctx.fillRect(span - 126, 260, 32, 50);
  // main catenary cable
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(110, 190);
  ctx.quadraticCurveTo(span / 2, 380, span - 110, 190);
  ctx.stroke();
  // vertical hangers
  ctx.lineWidth = 1.5;
  for (let x = 130; x < span - 110; x += 30) {
    const tFrac = (x - 110) / (span - 220);
    const cy = 190 + (1 - Math.pow(2 * tFrac - 1, 2)) * 190;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x, baseY - 20);
    ctx.stroke();
  }
  // deck line
  ctx.strokeStyle = '#6b5a3a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, baseY - 20);
  ctx.lineTo(span - 40, baseY - 20);
  ctx.stroke();
}

function observatory(ctx) {
  const baseY = 300;
  // Hill
  ctx.fillStyle = '#8ab86a';
  ctx.beginPath();
  ctx.moveTo(-50, GROUND_Y);
  ctx.quadraticCurveTo(160, baseY, 360, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Observatory building (Cabot-tower-esque simplification)
  ctx.fillStyle = '#c9a56c';
  ctx.fillRect(140, baseY - 20, 60, 120);
  ctx.fillStyle = '#a88047';
  ctx.beginPath();
  ctx.moveTo(130, baseY - 20);
  ctx.lineTo(170, baseY - 70);
  ctx.lineTo(210, baseY - 20);
  ctx.closePath();
  ctx.fill();
  // Flagpole
  ctx.fillStyle = '#222';
  ctx.fillRect(168, baseY - 100, 2, 30);
  ctx.fillStyle = '#e8504f';
  ctx.fillRect(170, baseY - 100, 14, 10);
}

function cliftonHigh(ctx) {
  const baseY = 300;
  // Main stone building
  ctx.fillStyle = '#e9e1c8';
  ctx.fillRect(0, baseY, 420, 180);
  // Central tower
  ctx.fillStyle = '#d8cfb2';
  ctx.fillRect(180, baseY - 40, 60, 40);
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.moveTo(170, baseY - 40);
  ctx.lineTo(210, baseY - 70);
  ctx.lineTo(250, baseY - 40);
  ctx.closePath();
  ctx.fill();
  // Windows
  ctx.fillStyle = '#3b5ea0';
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      ctx.fillRect(20 + c * 65, baseY + 30 + r * 60, 30, 40);
    }
  }
  // Central door
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(195, baseY + 110, 30, 70);
  // Sign
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(120, baseY + 4, 180, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui';
  ctx.fillText('CLIFTON HIGH', 142, baseY + 18);
}
