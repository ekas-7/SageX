/**
 * Shared math for 4×6 (or N×M) tiled map chunks: camera + which tiles intersect the viewport.
 * Used for rendering and for preloading the tiles that must be ready before we hide the loader.
 */
export function computeMapSize(args: {
  viewportWidth: number;
  viewTilesWide: number;
  aspectRatio: number;
  chunkRows: number;
  chunkCols: number;
}): { tileWidth: number; tileHeight: number; mapWidth: number; mapHeight: number } {
  const w = args.viewportWidth;
  const tileWidth = w > 0 ? w / args.viewTilesWide : 0;
  const tileHeight = tileWidth * args.aspectRatio;
  const mapWidth = tileWidth * args.chunkCols;
  const mapHeight = tileHeight * args.chunkRows;
  return { tileWidth, tileHeight, mapWidth, mapHeight };
}

export function computeCameraOffset(args: {
  viewportWidth: number;
  viewportHeight: number;
  mapWidth: number;
  mapHeight: number;
  positionPercent: { x: number; y: number };
}): { offsetX: number; offsetY: number } {
  const { positionPercent, viewportWidth, viewportHeight, mapWidth, mapHeight } = args;
  const playerX = (positionPercent.x / 100) * mapWidth;
  const playerY = (positionPercent.y / 100) * mapHeight;
  const unclampedOffsetX = viewportWidth / 2 - playerX;
  const unclampedOffsetY = viewportHeight / 2 - playerY;
  const minOffsetX = viewportWidth - mapWidth;
  const minOffsetY = viewportHeight - mapHeight;
  const offsetX = Math.min(0, Math.max(minOffsetX, unclampedOffsetX));
  const offsetY = Math.min(0, Math.max(minOffsetY, unclampedOffsetY));
  return { offsetX, offsetY };
}

/** 0-based row/col indices in the chunk grid, matching map page culling. */
export function getVisibleChunkIndices0(args: {
  tileWidth: number;
  tileHeight: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
  chunkRows: number;
  chunkCols: number;
}): { rowIndices: number[]; colIndices: number[] } {
  const {
    tileWidth: tw,
    tileHeight: th,
    offsetX: ox,
    offsetY: oy,
    viewportWidth: vw,
    viewportHeight: vh,
    chunkRows,
    chunkCols,
  } = args;
  if (!tw || !th) {
    return { rowIndices: [], colIndices: [] };
  }
  const colStart = Math.max(0, Math.floor(-ox / tw) - 1);
  const colEnd = Math.min(
    chunkCols - 1,
    Math.ceil((-ox + vw) / tw) + 1
  );
  const rowStart = Math.max(0, Math.floor(-oy / th) - 1);
  const rowEnd = Math.min(
    chunkRows - 1,
    Math.ceil((-oy + vh) / th) + 1
  );
  const colIndices = Array.from(
    { length: Math.max(0, colEnd - colStart + 1) },
    (_, i) => colStart + i
  );
  const rowIndices = Array.from(
    { length: Math.max(0, rowEnd - rowStart + 1) },
    (_, i) => rowStart + i
  );
  return { rowIndices, colIndices };
}

/** If the viewport is not ready, preload a 3×3 around the map center. */
export function getFallbackGridAroundCenter(args: {
  chunkRows: number;
  chunkCols: number;
}): { rowIndices: number[]; colIndices: number[] } {
  const { chunkRows, chunkCols } = args;
  const rMid = Math.floor((chunkRows - 1) / 2);
  const cMid = Math.floor((chunkCols - 1) / 2);
  const rowIndices: number[] = [];
  const colIndices: number[] = [];
  for (let r = rMid - 1; r <= rMid + 1; r++) {
    if (r >= 0 && r < chunkRows) rowIndices.push(r);
  }
  for (let c = cMid - 1; c <= cMid + 1; c++) {
    if (c >= 0 && c < chunkCols) colIndices.push(c);
  }
  if (rowIndices.length === 0) rowIndices.push(0);
  if (colIndices.length === 0) colIndices.push(0);
  return { rowIndices, colIndices };
}
