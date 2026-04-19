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
      className={`flex cursor-pointer flex-col items-center gap-5 rounded-[32px] border px-6 py-8 text-center transition ${
        selected
          ? "border-white bg-white/5"
          : "border-white/10 bg-black/40"
      }`}
    >
      <div className="text-sm font-semibold text-white">{name}</div>
      <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-black/30">
        <img
          src={imageSrc}
          alt={`${name} avatar`}
          className="h-24 w-24 object-contain"
        />
      </div>
      <button
        type="button"
        onClick={onSelect}
        className={`h-10 w-full rounded-full border text-sm font-semibold transition ${
          selected
            ? "border-[#00E5A0] bg-[#00E5A0] text-slate-900"
            : "border-white/10 bg-black/40 text-slate-200 hover:border-[#00E5A0]/60"
        }`}
      >
        {selected ? "Selected" : "Choose"}
      </button>
    </div>
  );
}
