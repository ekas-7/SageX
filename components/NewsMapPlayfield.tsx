"use client";

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapChunkLoaderOverlay } from "@/components/MapChunkLoaderOverlay";
import newsMapCollisions from "@/src/data/newsMapCollisions.json";
import newsMapEZone from "@/src/data/newsMapEZone.json";
import { usePriorityChunkPreload } from "@/src/hooks/usePriorityChunkPreload";
import { readStoredPlayer, signInPlayer } from "@/src/lib/playerClient";
import {
  MAP_PET_BASE_WIDTH,
  MAP_PET_DIRECTION_ROWS,
  MAP_PET_FOLLOW_GAP_PX,
  MAP_PET_FRAMES,
  MAP_PET_HORIZ_FLIP,
  MAP_PET_OFFSET_X,
  MAP_PET_OFFSET_Y,
  MAP_PET_SHEET,
  mapPetDisplayHeight,
} from "@/src/config/mapPet";

const CHUNK_DIR = "/assests/background/investement/news_backgroung_chunks";
const CHUNK_ROWS = 4;
const CHUNK_COLS = 6;
const VIEW_TILES_WIDE = 3;
const NEWS_PRELOAD_SPAWN = { x: 50, y: 60 } as const;
const NEWS_RATIO_SRC = `${CHUNK_DIR}/row-1-column-1.png`;

function newsChunkUrl(row: number, col: number) {
  return `${CHUNK_DIR}/row-${row}-column-${col}.png`;
}

type PlayerProfile = {
  playerId: string;
  name: string;
  avatar: string;
  avatarName?: string;
  skill: string;
};

type MovementDirection = "S" | "A" | "D" | "W";

type CollisionRect = { x: number; y: number; width: number; height: number };

const PLAYER_MARKER = 80;
const minMapX = 0;
const maxMapX = 100;
const minMapY = 0;
const maxMapY = 100;

function pointInRect(
  px: number,
  py: number,
  rect: CollisionRect
) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

type NewsMapPlayfieldProps = {
  /** Fired once when the player presses E while standing in the news column. */
  onOpenNewsPanel?: () => void;
  /** When true, E does not open the panel (e.g. already open). */
  newsPanelOpen?: boolean;
};

export function NewsMapPlayfield({
  onOpenNewsPanel,
  newsPanelOpen = false,
}: NewsMapPlayfieldProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 60 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [direction, setDirection] = useState<MovementDirection>("S");
  const [frameIndex, setFrameIndex] = useState(0);
  const lastFrameRef = useRef<number | null>(null);
  const frameTimerRef = useRef(0);
  const directionRef = useRef<MovementDirection>("S");
  const frameRef = useRef(0);

  useEffect(() => {
    const stored = readStoredPlayer();
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setProfile({
      playerId: stored.playerId ?? "",
      name: stored.name,
      avatar: stored.avatar ?? "",
      avatarName: stored.avatarName,
      skill: stored.skill ?? "",
    });
    setHydrated(true);
    void signInPlayer(stored).then((next) => {
      setProfile({
        playerId: next.playerId,
        name: next.name,
        avatar: next.avatar ?? "",
        avatarName: next.avatarName,
        skill: next.skill ?? "",
      });
    });
  }, [router]);

  const getNewsChunkUrl = useCallback((row1: number, col1: number) => {
    return newsChunkUrl(row1, col1);
  }, []);

  const {
    aspectRatio: chunkRatio,
    ready: chunksReady,
    error: chunkLoadError,
    retry: retryChunkLoad,
  } = usePriorityChunkPreload({
    viewport,
    chunkRows: CHUNK_ROWS,
    chunkCols: CHUNK_COLS,
    viewTilesWide: VIEW_TILES_WIDE,
    positionPercent: NEWS_PRELOAD_SPAWN,
    ratioImageUrl: NEWS_RATIO_SRC,
    getChunkUrl: getNewsChunkUrl,
  });

  useEffect(() => {
    const updateSize = () => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) =>
      setPressedKeys((c) => ({ ...c, [e.key]: true }));
    const onUp = (e: KeyboardEvent) =>
      setPressedKeys((c) => ({ ...c, [e.key]: false }));
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const collisionRects = newsMapCollisions as CollisionRect[];
  const eZoneRect = newsMapEZone as CollisionRect;
  const inNewsEZone = useMemo(
    () => pointInRect(position.x, position.y, eZoneRect),
    [eZoneRect, position.x, position.y]
  );

  useEffect(() => {
    if (!onOpenNewsPanel || newsPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "e" && e.key !== "E") return;
      if (e.repeat) return;
      if (!inNewsEZone) return;
      e.preventDefault();
      onOpenNewsPanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inNewsEZone, newsPanelOpen, onOpenNewsPanel]);

  const isColliding = useCallback(
    (nextX: number, nextY: number) => {
      return collisionRects.some((rect) => {
        const withinX = nextX >= rect.x && nextX <= rect.x + rect.width;
        const withinY = nextY >= rect.y && nextY <= rect.y + rect.height;
        return withinX && withinY;
      });
    },
    [collisionRects]
  );

  const tileWidth = viewport.width > 0 ? viewport.width / VIEW_TILES_WIDE : 0;
  const tileHeight = tileWidth * chunkRatio;
  const mapWidth = tileWidth * CHUNK_COLS;
  const mapHeight = tileHeight * CHUNK_ROWS;
  const playerX = (position.x / 100) * mapWidth;
  const playerY = (position.y / 100) * mapHeight;
  const unclampedOffsetX = viewport.width / 2 - playerX;
  const unclampedOffsetY = viewport.height / 2 - playerY;
  const minOffsetX = viewport.width - mapWidth;
  const minOffsetY = viewport.height - mapHeight;
  const offsetX = Math.min(0, Math.max(minOffsetX, unclampedOffsetX));
  const offsetY = Math.min(0, Math.max(minOffsetY, unclampedOffsetY));
  const centerCol = tileWidth
    ? Math.min(CHUNK_COLS - 1, Math.max(0, Math.round(playerX / tileWidth)))
    : 0;
  const centerRow = tileHeight
    ? Math.min(CHUNK_ROWS - 1, Math.max(0, Math.round(playerY / tileHeight)))
    : 0;

  const avatarSrc =
    hydrated && profile?.avatar?.startsWith("/assests/")
      ? profile.avatar
      : "/assests/skins/skin-1.png";
  const spriteFrameCount = 4;
  const spriteDirectionCount = 4;
  const spriteSheetSrc = "/assests/skins/skin-1-spritesheet.png";
  const spriteAspect = 1382 / 768;
  const spriteWidth = Math.round(PLAYER_MARKER * 0.75);
  const spriteHeight = Math.round(spriteWidth * spriteAspect);
  const usesSpriteSheet = avatarSrc.includes("skin-1");
  const directionRowMap: Record<MovementDirection, number> = {
    S: 0,
    A: 1,
    D: 2,
    W: 3,
  };
  const petDisplayW = MAP_PET_BASE_WIDTH;
  const petDisplayH = mapPetDisplayHeight(petDisplayW);
  const dr = directionRowMap;
  const { petSpriteRow, petMirrorX } =
    MAP_PET_HORIZ_FLIP === "A"
      ? {
          petSpriteRow: direction === "A" ? dr.D : dr[direction],
          petMirrorX: direction === "A",
        }
      : {
          petSpriteRow: direction === "D" ? dr.A : dr[direction],
          petMirrorX: direction === "D",
        };
  const behindPetOffset = (() => {
    const g = MAP_PET_FOLLOW_GAP_PX;
    switch (direction) {
      case "S":
        return { x: 0, y: -g };
      case "W":
        return { x: 0, y: g };
      case "A":
        return { x: g, y: 0 };
      case "D":
        return { x: -g, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  })();
  const effectivePetOffsetX = petMirrorX
    ? -MAP_PET_OFFSET_X
    : MAP_PET_OFFSET_X;
  const petX = playerX + behindPetOffset.x + effectivePetOffsetX;
  const petY = playerY + behindPetOffset.y + MAP_PET_OFFSET_Y;

  const visibleCols = useMemo(() => {
    if (!tileWidth) return [] as number[];
    const start = Math.max(0, Math.floor(-offsetX / tileWidth) - 1);
    const end = Math.min(
      CHUNK_COLS - 1,
      Math.ceil((-offsetX + viewport.width) / tileWidth) + 1
    );
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [offsetX, tileWidth, viewport.width]);

  const visibleRows = useMemo(() => {
    if (!tileHeight) return [] as number[];
    const start = Math.max(0, Math.floor(-offsetY / tileHeight) - 1);
    const end = Math.min(
      CHUNK_ROWS - 1,
      Math.ceil((-offsetY + viewport.height) / tileHeight) + 1
    );
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [offsetY, tileHeight, viewport.height]);

  useEffect(() => {
    if (!hydrated || !mapWidth || !mapHeight || !chunksReady) return;
    let raf = 0;
    const update = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }
      const deltaMs = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      const dx =
        (pressedKeys["ArrowRight"] || pressedKeys["d"] || pressedKeys["D"]
          ? 1
          : 0) -
        (pressedKeys["ArrowLeft"] || pressedKeys["a"] || pressedKeys["A"]
          ? 1
          : 0);
      const dy =
        (pressedKeys["ArrowDown"] || pressedKeys["s"] || pressedKeys["S"]
          ? 1
          : 0) -
        (pressedKeys["ArrowUp"] || pressedKeys["w"] || pressedKeys["W"]
          ? 1
          : 0);

      if (dx !== 0 || dy !== 0) {
        const nextDirection =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "D" : "A") : dy > 0 ? "S" : "W";
        if (directionRef.current !== nextDirection) {
          directionRef.current = nextDirection;
          setDirection(nextDirection);
        }
        const magnitude = Math.hypot(dx, dy) || 1;
        const normalizedX = dx / magnitude;
        const normalizedY = dy / magnitude;
        const baseSpeed = 150;
        const runMultiplier = pressedKeys["Shift"] ? 2 : 1;
        const speed = baseSpeed * runMultiplier;
        const deltaFactor = deltaMs / 1000;
        const moveX = (normalizedX * speed * deltaFactor) / mapWidth;
        const moveY = (normalizedY * speed * deltaFactor) / mapHeight;

        setPosition((current) => {
          let nextX = Math.min(
            maxMapX,
            Math.max(minMapX, current.x + moveX * 100)
          );
          let nextY = Math.min(
            maxMapY,
            Math.max(minMapY, current.y + moveY * 100)
          );
          if (isColliding(nextX, current.y)) {
            nextX = current.x;
          }
          if (isColliding(nextX, nextY)) {
            nextY = current.y;
          }
          return { x: nextX, y: nextY };
        });

        frameTimerRef.current += deltaMs;
        const frameDuration = 140;
        if (frameTimerRef.current >= frameDuration) {
          frameTimerRef.current = 0;
          frameRef.current = (frameRef.current + 1) % spriteFrameCount;
          setFrameIndex(frameRef.current);
        }
      } else {
        frameTimerRef.current = 0;
        if (frameRef.current !== 0) {
          frameRef.current = 0;
          setFrameIndex(0);
        }
      }
      raf = window.requestAnimationFrame(update);
    };
    raf = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(raf);
  }, [hydrated, isColliding, mapHeight, mapWidth, pressedKeys, chunksReady]);

  const footerLine = useMemo(
    () =>
      (profile
        ? `${profile.name} · AI investment news`
        : "AI investment news") +
      (inNewsEZone ? " · Press E" : ""),
    [inNewsEZone, profile]
  );

  return (
    <div className="relative h-full min-h-screen w-full cursor-default bg-[var(--background)]">
      <div ref={mapRef} className="absolute inset-0 h-full w-full">
        {!chunksReady && (
          <MapChunkLoaderOverlay
            error={chunkLoadError}
            onRetry={retryChunkLoad}
            label="Loading news map"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            width: mapWidth,
            height: mapHeight,
            transform: `translate(${offsetX}px, ${offsetY}px)`,
            zIndex: 1,
          }}
        >
          {collisionRects.map((rect, index) => (
            <div
              key={`news-collision-${index}`}
              className="pointer-events-none absolute border-2 border-cyan-300 bg-cyan-400/20 shadow-[0_0_16px_rgba(34,211,238,0.75),0_0_8px_rgba(168,85,247,0.4)]"
              style={{
                width: (rect.width / 100) * mapWidth,
                height: (rect.height / 100) * mapHeight,
                left: (rect.x / 100) * mapWidth,
                top: (rect.y / 100) * mapHeight,
                zIndex: -1,
              }}
              aria-hidden
            />
          ))}
          {visibleRows.flatMap((rowIndex) =>
            visibleCols.map((colIndex) => {
              const row = rowIndex + 1;
              const col = colIndex + 1;
              const width = Math.max(1, Math.round(tileWidth));
              const height = Math.max(1, Math.round(tileHeight));
              const isPriority =
                rowIndex === centerRow && colIndex === centerCol;
              return (
                <img
                  key={`news-chunk-${row}-${col}`}
                  src={newsChunkUrl(row, col)}
                  alt=""
                  width={width}
                  height={height}
                  className="absolute object-cover"
                  style={{
                    width: tileWidth,
                    height: tileHeight,
                    left: colIndex * tileWidth,
                    top: rowIndex * tileHeight,
                    zIndex: 0,
                  }}
                  draggable={false}
                  loading={isPriority ? "eager" : "lazy"}
                />
              );
            })
          )}
        </div>
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            width: petDisplayW,
            height: petDisplayH,
            zIndex: 3,
            left: petX + offsetX,
            top: petY + offsetY,
            transform: petMirrorX
              ? "translate(-50%, -50%) scaleX(-1)"
              : "translate(-50%, -50%)",
          }}
          aria-label="Mecha pet companion"
        >
          <div
            className="rounded-sm"
            style={{
              width: petDisplayW,
              height: petDisplayH,
              backgroundImage: `url(${MAP_PET_SHEET})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${MAP_PET_FRAMES * petDisplayW}px ${
                MAP_PET_DIRECTION_ROWS * petDisplayH
              }px`,
              backgroundPosition: `-${
                frameIndex * petDisplayW
              }px -${petSpriteRow * petDisplayH}px`,
            }}
          />
        </div>
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{
            width: PLAYER_MARKER,
            height: usesSpriteSheet ? spriteHeight : PLAYER_MARKER,
            zIndex: 4,
            left: playerX + offsetX,
            top: playerY + offsetY,
          }}
        >
          {usesSpriteSheet ? (
            <div
              className="rounded-full"
              aria-label="Player avatar"
              style={{
                width: spriteWidth,
                height: spriteHeight,
                backgroundImage: `url(${spriteSheetSrc})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${spriteFrameCount * spriteWidth}px ${
                  spriteDirectionCount * spriteHeight
                }px`,
                backgroundPosition: `-${
                  frameIndex * spriteWidth
                }px -${directionRowMap[direction] * spriteHeight}px`,
              }}
            />
          ) : (
            <Image
              src={avatarSrc}
              alt={
                hydrated && profile?.avatarName
                  ? `${profile.avatarName} avatar`
                  : "Player avatar"
              }
              width={Math.round(PLAYER_MARKER * 0.75)}
              height={Math.round(PLAYER_MARKER * 0.75)}
              className="rounded-2xl object-contain"
            />
          )}
        </div>
        <div className="glass-card absolute bottom-3 left-4 z-[5] max-w-[min(100%,28rem)] rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
          {footerLine} &middot; Arrow keys / WASD &middot; Shift to run
        </div>
      </div>
    </div>
  );
}
