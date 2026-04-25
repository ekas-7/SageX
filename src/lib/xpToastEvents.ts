export const XP_TOAST_EVENT = "sagex-xp-toast" as const;

export type XpToastDetail = {
  awarded: number;
  leveledUp?: boolean;
  levelsGained?: number;
  levelAfter?: number;
  rank?: string;
  softCapped?: boolean;
  multiplier?: number;
  /** Short label shown above the amount, e.g. "Quest complete", "Arena". */
  sourceLabel?: string;
};

/**
 * Show the global in-game XP toast. Use after any successful XP grant
 * (including arena API responses that don’t go through `postXpAward`).
 * No-ops if awarded is 0 or duplicate.
 */
export function emitXpToast(detail: XpToastDetail): void {
  if (typeof window === "undefined") return;
  const n = detail.awarded;
  if (typeof n !== "number" || n <= 0) return;
  window.dispatchEvent(
    new CustomEvent(XP_TOAST_EVENT, {
      detail: { ...detail, awarded: n } satisfies XpToastDetail,
    })
  );
}
