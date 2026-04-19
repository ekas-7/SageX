type PreviewCardProps = {
  pilotName: string;
  avatarName: string;
  avatarSrc: string;
  avatarDescription: string;
  skillLevel: string;
  interests?: string[];
  onEnter: () => void;
};

export default function PreviewCard({
  pilotName,
  avatarName,
  avatarSrc,
  avatarDescription,
  skillLevel,
  interests,
  onEnter,
}: PreviewCardProps) {
  return (
    <aside className="glass-card flex h-full flex-col gap-6 rounded-2xl p-6">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
        Preview
      </h2>

      <div className="flex flex-col items-start gap-4">
        <span className="flex h-60 w-40 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)]/60">
          <img src={avatarSrc} alt={`${avatarName} avatar`} className="h-40 w-24" />
        </span>
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--sagex-accent)]">
            {avatarName}
          </p>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            {pilotName || "Unnamed Pilot"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{avatarDescription}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="section-label">Skill</span>
        <span className="tag-accent text-xs">{skillLevel}</span>
      </div>

      {interests && interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {interests.map((interest) => (
            <span key={interest} className="tag text-[0.6rem]">
              {interest}
            </span>
          ))}
        </div>
      )}

      <button onClick={onEnter} className="btn-primary mt-auto">
        Enter AI City
      </button>
    </aside>
  );
}
