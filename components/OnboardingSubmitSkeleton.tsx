"use client";

/**
 * Inline skeleton in the preview column — same footprint as PreviewCard while saving.
 */
export default function OnboardingSubmitSkeleton() {
  return (
    <aside
      className="glass-card box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-col gap-3 overflow-x-hidden overflow-y-hidden rounded-2xl p-4 sm:gap-4 sm:p-5 md:gap-4 md:p-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Saving your pilot"
    >
      <div className="h-3.5 w-20 animate-pulse rounded bg-[var(--border-default)] sm:h-4 sm:w-24" />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)]/40 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="mx-auto h-[7.25rem] w-[5.5rem] shrink-0 rounded-xl border border-[var(--border-subtle)] sm:mx-0 sm:h-[7.5rem] sm:w-24" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-2.5 w-14 animate-pulse rounded bg-[var(--border-default)]" />
              <div className="h-6 w-4/5 max-w-[10rem] animate-pulse rounded bg-[var(--border-default)]" />
              <div className="h-2.5 w-full max-w-[14rem] animate-pulse rounded bg-[var(--border-default)]" />
              <div className="h-2.5 w-4/5 max-w-[11rem] animate-pulse rounded bg-[var(--border-default)]" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <div className="h-2.5 w-9 animate-pulse rounded bg-[var(--border-default)]" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--border-default)]" />
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
          <div className="h-5 w-14 animate-pulse rounded-full bg-[var(--border-default)]" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--border-default)]" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--border-default)]" />
        </div>
      </div>

      <div className="shrink-0 space-y-2">
        <p className="text-center text-xs text-[var(--text-secondary)]">
          Saving your pilot…
        </p>
        <div className="h-11 w-full max-w-full animate-pulse rounded-full bg-[var(--border-default)]" />
      </div>
    </aside>
  );
}
