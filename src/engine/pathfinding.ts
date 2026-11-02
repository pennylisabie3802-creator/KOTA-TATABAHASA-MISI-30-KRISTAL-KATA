import { MapId, MapPortal } from '../types/game';
import { DynamicTileCollisionOptions, isTileSolid, WORLD_MAPS } from './maps';

export interface TileCoord {
  tx: number;
  ty: number;
}

export interface AStarPathOptions extends DynamicTileCollisionOptions {
  /**
   * Adds a small clearance micro-cost near solid walls/obstacles so the avatar naturally
   * routes down corridor centers instead of grazing collision corners. Defaults to `true`.
   */
  preferClearance?: boolean;
  /**
   * Allows planning a path out of `(startTx, startTy)` even if the starting tile just became
   * dynamically occupied or sits on a tight collision edge. Defaults to `true`.
   */
  allowStartEscape?: boolean;
}

const SQRT2 = Math.SQRT2;
const WALL_CLEARANCE_PENALTY = 0.055;
const TURN_CHANGE_PENALTY = 0.008;

const DIRECTIONS_8: ReadonlyArray<{ dx: number; dy: number; cost: number }> = [
  { dx: 0, dy: -1, cost: 1 },
  { dx: 1, dy: 0, cost: 1 },
  { dx: 0, dy: 1, cost: 1 },
  { dx: -1, dy: 0, cost: 1 },
  { dx: 1, dy: -1, cost: SQRT2 },
  { dx: 1, dy: 1, cost: SQRT2 },
  { dx: -1, dy: 1, cost: SQRT2 },
  { dx: -1, dy: -1, cost: SQRT2 },
];

const CARDINAL_4: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

/**
 * Fast Binary Min-Heap keyed by f-score (with g-score tie-breaking favoring progress).
 */
class BinaryMinHeap {
  private keys: number[] = [];
  private fScores: number[] = [];
  private gScores: number[] = [];

  get size(): number {
    return this.keys.length;
  }

  push(nodeKey: number, f: number, g: number): void {
    const idx = this.keys.length;
    this.keys.push(nodeKey);
    this.fScores.push(f);
    this.gScores.push(g);
    this.bubbleUp(idx);
  }

  pop(): number {
    const topKey = this.keys[0];
    const lastIdx = this.keys.length - 1;
    if (lastIdx === 0) {
      this.keys.pop();
      this.fScores.pop();
      this.gScores.pop();
      return topKey;
    }

    this.keys[0] = this.keys[lastIdx];
    this.fScores[0] = this.fScores[lastIdx];
    this.gScores[0] = this.gScores[lastIdx];
    this.keys.pop();
    this.fScores.pop();
    this.gScores.pop();
    this.sinkDown(0);
    return topKey;
  }

  private isHigherPriority(i: number, j: number): boolean {
    const fi = this.fScores[i];
    const fj = this.fScores[j];
    if (Math.abs(fi - fj) > 1e-9) return fi < fj;
    // Tie-break toward higher g-score (closer to goal) for fewer expansions
    return this.gScores[i] > this.gScores[j];
  }

  private swap(i: number, j: number): void {
    const tk = this.keys[i];
    this.keys[i] = this.keys[j];
    this.keys[j] = tk;

    const tf = this.fScores[i];
    this.fScores[i] = this.fScores[j];
    this.fScores[j] = tf;

    const tg = this.gScores[i];
    this.gScores[i] = this.gScores[j];
    this.gScores[j] = tg;
  }

  private bubbleUp(idx: number): void {
    let cur = idx;
    while (cur > 0) {
      const parent = (cur - 1) >> 1;
      if (!this.isHigherPriority(cur, parent)) break;
      this.swap(cur, parent);
      cur = parent;
    }
  }

  private sinkDown(idx: number): void {
    const len = this.keys.length;
    let cur = idx;
    while (true) {
      const left = (cur << 1) + 1;
      const right = left + 1;
      let smallest = cur;

      if (left < len && this.isHigherPriority(left, smallest)) {
        smallest = left;
      }
      if (right < len && this.isHigherPriority(right, smallest)) {
        smallest = right;
      }
      if (smallest === cur) break;
      this.swap(cur, smallest);
      cur = smallest;
    }
  }
}

/**
 * Admissible Octile heuristic with tiny cross-product tie-breaker for straight natural lines.
 */
function octileHeuristicWithTieBreak(
  ax: number,
  ay: number,
  goalX: number,
  goalY: number,
  startX: number,
  startY: number
): number {
  const dx = Math.abs(ax - goalX);
  const dy = Math.abs(ay - goalY);
  const base = dx + dy + (SQRT2 - 2) * Math.min(dx, dy);

  const dx1 = ax - goalX;
  const dy1 = ay - goalY;
  const dx2 = startX - goalX;
  const dy2 = startY - goalY;
  const cross = Math.abs(dx1 * dy2 - dx2 * dy1);
  return base + cross * 0.0004;
}

/**
 * Checks whether a tile coordinate is inside map bounds and walkable under optional
 * live dynamic entity positions (`options`).
 */
export function isTileWalkable(
  mapId: MapId,
  tx: number,
  ty: number,
  options?: DynamicTileCollisionOptions
): boolean {
  const map = WORLD_MAPS[mapId];
  if (!map) return false;
  if (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows) return false;
  return !isTileSolid(mapId, tx, ty, options);
}

/**
 * Resolves the nearest walkable tile around `(originTx, originTy)` if the avatar's center
 * momentarily rests on a solid border or newly-moved dynamic object.
 */
export function resolveNearestWalkableTile(
  mapId: MapId,
  originTx: number,
  originTy: number,
  options?: DynamicTileCollisionOptions,
  maxRadius = 2
): TileCoord | null {
  if (isTileWalkable(mapId, originTx, originTy, options)) {
    return { tx: originTx, ty: originTy };
  }

  for (let r = 1; r <= maxRadius; r++) {
    let best: TileCoord | null = null;
    let bestDistSq = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const candX = originTx + dx;
        const candY = originTy + dy;
        if (isTileWalkable(mapId, candX, candY, options)) {
          const dSq = dx * dx + dy * dy;
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            best = { tx: candX, ty: candY };
          }
        }
      }
    }
    if (best) return best;
  }

  return null;
}

/**
 * Validates in O(K) whether an existing A* waypoint path remains 100% collision-free AND
 * corner-clear against current dynamic map obstacles.
 */
export function isPathStillClear(
  mapId: MapId,
  startTx: number,
  startTy: number,
  path: ReadonlyArray<TileCoord>,
  options?: DynamicTileCollisionOptions
): boolean {
  let prevX = startTx;
  let prevY = startTy;

  for (let i = 0; i < path.length; i++) {
    const wp = path[i];
    if (!isTileWalkable(mapId, wp.tx, wp.ty, options)) {
      return false;
    }

    const dx = wp.tx - prevX;
    const dy = wp.ty - prevY;

    // If non-adjacent jump ever occurred, force replan
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      return false;
    }

    // Diagonal step requires BOTH orthogonal corner tiles to remain clear
    if (dx !== 0 && dy !== 0) {
      if (
        !isTileWalkable(mapId, prevX + dx, prevY, options) ||
        !isTileWalkable(mapId, prevX, prevY + dy, options)
      ) {
        return false;
      }
    }

    prevX = wp.tx;
    prevY = wp.ty;
  }

  return true;
}

/**
 * Optimized Binary Min-Heap A* Pathfinding over the 2D tilemap grid:
 * - O(log N) priority queue + lazy walkability cache (`Uint8Array`) for sub-millisecond dynamic replans.
 * - Avoids all solid static & live dynamic obstacles (buildings, rivers, trees, pedestals, active props, moving NPCs).
 * - Applies corridor-centering clearance micro-costs so the avatar steers safely away from tight wall corners.
 * - Enforces strict diagonal corner-cutting guards across both orthogonal neighbor tiles.
 */
export function findPathAStar(
  mapId: MapId,
  startTx: number,
  startTy: number,
  goalTx: number,
  goalTy: number,
  options?: AStarPathOptions
): TileCoord[] | null {
  const map = WORLD_MAPS[mapId];
  if (!map) return null;

  const { cols, rows } = map;
  if (
    startTx < 0 ||
    startTy < 0 ||
    startTx >= cols ||
    startTy >= rows ||
    goalTx < 0 ||
    goalTy < 0 ||
    goalTx >= cols ||
    goalTy >= rows
  ) {
    return null;
  }

  const preferClearance = options?.preferClearance !== false;
  const allowStartEscape = options?.allowStartEscape !== false;

  const totalTiles = cols * rows;
  // Walkability memo: 0 = unvisited, 1 = walkable, 2 = solid
  const walkCache = new Uint8Array(totalTiles);

  const checkWalkable = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
    const idx = y * cols + x;
    const cached = walkCache[idx];
    if (cached !== 0) return cached === 1;
    const ok = !isTileSolid(mapId, x, y, options);
    walkCache[idx] = ok ? 1 : 2;
    return ok;
  };

  // Destination itself must be walkable
  if (!checkWalkable(goalTx, goalTy)) {
    return null;
  }

  if (startTx === goalTx && startTy === goalTy) {
    return [];
  }

  if (!allowStartEscape && !checkWalkable(startTx, startTy)) {
    return null;
  }

  // Lazy wall-adjacency clearance penalty cache (-1 = uncomputed)
  const clearancePenalty = preferClearance ? new Float32Array(totalTiles).fill(-1) : null;
  const getClearanceCost = (x: number, y: number): number => {
    if (!clearancePenalty) return 0;
    // Do not penalize the goal tile itself when stepping next to an interactive NPC/object
    if (x === goalTx && y === goalTy) return 0;
    const idx = y * cols + x;
    const cached = clearancePenalty[idx];
    if (cached >= 0) return cached;

    let adjacentSolids = 0;
    for (let i = 0; i < 4; i++) {
      const cDir = CARDINAL_4[i];
      if (!checkWalkable(x + cDir.dx, y + cDir.dy)) {
        adjacentSolids++;
      }
    }
    const cost = adjacentSolids * WALL_CLEARANCE_PENALTY;
    clearancePenalty[idx] = cost;
    return cost;
  };

  const gScore = new Float64Array(totalTiles).fill(Infinity);
  const parentIdx = new Int32Array(totalTiles).fill(-1);
  const incomingDir = new Int8Array(totalTiles).fill(-1);
  const closed = new Uint8Array(totalTiles);

  const startKey = startTy * cols + startTx;
  const goalKey = goalTy * cols + goalTx;

  const openHeap = new BinaryMinHeap();
  gScore[startKey] = 0;
  openHeap.push(
    startKey,
    octileHeuristicWithTieBreak(startTx, startTy, goalTx, goalTy, startTx, startTy),
    0
  );

  const maxIterations = totalTiles * 4;
  let iterations = 0;

  while (openHeap.size > 0 && iterations < maxIterations) {
    iterations++;

    const curKey = openHeap.pop();
    if (closed[curKey] === 1) continue;
    closed[curKey] = 1;

    if (curKey === goalKey) {
      const path: TileCoord[] = [];
      let ptr = curKey;
      while (ptr !== startKey && ptr !== -1) {
        const py = Math.floor(ptr / cols);
        const px = ptr - py * cols;
        path.push({ tx: px, ty: py });
        ptr = parentIdx[ptr];
      }
      path.reverse();
      return path;
    }

    const curY = Math.floor(curKey / cols);
    const curX = curKey - curY * cols;
    const curG = gScore[curKey];
    const prevDir = incomingDir[curKey];

    for (let dIdx = 0; dIdx < DIRECTIONS_8.length; dIdx++) {
      const dir = DIRECTIONS_8[dIdx];
      const nx = curX + dir.dx;
      const ny = curY + dir.dy;

      if (!checkWalkable(nx, ny)) continue;

      // Strict corner-cutting guard for diagonal steps:
      // BOTH orthogonal neighbors must be walkable so the avatar's bounding box never clips corners
      if (dir.dx !== 0 && dir.dy !== 0) {
        if (!checkWalkable(curX + dir.dx, curY) || !checkWalkable(curX, curY + dir.dy)) {
          continue;
        }
      }

      const nKey = ny * cols + nx;
      if (closed[nKey] === 1) continue;

      const turnCost = prevDir !== -1 && prevDir !== dIdx ? TURN_CHANGE_PENALTY : 0;
      const tentativeG = curG + dir.cost + turnCost + getClearanceCost(nx, ny);

      if (tentativeG + 1e-9 < gScore[nKey]) {
        gScore[nKey] = tentativeG;
        parentIdx[nKey] = curKey;
        incomingDir[nKey] = dIdx;
        const h = octileHeuristicWithTieBreak(nx, ny, goalTx, goalTy, startTx, startTy);
        openHeap.push(nKey, tentativeG + h, tentativeG);
      }
    }
  }

  return null;
}

/**
 * Finds the shortest collision-safe A* path from `(startTx, startTy)` to ANY walkable
 * interaction tile surrounding a solid interactive object (NPC, quest object, sign, prop)
 * or standing on/adjacent to a multi-tile door/portal.
 */
export function findBestPathToTargetCandidates(
  mapId: MapId,
  startTx: number,
  startTy: number,
  candidates: ReadonlyArray<TileCoord>,
  options?: AStarPathOptions
): { destination: TileCoord; path: TileCoord[] } | null {
  const map = WORLD_MAPS[mapId];
  if (!map) return null;

  // Deduplicate candidate tiles while preserving priority order (front -> orthogonal -> diagonal)
  const seen = new Set<number>();
  const uniqueCandidates: TileCoord[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.tx < 0 || c.ty < 0 || c.tx >= map.cols || c.ty >= map.rows) continue;
    const k = c.ty * map.cols + c.tx;
    if (seen.has(k)) continue;
    seen.add(k);
    if (isTileWalkable(mapId, c.tx, c.ty, options)) {
      uniqueCandidates.push(c);
    }
  }

  if (uniqueCandidates.length === 0) return null;

  let bestResult: { destination: TileCoord; path: TileCoord[]; score: number } | null = null;

  for (let idx = 0; idx < uniqueCandidates.length; idx++) {
    const cand = uniqueCandidates[idx];
    const path = findPathAStar(mapId, startTx, startTy, cand.tx, cand.ty, options);
    if (!path) continue;

    let pathCost = idx * 0.03; // Slight preference for cardinal/front interaction tiles on ties
    let prevX = startTx;
    let prevY = startTy;
    for (const step of path) {
      pathCost += step.tx !== prevX && step.ty !== prevY ? SQRT2 : 1;
      prevX = step.tx;
      prevY = step.ty;
    }

    if (!bestResult || pathCost < bestResult.score) {
      bestResult = { destination: cand, path, score: pathCost };
    }
  }

  if (!bestResult) return null;
  return { destination: bestResult.destination, path: bestResult.path };
}

/**
 * Returns candidate tiles in interaction range around a single-tile solid entity
 * `(entityTx, entityTy)`. Prefers the tile in front (`ty + 1`), then sides/top, then diagonals.
 */
export function getInteractionNeighborTiles(entityTx: number, entityTy: number): TileCoord[] {
  return [
    { tx: entityTx, ty: entityTy + 1 },
    { tx: entityTx - 1, ty: entityTy },
    { tx: entityTx + 1, ty: entityTy },
    { tx: entityTx, ty: entityTy - 1 },
    { tx: entityTx - 1, ty: entityTy + 1 },
    { tx: entityTx + 1, ty: entityTy + 1 },
    { tx: entityTx - 1, ty: entityTy - 1 },
    { tx: entityTx + 1, ty: entityTy - 1 },
  ];
}

/**
 * Returns candidate tiles on and immediately adjacent to a door/portal threshold.
 */
export function getPortalCandidateTiles(portal: MapPortal): TileCoord[] {
  const tiles: TileCoord[] = [];
  for (let r = portal.tileY; r < portal.tileY + portal.heightTiles; r++) {
    for (let c = portal.tileX; c < portal.tileX + portal.widthTiles; c++) {
      tiles.push({ tx: c, ty: r });
    }
  }
  for (let r = portal.tileY; r < portal.tileY + portal.heightTiles; r++) {
    for (let c = portal.tileX; c < portal.tileX + portal.widthTiles; c++) {
      tiles.push(
        { tx: c, ty: r + 1 },
        { tx: c, ty: r - 1 },
        { tx: c - 1, ty: r },
        { tx: c + 1, ty: r }
      );
    }
  }
  return tiles;
}
