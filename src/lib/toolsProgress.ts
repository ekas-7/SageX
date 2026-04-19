"use client";

/**
 * Client-side tools checklist progress, stored in localStorage.
 * Shape: { [slug: string]: { completedSteps: string[], completedAt?: string } }
 */

const STORAGE_KEY = "sagex.toolsProgress";
const PROGRESS_EVENT = "sagex.toolsProgress.updated";

export type ModuleProgress = {
  completedSteps: string[];
  completedAt?: string;
};

export type ToolsProgress = Record<string, ModuleProgress>;

function safeParse(raw: string | null): ToolsProgress {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as ToolsProgress;
    }
  } catch {
    // fall through
  }
  return {};
}

export function readAllProgress(): ToolsProgress {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function readModuleProgress(slug: string): ModuleProgress {
  const all = readAllProgress();
  return all[slug] ?? { completedSteps: [] };
}

export function writeModuleProgress(slug: string, progress: ModuleProgress) {
  if (typeof window === "undefined") return;
  const all = readAllProgress();
  all[slug] = progress;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(PROGRESS_EVENT));
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
  const handler = () => callback();
  window.addEventListener(PROGRESS_EVENT, handler);
  window.addEventListener("storage", handler);
  window.addEventListener("focus", handler);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, handler);
    window.removeEventListener("storage", handler);
    window.removeEventListener("focus", handler);
  };
}
