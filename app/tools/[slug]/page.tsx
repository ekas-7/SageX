"use client";

import Link from "next/link";
import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleBySlug, type ToolModule } from "@/src/data/toolsModules";
import {
  getServerModuleSnapshot,
  readModuleProgress,
  resetModuleProgress,
  subscribeToProgress,
  toggleStep,
  type ModuleProgress,
} from "@/src/lib/toolsProgress";

export default function ToolsModulePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const moduleData = useMemo<ToolModule | undefined>(
    () => (slug ? getModuleBySlug(slug) : undefined),
    [slug]
  );

  // Snapshot getter is memoized per slug so useSyncExternalStore always
  // gets the SAME function reference across renders — critical to avoid
  // the infinite-loop "getSnapshot should be cached" warning.
  const getClientSnapshot = useCallback(
    () => (slug ? readModuleProgress(slug) : getServerModuleSnapshot()),
    [slug]
  );

  const progress = useSyncExternalStore<ModuleProgress>(
    subscribeToProgress,
    getClientSnapshot,
    getServerModuleSnapshot
  );

  const hydrated = typeof window !== "undefined" && !!slug;

  const [justCompleted, setJustCompleted] = useState(false);

  const totalSteps = moduleData?.steps.length ?? 0;
  const completedSet = useMemo(
    () => new Set(progress.completedSteps),
    [progress]
  );
  const completedCount = moduleData
    ? moduleData.steps.filter((s) => completedSet.has(s.id)).length
    : 0;
  const progressPct =
    totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);
  const isComplete = totalSteps > 0 && completedCount === totalSteps;

  const handleToggle = (stepId: string) => {
    if (!moduleData) return;
    const wasComplete = isComplete;
    const next = toggleStep(moduleData.slug, stepId, totalSteps);
    const nowComplete =
      moduleData.steps.filter((s) => next.completedSteps.includes(s.id))
        .length === totalSteps;
    if (!wasComplete && nowComplete) {
      setJustCompleted(true);
      window.setTimeout(() => setJustCompleted(false), 4000);
    }
  };

  const handleReset = () => {
    if (!moduleData) return;
    resetModuleProgress(moduleData.slug);
    setJustCompleted(false);
  };

  if (!moduleData) {
    return (
      <div className="min-h-screen px-6 py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <p className="page-label">Tools Module</p>
          <h1 className="page-title text-3xl">Module not found</h1>
          <p className="page-description text-sm">
            That module doesn&apos;t exist (yet). Pick another from the
            workshop.
          </p>
          <Link href="/tools" className="btn-ghost w-fit text-xs">
            Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-3">
          <p className="page-label">Tools Module</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title text-3xl">{moduleData.title}</h1>
            <span className="tag">{moduleData.tag}</span>
            <span className="tag text-[0.55rem] font-mono">
              ~{moduleData.estMinutes} min
            </span>
          </div>
          <p className="page-description text-sm">{moduleData.intro}</p>
        </header>

        {/* ─── Progress summary ─────────────────────────────── */}
        <section className="glass-card rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-label">Your progress</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {completedCount} / {totalSteps} steps
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {isComplete
                  ? "Module complete \u2014 nice work."
                  : hydrated
                    ? "Check off each step as you finish it."
                    : "Loading your progress\u2026"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-semibold text-[var(--sagex-accent)]">
                {progressPct}%
              </p>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition hover:text-rose-400"
                >
                  Reset progress
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--sagex-accent)] to-emerald-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {justCompleted && (
            <div className="mt-4 rounded-xl border border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] p-3 text-sm text-[var(--sagex-accent)]">
              Module complete! You&apos;ve finished {moduleData.title}.
              {moduleData.nextSlug && (
                <> Ready for the next one?</>
              )}
            </div>
          )}
        </section>

        {/* ─── Steps checklist ──────────────────────────────── */}
        <section className="flex flex-col gap-3">
          {moduleData.steps.map((step, idx) => {
            const done = completedSet.has(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleToggle(step.id)}
                aria-pressed={done}
                className={`glass-card glass-card-hover flex items-start gap-4 rounded-2xl p-5 text-left transition ${
                  done ? "opacity-80" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                    done
                      ? "border-[var(--border-accent)] bg-[var(--sagex-accent)] text-[var(--surface-0)]"
                      : "border-[var(--border-default)] text-[var(--text-muted)]"
                  }`}
                >
                  {done ? (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-display text-sm font-semibold transition ${
                      done
                        ? "text-[var(--text-muted)] line-through"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {step.detail}
                  </p>
                  {step.hint && (
                    <p className="mt-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-[0.7rem] text-[var(--text-muted)]">
                      <span className="font-semibold uppercase tracking-wider text-[var(--sagex-accent)]">
                        Tip:
                      </span>{" "}
                      {step.hint}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {/* ─── Footer: next + back ──────────────────────────── */}
        <section className="glass-card rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-label">
                {isComplete ? "Up next" : "When you finish"}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {moduleData.nextSlug
                  ? `Continue your workshop with the next module.`
                  : `You've reached the last module in the workshop track.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {moduleData.nextSlug ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/tools/${moduleData.nextSlug}`)
                  }
                  disabled={!isComplete}
                  className="btn-primary text-xs disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:transform-none"
                >
                  Next Module &rarr;
                </button>
              ) : (
                <Link href="/tools" className="btn-primary text-xs">
                  Back to Workshop
                </Link>
              )}
              <Link href="/tools" className="btn-ghost text-xs">
                All Modules
              </Link>
            </div>
          </div>
        </section>

        <Link href="/map" className="back-link">
          Back to map
        </Link>
      </div>
    </div>
  );
}
