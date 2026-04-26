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
    <div
      className="flex w-full min-w-0 flex-row items-stretch justify-center gap-2 sm:justify-start sm:gap-3 md:gap-4"
      role="group"
      aria-label="Skill level"
    >
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-[2.75rem] min-w-0 flex-1 rounded-full border px-2 py-2 text-center text-xs font-medium leading-tight transition-all duration-300 sm:flex-none sm:min-w-[6.5rem] sm:px-4 sm:text-sm ${
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
