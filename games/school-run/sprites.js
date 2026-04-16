// Sprite drawing for School Run.
// All sprites are pure canvas — no image assets.
// Characters are drawn based on the real kids' appearances:
//   Seb  — 4yo boy, short blond hair, blue eyes, blue t-shirt with colourful graphic, colourful patterned trousers
//   Isla — 7yo girl, taller/slim, long red hair, blue eyes, blue polka-dot sweater, blue polka-dot leggings, pink trainers

import { TILE_SIZE } from './level.js';

// ── Character drawing ────────────────────────────────────────────────────

export function drawPlayer(ctx, p, character, camX, camY) {
  const sx = p.x - camX;
  const sy = p.y - camY;

  // Invuln flash
  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 8) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  // Shield glow
  if (p.shieldTimer > 0) {
    ctx.beginPath();
    ctx.arc(sx + p.w / 2, sy + p.h / 2, p.w * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.fill();
  }
  // Strength glow
  if (p.strongTimer > 0) {
    ctx.beginPath();
    ctx.arc(sx + p.w / 2, sy + p.h / 2, p.w * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76, 175, 80, 0.25)';
    ctx.fill();
  }

  ctx.save();
  // Flip for facing direction
  if (p.facing < 0) {
    ctx.translate(sx + p.w, sy);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(sx, sy);
  }

  // Walk bob
  const bob = p.onGround ? Math.sin(p.walkPhase) * 2 : 0;
  const legPhase = p.onGround ? Math.sin(p.walkPhase) : (p.vy < 0 ? 0.5 : -0.3);

  if (character === 'isla') {
    drawIsla(ctx, p.w, p.h, bob, legPhase, p.onGround);
  } else {
    drawSeb(ctx, p.w, p.h, bob, legPhase, p.onGround);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawSeb(ctx, w, h, bob, legPhase, onGround) {
  const cx = w / 2;

  // ── Legs (colourful patterned trousers) ──
  const legW = 7;
  const legH = 14;
  const legY = h - legH;
  const legSpread = legPhase * 3;

  // Left leg
  ctx.fillStyle = '#1a6b5a'; // dark teal base
  ctx.fillRect(cx - legW - 1 - legSpread, legY, legW, legH);
  // Pattern on trousers (colourful dino/camo-like)
  ctx.fillStyle = '#e8832a';
  ctx.fillRect(cx - legW + 1 - legSpread, legY + 3, 3, 3);
  ctx.fillStyle = '#3498db';
  ctx.fillRect(cx - legW + 1 - legSpread, legY + 8, 3, 2);

  // Right leg
  ctx.fillStyle = '#1a6b5a';
  ctx.fillRect(cx + 1 + legSpread, legY, legW, legH);
  ctx.fillStyle = '#e8832a';
  ctx.fillRect(cx + 3 + legSpread, legY + 2, 3, 3);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(cx + 3 + legSpread, legY + 7, 3, 3);

  // Shoes
  ctx.fillStyle = '#333';
  ctx.fillRect(cx - legW - 1 - legSpread, legY + legH - 3, legW + 1, 3);
  ctx.fillRect(cx + 1 + legSpread, legY + legH - 3, legW + 1, 3);

  // ── Body (blue t-shirt) ──
  const bodyY = legY - 12 + bob;
  ctx.fillStyle = '#2980b9';
  ctx.fillRect(cx - 10, bodyY, 20, 14);
  // Colourful graphic on shirt
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(cx - 5, bodyY + 3, 4, 4);
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(cx - 1, bodyY + 3, 4, 4);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(cx + 3, bodyY + 5, 3, 3);

  // ── Arms ──
  ctx.fillStyle = '#fdd9b5'; // skin
  const armY = bodyY + 3;
  const armSwing = legPhase * 2;
  ctx.fillRect(cx - 13, armY + armSwing, 4, 10);
  ctx.fillRect(cx + 9, armY - armSwing, 4, 10);

  // ── Head ──
  const headY = bodyY - 11 + bob;
  // Face
  ctx.fillStyle = '#fdd9b5';
  ctx.beginPath();
  ctx.arc(cx, headY + 5, 8, 0, Math.PI * 2);
  ctx.fill();

  // Hair (short blond)
  ctx.fillStyle = '#f0c75e';
  ctx.beginPath();
  ctx.arc(cx, headY + 3, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 8, headY + 2, 16, 4);
  // Fringe
  ctx.fillRect(cx - 7, headY - 1, 14, 3);

  // Eyes (blue)
  ctx.fillStyle = '#3498db';
  ctx.fillRect(cx - 4, headY + 4, 3, 3);
  ctx.fillRect(cx + 1, headY + 4, 3, 3);
  // Pupils
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(cx - 3, headY + 5, 2, 2);
  ctx.fillRect(cx + 2, headY + 5, 2, 2);

  // Smile
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, headY + 8, 3, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

function drawIsla(ctx, w, h, bob, legPhase, onGround) {
  const cx = w / 2;

  // ── Legs (blue polka-dot leggings) ──
  const legW = 6;
  const legH = 16;
  const legY = h - legH;
  const legSpread = legPhase * 3;

  // Left leg
  ctx.fillStyle = '#6b8fb5';
  ctx.fillRect(cx - legW - 1 - legSpread, legY, legW, legH);
  // Polka dots
  ctx.fillStyle = '#c8daf0';
  for (let dy = 2; dy < legH - 2; dy += 5) {
    ctx.beginPath();
    ctx.arc(cx - legW / 2 - 1 - legSpread, legY + dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Right leg
  ctx.fillStyle = '#6b8fb5';
  ctx.fillRect(cx + 1 + legSpread, legY, legW, legH);
  ctx.fillStyle = '#c8daf0';
  for (let dy = 4; dy < legH - 2; dy += 5) {
    ctx.beginPath();
    ctx.arc(cx + legW / 2 + 1 + legSpread, legY + dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pink trainers
  ctx.fillStyle = '#e891b0';
  ctx.fillRect(cx - legW - 1 - legSpread, legY + legH - 3, legW + 2, 3);
  ctx.fillRect(cx + 1 + legSpread, legY + legH - 3, legW + 2, 3);
  // Trainer detail
  ctx.fillStyle = '#d4769a';
  ctx.fillRect(cx - legW - legSpread, legY + legH - 2, legW, 1);
  ctx.fillRect(cx + 2 + legSpread, legY + legH - 2, legW, 1);

  // ── Body (blue polka-dot sweater) ──
  const bodyY = legY - 13 + bob;
  ctx.fillStyle = '#4a6fa5';
  ctx.fillRect(cx - 10, bodyY, 20, 15);
  // Polka dots on sweater
  ctx.fillStyle = '#c8daf0';
  const dotPositions = [[-5, 3], [2, 3], [-2, 8], [5, 7], [-6, 11], [3, 11]];
  for (const [dx, dy] of dotPositions) {
    ctx.beginPath();
    ctx.arc(cx + dx, bodyY + dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Arms ──
  ctx.fillStyle = '#4a6fa5'; // sweater sleeves
  const armY = bodyY + 2;
  const armSwing = legPhase * 2;
  ctx.fillRect(cx - 13, armY + armSwing, 4, 8);
  ctx.fillRect(cx + 9, armY - armSwing, 4, 8);
  // Hands
  ctx.fillStyle = '#fdd9b5';
  ctx.fillRect(cx - 13, armY + armSwing + 8, 4, 3);
  ctx.fillRect(cx + 9, armY - armSwing + 8, 4, 3);

  // ── Head ──
  const headY = bodyY - 12 + bob;
  // Face
  ctx.fillStyle = '#fdd9b5';
  ctx.beginPath();
  ctx.arc(cx, headY + 5, 8, 0, Math.PI * 2);
  ctx.fill();

  // Red hair - long, flowing
  ctx.fillStyle = '#c0392b';
  // Top of head
  ctx.beginPath();
  ctx.arc(cx, headY + 3, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 9, headY + 2, 18, 5);
  // Long hair flowing down sides
  ctx.fillRect(cx - 9, headY + 2, 4, 20);
  ctx.fillRect(cx + 6, headY + 2, 4, 20);
  // Hair tips (slight wave)
  ctx.fillStyle = '#a93226';
  ctx.fillRect(cx - 9, headY + 18, 4, 4);
  ctx.fillRect(cx + 6, headY + 18, 4, 4);

  // Eyes (blue)
  ctx.fillStyle = '#3498db';
  ctx.fillRect(cx - 4, headY + 4, 3, 3);
  ctx.fillRect(cx + 1, headY + 4, 3, 3);
  // Pupils
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(cx - 3, headY + 5, 2, 2);
  ctx.fillRect(cx + 2, headY + 5, 2, 2);

  // Smile
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, headY + 8, 3, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

// ── Enemy drawing (Minecraft-style blocky) ───────────────────────────────

export function drawEnemy(ctx, e, camX, camY) {
  const sx = e.x - camX;
  const sy = e.y - camY;

  if (e.dying) {
    // Death animation: shrink + fade
    const t = e.deathTimer / 0.5;
    ctx.globalAlpha = 1 - t;
    ctx.save();
    ctx.translate(sx + e.w / 2, sy + e.h);
    ctx.scale(1 - t * 0.5, 1 - t);
    ctx.translate(-(sx + e.w / 2), -(sy + e.h));
  }

  switch (e.type) {
    case 'zombie':   drawZombie(ctx, sx, sy, e); break;
    case 'creeper':  drawCreeper(ctx, sx, sy, e); break;
    case 'skeleton': drawSkeleton(ctx, sx, sy, e); break;
    case 'spider':   drawSpider(ctx, sx, sy, e); break;
  }

  if (e.dying) {
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function drawZombie(ctx, x, y, e) {
  const w = e.w, h = e.h;
  const bob = Math.sin(e.phase) * 1.5;

  // Body (teal-green tattered shirt)
  ctx.fillStyle = '#2e7d6a';
  ctx.fillRect(x + 3, y + h * 0.35 + bob, w - 6, h * 0.35);

  // Legs (dark blue blocky)
  ctx.fillStyle = '#2c3e6b';
  const legPhase = Math.sin(e.phase * 2) * 2;
  ctx.fillRect(x + 4 - legPhase, y + h * 0.65, 8, h * 0.35);
  ctx.fillRect(x + w - 12 + legPhase, y + h * 0.65, 8, h * 0.35);

  // Head (blocky green - Minecraft zombie style)
  ctx.fillStyle = '#5c8a5c';
  ctx.fillRect(x + 2, y + bob, w - 4, h * 0.38);

  // Dark patches on face
  ctx.fillStyle = '#4a7a4a';
  ctx.fillRect(x + 4, y + 4 + bob, 4, 4);
  ctx.fillRect(x + w - 8, y + 6 + bob, 4, 3);

  // Eyes (dark, sunken)
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x + 6, y + 6 + bob, 4, 4);
  ctx.fillRect(x + w - 10, y + 6 + bob, 4, 4);

  // Mouth (grim line)
  ctx.fillStyle = '#3d5c3d';
  ctx.fillRect(x + 7, y + 13 + bob, 10, 2);

  // Arms (outstretched in front — classic zombie)
  ctx.fillStyle = '#5c8a5c';
  const armDir = e.facing || 1;
  ctx.fillRect(
    armDir > 0 ? x + w - 2 : x - 8,
    y + h * 0.35 + bob + 2,
    10, 4
  );
}

function drawCreeper(ctx, x, y, e) {
  const w = e.w, h = e.h;

  // Flash when about to explode (hard mode)
  if (e.flashTimer > 0) {
    const flash = Math.floor(e.flashTimer * 6) % 2 === 0;
    if (flash) ctx.globalAlpha = 0.6;
  }

  // Body (green blocky)
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x + 2, y + h * 0.32, w - 4, h * 0.38);

  // Legs (4 short legs like Minecraft creeper)
  ctx.fillStyle = '#388e3c';
  const phase = Math.sin(e.phase * 2);
  ctx.fillRect(x + 3 + phase, y + h * 0.68, 6, h * 0.32);
  ctx.fillRect(x + w - 9 - phase, y + h * 0.68, 6, h * 0.32);

  // Head (square, green, iconic face)
  ctx.fillStyle = '#66bb6a';
  ctx.fillRect(x + 1, y, w - 2, h * 0.36);

  // Darker patches
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x + 3, y + 2, 5, 3);
  ctx.fillRect(x + w - 8, y + 3, 4, 3);

  // Creeper face (iconic)
  ctx.fillStyle = '#1a1a1a';
  // Eyes
  ctx.fillRect(x + 5, y + 4, 4, 4);
  ctx.fillRect(x + w - 9, y + 4, 4, 4);
  // Mouth (frown shape)
  ctx.fillRect(x + 8, y + 10, 6, 2);
  ctx.fillRect(x + 7, y + 12, 2, 2);
  ctx.fillRect(x + 13, y + 12, 2, 2);

  ctx.globalAlpha = 1;
}

function drawSkeleton(ctx, x, y, e) {
  const w = e.w, h = e.h;
  const bob = Math.sin(e.phase * 1.5) * 1;

  // Body (grey/white ribcage look)
  ctx.fillStyle = '#bdc3c7';
  ctx.fillRect(x + 4, y + h * 0.35 + bob, w - 8, h * 0.3);
  // Ribs
  ctx.fillStyle = '#95a5a6';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 6, y + h * 0.38 + i * 4 + bob, w - 12, 1);
  }

  // Legs (bony)
  const legPhase = Math.sin(e.phase * 2.5) * 2;
  ctx.fillStyle = '#bdc3c7';
  ctx.fillRect(x + 6 - legPhase, y + h * 0.62, 5, h * 0.38);
  ctx.fillRect(x + w - 11 + legPhase, y + h * 0.62, 5, h * 0.38);
  // Knee joints
  ctx.fillStyle = '#95a5a6';
  ctx.fillRect(x + 5 - legPhase, y + h * 0.78, 7, 2);
  ctx.fillRect(x + w - 12 + legPhase, y + h * 0.78, 7, 2);

  // Head (skull)
  ctx.fillStyle = '#ecf0f1';
  ctx.fillRect(x + 2, y + bob, w - 4, h * 0.36);

  // Eye sockets (dark)
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(x + 5, y + 5 + bob, 5, 5);
  ctx.fillRect(x + w - 10, y + 5 + bob, 5, 5);

  // Nose
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(x + w / 2 - 1, y + 11 + bob, 3, 2);

  // Teeth
  ctx.fillStyle = '#ecf0f1';
  ctx.fillRect(x + 6, y + 14 + bob, 3, 2);
  ctx.fillRect(x + 10, y + 14 + bob, 3, 2);
  ctx.fillRect(x + w - 9, y + 14 + bob, 3, 2);
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(x + 9, y + 14 + bob, 1, 2);
  ctx.fillRect(x + 13, y + 14 + bob, 1, 2);

  // Arms
  ctx.fillStyle = '#bdc3c7';
  ctx.fillRect(x - 1, y + h * 0.36 + bob, 4, 10);
  ctx.fillRect(x + w - 3, y + h * 0.36 + bob, 4, 10);
}

function drawSpider(ctx, x, y, e) {
  const w = e.w, h = e.h;
  const phase = e.phase;

  // Body (two segments like Minecraft spider)
  ctx.fillStyle = '#4a3728';
  // Abdomen (back)
  ctx.fillRect(x + 2, y + h * 0.3, w * 0.5, h * 0.5);
  // Head (front)
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + w * 0.4, y + h * 0.25, w * 0.55, h * 0.45);

  // Eyes (red, multiple — spidery)
  ctx.fillStyle = '#e53935';
  ctx.fillRect(x + w * 0.55, y + h * 0.3, 3, 3);
  ctx.fillRect(x + w * 0.72, y + h * 0.3, 3, 3);
  ctx.fillStyle = '#c62828';
  ctx.fillRect(x + w * 0.5, y + h * 0.4, 2, 2);
  ctx.fillRect(x + w * 0.78, y + h * 0.4, 2, 2);

  // Legs (4 per side, animated)
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const legOffset = Math.sin(phase * 3 + i * 1.2) * 3;
    const baseX = x + 4 + i * (w * 0.2);
    const baseY2 = y + h * 0.5;
    // Top legs
    ctx.beginPath();
    ctx.moveTo(baseX, baseY2);
    ctx.lineTo(baseX - 6 + legOffset, baseY2 - 8);
    ctx.lineTo(baseX - 4 + legOffset, baseY2 + 8);
    ctx.stroke();
    // Bottom legs
    ctx.beginPath();
    ctx.moveTo(baseX, baseY2);
    ctx.lineTo(baseX + 6 - legOffset, baseY2 - 6);
    ctx.lineTo(baseX + 4 - legOffset, baseY2 + 10);
    ctx.stroke();
  }
}

// ── Powerup / Item drawing ───────────────────────────────────────────────

export function drawItem(ctx, item, camX, camY) {
  const sx = item.x - camX;
  const sy = item.y - camY;
  if (item.collected) return;

  const bob = Math.sin(Date.now() * 0.004 + item.x) * 3;
  const y = sy + bob;

  switch (item.type) {
    case 'broccoli': drawBroccoli(ctx, sx, y, item.w); break;
    case 'carrot':   drawCarrot(ctx, sx, y, item.w); break;
    case 'apple':    drawApple(ctx, sx, y, item.w); break;
    case 'banana':   drawBanana(ctx, sx, y, item.w); break;
    case 'grapes':   drawGrapes(ctx, sx, y, item.w); break;
  }

  // Glow behind powerup
  ctx.beginPath();
  ctx.arc(sx + item.w / 2, y + item.h / 2, item.w * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,200,0.15)';
  ctx.fill();
}

function drawBroccoli(ctx, x, y, s) {
  // Stalk
  ctx.fillStyle = '#7cb342';
  ctx.fillRect(x + s * 0.4, y + s * 0.5, s * 0.2, s * 0.5);
  // Florets (clusters of green circles)
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.arc(x + s * 0.5, y + s * 0.3, s * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#43a047';
  ctx.beginPath();
  ctx.arc(x + s * 0.35, y + s * 0.35, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s * 0.65, y + s * 0.35, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(x + s * 0.5, y + s * 0.2, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  // 💪 icon hint
  ctx.fillStyle = '#fff';
  ctx.font = `${s * 0.3}px sans-serif`;
  ctx.fillText('💪', x + s * 0.05, y + s * 0.95);
}

function drawCarrot(ctx, x, y, s) {
  // Carrot body (orange triangle-ish)
  ctx.fillStyle = '#ff9800';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y + s * 0.25);
  ctx.lineTo(x + s * 0.7, y + s * 0.25);
  ctx.lineTo(x + s * 0.5, y + s * 0.95);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#ffb74d';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.38, y + s * 0.3);
  ctx.lineTo(x + s * 0.55, y + s * 0.3);
  ctx.lineTo(x + s * 0.48, y + s * 0.7);
  ctx.closePath();
  ctx.fill();
  // Green top
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x + s * 0.35, y + s * 0.1, s * 0.08, s * 0.2);
  ctx.fillRect(x + s * 0.48, y + s * 0.05, s * 0.08, s * 0.25);
  ctx.fillRect(x + s * 0.58, y + s * 0.1, s * 0.08, s * 0.2);
}

function drawApple(ctx, x, y, s) {
  // Apple body
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(x + s * 0.5, y + s * 0.55, s * 0.35, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#ef5350';
  ctx.beginPath();
  ctx.arc(x + s * 0.4, y + s * 0.45, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  // Stem
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + s * 0.47, y + s * 0.15, s * 0.06, s * 0.15);
  // Leaf
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.ellipse(x + s * 0.6, y + s * 0.2, s * 0.1, s * 0.06, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Heart icon (extra life)
  ctx.fillStyle = '#fff';
  ctx.font = `${s * 0.3}px sans-serif`;
  ctx.fillText('❤️', x + s * 0.05, y + s * 0.95);
}

function drawBanana(ctx, x, y, s) {
  // Banana curve
  ctx.fillStyle = '#fdd835';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.2, y + s * 0.3);
  ctx.quadraticCurveTo(x + s * 0.15, y + s * 0.8, x + s * 0.45, y + s * 0.9);
  ctx.quadraticCurveTo(x + s * 0.8, y + s * 0.85, x + s * 0.85, y + s * 0.4);
  ctx.quadraticCurveTo(x + s * 0.6, y + s * 0.6, x + s * 0.3, y + s * 0.35);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#ffee58';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y + s * 0.4);
  ctx.quadraticCurveTo(x + s * 0.4, y + s * 0.7, x + s * 0.55, y + s * 0.75);
  ctx.quadraticCurveTo(x + s * 0.65, y + s * 0.65, x + s * 0.7, y + s * 0.45);
  ctx.lineTo(x + s * 0.5, y + s * 0.55);
  ctx.closePath();
  ctx.fill();
  // Tip
  ctx.fillStyle = '#8d6e3f';
  ctx.fillRect(x + s * 0.18, y + s * 0.25, s * 0.08, s * 0.06);
  // Shield icon
  ctx.fillStyle = '#fff';
  ctx.font = `${s * 0.3}px sans-serif`;
  ctx.fillText('🛡️', x + s * 0.05, y + s * 0.2);
}

function drawGrapes(ctx, x, y, s) {
  ctx.fillStyle = '#7b1fa2';
  const positions = [
    [0.4, 0.3], [0.6, 0.3],
    [0.3, 0.45], [0.5, 0.45], [0.7, 0.45],
    [0.35, 0.6], [0.55, 0.6], [0.65, 0.6],
    [0.4, 0.75], [0.55, 0.75],
    [0.48, 0.88],
  ];
  for (const [px, py] of positions) {
    ctx.beginPath();
    ctx.arc(x + s * px, y + s * py, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  // Highlight on each grape
  ctx.fillStyle = '#ab47bc';
  for (const [px, py] of positions) {
    ctx.beginPath();
    ctx.arc(x + s * px - 1, y + s * py - 1, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  // Stem
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x + s * 0.47, y + s * 0.12, s * 0.06, s * 0.15);
  ctx.beginPath();
  ctx.ellipse(x + s * 0.58, y + s * 0.14, s * 0.08, s * 0.04, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Coin (gold star) ─────────────────────────────────────────────────────

export function drawCoin(ctx, coin, camX, camY) {
  if (coin.collected) return;
  const sx = coin.x - camX + coin.w / 2;
  const sy = coin.y - camY + coin.h / 2;
  const bob = Math.sin(Date.now() * 0.005 + coin.x * 0.1) * 2;
  const r = coin.w * 0.4;

  // Star shape
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const outerX = sx + Math.cos(angle) * r;
    const outerY = sy + bob + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);

    const innerAngle = angle + Math.PI / 5;
    const innerR = r * 0.45;
    ctx.lineTo(
      sx + Math.cos(innerAngle) * innerR,
      sy + bob + Math.sin(innerAngle) * innerR
    );
  }
  ctx.closePath();
  ctx.fill();

  // Shine
  ctx.fillStyle = '#ffec8b';
  ctx.beginPath();
  ctx.arc(sx - r * 0.2, sy + bob - r * 0.2, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

// ── Finish gate (school gate) ────────────────────────────────────────────

export function drawFinishGate(ctx, fx, fy, camX, camY) {
  const sx = fx - camX;
  const sy = fy - camY;
  const gateW = TILE_SIZE * 2;
  const gateH = TILE_SIZE * 3;

  // Pillars
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(sx - 6, sy - gateH, 12, gateH);
  ctx.fillRect(sx + gateW - 6, sy - gateH, 12, gateH);

  // Pillar caps
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(sx - 8, sy - gateH - 6, 16, 8);
  ctx.fillRect(sx + gateW - 8, sy - gateH - 6, 16, 8);

  // Arch
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(sx + gateW / 2, sy - gateH + 4, gateW / 2, Math.PI, 0);
  ctx.stroke();

  // "Clifton High" sign
  ctx.fillStyle = '#1a237e';
  ctx.fillRect(sx + 6, sy - gateH + 8, gateW - 12, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLIFTON HIGH', sx + gateW / 2, sy - gateH + 21);
  ctx.textAlign = 'start';

  // Gate bars
  ctx.strokeStyle = '#455a64';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    const bx = sx + i * (gateW / 5);
    ctx.beginPath();
    ctx.moveTo(bx, sy - gateH + 28);
    ctx.lineTo(bx, sy);
    ctx.stroke();
  }

  // Bell on top
  const bellX = sx + gateW / 2;
  const bellY = sy - gateH - 16;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(bellX, bellY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(bellX - 1, bellY - 10, 2, 8);
  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.arc(bellX, bellY + 3, 3, 0, Math.PI);
  ctx.fill();
}

// ── Rainbow trail particles ──────────────────────────────────────────────

const RAINBOW_COLORS = ['#ff0000', '#ff8800', '#ffff00', '#00cc00', '#0066ff', '#8800ff'];

export function drawRainbowTrail(ctx, particles, camX, camY) {
  for (const p of particles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = RAINBOW_COLORS[p.colorIdx % RAINBOW_COLORS.length];
    ctx.beginPath();
    ctx.arc(sx, sy, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Zone name banner ─────────────────────────────────────────────────────

export function drawZoneBanner(ctx, name, alpha, canvasW) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 10, canvasW, 36);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, canvasW / 2, 34);
  ctx.textAlign = 'start';
  ctx.globalAlpha = 1;
}

// ── Confetti (win celebration) ───────────────────────────────────────────

export function drawConfetti(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
  ctx.globalAlpha = 1;
}
