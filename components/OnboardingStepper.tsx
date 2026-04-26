import { Fragment } from "react";

type OnboardingStepperProps = {
  currentIndex: number;
  steps: readonly { id: string; label: string }[];
};

/**
 * Linear onboarding progress. Current step is highlighted; past steps show a checkmark.
 */
export default function OnboardingStepper({
  currentIndex,
  steps,
}: OnboardingStepperProps) {
  const total = steps.length;

  return (
    <nav
      className="w-full min-w-0 px-1"
      aria-label="Onboarding steps"
    >
      <p className="mb-3 text-center text-[0.7rem] font-medium text-[var(--text-muted)] sm:hidden">
        Step {currentIndex + 1} of {total}
      </p>
      <ol className="flex w-full min-w-0 list-none items-center">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <Fragment key={step.id}>
              {index > 0 && (
                <li
                  className={`h-0.5 min-w-[0.35rem] flex-1 rounded-full ${
                    index <= currentIndex
                      ? "bg-[var(--sagex-accent)]/70"
                      : "bg-[var(--border-default)]"
                  }`}
                  aria-hidden
                />
              )}
              <li
                className="flex min-w-0 flex-col items-center gap-1"
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:h-9 sm:w-9 sm:text-sm ${
                    isCurrent
                      ? "bg-[var(--sagex-accent)] text-[var(--surface-0)] shadow-[0_0_16px_var(--sagex-accent-glow)]"
                      : isComplete
                        ? "bg-[var(--sagex-accent-muted)] text-[var(--sagex-accent)] ring-1 ring-[var(--border-accent)]"
                        : "border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-muted)]"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                <span
                  className={`hidden max-w-[5.5rem] text-center text-[0.6rem] font-medium uppercase tracking-wide sm:block sm:max-w-[6.5rem] sm:text-[0.65rem] ${
                    isCurrent
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-[0.65rem] font-medium text-[var(--text-secondary)] sm:hidden">
        {steps[currentIndex]?.label}
      </p>
    </nav>
  );
}
