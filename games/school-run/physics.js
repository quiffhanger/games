// Platformer physics engine for School Run.
// Handles gravity, jumping, horizontal movement, and AABB tile collision.
// Includes coyote time and jump buffering for responsive controls.

import { TILE_SIZE, getTile, setTile, TILE, LEVEL_W, LEVEL_H } from './level.js';

// ── Constants ────────────────────────────────────────────────────────────
export const GRAVITY       = 1400;   // px/s²
export const MAX_FALL      = 700;    // terminal velocity px/s
export const JUMP_VELOCITY = -520;   // initial jump impulse
export const JUMP_CUT      = -160;   // velocity set when releasing jump early
export const MOVE_SPEED    = 260;    // horizontal px/s
export const MOVE_SPEED_FAST = 390;  // with carrot powerup
export const STOMP_BOUNCE  = -350;   // bounce after stomping an enemy
export const RAINBOW_BOUNCE = -780;  // big bounce from rainbow trampoline
const COYOTE_TIME = 0.09;           // seconds you can still jump after leaving ground

// ── Player state factory ─────────────────────────────────────────────────
export function createPlayer(x, y) {
  return {
    x, y,                // top-left of hitbox in world px
    w: 24, h: 30,        // hitbox size
    vx: 0, vy: 0,
    onGround: false,
    coyoteTimer: 0,      // time left where jump is still allowed after leaving ground
    facing: 1,           // 1 = right, -1 = left
    walkPhase: 0,
    // Powerup timers (seconds remaining, 0 = inactive)
    strongTimer: 0,      // broccoli
    speedTimer: 0,       // carrot
    shieldTimer: 0,      // banana
    doubleJumpTimer: 0,  // grapes
    hasDoubleJump: false, // consumed the air-jump yet?
    invulnTimer: 0,      // post-hit invulnerability
    lives: 3,
    score: 0,
    coins: 0,
    dead: false,
  };
}

// ── Update player physics for one frame ──────────────────────────────────
export function updatePlayer(p, dt, input, canDie) {
  if (p.dead) return;

  const speed = p.speedTimer > 0 ? MOVE_SPEED_FAST : MOVE_SPEED;

  // Horizontal
  if (input.left)       { p.vx = -speed; p.facing = -1; }
  else if (input.right) { p.vx =  speed; p.facing =  1; }
  else                  { p.vx = 0; }

  // Walk animation
  if (p.vx !== 0 && p.onGround) {
    p.walkPhase += Math.abs(p.vx) * dt * 0.04;
  } else if (p.onGround) {
    p.walkPhase = 0;
  }

  // Coyote time: track how long since we left the ground
  if (p.onGround) {
    p.coyoteTimer = COYOTE_TIME;
  } else {
    p.coyoteTimer -= dt;
  }

  const canJump = p.onGround || p.coyoteTimer > 0;

  // Jump (uses buffered jumpPressed from input)
  if (input.jumpPressed && canJump) {
    p.vy = JUMP_VELOCITY;
    p.onGround = false;
    p.coyoteTimer = 0; // consume coyote time
    p.hasDoubleJump = p.doubleJumpTimer > 0;
    input.consumeJump(); // consume the buffer so it doesn't re-trigger
  } else if (input.jumpPressed && p.hasDoubleJump && !p.onGround) {
    p.vy = JUMP_VELOCITY * 0.85;
    p.hasDoubleJump = false;
    input.consumeJump();
  }

  // Variable jump height: cutting jump short on release
  if (!input.jump && p.vy < JUMP_CUT && !p.onGround) {
    p.vy = JUMP_CUT;
  }

  // Gravity
  p.vy += GRAVITY * dt;
  if (p.vy > MAX_FALL) p.vy = MAX_FALL;

  // Tick powerup timers
  if (p.strongTimer > 0)     p.strongTimer     -= dt;
  if (p.speedTimer > 0)      p.speedTimer      -= dt;
  if (p.shieldTimer > 0)     p.shieldTimer     -= dt;
  if (p.doubleJumpTimer > 0) p.doubleJumpTimer -= dt;
  if (p.invulnTimer > 0)     p.invulnTimer     -= dt;

  // Move and collide
  moveAxis(p, 'x', p.vx * dt);
  moveAxis(p, 'y', p.vy * dt);

  // Fell off the bottom
  if (p.y > LEVEL_H * TILE_SIZE + 100) {
    if (canDie) {
      p.dead = true;
    } else {
      // Easy mode: respawn at last safe position above
      p.y = 0;
      p.vy = 0;
    }
  }

  // Clamp to level bounds (left)
  if (p.x < 0) { p.x = 0; p.vx = 0; }
}

// ── Axis-aligned movement with tile collision ────────────────────────────
function moveAxis(p, axis, delta) {
  if (axis === 'x') {
    p.x += delta;
    const left   = Math.floor(p.x / TILE_SIZE);
    const right  = Math.floor((p.x + p.w - 1) / TILE_SIZE);
    const top    = Math.floor(p.y / TILE_SIZE);
    const bottom = Math.floor((p.y + p.h - 1) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (isSolid(c, r)) {
          if (delta > 0) {
            p.x = c * TILE_SIZE - p.w;
          } else {
            p.x = (c + 1) * TILE_SIZE;
          }
          p.vx = 0;
          return;
        }
      }
    }
  } else {
    p.y += delta;
    const left   = Math.floor(p.x / TILE_SIZE);
    const right  = Math.floor((p.x + p.w - 1) / TILE_SIZE);
    const top    = Math.floor(p.y / TILE_SIZE);
    const bottom = Math.floor((p.y + p.h - 1) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (isSolid(c, r)) {
          if (delta > 0) {
            // Landing
            p.y = r * TILE_SIZE - p.h;
            p.vy = 0;
            p.onGround = true;
          } else {
            // Hit ceiling
            p.y = (r + 1) * TILE_SIZE;
            p.vy = 0;
            // Break bricks from below (Mario-style head smash)
            const hitTile = getTile(c, r);
            if (hitTile === TILE.BRICK) {
              setTile(c, r, TILE.EMPTY);
              if (p._onBreakBrick) p._onBreakBrick(c, r);
            }
          }
          return;
        }
      }
    }
    // If moving down and didn't collide, we're airborne
    if (delta > 0) p.onGround = false;
  }
}

function isSolid(col, row) {
  const t = getTile(col, row);
  return t === TILE.GROUND || t === TILE.BRICK || t === TILE.PLATFORM;
}

// ── AABB overlap test ────────────────────────────────────────────────────
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Is A landing on top of B? (A's bottom half overlapping B's top half)
export function stompCheck(a, b) {
  if (!overlaps(a, b)) return false;
  const aMid = a.y + a.h * 0.5;
  const bMid = b.y + b.h * 0.5;
  return aMid < bMid && a.vy > 0;
}
