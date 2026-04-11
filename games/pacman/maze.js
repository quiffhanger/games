// Maze definition + rendering.
//
// Characters:
//   # - wall
//   . - dot (pellet)
//   o - big dot (decorative in v1)
//   ' ' - empty floor (no pellet)
//   P - Pac-Man spawn (floor)
//   G - ghost spawn (floor)

const RAW_MAZE = [
  '#############',
  '#...........#',
  '#.##.###.##.#',
  '#.#.......#.#',
  '#.#.##.##.#.#',
  '#.....G.....#',
  '#.#.##.##.#.#',
  '#.#.......#.#',
  '#.##.###.##.#',
  '#.....P.....#',
  '#############',
];

export const COLS = RAW_MAZE[0].length;
export const ROWS = RAW_MAZE.length;

export const TILE = {
  WALL: 0,
  DOT: 1,
  BIG: 2,
  EMPTY: 3,
};

export function createMaze() {
  const grid = [];
  let pacSpawn = { col: 1, row: 1 };
  let ghostSpawn = { col: 1, row: 1 };
  let totalDots = 0;

  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS);
    for (let c = 0; c < COLS; c++) {
      const ch = RAW_MAZE[r][c];
      switch (ch) {
        case '#':
          row[c] = TILE.WALL;
          break;
        case '.':
          row[c] = TILE.DOT;
          totalDots++;
          break;
        case 'o':
          row[c] = TILE.BIG;
          totalDots++;
          break;
        case 'P':
          row[c] = TILE.EMPTY;
          pacSpawn = { col: c, row: r };
          break;
        case 'G':
          row[c] = TILE.EMPTY;
          ghostSpawn = { col: c, row: r };
          break;
        default:
          row[c] = TILE.EMPTY;
      }
    }
    grid.push(row);
  }

  return { grid, pacSpawn, ghostSpawn, totalDots };
}

export function isWall(grid, col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
  return grid[row][col] === TILE.WALL;
}

// Draws maze walls + remaining dots into ctx.
// `tile` is the pixel size of a cell.
export function drawMaze(ctx, grid, tile) {
  const colors = {
    wall: '#7ec8ff',
    wallFill: '#1b2a6b',
    dot: '#ffe082',
    big: '#ffecb3',
  };

  // Walls: draw each wall cell as a rounded filled square so the maze
  // looks chunky and friendly.
  ctx.lineJoin = 'round';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === TILE.WALL) {
        const x = c * tile;
        const y = r * tile;
        const pad = Math.max(1, tile * 0.08);
        const rad = tile * 0.35;
        roundedRect(
          ctx,
          x + pad,
          y + pad,
          tile - pad * 2,
          tile - pad * 2,
          rad
        );
        ctx.fillStyle = colors.wallFill;
        ctx.fill();
        ctx.lineWidth = Math.max(2, tile * 0.09);
        ctx.strokeStyle = colors.wall;
        ctx.stroke();
      }
    }
  }

  // Dots
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (t === TILE.DOT) {
        ctx.beginPath();
        ctx.arc(
          c * tile + tile / 2,
          r * tile + tile / 2,
          tile * 0.1,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = colors.dot;
        ctx.fill();
      } else if (t === TILE.BIG) {
        ctx.beginPath();
        ctx.arc(
          c * tile + tile / 2,
          r * tile + tile / 2,
          tile * 0.22,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = colors.big;
        ctx.fill();
      }
    }
  }
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
