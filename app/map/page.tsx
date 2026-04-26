"use client";

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapChunkLoaderOverlay } from "@/components/MapChunkLoaderOverlay";
import { usePriorityChunkPreload } from "@/src/hooks/usePriorityChunkPreload";
import collisions from "../../src/data/mapCollisions.json";
import {
  readStoredPlayer,
  signInPlayer,
  withPlayerDefaults,
  writeStoredPlayer,
} from "@/src/lib/playerClient";
import {
  MAP_PET_DIRECTION_ROWS,
  MAP_PET_FRAMES,
  MAP_PET_SHEET,
  MAP_PET_BASE_WIDTH,
  MAP_PET_FOLLOW_GAP_PX,
  MAP_PET_HORIZ_FLIP,
  MAP_PET_OFFSET_X,
  MAP_PET_OFFSET_Y,
  mapPetDisplayHeight,
} from "@/src/config/mapPet";
import AlisaTour from "../../components/AlisaTour";

const TOUR_STORAGE_KEY = "sagex.tourCompleted";

const buildingZones = [
  {
    id: "ethics-center",
    label: "AI Ethics Center",
    href: "/ethics",
    rect: { x: 45, y: 4, width: 16, height: 20 },
  },
  {
    id: "investment-news",
    label: "Investements and AI News",
    href: "/investment",
    rect: { x: 40, y: 10, width: 30, height: 36 },
  },
  {
    id: "field",
    label: "Your Field",
    href: "/field",
    rect: { x: 4, y: 4, width: 24, height: 34 }, 
  },
  {
    id: "stats-2",
    label: "Your Stats",
    href: "/stats",
    rect: { x: 50, y: 40, width: 14, height: 18 },
  },
  {
    id: "learn-code",
    label: "Learn to Code",
    href: "/arena",
    rect: { x: 70, y: 35, width: 10, height: 10 },
  },
  {
    id: "side-quests",
    label: "Side Quests",
    href: "/side-quests",
    rect: { x: 71, y: 63, width: 13, height: 24 },
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    href: "/tools",
    rect: { x: 12, y: 66, width: 18, height: 20 },
  },
];

type CollisionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PlayerProfile = {
  playerId: string;
  name: string;
  avatar: string;
  avatarName?: string;
  skill: string;
};

type MovementDirection = "S" | "A" | "D" | "W";

/** Preload + camera math use this — keep aligned with `position` initial state */
const MAP_PRELOAD_SPAWN = { x: 50, y: 60 } as const;
const MAIN_MAP_RATIO_SRC = "/assests/background/main_map_chunks/map_r1_c1.png";

export default function MapPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const chunkRows = 4;
  const chunkCols = 6;
  const viewTilesWide = 3;
  const playerMarkerSize = 80;
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 60 });
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [interactionZone, setInteractionZone] = useState<string | null>(null);
  const [direction, setDirection] = useState<MovementDirection>("S");
  const [frameIndex, setFrameIndex] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const lastFrameRef = useRef<number | null>(null);
  const frameTimerRef = useRef(0);
  const directionRef = useRef<MovementDirection>("S");
  const frameRef = useRef(0);
  const collisionRects = collisions as CollisionRect[];
  const interactionPadding = 2;
  const minMapX = 0;
  const maxMapX = 100;
  const minMapY = 0;
  const maxMapY = 100;

  useEffect(() => {
    const sessionPlayerId = session?.user?.playerId;
    const stored =
      readStoredPlayer() ??
      (sessionPlayerId
        ? withPlayerDefaults({
            playerId: sessionPlayerId,
            name: session.user.name?.trim() || "Pilot",
            avatar: session.user.image ?? undefined,
          })
        : null);
    if (!stored) {
      if (status === "loading") return;
      router.replace("/onboarding");
      return;
    }
    writeStoredPlayer(stored);
    // Show cached profile immediately for snappy UX.
    setProfile({
      playerId: stored.playerId ?? "",
      name: stored.name,
      avatar: stored.avatar ?? "",
      avatarName: stored.avatarName,
      skill: stored.skill ?? "",
    });
    setHydrated(true);

    // Auto-start Alisa's tour the first time a player reaches /map,
    // or whenever the URL carries ?tour=1 (used by the "Replay tour"
    // button in the hub).
    try {
      const params = new URLSearchParams(window.location.search);
      const forced = params.get("tour") === "1";
      const alreadyCompleted =
        window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
      if (forced || !alreadyCompleted) {
        setTourActive(true);
      }
    } catch {
      // localStorage disabled: don't run the tour.
    }

    // Fire-and-forget sign-in so the backend has the player and any
    // missing playerId is minted. Updates localStorage for future pages.
    void signInPlayer(stored).then((next) => {
      setProfile({
        playerId: next.playerId,
        name: next.name,
        avatar: next.avatar ?? "",
        avatarName: next.avatarName,
        skill: next.skill ?? "",
      });
    });
  }, [router, session, status]);

  const getMainMapChunkUrl = useCallback((row1: number, col1: number) => {
    return `/assests/background/main_map_chunks/map_r${row1}_c${col1}.png`;
  }, []);

  const {
    aspectRatio: chunkRatio,
    ready: chunksReady,
    error: chunkLoadError,
    retry: retryChunkLoad,
  } = usePriorityChunkPreload({
    viewport,
    chunkRows,
    chunkCols,
    viewTilesWide,
    positionPercent: MAP_PRELOAD_SPAWN,
    ratioImageUrl: MAIN_MAP_RATIO_SRC,
    getChunkUrl: getMainMapChunkUrl,
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
    if (!hydrated) return;
    const current = buildingZones.find((zone) => {
      const rect = zone.rect;
      const withinX =
        position.x >= rect.x - interactionPadding &&
        position.x <= rect.x + rect.width + interactionPadding;
      const withinY =
        position.y >= rect.y - interactionPadding &&
        position.y <= rect.y + rect.height + interactionPadding;
      return withinX && withinY;
    });

    if (current && current.id !== activeZone) {
      setActiveZone(current.id);
      return;
    }

    if (!current) {
      setActiveZone(null);
    }
  }, [activeZone, hydrated, position.x, position.y, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys((current) => ({ ...current, [event.key]: true }));
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys((current) => ({ ...current, [event.key]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

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

  const tileWidth = viewport.width > 0 ? viewport.width / viewTilesWide : 0;
  const tileHeight = tileWidth * chunkRatio;
  const mapWidth = tileWidth * chunkCols;
  const mapHeight = tileHeight * chunkRows;
  const playerX = (position.x / 100) * mapWidth;
  const playerY = (position.y / 100) * mapHeight;
  const unclampedOffsetX = viewport.width / 2 - playerX;
  const unclampedOffsetY = viewport.height / 2 - playerY;
  const minOffsetX = viewport.width - mapWidth;
  const minOffsetY = viewport.height - mapHeight;
  const offsetX = Math.min(0, Math.max(minOffsetX, unclampedOffsetX));
  const offsetY = Math.min(0, Math.max(minOffsetY, unclampedOffsetY));
  const centerCol = tileWidth
    ? Math.min(chunkCols - 1, Math.max(0, Math.round(playerX / tileWidth)))
    : 0;
  const centerRow = tileHeight
    ? Math.min(chunkRows - 1, Math.max(0, Math.round(playerY / tileHeight)))
    : 0;
  const avatarSrc =
    hydrated && profile?.avatar?.startsWith("/assests/")
      ? profile.avatar
      : "/assests/skins/skin-1.png";
  const spriteFrameCount = 4;
  const spriteDirectionCount = 4;
  const spriteSheetSrc = "/assests/skins/skin-1-spritesheet.png";
  const spriteAspect = 1382 / 768;
  const spriteWidth = Math.round(playerMarkerSize * 0.75);
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
      chunkCols - 1,
      Math.ceil((-offsetX + viewport.width) / tileWidth) + 1
    );
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [chunkCols, offsetX, tileWidth, viewport.width]);

  const visibleRows = useMemo(() => {
    if (!tileHeight) return [] as number[];
    const start = Math.max(0, Math.floor(-offsetY / tileHeight) - 1);
    const end = Math.min(
      chunkRows - 1,
      Math.ceil((-offsetY + viewport.height) / tileHeight) + 1
    );
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [chunkRows, offsetY, tileHeight, viewport.height]);

  useEffect(() => {
    if (!hydrated || !mapWidth || !mapHeight || !chunksReady) return;
    let animationFrame: number;

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

      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [hydrated, isColliding, mapHeight, mapWidth, pressedKeys, chunksReady]);

  const subtitle = useMemo(() => {
    if (!profile) return "Global Metaverse Map";
    return `${profile.name}'s navigation feed`;
  }, [profile]);

  useEffect(() => {
    if (!hydrated) return;
    const nearby = buildingZones.find((zone) => {
      const rect = zone.rect;
      const withinX =
        position.x >= rect.x - interactionPadding &&
        position.x <= rect.x + rect.width + interactionPadding;
      const withinY =
        position.y >= rect.y - interactionPadding &&
        position.y <= rect.y + rect.height + interactionPadding;
      return withinX && withinY;
    });
    setInteractionZone(nearby?.id ?? null);
  }, [hydrated, position.x, position.y]);

  useEffect(() => {
    if (!interactionZone) return;
    const zone = buildingZones.find((item) => item.id === interactionZone);
    if (!zone || !zone.href) return;
    if (pressedKeys["e"] || pressedKeys["E"] || pressedKeys["Enter"] || pressedKeys[" "]) {
      router.push(zone.href);
    }
  }, [interactionZone, pressedKeys, router]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="relative h-screen w-full overflow-hidden bg-[var(--background)]">
        <div ref={mapRef} className="relative h-full w-full cursor-default">
          {!chunksReady && (
            <MapChunkLoaderOverlay
              error={chunkLoadError}
              onRetry={retryChunkLoad}
              label="Loading world map"
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
                key={`collision-${index}`}
                className="absolute border-2 border-lime-300 bg-lime-300/20 shadow-[0_0_12px_rgba(52,255,161,0.9)]"
                style={{
                  width: (rect.width / 100) * mapWidth,
                  height: (rect.height / 100) * mapHeight,
                  left: (rect.x / 100) * mapWidth,
                  top: (rect.y / 100) * mapHeight,
                  zIndex: -1,
                }}
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
                    key={`chunk-${row}-${col}`}
                    src={`/assests/background/main_map_chunks/map_r${row}_c${col}.png`}
                    alt={`Map chunk ${row}-${col}`}
                    width={width}
                    height={height}
                    className="absolute object-cover"
                    style={{
                      width: tileWidth,
                      height: tileHeight,
                      left: colIndex * tileWidth,
                      top: rowIndex * tileHeight,
                    }}
                    draggable={false}
                    loading={isPriority ? "eager" : "lazy"}
                  />
                );
              })
            )}
          </div>
          {buildingZones.map((zone) => {
            const centerX = zone.rect.x + zone.rect.width / 2;
            const centerY = zone.rect.y + zone.rect.height / 2;
            const zoneX = (centerX / 100) * mapWidth + offsetX;
            const zoneY = (centerY / 100) * mapHeight + offsetY;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => zone.href && router.push(zone.href)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: zoneX, top: zoneY, zIndex: 2 }}
                aria-label={zone.label}
              >
                <span
                  className={`block h-16 w-16 rounded-full border border-[var(--border-default)] transition group-hover:border-[var(--border-accent)] group-hover:bg-[var(--sagex-accent-muted)] group-hover:shadow-[0_0_20px_var(--sagex-accent-glow)] ${
                    zone.href ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                />
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 px-3 py-1.5 text-[10px] font-medium text-[var(--text-primary)] opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  {zone.label}
                </span>
              </button>
            );
          })}
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
              width: playerMarkerSize,
              height: usesSpriteSheet ? spriteHeight : playerMarkerSize,
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
                  hydrated
                    ? profile?.avatarName
                      ? `${profile.avatarName} avatar`
                      : "Player avatar"
                    : "Player avatar"
                }
                width={Math.round(playerMarkerSize * 0.75)}
                height={Math.round(playerMarkerSize * 0.75)}
                className="rounded-2xl object-contain"
              />
            )}
          </div>
          {tourActive &&
            hydrated &&
            chunksReady &&
            mapWidth > 0 &&
            mapHeight > 0 && (
            <AlisaTour
              mapWidth={mapWidth}
              mapHeight={mapHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              onVisit={(href) => {
                try {
                  window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
                } catch {
                  // ignore
                }
                setTourActive(false);
                router.push(href);
              }}
              onFinish={() => {
                try {
                  window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
                } catch {
                  // ignore
                }
                setTourActive(false);
              }}
              onSkip={() => {
                try {
                  window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
                } catch {
                  // ignore
                }
                setTourActive(false);
              }}
            />
          )}
          <div className="glass-card absolute bottom-3 left-4 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            {hydrated ? subtitle : "Global Metaverse Map"} &middot; Arrow keys / WASD &middot; Shift to run
          </div>
          {interactionZone && (
            <div className="absolute bottom-12 left-4 z-50 rounded-full border border-[var(--border-accent)] bg-[var(--surface-1)]/95 px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[0_0_24px_var(--sagex-accent-glow)] backdrop-blur-sm">
              Press E to enter {buildingZones.find((zone) => zone.id === interactionZone)?.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
