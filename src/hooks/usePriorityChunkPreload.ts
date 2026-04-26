import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeCameraOffset,
  computeMapSize,
  getFallbackGridAroundCenter,
  getVisibleChunkIndices0,
} from "@/src/lib/mapChunkLayout";
import { loadAspectFromImage, preloadAll } from "@/src/lib/preloadImage";

type PositionPercent = { x: number; y: number };

export type UsePriorityChunkPreloadOptions = {
  viewport: { width: number; height: number };
  chunkRows: number;
  chunkCols: number;
  viewTilesWide: number;
  /** Initial camera anchor in map % (keep stable; not live player position) */
  positionPercent: PositionPercent;
  ratioImageUrl: string;
  getChunkUrl: (row1: number, col1: number) => string;
};

/**
 * 1) Read tile aspect from `ratioImageUrl`
 * 2) Preload the tiles needed for the first on-screen view (or a 3×3 if viewport is not measured yet)
 * 3) After the first success, re-preloads on resize/tile set change in the background (no flash)
 */
export function usePriorityChunkPreload(options: UsePriorityChunkPreloadOptions): {
  aspectRatio: number;
  ready: boolean;
  error: string | null;
  retry: () => void;
} {
  const {
    viewport,
    chunkRows,
    chunkCols,
    viewTilesWide,
    positionPercent,
    ratioImageUrl,
  } = options;
  const getChunkUrlRef = useRef(options.getChunkUrl);
  getChunkUrlRef.current = options.getChunkUrl;

  const [aspectRatio, setAspectRatio] = useState(1);
  const [aspectOk, setAspectOk] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const firstPaintPending = useRef(true);

  const retry = useCallback(() => {
    setError(null);
    setReady(false);
    setAspectOk(false);
    firstPaintPending.current = true;
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAspectOk(false);
    loadAspectFromImage(ratioImageUrl)
      .then((r) => {
        if (cancelled) return;
        setAspectRatio(r);
        setAspectOk(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Could not read map tile size."
        );
        setAspectOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ratioImageUrl, attempt]);

  useEffect(() => {
    if (!aspectOk) return;
    let cancelled = false;
    const getChunkUrl = (r: number, c: number) => getChunkUrlRef.current(r, c);
    const mustBlock = firstPaintPending.current;
    if (mustBlock) {
      setError(null);
    }

    const { width: vw, height: vh } = viewport;
    const { tileWidth, tileHeight, mapWidth, mapHeight } = computeMapSize({
      viewportWidth: vw,
      viewTilesWide,
      aspectRatio,
      chunkRows,
      chunkCols,
    });

    const runPreload = (urls: string[]) => {
      if (urls.length === 0) urls.push(getChunkUrl(1, 1));
      void preloadAll(urls)
        .then(() => {
          if (cancelled) return;
          if (mustBlock) {
            setReady(true);
            firstPaintPending.current = false;
          }
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          if (mustBlock) {
            setError(
              e instanceof Error ? e.message : "Map tiles failed to load."
            );
          }
        });
    };

    if (!mapWidth || !mapHeight) {
      if (vw <= 0 || vh <= 0) {
        const { rowIndices, colIndices } = getFallbackGridAroundCenter({
          chunkRows,
          chunkCols,
        });
        const urls: string[] = [];
        for (const ri of rowIndices) {
          for (const ci of colIndices) {
            urls.push(getChunkUrl(ri + 1, ci + 1));
          }
        }
        runPreload(urls);
        return () => {
          cancelled = true;
        };
      }
      return () => {
        cancelled = true;
      };
    }

    const { offsetX, offsetY } = computeCameraOffset({
      viewportWidth: Math.max(1, vw),
      viewportHeight: Math.max(1, vh),
      mapWidth,
      mapHeight,
      positionPercent,
    });
    const { rowIndices, colIndices } = getVisibleChunkIndices0({
      tileWidth,
      tileHeight,
      offsetX,
      offsetY,
      viewportWidth: vw,
      viewportHeight: vh,
      chunkRows,
      chunkCols,
    });
    const urls: string[] = [];
    for (const ri of rowIndices) {
      for (const ci of colIndices) {
        urls.push(getChunkUrl(ri + 1, ci + 1));
      }
    }
    runPreload(urls);

    return () => {
      cancelled = true;
    };
  }, [
    aspectOk,
    aspectRatio,
    attempt,
    chunkCols,
    chunkRows,
    positionPercent.x,
    positionPercent.y,
    viewTilesWide,
    viewport.height,
    viewport.width,
  ]);

  return { aspectRatio, ready, error, retry };
}
