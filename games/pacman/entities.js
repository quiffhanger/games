// Pac-Man and ghost entities.
//
// Movement model: tile-based. Each entity has an integer (col, row) and a
// target tile (tcol, trow) it's moving toward, with a progress value 0..1.
// When progress hits 1 it arrives at the target. At that point we decide the
// next target (either nextDir if valid, or keep going in current dir).

import { isWall, TILE } from './maze.js';

export const DIR = {
  NONE: { dx: 0, dy: 0, name: 'none' },
  UP: { dx: 0, dy: -1, name: 'up' },
  DOWN: { dx: 0, dy: 1, name: 'down' },
  LEFT: { dx: -1, dy: 0, name: 'left' },
  RIGHT: { dx: 1, dy: 0, name: 'right' },
};

export function dirFromName(name) {
  switch (name) {
    case 'up':
      return DIR.UP;
    case 'down':
      return DIR.DOWN;
    case 'left':
      return DIR.LEFT;
    case 'right':
      return DIR.RIGHT;
    default:
      return DIR.NONE;
  }
}

function opposite(a, b) {
  return a.dx === -b.dx && a.dy === -b.dy && (a.dx !== 0 || a.dy !== 0);
}

class Entity {
  constructor(col, row, tilesPerSec) {
    this.col = col;
    this.row = row;
    this.tcol = col;
    this.trow = row;
    this.progress = 1; // 1 = arrived
    this.dir = DIR.NONE;
    this.nextDir = DIR.NONE;
    this.tilesPerSec = tilesPerSec;
  }

  // World pixel center (for rendering + collision).
  pixelCenter(tile) {
    const interpCol = this.col + (this.tcol - this.col) * this.progress;
    const interpRow = this.row + (this.trow - this.row) * this.progress;
    return {
      x: interpCol * tile + tile / 2,
      y: interpRow * tile + tile / 2,
    };
  }

  arrived() {
    return this.progress >= 1;
  }

  tryStartMove(grid, dir) {
    if (dir === DIR.NONE) return false;
    const nc = this.col + dir.dx;
    const nr = this.row + dir.dy;
    if (isWall(grid, nc, nr)) return false;
    this.tcol = nc;
    this.trow = nr;
    this.progress = 0;
    this.dir = dir;
    return true;
  }
}

export class PacMan extends Entity {
  constructor(col, row) {
    super(col, row, 4.5); // tiles per second
    this.mouthPhase = 0;
    this.invulnTimer = 0;
    this.dotsEaten = 0;
  }

  queue(dir) {
    this.nextDir = dir;
  }

  update(dt, grid, onEatDot) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    // Mouth animation
    if (this.dir !== DIR.NONE && this.progress < 1) {
      this.mouthPhase += dt * 8;
    }

    if (this.arrived()) {
      // Consume any dot on this tile
      const t = grid[this.row][this.col];
      if (t === TILE.DOT || t === TILE.BIG) {
        grid[this.row][this.col] = TILE.EMPTY;
        this.dotsEaten++;
        if (onEatDot) onEatDot(t);
      }

      // Try nextDir first, then keep going in current dir.
      if (this.nextDir !== DIR.NONE && this.tryStartMove(grid, this.nextDir)) {
        // consumed
      } else if (this.dir !== DIR.NONE) {
        this.tryStartMove(grid, this.dir);
      }
    }

    if (!this.arrived()) {
      this.progress += dt * this.tilesPerSec;
      if (this.progress >= 1) {
        this.progress = 1;
        this.col = this.tcol;
        this.row = this.trow;
      }
    }
  }

  bounce() {
    // Cancel current move, return to last tile, brief invuln.
    this.tcol = this.col;
    this.trow = this.row;
    this.progress = 1;
    this.dir = DIR.NONE;
    this.nextDir = DIR.NONE;
    this.invulnTimer = 0.9;
  }

  draw(ctx, tile) {
    const { x, y } = this.pixelCenter(tile);
    const r = tile * 0.42;

    // Flash when invulnerable.
    const flash =
      this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0;
    if (flash) {
      ctx.globalAlpha = 0.4;
    }

    // Mouth angle 0..0.6 rad
    const mouth = 0.15 + (Math.sin(this.mouthPhase) * 0.5 + 0.5) * 0.55;
    let facing = 0;
    if (this.dir === DIR.RIGHT) facing = 0;
    else if (this.dir === DIR.LEFT) facing = Math.PI;
    else if (this.dir === DIR.UP) facing = -Math.PI / 2;
    else if (this.dir === DIR.DOWN) facing = Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, facing + mouth, facing + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fillStyle = '#ffd600';
    ctx.fill();
    ctx.lineWidth = Math.max(1, tile * 0.04);
    ctx.strokeStyle = '#c79a00';
    ctx.stroke();

    // Eye
    const eyeOffset = { x: 0, y: -r * 0.45 };
    if (this.dir === DIR.LEFT) eyeOffset.x = -r * 0.1;
    if (this.dir === DIR.RIGHT) eyeOffset.x = r * 0.1;
    ctx.beginPath();
    ctx.arc(x + eyeOffset.x, y + eyeOffset.y, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

export class Ghost extends Entity {
  constructor(col, row, color) {
    super(col, row, 2.2);
    this.color = color;
    this.bob = Math.random() * Math.PI * 2;
  }

  pickDirection(grid) {
    // Random valid direction, preferring not to reverse unless it's the only
    // option. Gives a gently wandering feel.
    const options = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
    const valid = options.filter(
      (d) => !isWall(grid, this.col + d.dx, this.row + d.dy)
    );
    if (valid.length === 0) return DIR.NONE;
    const nonReverse = valid.filter((d) => !opposite(d, this.dir));
    const pool = nonReverse.length > 0 ? nonReverse : valid;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  update(dt, grid) {
    this.bob += dt * 4;

    if (this.arrived()) {
      const next = this.pickDirection(grid);
      if (next !== DIR.NONE) {
        this.tryStartMove(grid, next);
      }
    }

    if (!this.arrived()) {
      this.progress += dt * this.tilesPerSec;
      if (this.progress >= 1) {
        this.progress = 1;
        this.col = this.tcol;
        this.row = this.trow;
      }
    }
  }

  reverse() {
    // Swap current and target tiles so the ghost heads back.
    const { col, row, tcol, trow, progress } = this;
    this.col = tcol;
    this.row = trow;
    this.tcol = col;
    this.trow = row;
    this.progress = 1 - progress;
    this.dir = { dx: -this.dir.dx, dy: -this.dir.dy, name: 'rev' };
  }

  draw(ctx, tile) {
    const { x, y } = this.pixelCenter(tile);
    const r = tile * 0.42;
    const bobY = Math.sin(this.bob) * r * 0.05;

    // Body: rounded top, wavy bottom
    ctx.beginPath();
    ctx.arc(x, y + bobY, r, Math.PI, 0, false);
    ctx.lineTo(x + r, y + r + bobY);
    // wavy bottom
    const waves = 4;
    for (let i = 0; i < waves; i++) {
      const wx = x + r - ((i + 0.5) / waves) * (r * 2);
      const wy = y + r + bobY - (i % 2 === 0 ? r * 0.2 : 0);
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(x - r, y + r + bobY);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Eyes
    const eyeR = r * 0.22;
    const pupilR = r * 0.1;
    for (const side of [-1, 1]) {
      const ex = x + side * r * 0.35;
      const ey = y - r * 0.1 + bobY;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      // Look in the direction of travel.
      const lx = ex + this.dir.dx * pupilR * 0.8;
      const ly = ey + this.dir.dy * pupilR * 0.8;
      ctx.beginPath();
      ctx.arc(lx, ly, pupilR, 0, Math.PI * 2);
      ctx.fillStyle = '#1b2a6b';
      ctx.fill();
    }
  }
}
