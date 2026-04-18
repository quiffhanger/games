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
  constructor(col, row, speed = 4.5) {
    super(col, row, speed);
    this.mouthPhase = 0;
    this.invulnTimer = 0;
    this.dotsEaten = 0;
    this.score = 0;
    this.lives = 3;
  }

  queue(dir) {
    this.nextDir = dir;
  }

  update(dt, grid, onEatDot) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    if (this.dir !== DIR.NONE && this.progress < 1) {
      this.mouthPhase += dt * 8;
    }

    if (this.arrived()) {
      const t = grid[this.row][this.col];
      if (t === TILE.DOT || t === TILE.BIG) {
        grid[this.row][this.col] = TILE.EMPTY;
        this.dotsEaten++;
        if (onEatDot) onEatDot(t);
      }

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

    const flash =
      this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0;
    if (flash) {
      ctx.globalAlpha = 0.4;
    }

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
  constructor(col, row, color, speed = 2.2) {
    super(col, row, speed);
    this.color = color;
    this.bob = Math.random() * Math.PI * 2;
    // Frightened / edible state
    this.frightened = false;
    this.frightenedTimer = 0;
    // Eaten state: just eyes returning to spawn
    this.eaten = false;
    this.spawnCol = col;
    this.spawnRow = row;
  }

  frighten(duration) {
    if (this.eaten) return; // already eaten, heading to spawn
    const wasAlready = this.frightened;
    this.frightened = true;
    this.frightenedTimer = duration;
    if (!wasAlready) this.reverse();
  }

  // Pick a direction. AI modes:
  //   'random' — wander randomly (no-reverse preference)
  //   'chase'  — 70% toward pac-man, 30% random
  //   'flee'   — run away from pac-man
  pickDirection(grid, pacCol, pacRow, ai) {
    const options = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
    const valid = options.filter(
      (d) => !isWall(grid, this.col + d.dx, this.row + d.dy)
    );
    if (valid.length === 0) return DIR.NONE;
    const nonReverse = valid.filter((d) => !opposite(d, this.dir));
    const pool = nonReverse.length > 0 ? nonReverse : valid;

    // Eaten: head toward spawn
    if (this.eaten) {
      return this.dirToward(pool, this.spawnCol, this.spawnRow);
    }

    if (ai === 'flee') {
      return this.dirAway(pool, pacCol, pacRow);
    }

    if (ai === 'chase' && Math.random() < 0.7) {
      return this.dirToward(pool, pacCol, pacRow);
    }

    // Random
    return pool[Math.floor(Math.random() * pool.length)];
  }

  dirToward(pool, targetCol, targetRow) {
    let best = pool[0];
    let bestDist = Infinity;
    for (const d of pool) {
      const nc = this.col + d.dx;
      const nr = this.row + d.dy;
      const dist = Math.abs(nc - targetCol) + Math.abs(nr - targetRow);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  dirAway(pool, targetCol, targetRow) {
    let best = pool[0];
    let bestDist = -Infinity;
    for (const d of pool) {
      const nc = this.col + d.dx;
      const nr = this.row + d.dy;
      const dist = Math.abs(nc - targetCol) + Math.abs(nr - targetRow);
      if (dist > bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  update(dt, grid, pacCol, pacRow, ai, frightenedFlees) {
    this.bob += dt * 4;

    // Tick down frightened timer
    if (this.frightened) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightened = false;
        this.frightenedTimer = 0;
      }
    }

    // Eaten: fast travel back to spawn
    if (this.eaten) {
      if (this.arrived()) {
        if (this.col === this.spawnCol && this.row === this.spawnRow) {
          this.eaten = false;
          return;
        }
        const next = this.pickDirection(grid, pacCol, pacRow, 'random');
        if (next !== DIR.NONE) this.tryStartMove(grid, next);
      }
      if (!this.arrived()) {
        this.progress += dt * this.tilesPerSec * 2.5;
        if (this.progress >= 1) {
          this.progress = 1;
          this.col = this.tcol;
          this.row = this.trow;
        }
      }
      return;
    }

    // Determine effective AI for this tick
    const effectiveAI =
      this.frightened && frightenedFlees ? 'flee' : ai;

    if (this.arrived()) {
      const next = this.pickDirection(grid, pacCol, pacRow, effectiveAI);
      if (next !== DIR.NONE) {
        this.tryStartMove(grid, next);
      }
    }

    if (!this.arrived()) {
      const speed = this.frightened
        ? this.tilesPerSec * 0.55
        : this.tilesPerSec;
      this.progress += dt * speed;
      if (this.progress >= 1) {
        this.progress = 1;
        this.col = this.tcol;
        this.row = this.trow;
      }
    }
  }

  reverse() {
    const { col, row, tcol, trow, progress } = this;
    this.col = tcol;
    this.row = trow;
    this.tcol = col;
    this.trow = row;
    this.progress = 1 - progress;
    this.dir = { dx: -this.dir.dx, dy: -this.dir.dy, name: 'rev' };
  }

  draw(ctx, tile) {
    // Eaten: just the eyes floating back to spawn
    if (this.eaten) {
      this._drawEyes(ctx, tile, false);
      return;
    }

    const { x, y } = this.pixelCenter(tile);
    const r = tile * 0.42;
    const bobY = Math.sin(this.bob) * r * 0.05;

    // Body: rounded top, wavy bottom
    ctx.beginPath();
    ctx.arc(x, y + bobY, r, Math.PI, 0, false);
    ctx.lineTo(x + r, y + r + bobY);
    const waves = 4;
    for (let i = 0; i < waves; i++) {
      const wx = x + r - ((i + 0.5) / waves) * (r * 2);
      const wy = y + r + bobY - (i % 2 === 0 ? r * 0.2 : 0);
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(x - r, y + r + bobY);
    ctx.closePath();

    // Colour: blue when frightened, flashing blue/white when expiring
    if (this.frightened) {
      const flashing = this.frightenedTimer < 2;
      const white = flashing && Math.floor(this.frightenedTimer * 4) % 2 === 0;
      ctx.fillStyle = white ? '#ffffff' : '#2244dd';
      ctx.fill();

      // Scared face: simple dot eyes + wavy mouth
      const eyeColor = white ? '#2244dd' : '#ffffff';
      const eyeR = r * 0.12;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(x + side * r * 0.3, y - r * 0.15 + bobY, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = eyeColor;
        ctx.fill();
      }
      ctx.beginPath();
      const mouthY = y + r * 0.25 + bobY;
      ctx.moveTo(x - r * 0.35, mouthY);
      for (let i = 1; i <= 4; i++) {
        const mx = x - r * 0.35 + i * (r * 0.7 / 4);
        const my = mouthY + (i % 2 === 0 ? 0 : -r * 0.12);
        ctx.lineTo(mx, my);
      }
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.fill();
      this._drawEyes(ctx, tile, true);
    }
  }

  _drawEyes(ctx, tile, withBob) {
    const { x, y } = this.pixelCenter(tile);
    const r = tile * 0.42;
    const bobY = withBob ? Math.sin(this.bob) * r * 0.05 : 0;
    const eyeR = this.eaten ? r * 0.28 : r * 0.22;
    const pupilR = this.eaten ? r * 0.14 : r * 0.1;

    for (const side of [-1, 1]) {
      const ex = x + side * r * 0.35;
      const ey = y - r * 0.1 + bobY;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      const lx = ex + this.dir.dx * pupilR * 0.8;
      const ly = ey + this.dir.dy * pupilR * 0.8;
      ctx.beginPath();
      ctx.arc(lx, ly, pupilR, 0, Math.PI * 2);
      ctx.fillStyle = '#1b2a6b';
      ctx.fill();
    }
  }
}
