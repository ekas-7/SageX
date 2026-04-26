type PreviewCardProps = {
  pilotName: string;
  avatarName: string;
  avatarSrc: string;
  avatarDescription: string;
  skillLevel: string;
  interests?: string[];
  onEnter: () => void;
  disabled?: boolean;
};

export default function PreviewCard({
  pilotName,
  avatarName,
  avatarSrc,
  avatarDescription,
  skillLevel,
  interests,
  onEnter,
  disabled = false,
}: PreviewCardProps) {
  const hasName = pilotName.trim().length > 0;

  return (
    <aside className="glass-card box-border flex w-full min-h-0 min-w-0 max-w-full flex-col gap-3 overflow-x-hidden rounded-2xl p-4 sm:gap-4 sm:p-5 md:gap-4 md:p-5">
      <h2 className="font-display shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] sm:text-sm">
        Preview
      </h2>

      <div className="flex min-h-0 w-full flex-col gap-3 pr-0.5 [scrollbar-gutter:stable]">
        {/* Pilot identity — self-contained so long names and copy don’t break layout */}
        <div className="min-w-0 max-w-full rounded-2xl border border-[var(--border-default)]/80 bg-[var(--surface-0)]/50 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] sm:p-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            <span className="mx-auto flex h-[7.25rem] w-[5.5rem] max-w-full shrink-0 items-center justify-center self-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/60 sm:mx-0 sm:h-[7.5rem] sm:w-24 sm:self-stretch">
              <img
                src={avatarSrc}
                alt={`${avatarName} avatar`}
                className="h-24 w-16 max-h-full max-w-full object-contain sm:h-28 sm:w-[4.5rem]"
              />
            </span>
            <div className="min-w-0 w-full min-h-0 flex-1 text-center sm:text-left">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[var(--sagex-accent)] sm:text-xs">
                {avatarName}
              </p>
              <p
                className={`mt-1 line-clamp-3 break-words text-lg font-semibold leading-tight [overflow-wrap:anywhere] sm:text-xl ${
                  hasName
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]"
                }`}
                title={hasName ? pilotName : undefined}
              >
                {hasName ? pilotName : "Pilot name required"}
              </p>
              <p className="mt-1.5 line-clamp-3 text-left text-xs leading-relaxed text-[var(--text-muted)] sm:line-clamp-4">
                {avatarDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="section-label">Skill</span>
          <span className="tag-accent text-xs">{skillLevel}</span>
        </div>

        {interests && interests.length > 0 && (
          <div className="flex min-w-0 flex-wrap justify-center gap-1.5 sm:justify-start">
            {interests.map((interest) => (
              <span
                key={interest}
                className="tag max-w-full min-w-0 break-words text-[0.6rem] [overflow-wrap:anywhere]"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onEnter}
        className="btn-primary w-full shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
      >
        Enter AI City
      </button>
    </aside>
  );
}
