"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const viewTilesWide = 3.2;
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 60 });
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [chunkRatio, setChunkRatio] = useState(1);

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
      if (current.href) {
        router.push(current.href);
      }
      return;
    }

    if (!current) {
      setActiveZone(null);
    }
  }, [activeZone, hydrated, position.x, position.y, router]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 4 : 2;
      setPosition((current) => {
        let nextX = current.x;
        let nextY = current.y;
        if (event.key === "ArrowUp" || event.key === "w") nextY -= step;
        if (event.key === "ArrowDown" || event.key === "s") nextY += step;
        if (event.key === "ArrowLeft" || event.key === "a") nextX -= step;
        if (event.key === "ArrowRight" || event.key === "d") nextX += step;
        return {
          x: Math.min(92, Math.max(8, nextX)),
          y: Math.min(86, Math.max(12, nextY)),
        };
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
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
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(86, Math.max(12, y)),
    });
  };

  const tileWidth = viewport.width > 0 ? viewport.width / viewTilesWide : 0;
  const tileHeight = tileWidth * chunkRatio;
  const mapWidth = tileWidth * chunkCols;
  const mapHeight = tileHeight * chunkRows;
  const playerX = (position.x / 100) * mapWidth;
  const playerY = (position.y / 100) * mapHeight;
  const offsetX = viewport.width / 2 - playerX;
  const offsetY = viewport.height / 2 - playerY;

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

  const subtitle = useMemo(() => {
    if (!profile) return "Global Metaverse Map";
    return `${profile.name}'s navigation feed`;
  }, [profile]);

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
            }}
          >
            {visibleRows.flatMap((rowIndex) =>
              visibleCols.map((colIndex) => {
                const row = rowIndex + 1;
                const col = colIndex + 1;
                const width = Math.max(1, Math.round(tileWidth));
                const height = Math.max(1, Math.round(tileHeight));
                return (
                  <Image
                    key={`chunk-${row}-${col}`}
                    src={`/assests/background/main_map_chunks/map_r${row}_c${col}.png`}
                    alt={`Map chunk ${row}-${col}`}
                    width={width}
                    height={height}
                    sizes="20vw"
                    className="absolute object-cover"
                    style={{
                      left: colIndex * tileWidth,
                      top: rowIndex * tileHeight,
                    }}
                    draggable={false}
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
                style={{ left: zoneX, top: zoneY }}
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
            className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-sagex-teal/80 text-xl shadow-lg shadow-sagex-teal/40"
          >
            {hydrated ? profile?.avatar ?? "🧑‍🚀" : "🧑‍🚀"}
          </div>
          <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-slate-200">
            {hydrated ? subtitle : "Global Metaverse Map"} · Click to move · Arrow keys / WASD
          </div>
        </div>
      </div>
    </div>
  );
}
