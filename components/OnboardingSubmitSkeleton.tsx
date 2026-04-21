"use client";

/**
 * Full-viewport overlay while onboarding profile is persisted.
 */
export default function OnboardingSubmitSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 px-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="glass-card w-full max-w-md space-y-4 rounded-2xl p-8">
        <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--border-default)]" />
        <div className="h-40 animate-pulse rounded-xl bg-[var(--border-default)]" />
        <div className="space-y-2">
          <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--border-default)]" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-[var(--border-default)]" />
          <div className="h-3 w-2/5 animate-pulse rounded bg-[var(--border-default)]" />
        </div>
        <p className="pt-2 text-center text-sm text-[var(--text-secondary)]">
          Saving your pilot…
        </p>
      </div>
    </div>
  );
}
