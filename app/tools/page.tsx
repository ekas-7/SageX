"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { TOOL_MODULES } from "@/src/data/toolsModules";
import {
  getServerSnapshot,
  readAllProgress,
  subscribeToProgress,
  type ToolsProgress,
} from "@/src/lib/toolsProgress";

export default function ToolsPage() {
  const progress = useSyncExternalStore<ToolsProgress>(
    subscribeToProgress,
    readAllProgress,
    getServerSnapshot
  );

  const hydrated = typeof window !== "undefined";

  const totals = useMemo(() => {
    const totalModules = TOOL_MODULES.length;
    const totalSteps = TOOL_MODULES.reduce(
      (sum, m) => sum + m.steps.length,
      0
    );
    let completedModules = 0;
    let completedSteps = 0;
    for (const m of TOOL_MODULES) {
      const mp = progress[m.slug];
      const done = mp?.completedSteps.filter((id) =>
        m.steps.some((s) => s.id === id)
      ).length ?? 0;
      completedSteps += done;
      if (done === m.steps.length && m.steps.length > 0) {
        completedModules += 1;
      }
    }
    return { totalModules, totalSteps, completedModules, completedSteps };
  }, [progress]);

  const overallPct =
    totals.totalSteps === 0
      ? 0
      : Math.round((totals.completedSteps / totals.totalSteps) * 100);

  const nextModule = useMemo(() => {
    return TOOL_MODULES.find((m) => {
      const done = (progress[m.slug]?.completedSteps ?? []).filter((id) =>
        m.steps.some((s) => s.id === id)
      ).length;
      return done < m.steps.length;
    });
  }, [progress]);

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="/assests/background/tools/background.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <div className="absolute inset-0 backdrop-blur-xs pointer-events-none" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3">
          <p className="page-label">Learn Tools</p>
          <h1 className="page-title text-3xl">AI Tools Workshop</h1>
          <p className="page-description text-sm">
            Master the tools that power SageX agents. Each module is a short,
            hands-on checklist — check off steps as you go.
          </p>
        </header>

        {/* ─── Overall progress ────────────────────────────── */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-label">Workshop Progress</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                {hydrated
                  ? `${totals.completedModules} / ${totals.totalModules} modules`
                  : "Loading..."}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {hydrated
                  ? `${totals.completedSteps} of ${totals.totalSteps} total steps completed`
                  : " "}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-semibold text-[var(--sagex-accent)]">
                {overallPct}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--sagex-accent)] to-emerald-400 transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </section>

        {/* ─── Module grid ─────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TOOL_MODULES.map((item) => {
            const mp = progress[item.slug];
            const completedStepIds = (mp?.completedSteps ?? []).filter((id) =>
              item.steps.some((s) => s.id === id)
            );
            const done = completedStepIds.length;
            const total = item.steps.length;
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            const isDone = done === total && total > 0;

            return (
              <article
                key={item.slug}
                className={`glass-card glass-card-hover flex h-full flex-col gap-4 rounded-2xl p-5 ${
                  isDone ? "border border-[var(--border-accent)]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="tag">{item.tag}</span>
                    {isDone && (
                      <span className="rounded-full border border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-[var(--sagex-accent)]">
                        Done
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {item.intro}
                </p>

                <div className="mt-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>
                      {hydrated ? `${done} / ${total} steps` : " "}
                    </span>
                    <span className="font-mono">~{item.estMinutes} min</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--sagex-accent)] to-emerald-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <Link
                    href={`/tools/${item.slug}`}
                    className={`text-xs ${isDone ? "btn-ghost" : done > 0 ? "btn-primary" : "btn-ghost"}`}
                  >
                    {isDone ? "Review" : done > 0 ? "Continue" : "Start Module"}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {/* ─── Next mission callout ────────────────────────── */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-label">Next up</p>
              <h2 className="mt-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                {hydrated
                  ? nextModule
                    ? `${nextModule.title} — ${(progress[nextModule.slug]?.completedSteps ?? []).length}/${nextModule.steps.length} done`
                    : "You've completed every module"
                  : "Workshop loading..."}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {nextModule
                  ? `Pick up where you left off. ${nextModule.intro}`
                  : "Every checklist is complete. Time to ship something."}
              </p>
            </div>
            {nextModule && (
              <Link
                href={`/tools/${nextModule.slug}`}
                className="btn-primary text-xs"
              >
                {(progress[nextModule.slug]?.completedSteps ?? []).length > 0
                  ? "Continue"
                  : "Start"}
              </Link>
            )}
          </div>
        </section>

        <a href="/map" className="back-link">
          Back to map
        </a>
      </div>
    </div>
  );
}
