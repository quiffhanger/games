// Pixel-art sprite renderer for Seb, Isla and the Minecraft-style baddies.
// Each sprite is an array of strings where each character maps to a palette
// colour (defined below). '.' is transparent.

const PALETTE = {
  '.': null,
  // Seb
  'H': '#f2cc5e', // blond hair
  'h': '#c6a13f', // blond hair shadow
  // Isla
  'R': '#c94a1b', // red/ginger hair
  'r': '#8a2f10', // red hair shadow
  // Skin / eyes / mouth
  'S': '#fbdcb4',
  's': '#d9ac81',
  'e': '#2b7bff', // blue eyes
  'p': '#f07a8a', // mouth
  // Isla's navy jumper with polka dots + leggings
  'N': '#1e2a55', // navy
  'n': '#121a3a', // navy shadow
  'D': '#ffffff', // dots on jumper
  'L': '#8ec8ff', // light-blue leggings
  'l': '#6cb0ea',
  'P': '#ff9ec4', // pink trainers
  // Seb's blue tee with octopus + dino trousers
  'B': '#1e7cff', // royal blue tee
  'b': '#1560c8',
  'O': '#6d4fb5', // octopus purple
  'o': '#8a6bd4', // octopus highlight
  'Y': '#ffd842',
  'T': '#2e6b3a', // dino trouser dark green
  't': '#21542b',
  'g': '#3b8a4c', // dino pattern green
  'y': '#f2b43a', // dino pattern orange
  'q': '#d94f4f', // dino pattern red
  'F': '#5a3d28', // dark trainers
  // Generic
  'W': '#ffffff',
  'K': '#111111',
  'G': '#8a8a8a',
  // Minecraft baddies
  'C': '#76b82a', // creeper green
  'c': '#4e7c18',
  'Z': '#4d7a4d', // zombie skin
  'z': '#324f32',
  'J': '#2b6bda', // zombie shirt
  'j': '#184a9c',
  'M': '#7a5a3a', // zombie trousers
  'm': '#4a331f',
  'X': '#cfd3d6', // skeleton bone
  'x': '#8e9397',
  // Pigeons / seagulls
  'V': '#e6e6e6',
  'v': '#a0a0a0',
  'k': '#2a2a2a',
  'f': '#ffa726', // beak / feet
};

export const SPRITES = {
  // ---- Seb (4yo): short blond hair, blue octopus tee, dino trousers ----
  seb_idle: [
    '....HHHHHH..',
    '...HHHHHHHH.',
    '..HhHHHHHHHh',
    '..HSSSSSSSSh',
    '..SSeWSSWeSS',
    '..SSSSSSSSSS',
    '..SSSSppSSSs',
    '...sSSSSSSs.',
    '...BBBBBBBB.',
    '..BBoOOOOoBB',
    '..BBObOOobBB',
    '..BBoOOOOoBB',
    '..BBBBBBBBBB',
    '.SBBBBBBBBBS',
    '.SBBBBBBBBBS',
    '..TTgTyTqTT.',
    '..TTTgTTTTT.',
    '..TTqTTgTTT.',
    '..TT......T.',
    '..TT....TTT.',
    '..FFF..FFFF.',
    '.FFFF..FFFF.',
  ],
  seb_walk: [
    '....HHHHHH..',
    '...HHHHHHHH.',
    '..HhHHHHHHHh',
    '..HSSSSSSSSh',
    '..SSeWSSWeSS',
    '..SSSSSSSSSS',
    '..SSSSppSSSs',
    '...sSSSSSSs.',
    '...BBBBBBBB.',
    '..BBoOOOOoBB',
    '..BBObOOobBB',
    '..BBoOOOOoBB',
    '..BBBBBBBBBB',
    '.SBBBBBBBBB.',
    '..BBBBBBBBBS',
    '..TTgTyTqTT.',
    '..TTTgTTTTT.',
    '..TTqTTgTTT.',
    '..TTT....TT.',
    '..TTT....TT.',
    '.FFFF....FFF',
    'FFFFF....FFF',
  ],
  seb_jump: [
    '....HHHHHH..',
    '...HHHHHHHH.',
    '..HhHHHHHHHh',
    '..HSSSSSSSSh',
    '..SSeWSSWeSS',
    '..SSSSSSSSSS',
    '..SSSSOOSSSs',
    '...sSSSSSSs.',
    'S..BBBBBBBB.',
    'SBBBoOOOOoBB',
    'SBBBObOOobBBS',
    '.BBBoOOOOoBBS',
    '..BBBBBBBBBB',
    '..BBBBBBBBBB',
    '..BBBBBBBBBB',
    '..TTgTyTqTT.',
    '..TTTgTTTTT.',
    '..TTqTTgTTT.',
    '..TT......T.',
    '..TT......T.',
    '..FFF....FFF',
    '..FFF....FFF',
  ],
  // ---- Isla (7yo): long red hair, navy dotty jumper, blue leggings ----
  isla_idle: [
    '...RRRRRRRR.',
    '..RRRRRRRRRR',
    '.RRRRrrrrRRR',
    '.RRSSSSSSSRR',
    '.RSSeWSSWeSR',
    '.RSSSSSSSSSR',
    '.RSSSSppSSSR',
    '..RsSSSSSSs.',
    '.RRRSSSSSRRR',
    '.RRRRSSSRRRr',
    '..NNNNNNNNN.',
    '.NNDNNNDNNNN',
    '.NNNDNNNNDNN',
    'SNNNNNDNNNNS',
    'SNDNNNNDNNNS',
    '.NNDNNDNNNNN',
    '.NNNNNNDNNDN',
    '.NNNNNNNNNN.',
    '.LlLLDLLDLL.',
    '.LLLDLLLLLL.',
    '.LDLLLLDLLL.',
    '.LLLLLLLLLL.',
    '.PPP....PPP.',
    'PPPP....PPPP',
  ],
  isla_walk: [
    '...RRRRRRRR.',
    '..RRRRRRRRRR',
    '.RRRRrrrrRRR',
    '.RRSSSSSSSRR',
    '.RSSeWSSWeSR',
    '.RSSSSSSSSSR',
    '.RSSSSppSSSR',
    '..RsSSSSSSs.',
    '.RRRSSSSSRRR',
    '.RRRRSSSRRRr',
    '..NNNNNNNNN.',
    '.NNDNNNDNNNN',
    '.NNNDNNNNDNN',
    'SNNNNNDNNNN.',
    '.NNNNNNDNNNS',
    '.NNDNNDNNNNN',
    '.NNNNNNDNNDN',
    '.NNNNNNNNNN.',
    '.LlLLDLLDLL.',
    '.LLLDLLLLLL.',
    '.LDLL..DLLL.',
    '.LLLL..LLLL.',
    'PPPP....PPPP',
    'PPPPP..PPPPP',
  ],
  isla_jump: [
    '...RRRRRRRR.',
    '..RRRRRRRRRR',
    '.RRRRrrrrRRR',
    '.RRSSSSSSSRR',
    '.RSSeWSSWeSR',
    '.RSSSSSSSSSR',
    '.RSSSSOOSSSR',
    '..RsSSSSSSs.',
    '.RRRSSSSSRRR',
    '.RRRRSSSRRRr',
    'S.NNNNNNNNN.S',
    'SSNNDNNNDNNNN',
    '.NNNDNNNNDNNSS',
    '.NNNNNDNNNNN',
    '.NDNNNNDNNNN',
    '.NNDNNDNNNNN',
    '.NNNNNNDNNDN',
    '.NNNNNNNNNN.',
    '.LlLLDLLDLL.',
    '.LLLDLLLLLL.',
    '.LDLLLLDLLL.',
    '.LLLLLLLLLL.',
    '.PPP....PPP.',
    '.PPP....PPP.',
  ],
  // ---- Enemies (Minecraft blocky style) ----
  creeper: [
    'CCCCCCCCCCCC',
    'CcCCCCCCCCcC',
    'CcCCCCCCCCcC',
    'CCKKCCCCKKCC',
    'CCKKCCCCKKCC',
    'CCCCCKKCCCCC',
    'CCCCKKKKCCCC',
    'CCCKKccKKCCC',
    'CCCKccccKCCC',
    'CCCKccccKCCC',
    'CCCCCCCCCCCC',
    'cCCCCCCCCCCc',
    'cCCCCCCCCCCc',
    'ccCCCCCCCCcc',
  ],
  zombie: [
    '.ZZZZZZZZZZ.',
    '.ZZZZZZZZZZ.',
    '.ZzZZZzZzZZ.',
    '.KKZZKKZKKZ.',
    '.ZZKKZZKKZZ.',
    '.ZZZZZZZZZZ.',
    '.ZzzKKKKzzZ.',
    '..ZZZZZZZZ..',
    '.JJJJJJJJJJ.',
    'ZJJjJJJjJJJZ',
    'ZJJJJJJJJJJZ',
    'ZJJJJJJJJJJZ',
    '.JJJJJJJJJJ.',
    '.MMMMMMMMMM.',
    '.MmMMMMMMmM.',
    '.MMMMMMMMMM.',
    '.MM......MM.',
    '.MM......MM.',
    '.KKK....KKK.',
    '.KKK....KKK.',
  ],
  skeleton: [
    '.XXXXXXXXXX.',
    '.XxXXXXXXxX.',
    '.XKKXXXXKKX.',
    '.XXXXKKXXXX.',
    '.XxXKKKKXxX.',
    '.XXXXXXXXXX.',
    '..XXKKKKXX..',
    '.XXXXXXXXXX.',
    'XXXXxxxxXXXX',
    'xXXXXXXXXXXx',
    '.XXxxxxxxXX.',
    '.XXXXXXXXXX.',
    '.XXxxxxxxXX.',
    '.XXXXXXXXXX.',
    '.XX......XX.',
    '.XX......XX.',
    '.XX......XX.',
    '.Xx......xX.',
    '.XX......XX.',
    '.XX......XX.',
  ],
  slime: [
    '...CCCCCC...',
    '..CCCCCCCC..',
    '.CCcccCcccC.',
    'CCcccccccccC',
    'CKKccccKKccC',
    'CKKccccKKccC',
    'CcccKKKKcccC',
    'CccccccccccC',
    '.CCccccccCC.',
    '..CCCCCCCC..',
  ],
  pigeon: [
    '.....VVV....',
    '....VVVVv...',
    '...VVVVvvk..',
    '..VVVVVvvvk.',
    '.VVvvvvvvvvk',
    'VVVvvvvvvvv.',
    '.VvvvvvvvvvV',
    '..vvvvvvvvvV',
    '...vvvvvvv..',
    '....ff.ff...',
  ],
  // Goal flag pole
  flag: [
    'FFFFFFF..',
    'FFFFFFF..',
    'FFFFFFFF.',
    'FWWWWWWW.',
    'FWKKKKWW.',
    'FFFFFFFF.',
    'FFFFFFF..',
    'FFFFFFF..',
    'FFFFFFF..',
    'K........',
    'K........',
    'K........',
    'K........',
    'K........',
    'K........',
    'K........',
    'K........',
    'K........',
  ],
};

// Convert a sprite into a cached offscreen canvas for fast drawing.
const cache = new Map();

function bakeSprite(name, scale, facing) {
  const key = `${name}@${scale}@${facing}`;
  if (cache.has(key)) return cache.get(key);
  const sprite = SPRITES[name];
  if (!sprite) return null;
  const rows = sprite.length;
  const cols = sprite[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = cols * scale;
  canvas.height = rows * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < rows; r++) {
    const line = sprite[r];
    for (let c = 0; c < cols; c++) {
      const col = PALETTE[line[c]];
      if (col) {
        ctx.fillStyle = col;
        const dx = facing < 0 ? (cols - 1 - c) * scale : c * scale;
        ctx.fillRect(dx, r * scale, scale, scale);
      }
    }
  }
  cache.set(key, canvas);
  return canvas;
}

export function drawSprite(ctx, name, x, y, scale = 3, facing = 1) {
  const img = bakeSprite(name, scale, facing);
  if (!img) return;
  ctx.drawImage(img, Math.round(x), Math.round(y));
}

export function getSpriteDims(name, scale = 3) {
  const sprite = SPRITES[name];
  if (!sprite) return { w: 0, h: 0 };
  return { w: sprite[0].length * scale, h: sprite.length * scale };
}

// ---- Fruit & veg power-up drawing (procedural, not pixel-art) -------------

export function drawPowerup(ctx, type, x, y, size, bob = 0) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2 + Math.sin(bob) * 3);
  const s = size / 2;
  switch (type) {
    case 'broccoli': {
      // stem
      ctx.fillStyle = '#c9d98a';
      ctx.fillRect(-s * 0.2, s * 0.1, s * 0.4, s * 0.7);
      // florets
      ctx.fillStyle = '#3b8a4c';
      circle(ctx, -s * 0.5, -s * 0.1, s * 0.45);
      circle(ctx, s * 0.5, -s * 0.1, s * 0.45);
      circle(ctx, 0, -s * 0.55, s * 0.5);
      circle(ctx, 0, -s * 0.05, s * 0.45);
      ctx.fillStyle = '#5ba961';
      circle(ctx, -s * 0.45, -s * 0.25, s * 0.2);
      circle(ctx, 0.1 * s, -s * 0.65, s * 0.2);
      break;
    }
    case 'carrot': {
      ctx.fillStyle = '#ff8f2b';
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.1);
      ctx.lineTo(s * 0.55, -s * 0.1);
      ctx.lineTo(0, s * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffb871';
      ctx.fillRect(-s * 0.35, s * 0.1, s * 0.1, s * 0.1);
      ctx.fillRect(s * 0.15, s * 0.3, s * 0.1, s * 0.1);
      ctx.fillStyle = '#3b8a4c';
      leaf(ctx, -s * 0.25, -s * 0.1);
      leaf(ctx, 0, -s * 0.25);
      leaf(ctx, s * 0.25, -s * 0.1);
      break;
    }
    case 'banana': {
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, -s * 0.1);
      ctx.quadraticCurveTo(0, s * 1.0, s * 0.7, -s * 0.3);
      ctx.quadraticCurveTo(s * 0.45, s * 0.2, -s * 0.1, s * 0.5);
      ctx.quadraticCurveTo(-s * 0.5, s * 0.3, -s * 0.7, -s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3d2a0f';
      ctx.fillRect(s * 0.55, -s * 0.35, s * 0.15, s * 0.1);
      break;
    }
    case 'strawberry': {
      ctx.fillStyle = '#e8314c';
      ctx.beginPath();
      ctx.moveTo(-s * 0.75, -s * 0.2);
      ctx.quadraticCurveTo(0, s * 1.0, s * 0.75, -s * 0.2);
      ctx.quadraticCurveTo(0, -s * 0.1, -s * 0.75, -s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffee88';
      for (let i = -2; i <= 2; i++) {
        ctx.fillRect(i * s * 0.25 - 1, s * 0.15 + (i & 1) * s * 0.1, 2, 2);
      }
      ctx.fillStyle = '#3b8a4c';
      leaf(ctx, -s * 0.3, -s * 0.25);
      leaf(ctx, 0, -s * 0.45);
      leaf(ctx, s * 0.3, -s * 0.25);
      break;
    }
    case 'apple': {
      ctx.fillStyle = '#e63946';
      circle(ctx, 0, s * 0.1, s * 0.8);
      ctx.fillStyle = '#ff7a7a';
      circle(ctx, -s * 0.3, -s * 0.15, s * 0.2);
      ctx.fillStyle = '#5a3d28';
      ctx.fillRect(-s * 0.05, -s * 0.6, s * 0.15, s * 0.25);
      ctx.fillStyle = '#3b8a4c';
      leaf(ctx, s * 0.15, -s * 0.5);
      break;
    }
    case 'blueberry': {
      ctx.fillStyle = '#3f5fb8';
      circle(ctx, -s * 0.35, s * 0.1, s * 0.45);
      circle(ctx, s * 0.3, s * 0.0, s * 0.45);
      circle(ctx, 0, s * 0.5, s * 0.4);
      ctx.fillStyle = '#6b8bd6';
      circle(ctx, -s * 0.45, -s * 0.05, s * 0.15);
      circle(ctx, s * 0.2, -s * 0.15, s * 0.15);
      break;
    }
    case 'star': {
      const spikes = 5;
      const outer = s * 0.85;
      const inner = s * 0.4;
      ctx.fillStyle = '#ffd600';
      ctx.strokeStyle = '#c89a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let rot = -Math.PI / 2;
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(rot) * outer, Math.sin(rot) * outer);
        rot += Math.PI / spikes;
        ctx.lineTo(Math.cos(rot) * inner, Math.sin(rot) * inner);
        rot += Math.PI / spikes;
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'chocolate': {
      ctx.fillStyle = '#5a3322';
      roundRect(ctx, -s * 0.7, -s * 0.5, s * 1.4, s * 1.0, 4);
      ctx.fill();
      ctx.fillStyle = '#7a4a30';
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          roundRect(ctx, -s * 0.55 + c * s * 0.4, -s * 0.35 + r * s * 0.4, s * 0.3, s * 0.3, 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'heart': {
      ctx.fillStyle = '#ff4f6d';
      ctx.beginPath();
      const hs = s * 0.9;
      ctx.moveTo(0, hs * 0.3);
      ctx.bezierCurveTo(hs, -hs * 0.5, hs * 0.5, -hs, 0, -hs * 0.3);
      ctx.bezierCurveTo(-hs * 0.5, -hs, -hs, -hs * 0.5, 0, hs * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffa3b4';
      circle(ctx, -hs * 0.3, -hs * 0.45, hs * 0.15);
      break;
    }
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function leaf(ctx, x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
}
