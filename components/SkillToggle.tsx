type SkillToggleProps = {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

export default function SkillToggle({
  options,
  value,
  onChange,
}: SkillToggleProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
              selected
                ? "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] text-[var(--sagex-accent)] shadow-[0_0_12px_var(--sagex-accent-glow)]"
                : "border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
