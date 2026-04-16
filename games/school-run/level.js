// Level data and rendering for the School Run.
// A single scrolling level themed on the school run from Redland to Clifton High.
//
// Tile map legend:
//   . = empty (air)
//   # = ground (solid, grass-topped)
//   B = brick block (solid, breakable with broccoli)
//   P = platform (solid, can stand on)
//   R = rainbow trampoline
//   S = player spawn
//   F = finish (school gate)
//   Enemies / items placed separately via entity lists.

export const TILE_SIZE = 32;

export const TILE = {
  EMPTY:    0,
  GROUND:   1,
  BRICK:    2,
  PLATFORM: 3,
  RAINBOW:  4,
  SPAWN:    5,
  FINISH:   6,
};

const CHAR_MAP = {
  '.': TILE.EMPTY,
  '#': TILE.GROUND,
  'B': TILE.BRICK,
  'P': TILE.PLATFORM,
  'R': TILE.RAINBOW,
  'S': TILE.SPAWN,
  'F': TILE.FINISH,
};

// The level is designed as rows (top to bottom). Each row is the same width.
// The level is ~300 tiles wide × 18 tiles tall (landscape screen fits ~25×14 tiles).
// Zones: Redland home → Cotham Hill → Whiteladies → Clifton Station → Suspension Bridge → Clifton High

const RAW = [
  '............................................................................................................................................................................................................................................................................................................',
  '............................................................................................................................................................................................................................................................................................................',
  '............................................................................................................................................................................................................................................................................................................',
  '............................................................................................................................................................................................................................................................................................................',
  '..............................................................................................................BB.BB.........................................................P............................................................BB.BB..............................................................',
  '...................................................................................................BB...............BB..............................................PPP................................................................BB...................................................................',
  '...............................BB...........................................................BB.......................BB..........P.PP.P...............PPPP..............................PPP.................................................BB.........PP...PP..............................................',
  '....................PP.PP..............PP..PP.....................................BB.....................................PP.....................PP.............................PP..............BB...BB.............PP..PP.............................PP..PP................................................',
  '...........PP....................PP............PP.PP......PP.PP.....................................PP.........PP..........PP..PP..................R.......PP..PP.....PP..PP.........PP...................................PP.......PP.PP.....R.......PP...PP.PP......PP.........PPP..PPPP..PPP.....PP.......',
  '......PP................PP...............PP......................PP........PP.PP.......PP......PP........PP..........PP.................PP..........................................................PP..PP..........PP.PP........PP...............PP.....PP..................PP.........PP..................',
  'S...........PP.....PP.........PP...PP.........PP....PP......PP.........PP.........PP......PP.......PP.......PP..........PP...PP.....PP.....PP...PP.PP.......PP......PP......PP.PP...PP.....PP....PP..........PP..PP........PP..PP......PP...PP...PP......PP.........PP....PP..........PP....PP..............',
  '...PP.......................................................................................................................................................................................................................................................................................................',
  '##..####.##..##..####.####.##.####..####.###.###.####.####.##.####.####.##..##.####.####..##..##..####.###..####.##..####..####.####.##.####.##..####.##..####.####.####.##...##.####.####.####.####.####.##..####.####.##..####.####.##.####..####..####.####.####..###.####.####.####.##..####.##F#.......',
  '############################################################################################################################################################################################################################################################################################################',
  '############################################################################################################################################################################################################################################################################################################',
  '############################################################################################################################################################################################################################################################################################################',
  '############################################################################################################################################################################################################################################################################################################',
  '############################################################################################################################################################################################################################################################################################################'
];

// Parse raw map
const grid = [];
let spawnX = 0, spawnY = 0;
let finishX = 0, finishY = 0;

for (let r = 0; r < RAW.length; r++) {
  const row = [];
  for (let c = 0; c < RAW[r].length; c++) {
    const ch = RAW[r][c];
    const tile = CHAR_MAP[ch] ?? TILE.EMPTY;
    if (ch === 'S') { spawnX = c; spawnY = r; row.push(TILE.EMPTY); }
    else if (ch === 'F') { finishX = c; finishY = r; row.push(TILE.GROUND); }
    else { row.push(tile); }
  }
  grid.push(row);
}

export const LEVEL_W = grid[0].length;
export const LEVEL_H = grid.length;
export const SPAWN = { x: spawnX * TILE_SIZE, y: spawnY * TILE_SIZE - 30 };
export const FINISH = { x: finishX * TILE_SIZE, y: finishY * TILE_SIZE };

export function getTile(col, row) {
  if (col < 0 || row < 0 || row >= LEVEL_H || col >= LEVEL_W) return TILE.EMPTY;
  return grid[row][col];
}

export function setTile(col, row, val) {
  if (col < 0 || row < 0 || row >= LEVEL_H || col >= LEVEL_W) return;
  grid[row][col] = val;
}

// ── Enemy & item placement ───────────────────────────────────────────────
// Each entry: { type, col, row } — converted to world px by the game.
// Enemies patrol between their spawn and the nearest pit/wall.

export const ENEMY_SPAWNS = [
  // Redland zone
  { type: 'zombie',   col: 20,  row: 11 },
  { type: 'zombie',   col: 30,  row: 11 },
  { type: 'creeper',  col: 42,  row: 11 },
  // Cotham Hill zone
  { type: 'skeleton', col: 60,  row: 11 },
  { type: 'zombie',   col: 75,  row: 11 },
  { type: 'spider',   col: 85,  row: 9 },
  { type: 'creeper',  col: 95,  row: 11 },
  // Whiteladies Road
  { type: 'skeleton', col: 110, row: 11 },
  { type: 'zombie',   col: 125, row: 11 },
  { type: 'spider',   col: 135, row: 8 },
  { type: 'creeper',  col: 145, row: 11 },
  { type: 'skeleton', col: 155, row: 11 },
  // Clifton Station
  { type: 'zombie',   col: 170, row: 11 },
  { type: 'skeleton', col: 180, row: 11 },
  { type: 'spider',   col: 190, row: 8 },
  { type: 'creeper',  col: 200, row: 11 },
  // Suspension Bridge area
  { type: 'skeleton', col: 220, row: 10 },
  { type: 'zombie',   col: 235, row: 11 },
  { type: 'creeper',  col: 248, row: 11 },
  { type: 'spider',   col: 258, row: 9 },
  // Near school
  { type: 'skeleton', col: 270, row: 11 },
  { type: 'zombie',   col: 280, row: 11 },
  { type: 'creeper',  col: 290, row: 11 },
];

export const ITEM_SPAWNS = [
  // Powerups spread through the level
  { type: 'broccoli', col: 25,  row: 10 },
  { type: 'carrot',   col: 55,  row: 7 },
  { type: 'apple',    col: 80,  row: 10 },
  { type: 'grapes',   col: 105, row: 6 },
  { type: 'banana',   col: 140, row: 10 },
  { type: 'broccoli', col: 165, row: 8 },
  { type: 'carrot',   col: 195, row: 10 },
  { type: 'apple',    col: 225, row: 9 },
  { type: 'grapes',   col: 255, row: 7 },
  { type: 'banana',   col: 275, row: 10 },
  { type: 'broccoli', col: 280, row: 10 },
];

// Coins (gold stars) - scattered generously
export const COIN_SPAWNS = [];
// Programmatically place coins along the route
for (let c = 5; c < LEVEL_W - 10; c += 3) {
  // Find a row that's above ground at this column
  for (let r = 4; r < LEVEL_H; r++) {
    if (grid[r][c] === TILE.GROUND || grid[r][c] === TILE.PLATFORM || grid[r][c] === TILE.BRICK) {
      // Place coin 2 tiles above the surface
      if (r - 2 >= 0 && grid[r - 2][c] === TILE.EMPTY) {
        COIN_SPAWNS.push({ col: c, row: r - 2 });
      }
      break;
    }
  }
}

// Rainbow trampoline positions (look for R in the map)
export const RAINBOW_POSITIONS = [];
for (let r = 0; r < LEVEL_H; r++) {
  for (let c = 0; c < LEVEL_W; c++) {
    if (RAW[r][c] === 'R') {
      RAINBOW_POSITIONS.push({ col: c, row: r });
    }
  }
}

// ── Zone definitions for background theming ──────────────────────────────
export const ZONES = [
  { name: 'Redland',        startCol: 0,   endCol: 50,  sky: '#87CEEB', ground: '#4a7c3f' },
  { name: 'Cotham Hill',    startCol: 50,  endCol: 110, sky: '#7EC8E3', ground: '#3d6b35' },
  { name: 'Whiteladies Rd', startCol: 110, endCol: 170, sky: '#6BB5D6', ground: '#4a7c3f' },
  { name: 'Clifton Station',startCol: 170, endCol: 220, sky: '#5FA3C9', ground: '#555555' },
  { name: 'The Bridge',     startCol: 220, endCol: 270, sky: '#5294BC', ground: '#6b5b3f' },
  { name: 'Clifton High',   startCol: 270, endCol: 310, sky: '#87CEEB', ground: '#4a7c3f' },
];

export function getZone(col) {
  for (const z of ZONES) {
    if (col >= z.startCol && col < z.endCol) return z;
  }
  return ZONES[ZONES.length - 1];
}

// ── Background rendering ─────────────────────────────────────────────────
// Draws parallax sky, clouds, distant landmarks, and zone-specific buildings.

export function drawBackground(ctx, camX, camY, canvasW, canvasH) {
  const zone = getZone(Math.floor((camX + canvasW / 2) / TILE_SIZE));

  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, '#4a90d9');
  grad.addColorStop(0.6, zone.sky);
  grad.addColorStop(1, '#c8e6f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Sun
  ctx.beginPath();
  ctx.arc(canvasW * 0.85, canvasH * 0.12, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#FFE066';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvasW * 0.85, canvasH * 0.12, 35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,224,102,0.3)';
  ctx.fill();

  // Clouds (parallax - move at 0.1× camera speed)
  drawClouds(ctx, camX, canvasW, canvasH);

  // Distant hills
  drawHills(ctx, camX, canvasW, canvasH);

  // Bristol landmarks in far background (0.2× parallax)
  drawLandmarks(ctx, camX, canvasW, canvasH);

  // Hot air balloons (decorative, slow float)
  drawBalloons(ctx, camX, canvasW, canvasH);
}

function drawClouds(ctx, camX, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const clouds = [
    { x: 100, y: 30, r: 25 },
    { x: 400, y: 50, r: 30 },
    { x: 800, y: 25, r: 22 },
    { x: 1300, y: 45, r: 35 },
    { x: 1800, y: 30, r: 28 },
    { x: 2400, y: 55, r: 32 },
    { x: 3200, y: 35, r: 26 },
    { x: 4000, y: 40, r: 30 },
    { x: 5000, y: 28, r: 24 },
    { x: 6000, y: 50, r: 34 },
    { x: 7000, y: 32, r: 28 },
    { x: 8000, y: 45, r: 30 },
  ];
  for (const c of clouds) {
    const sx = c.x - camX * 0.1;
    // Wrap clouds
    const wrapped = ((sx % (w + 200)) + w + 200) % (w + 200) - 100;
    drawCloud(ctx, wrapped, c.y, c.r);
  }
}

function drawCloud(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.8, y - r * 0.3, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x + r * 1.4, y, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x - r * 0.5, y + r * 0.1, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx, camX, w, h) {
  // Distant green hills at 0.15× parallax
  const hillY = h * 0.55;
  ctx.fillStyle = '#6aaa5d';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w + 60; x += 60) {
    const worldX = x + camX * 0.15;
    const y = hillY + Math.sin(worldX * 0.003) * 30 + Math.sin(worldX * 0.007) * 15;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Nearer hills at 0.25× parallax
  const hill2Y = h * 0.62;
  ctx.fillStyle = '#5a9950';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w + 60; x += 60) {
    const worldX = x + camX * 0.25;
    const y = hill2Y + Math.sin(worldX * 0.004 + 1) * 25 + Math.sin(worldX * 0.009) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawLandmarks(ctx, camX, w, h) {
  const parallax = 0.2;

  // Cabot Tower (visible when camera is in Redland/Cotham area)
  const cabotScreenX = 300 - camX * 0.05;
  if (cabotScreenX > -80 && cabotScreenX < w + 80) {
    drawCabotTower(ctx, cabotScreenX, h * 0.35);
  }

  // Clifton Suspension Bridge (visible in Clifton area)
  const bridgeScreenX = 1200 - camX * 0.08;
  if (bridgeScreenX > -500 && bridgeScreenX < w + 500) {
    drawSuspensionBridge(ctx, bridgeScreenX, h * 0.38, 400);
  }

  // Colourful terraced houses (background row at various points)
  drawTerracedHouses(ctx, camX, w, h);
}

function drawCabotTower(ctx, x, y) {
  // Simple tower silhouette
  ctx.fillStyle = '#8a7b6b';
  ctx.fillRect(x - 6, y - 50, 12, 50);
  ctx.fillRect(x - 10, y - 55, 20, 8);
  ctx.fillRect(x - 3, y - 62, 6, 10);
  // Battlement
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(x + i * 5 - 2, y - 58, 3, 4);
  }
}

function drawSuspensionBridge(ctx, x, y, span) {
  ctx.strokeStyle = '#7a6b5a';
  ctx.lineWidth = 3;
  // Towers
  ctx.fillStyle = '#8a7b6b';
  ctx.fillRect(x - span / 2 - 4, y - 60, 8, 65);
  ctx.fillRect(x + span / 2 - 4, y - 60, 8, 65);
  // Main cables (catenary)
  ctx.beginPath();
  ctx.moveTo(x - span / 2, y - 55);
  ctx.quadraticCurveTo(x, y - 15, x + span / 2, y - 55);
  ctx.stroke();
  // Deck
  ctx.fillStyle = '#9a8b7a';
  ctx.fillRect(x - span / 2, y, span, 4);
  // Suspender cables
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#7a6b5a';
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const cx = x - span / 2 + t * span;
    const cy = y - 55 + (1 - 4 * (t - 0.5) * (t - 0.5)) * 40;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, y);
    ctx.stroke();
  }
}

function drawTerracedHouses(ctx, camX, w, h) {
  // Row of colourful houses in the mid-background
  const parallax = 0.3;
  const baseY = h * 0.58;
  const houseW = 28;
  const colors = ['#e8a87c', '#d5c4a1', '#f2d7b6', '#c9b8a4', '#e6cba8',
                  '#d4a5a5', '#a8d8ea', '#f3e9dc', '#c5dedd', '#f7d794'];
  const roofColors = ['#7a5c4f', '#5c4033', '#8b6f4e', '#6b4f3b', '#5a4030'];

  const startCol = Math.floor((camX * parallax) / houseW) - 1;
  const endCol = startCol + Math.ceil(w / houseW) + 2;

  for (let i = startCol; i < endCol; i++) {
    const sx = i * houseW - camX * parallax;
    const houseH = 25 + (((i * 7 + 3) % 11) / 11) * 15;
    const color = colors[((i * 13 + 7) % colors.length + colors.length) % colors.length];
    const roofColor = roofColors[((i * 11 + 3) % roofColors.length + roofColors.length) % roofColors.length];

    // House body
    ctx.fillStyle = color;
    ctx.fillRect(sx, baseY - houseH, houseW - 2, houseH);

    // Roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(sx - 2, baseY - houseH);
    ctx.lineTo(sx + houseW / 2 - 1, baseY - houseH - 10);
    ctx.lineTo(sx + houseW, baseY - houseH);
    ctx.closePath();
    ctx.fill();

    // Windows
    ctx.fillStyle = '#ffeebb';
    const winY = baseY - houseH + 8;
    ctx.fillRect(sx + 4, winY, 6, 6);
    ctx.fillRect(sx + houseW - 12, winY, 6, 6);

    // Door
    ctx.fillStyle = roofColor;
    ctx.fillRect(sx + houseW / 2 - 4, baseY - 14, 8, 14);
  }
}

function drawBalloons(ctx, camX, w, h) {
  const time = Date.now() * 0.001;
  const balloons = [
    { x: 600,  y: 60,  color: '#ff6b6b', r: 16 },
    { x: 2200, y: 40,  color: '#ffd93d', r: 14 },
    { x: 4500, y: 55,  color: '#6bcb77', r: 15 },
    { x: 6800, y: 35,  color: '#4d96ff', r: 16 },
    { x: 8500, y: 50,  color: '#ff6b9d', r: 14 },
  ];

  for (const b of balloons) {
    const sx = b.x - camX * 0.12;
    const sy = b.y + Math.sin(time * 0.5 + b.x) * 8;
    if (sx < -40 || sx > w + 40) continue;

    // Envelope
    ctx.beginPath();
    ctx.arc(sx, sy, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(sx - b.r * 0.3, sy - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    // Basket
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy + b.r);
    ctx.lineTo(sx - 4, sy + b.r + 10);
    ctx.lineTo(sx + 4, sy + b.r + 10);
    ctx.lineTo(sx + 3, sy + b.r);
    ctx.stroke();
    // Strings
    ctx.beginPath();
    ctx.moveTo(sx - b.r * 0.4, sy + b.r * 0.7);
    ctx.lineTo(sx - 3, sy + b.r + 8);
    ctx.moveTo(sx + b.r * 0.4, sy + b.r * 0.7);
    ctx.lineTo(sx + 3, sy + b.r + 8);
    ctx.stroke();
  }
}

// ── Tile rendering ───────────────────────────────────────────────────────
export function drawTiles(ctx, camX, camY, canvasW, canvasH) {
  const startCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
  const endCol   = Math.min(LEVEL_W, Math.ceil((camX + canvasW) / TILE_SIZE) + 1);
  const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
  const endRow   = Math.min(LEVEL_H, Math.ceil((camY + canvasH) / TILE_SIZE) + 1);

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const t = grid[r][c];
      if (t === TILE.EMPTY) continue;
      const sx = c * TILE_SIZE - camX;
      const sy = r * TILE_SIZE - camY;
      drawTile(ctx, t, sx, sy, c, r);
    }
  }
}

function drawTile(ctx, tile, x, y, col, row) {
  const s = TILE_SIZE;

  switch (tile) {
    case TILE.GROUND: {
      // Check if this is a surface tile (air above)
      const above = row > 0 ? grid[row - 1][col] : TILE.EMPTY;
      if (above === TILE.EMPTY || above === TILE.SPAWN || above === TILE.FINISH || above === TILE.RAINBOW) {
        // Grass top
        ctx.fillStyle = '#5a9e4b';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#6dc35b';
        ctx.fillRect(x, y, s, 6);
        // Grass blades
        ctx.fillStyle = '#7ed96e';
        for (let i = 0; i < 4; i++) {
          const bx = x + 3 + i * 8 + ((col * 3 + i * 7) % 5);
          ctx.fillRect(bx, y - 2, 2, 4);
        }
      } else {
        // Underground
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#7a5c12';
        ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
        // Dirt specks
        ctx.fillStyle = '#6b4e10';
        const hash = (col * 17 + row * 31) % 7;
        ctx.fillRect(x + 5 + hash, y + 8, 3, 3);
        ctx.fillRect(x + 18 - hash, y + 20, 2, 2);
      }
      break;
    }
    case TILE.BRICK: {
      // Breakable brick - reddish
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = '#922b21';
      ctx.lineWidth = 1;
      // Brick pattern
      ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s / 2 - 1);
      ctx.strokeRect(x + 0.5, y + s / 2 + 0.5, s - 1, s / 2 - 1);
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y);
      ctx.lineTo(x + s / 2, y + s / 2);
      ctx.moveTo(x + s / 4, y + s / 2);
      ctx.lineTo(x + s / 4, y + s);
      ctx.moveTo(x + s * 3 / 4, y + s / 2);
      ctx.lineTo(x + s * 3 / 4, y + s);
      ctx.stroke();
      break;
    }
    case TILE.PLATFORM: {
      // Floating platform - wooden
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(x, y, s, 8);
      ctx.fillStyle = '#cd9b1d';
      ctx.fillRect(x, y, s, 4);
      // Wood grain
      ctx.fillStyle = '#a0760a';
      ctx.fillRect(x + 4, y + 2, 8, 1);
      ctx.fillRect(x + 18, y + 4, 10, 1);
      break;
    }
    case TILE.RAINBOW: {
      // Rainbow trampoline pad - drawn as a colourful arc
      drawRainbowTile(ctx, x, y, s);
      break;
    }
    default:
      break;
  }
}

function drawRainbowTile(ctx, x, y, s) {
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#00cc00', '#0066ff', '#8800ff'];
  const cx = x + s / 2;
  const cy = y + s;
  const baseR = s * 0.9;

  for (let i = 0; i < colors.length; i++) {
    const r = baseR - i * 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Sparkle effect
  const time = Date.now() * 0.003;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) {
    const angle = Math.PI + (i / 3) * Math.PI;
    const sparkleR = baseR - 8;
    const sx2 = cx + Math.cos(angle + time) * sparkleR;
    const sy2 = cy + Math.sin(angle + time) * sparkleR;
    ctx.beginPath();
    ctx.arc(sx2, sy2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
