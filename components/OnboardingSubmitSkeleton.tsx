"use client";

/**
 * Inline skeleton in the preview column — same footprint as PreviewCard while saving.
 */
export default function OnboardingSubmitSkeleton() {
  return (
    <aside
      className="glass-card flex h-full min-h-[28rem] w-full flex-col gap-6 rounded-2xl p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Saving your pilot"
    >
      <div className="h-4 w-24 animate-pulse rounded bg-[var(--border-default)]" />

      <div className="flex flex-col items-start gap-4">
        <span className="flex h-60 w-40 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)]/40">
          <div className="h-40 w-24 animate-pulse rounded-lg bg-[var(--border-default)]/80" />
        </span>
        <div className="w-full space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--border-default)]" />
          <div className="h-5 w-3/4 max-w-[12rem] animate-pulse rounded bg-[var(--border-default)]" />
          <div className="h-3 w-full max-w-[14rem] animate-pulse rounded bg-[var(--border-default)]" />
          <div className="h-3 w-4/5 max-w-[11rem] animate-pulse rounded bg-[var(--border-default)]" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-3 w-10 animate-pulse rounded bg-[var(--border-default)]" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--border-default)]" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--border-default)]" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-[var(--border-default)]" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--border-default)]" />
      </div>

      <div className="mt-auto space-y-3">
        <p className="text-center text-xs text-[var(--text-secondary)]">
          Saving your pilot…
        </p>
        <div className="h-[2.875rem] w-full animate-pulse rounded-full bg-[var(--border-default)]" />
      </div>
    </aside>
  );
}
