type PreviewCardProps = {
  pilotName: string;
  avatarName: string;
  avatarSrc: string;
  avatarDescription: string;
  skillLevel: string;
  onEnter: () => void;
};

export default function PreviewCard({
  pilotName,
  avatarName,
  avatarSrc,
  avatarDescription,
  skillLevel,
  onEnter,
}: PreviewCardProps) {
  return (
    <aside className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-black/40 p-6">
      <h2 className="text-lg font-semibold text-white">Preview</h2>
      <div className="flex flex-col items-start gap-4">
        <span className="flex h-60 w-40 items-center justify-center rounded-3xl border border-white/10 bg-black/30">
          <img src={avatarSrc} alt={`${avatarName} avatar`} className="h-40 w-24" />
        </span>
        <div className="space-y-1">
          <p className="text-sm text-slate-400">{avatarName}</p>
          <p className="text-base font-semibold text-white">
            {pilotName || "Unnamed Pilot"}
          </p>
          <p className="text-xs text-slate-500">{avatarDescription}</p>
        </div>
      </div>
      <p className="text-sm text-slate-400">Skill: {skillLevel}</p>
      <button
        onClick={onEnter}
        className="mt-auto h-12 rounded-full bg-[#00E5A0] text-base font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00E5A0]/40"
      >
        Enter AI City
      </button>
    </aside>
  );
}
