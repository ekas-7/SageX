"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALISA_TOUR,
  type AlisaDirection,
  type AlisaWaypoint,
} from "@/src/data/alisaTour";

/**
 * Alisa — the in-game tour guide.
 *
 * Rendered as an overlay inside the map viewport. She uses the same
 * skin-1 sprite sheet and 4-direction walking frames as the player, and
 * walks a GSAP timeline between building waypoints. At each stop she
 * faces the building, fires a typewriter dialogue, and waits for the
 * player to click Next / Visit / Skip.
 */

// Alisa sprite sheet — /assests/npc/alsiaspritesheet.png
// 1536×2762 arranged as 4 cols × 4 rows of ~384×690 frames.
// If any direction looks wrong, swap rows in DIRECTION_ROW below.
const SPRITE_SHEET = "/assests/npc/alsiaspritesheet.png";
const SPRITE_FRAMES = 4;
const SPRITE_ROWS = 4;
const SPRITE_ASPECT = 690 / 384; // ≈ 1.796
const SPRITE_WIDTH = 60;
const SPRITE_HEIGHT = Math.round(SPRITE_WIDTH * SPRITE_ASPECT);

const DIRECTION_ROW: Record<AlisaDirection, number> = {
  S: 0,
  A: 1,
  D: 2,
  W: 3,
};

// Walking animation tuning. Lower PCT_PER_SEC = slower movement across the map.
// Higher FRAME_MS = slower leg-swap animation on the sprite.
const WALK_FRAME_MS = 220;
const WALK_SPEED_PCT_PER_SEC = 9;

type Position = { x: number; y: number }; // % of map

function directionForMove(from: Position, to: Position): AlisaDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? "D" : "A";
  }
  return dy >= 0 ? "S" : "W";
}

function distance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function resolveStopPosition(wp: AlisaWaypoint): Position {
  return {
    x: wp.x + (wp.standOffsetX ?? 0),
    y: wp.y + (wp.standOffsetY ?? 0),
  };
}

type Props = {
  mapWidth: number;
  mapHeight: number;
  offsetX: number;
  offsetY: number;
  onVisit?: (href: string) => void;
  onFinish?: () => void;
  onSkip?: () => void;
};

export default function AlisaTour({
  mapWidth,
  mapHeight,
  offsetX,
  offsetY,
  onVisit,
  onFinish,
  onSkip,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [pos, setPos] = useState<Position>(() =>
    resolveStopPosition(ALISA_TOUR[0])
  );
  const [direction, setDirection] = useState<AlisaDirection>(
    ALISA_TOUR[0].facing
  );
  const [frame, setFrame] = useState(0);
  const [walking, setWalking] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [hidden, setHidden] = useState(false);

  const walkTween = useRef<gsap.core.Tween | null>(null);
  const frameTimer = useRef<number | null>(null);
  const typeTimer = useRef<number | null>(null);

  const waypoint = ALISA_TOUR[stepIdx];
  const line = waypoint.lines[lineIdx] ?? "";
  const isLastWaypoint = stepIdx >= ALISA_TOUR.length - 1;
  const isLastLine = lineIdx >= waypoint.lines.length - 1;

  // ─── Walking animation: cycle sprite frames while walking ─────
  useEffect(() => {
    if (!walking) {
      setFrame(0);
      if (frameTimer.current) {
        window.clearInterval(frameTimer.current);
        frameTimer.current = null;
      }
      return;
    }
    frameTimer.current = window.setInterval(() => {
      setFrame((f) => (f + 1) % SPRITE_FRAMES);
    }, WALK_FRAME_MS);
    return () => {
      if (frameTimer.current) {
        window.clearInterval(frameTimer.current);
        frameTimer.current = null;
      }
    };
  }, [walking]);

  // ─── Typewriter for the current line ──────────────────────────
  useEffect(() => {
    if (walking || hidden) return;
    if (!line) return;
    setTyped("");
    let i = 0;
    typeTimer.current = window.setInterval(() => {
      i += 1;
      setTyped(line.slice(0, i));
      if (i >= line.length) {
        if (typeTimer.current) {
          window.clearInterval(typeTimer.current);
          typeTimer.current = null;
        }
      }
    }, 18);
    return () => {
      if (typeTimer.current) {
        window.clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    };
  }, [line, walking, hidden]);

  // ─── GSAP walk to the next waypoint ───────────────────────────
  const walkTo = useMemo(
    () => (target: Position, facing: AlisaDirection, onDone: () => void) => {
      if (walkTween.current) walkTween.current.kill();

      const start = pos;
      const dist = distance(start, target);
      if (dist < 0.1) {
        setDirection(facing);
        onDone();
        return;
      }

      const duration = Math.max(0.4, dist / WALK_SPEED_PCT_PER_SEC);
      const moveDir = directionForMove(start, target);
      setDirection(moveDir);
      setWalking(true);

      const state = { x: start.x, y: start.y };
      walkTween.current = gsap.to(state, {
        x: target.x,
        y: target.y,
        duration,
        ease: "sine.inOut",
        onUpdate: () => {
          setPos({ x: state.x, y: state.y });
        },
        onComplete: () => {
          setWalking(false);
          setDirection(facing);
          onDone();
        },
      });
    },
    [pos]
  );

  // ─── Clean up timelines on unmount ────────────────────────────
  useEffect(() => {
    return () => {
      if (walkTween.current) walkTween.current.kill();
      if (frameTimer.current) window.clearInterval(frameTimer.current);
      if (typeTimer.current) window.clearInterval(typeTimer.current);
    };
  }, []);

  // ─── Navigation ───────────────────────────────────────────────
  const advanceToNextWaypoint = () => {
    if (isLastWaypoint) {
      onFinish?.();
      setHidden(true);
      return;
    }
    const nextIdx = stepIdx + 1;
    const nextWp = ALISA_TOUR[nextIdx];
    const target = resolveStopPosition(nextWp);
    walkTo(target, nextWp.facing, () => {
      setStepIdx(nextIdx);
      setLineIdx(0);
    });
  };

  const handleNext = () => {
    if (walking) return;
    // If the text is still typing, fast-forward to the full line.
    if (typed.length < line.length) {
      setTyped(line);
      if (typeTimer.current) {
        window.clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
      return;
    }
    if (!isLastLine) {
      setLineIdx(lineIdx + 1);
      return;
    }
    advanceToNextWaypoint();
  };

  const handleVisit = () => {
    if (walking) return;
    onVisit?.(waypoint.href);
  };

  const handleSkip = () => {
    if (walkTween.current) walkTween.current.kill();
    setHidden(true);
    onSkip?.();
  };

  if (hidden) return null;

  // ─── Render ───────────────────────────────────────────────────
  const px = (pos.x / 100) * mapWidth;
  const py = (pos.y / 100) * mapHeight;
  const left = px + offsetX;
  const top = py + offsetY;

  const showVisitButton = waypoint.href !== "/map";

  return (
    <>
      {/* Sprite */}
      <div
        aria-label="Alisa the tour guide"
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          width: SPRITE_WIDTH,
          height: SPRITE_HEIGHT,
          left,
          top,
          zIndex: 5,
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
        }}
      >
        <div
          style={{
            width: SPRITE_WIDTH,
            height: SPRITE_HEIGHT,
            backgroundImage: `url(${SPRITE_SHEET})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${SPRITE_FRAMES * SPRITE_WIDTH}px ${
              SPRITE_ROWS * SPRITE_HEIGHT
            }px`,
            backgroundPosition: `-${frame * SPRITE_WIDTH}px -${
              DIRECTION_ROW[direction] * SPRITE_HEIGHT
            }px`,
          }}
        />
        {/* Nameplate */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-[var(--sagex-accent)]">
          Alisa &middot; Guide
        </div>
      </div>

      {/* Speech bubble — tethered above sprite */}
      {!walking && (
        <div
          className="pointer-events-auto absolute z-50 -translate-x-1/2"
          style={{
            left,
            top: top - SPRITE_HEIGHT / 2 - 16,
            transform: `translate(-50%, -100%)`,
          }}
        >
          <div
            className="relative w-[min(22rem,80vw)] p-4"
            style={{
              textShadow: "0 2px 8px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--sagex-accent)]">
                {waypoint.label}
              </p>
              <span className="text-[0.6rem] text-[var(--text-muted)]">
                {stepIdx + 1} / {ALISA_TOUR.length}
              </span>
            </div>
            <p className="mt-2 min-h-[3.5rem] text-sm leading-relaxed text-[var(--text-primary)]">
              {typed}
              {typed.length < line.length && (
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-[var(--sagex-accent)] align-middle" />
              )}
            </p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition hover:text-rose-300"
              >
                Skip Tour
              </button>
              <div className="flex items-center gap-2">
                {showVisitButton && isLastLine && (
                  <button
                    type="button"
                    onClick={handleVisit}
                    className="btn-ghost text-xs"
                  >
                    Visit
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary text-xs"
                >
                  {typed.length < line.length
                    ? "..."
                    : !isLastLine
                      ? "Next"
                      : isLastWaypoint
                        ? "Finish"
                        : "Next Stop \u2192"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
