"use client";

/**
 * Client-side tools checklist progress, stored in localStorage.
 * Shape: { [slug: string]: { completedSteps: string[], completedAt?: string } }
 *
 * Uses a cached snapshot + pub/sub so useSyncExternalStore gets a
 * stable reference between updates (required — otherwise React
 * detects a snapshot change every render and infinite-loops).
 */

const STORAGE_KEY = "sagex.toolsProgress";
const PROGRESS_EVENT = "sagex.toolsProgress.updated";

export type ModuleProgress = {
  completedSteps: string[];
  completedAt?: string;
};

export type ToolsProgress = Record<string, ModuleProgress>;

const EMPTY_SNAPSHOT: ToolsProgress = Object.freeze({}) as ToolsProgress;
const EMPTY_MODULE: ModuleProgress = Object.freeze({
  completedSteps: [] as string[],
}) as ModuleProgress;

// ─── Cached snapshot (module-level) ──────────────────────────────
// Only mutated when the storage key actually changes. Callers of
// readAllProgress() always get the same reference until then.
let cachedRaw: string | null | undefined;
let cachedSnapshot: ToolsProgress = EMPTY_SNAPSHOT;

function safeParse(raw: string | null): ToolsProgress {
  if (!raw) return EMPTY_SNAPSHOT;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as ToolsProgress;
    }
  } catch {
    // fall through
  }
  return EMPTY_SNAPSHOT;
}

function refreshSnapshotFromStorage(): ToolsProgress {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = safeParse(raw);
  return cachedSnapshot;
}

/** Snapshot getter used by useSyncExternalStore. Must be stable. */
export function readAllProgress(): ToolsProgress {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  return refreshSnapshotFromStorage();
}

/** SSR snapshot — always the frozen empty object. */
export function getServerSnapshot(): ToolsProgress {
  return EMPTY_SNAPSHOT;
}

export function readModuleProgress(slug: string): ModuleProgress {
  const all = readAllProgress();
  return all[slug] ?? EMPTY_MODULE;
}

/** Stable SSR snapshot for a single module. */
export function getServerModuleSnapshot(): ModuleProgress {
  return EMPTY_MODULE;
}

function writeAndInvalidate(next: ToolsProgress) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  // Invalidate cache so the next read returns a fresh reference.
  cachedRaw = serialized;
  cachedSnapshot = next;
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function writeModuleProgress(slug: string, progress: ModuleProgress) {
  if (typeof window === "undefined") return;
  // Build a new object (new reference) so React re-renders.
  const current = readAllProgress();
  const next: ToolsProgress = { ...current, [slug]: progress };
  writeAndInvalidate(next);
}

export function toggleStep(
  slug: string,
  stepId: string,
  totalSteps: number
): ModuleProgress {
  const current = readModuleProgress(slug);
  const set = new Set(current.completedSteps);
  if (set.has(stepId)) {
    set.delete(stepId);
  } else {
    set.add(stepId);
  }
  const completedSteps = Array.from(set);
  const nextCompletedAt =
    completedSteps.length === totalSteps
      ? current.completedAt ?? new Date().toISOString()
      : undefined;
  const next: ModuleProgress = { completedSteps, completedAt: nextCompletedAt };
  writeModuleProgress(slug, next);
  return next;
}

export function resetModuleProgress(slug: string): ModuleProgress {
  const next: ModuleProgress = { completedSteps: [] };
  writeModuleProgress(slug, next);
  return next;
}

export function subscribeToProgress(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  // On any of these events, force-refresh the cached snapshot so
  // useSyncExternalStore sees a new reference on its next read.
  const handler = () => {
    // Bust the cache so refreshSnapshotFromStorage re-parses.
    cachedRaw = undefined;
    callback();
  };
  window.addEventListener(PROGRESS_EVENT, handler);
  window.addEventListener("storage", handler);
  window.addEventListener("focus", handler);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, handler);
    window.removeEventListener("storage", handler);
    window.removeEventListener("focus", handler);
  };
}
