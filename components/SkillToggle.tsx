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
            className={`rounded-full border px-4 py-2 text-sm transition ${
              selected
                ? "border-white text-white"
                : "border-white/20 text-slate-400 hover:border-white/50 hover:text-slate-200"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
