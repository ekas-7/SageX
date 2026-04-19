"use client";

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import collisions from "../../src/data/mapCollisions.json";

const mapZones = [
  {
    id: "hub",
    label: "AI City Hub",
    x: 22,
    y: 26,
    radius: 6,
    href: "/hub",
  },
  {
    id: "lab",
    label: "AI Learning Lab",
    x: 66,
    y: 52,
    radius: 6,
    href: "/lab?seed=42",
  },
  {
    id: "data-center",
    label: "Neural Data Center",
    x: 78,
    y: 24,
    radius: 6,
  },
  {
    id: "ethics",
    label: "AI Ethics Dock",
    x: 44,
    y: 70,
    radius: 6,
  },
  {
    id: "arena",
    label: "Coding Arena",
    x: 16,
    y: 68,
    radius: 6,
  },
];

type CollisionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PlayerProfile = {
  name: string;
  avatar: string;
  skill: string;
};

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const chunkRows = 3;
  const chunkCols = 6;
  const viewTilesWide = 2;
  const playerMarkerSize = 100;
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 60 });
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [chunkRatio, setChunkRatio] = useState(1);
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [interactionZone, setInteractionZone] = useState<string | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const collisionRects = collisions as CollisionRect[];
  const minMapX = 0;
  const maxMapX = 100;
  const minMapY = 0;
  const maxMapY = 100;

  useEffect(() => {
    const stored = localStorage.getItem("sagex.player");
    if (stored) {
      setProfile(JSON.parse(stored) as PlayerProfile);
    } else {
      router.replace("/onboarding");
      return;
    }
    setHydrated(true);
  }, [router]);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/assests/background/main_map_chunks/map_r1_c1.png";
    img.onload = () => {
      if (img.width > 0) {
        setChunkRatio(img.height / img.width);
      }
    };
  }, []);

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
    const current = mapZones.find((zone) => {
      const dx = position.x - zone.x;
      const dy = position.y - zone.y;
      return Math.hypot(dx, dy) <= zone.radius;
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

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const worldX = clickX - offsetX;
    const worldY = clickY - offsetY;
    const x = (worldX / mapWidth) * 100;
    const y = (worldY / mapHeight) * 100;
    setPosition({
      x: Math.min(maxMapX, Math.max(minMapX, x)),
      y: Math.min(maxMapY, Math.max(minMapY, y)),
    });
  };

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
    if (!hydrated || !mapWidth || !mapHeight) return;
    let animationFrame: number;

    const update = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }
      const deltaMs = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      const dx =
        (pressedKeys["ArrowRight"] || pressedKeys["d"] ? 1 : 0) -
        (pressedKeys["ArrowLeft"] || pressedKeys["a"] ? 1 : 0);
      const dy =
        (pressedKeys["ArrowDown"] || pressedKeys["s"] ? 1 : 0) -
        (pressedKeys["ArrowUp"] || pressedKeys["w"] ? 1 : 0);

      if (dx !== 0 || dy !== 0) {
        const magnitude = Math.hypot(dx, dy) || 1;
        const normalizedX = dx / magnitude;
        const normalizedY = dy / magnitude;
        const baseSpeed = 260;
        const runMultiplier = pressedKeys["Shift"] ? 1.6 : 1;
        const speed = baseSpeed * runMultiplier;
        const deltaFactor = deltaMs / 1000;
        const moveX = (normalizedX * speed * deltaFactor) / mapWidth;
        const moveY = (normalizedY * speed * deltaFactor) / mapHeight;

        setPosition((current) => {
          let nextX = Math.min(maxMapX, Math.max(minMapX, current.x + moveX * 100));
          let nextY = Math.min(maxMapY, Math.max(minMapY, current.y + moveY * 100));

          if (isColliding(nextX, current.y)) {
            nextX = current.x;
          }
          if (isColliding(nextX, nextY)) {
            nextY = current.y;
          }

          return { x: nextX, y: nextY };
        });
      }

      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [hydrated, isColliding, mapHeight, mapWidth, pressedKeys]);

  const subtitle = useMemo(() => {
    if (!profile) return "Global Metaverse Map";
    return `${profile.name}'s navigation feed`;
  }, [profile]);

  useEffect(() => {
    if (!hydrated) return;
    const nearby = mapZones.find((zone) => {
      const dx = position.x - zone.x;
      const dy = position.y - zone.y;
      return Math.hypot(dx, dy) <= zone.radius;
    });
    setInteractionZone(nearby?.id ?? null);
  }, [hydrated, position.x, position.y]);

  useEffect(() => {
    if (!interactionZone) return;
    const zone = mapZones.find((item) => item.id === interactionZone);
    if (!zone || !zone.href) return;
    if (pressedKeys["e"] || pressedKeys["E"] || pressedKeys["Enter"] || pressedKeys[" "]) {
      router.push(zone.href);
    }
  }, [interactionZone, pressedKeys, router]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="relative h-screen w-full overflow-hidden bg-slate-950">
        <div
          ref={mapRef}
          onClick={handleMapClick}
          className="relative h-full w-full cursor-crosshair"
        >
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
                  zIndex: 3,
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
          {mapZones.map((zone) => {
            const zoneX = (zone.x / 100) * mapWidth + offsetX;
            const zoneY = (zone.y / 100) * mapHeight + offsetY;
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
                  className={`block h-16 w-16 rounded-full border border-white/30 bg-white/0 transition group-hover:bg-white/10 ${
                    zone.href ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                />
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {zone.label}
                </span>
              </button>
            );
          })}
          <div
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-sagex-teal/80 shadow-lg shadow-sagex-teal/40"
            style={{ width: playerMarkerSize, height: playerMarkerSize, zIndex: 4 }}
          >
            <span style={{ fontSize: playerMarkerSize * 0.45 }}>
              {hydrated ? profile?.avatar ?? "🧑‍🚀" : "🧑‍🚀"}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-slate-200">
            {hydrated ? subtitle : "Global Metaverse Map"} · Click to move · Arrow keys / WASD · Shift to run
          </div>
          {interactionZone && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
              Press E to enter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
