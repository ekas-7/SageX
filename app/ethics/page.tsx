"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function EthicsPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const playerMarkerSize = 80;
  const [profile, setProfile] = useState<
    | { name: string; avatar: string; avatarName?: string; skill: string }
    | null
  >(null);
  const [hydrated, setHydrated] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 60 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [direction, setDirection] = useState<"S" | "A" | "D" | "W">("S");
  const [frameIndex, setFrameIndex] = useState(0);
  const lastFrameRef = useRef<number | null>(null);
  const movementFrameRef = useRef<number | null>(null);
  const frameTimerRef = useRef(0);
  const directionRef = useRef<"S" | "A" | "D" | "W">("S");
  const frameRef = useRef(0);
  const [sceneRatio, setSceneRatio] = useState(0.62);
  const minMapX = 0;
  const maxMapX = 100;
  const minMapY = 0;
  const maxMapY = 100;

  useEffect(() => {
    const stored = localStorage.getItem("sagex.player");
    if (stored) {
      setProfile(JSON.parse(stored) as {
        name: string;
        avatar: string;
        avatarName?: string;
        skill: string;
      });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/assests/background/ethics/backgroung.png";
    img.onload = () => {
      if (img.width > 0) {
        setSceneRatio(img.height / img.width);
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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push("/map");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [router]);

  const mapWidth = Math.max(viewport.width * 1.6, viewport.width);
  const mapHeight = Math.max(mapWidth * sceneRatio, viewport.height);
  const playerX = (position.x / 100) * mapWidth;
  const playerY = (position.y / 100) * mapHeight;
  const unclampedOffsetX = viewport.width / 2 - playerX;
  const unclampedOffsetY = viewport.height / 2 - playerY;
  const minOffsetX = viewport.width - mapWidth;
  const minOffsetY = viewport.height - mapHeight;
  const offsetX = Math.min(0, Math.max(minOffsetX, unclampedOffsetX));
  const offsetY = Math.min(0, Math.max(minOffsetY, unclampedOffsetY));
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
  const directionRowMap: Record<"S" | "A" | "D" | "W", number> = {
    S: 0,
    A: 1,
    D: 2,
    W: 3,
  };

  const updateMovement = useCallback(function updateMovementCallback(timestamp: number) {
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
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? "D"
              : "A"
            : dy > 0
            ? "S"
            : "W";
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
          const nextX = Math.min(
            maxMapX,
            Math.max(minMapX, current.x + moveX * 100)
          );
          const nextY = Math.min(
            maxMapY,
            Math.max(minMapY, current.y + moveY * 100)
          );
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

      movementFrameRef.current = window.requestAnimationFrame(updateMovementCallback);
    },
    [mapHeight, mapWidth, pressedKeys]
  );

  useEffect(() => {
    if (!hydrated || !mapWidth || !mapHeight) return;
    movementFrameRef.current = window.requestAnimationFrame(updateMovement);
    return () => {
      if (movementFrameRef.current !== null) {
        window.cancelAnimationFrame(movementFrameRef.current);
      }
    };
  }, [hydrated, mapHeight, mapWidth, updateMovement]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07060f] text-slate-100">
      <div ref={mapRef} className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            width: mapWidth,
            height: mapHeight,
            transform: `translate(${offsetX}px, ${offsetY}px)`,
            zIndex: 1,
          }}
        >
          <Image
            src="/assests/background/ethics/backgroung.png"
            alt="Ethics courtyard"
            fill
            sizes="100vw"
            priority
            className="object-cover"
            draggable={false}
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
        <div className="absolute bottom-3 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-slate-200">
          Arrow keys / WASD · Shift to run
        </div>
      </div>

      <div className="relative z-10 min-h-screen" />
    </div>
  );
}
