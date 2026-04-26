type AvatarCardProps = {
  name: string;
  imageSrc: string;
  selected: boolean;
  onSelect: () => void;
};

export default function AvatarCard({
  name,
  imageSrc,
  selected,
  onSelect,
}: AvatarCardProps) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`flex cursor-pointer flex-col items-center gap-5 rounded-2xl border px-5 py-6 text-center transition-all duration-300 ${
        selected
          ? "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] shadow-[0_0_24px_var(--sagex-accent-glow)]"
          : "border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)]"
      }`}
    >
      <div className="font-display text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
        {name}
      </div>
      <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)]/60">
        <img
          src={imageSrc}
          alt={`${name} avatar`}
          className="h-24 w-24 object-contain"
        />
      </div>
      <button
        type="button"
        onClick={onSelect}
        className={`h-9 w-full rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
          selected
            ? "bg-[var(--sagex-accent)] text-[var(--surface-0)] shadow-[0_0_12px_var(--sagex-accent-glow)]"
            : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
        }`}
      >
        {selected ? "Selected" : "Choose"}
      </button>
    </div>
  );
}
