import {
  DAILY_CAP_REDUCTION,
  DAILY_XP_SOFT_CAP,
  DIFFICULTY_MULTIPLIERS,
  LEVEL_BASE,
  LEVEL_EXPONENT,
  MAX_LEVEL,
  MAX_STREAK_BONUS,
  MAX_STREAK_DAYS,
  MAX_XP_PER_AWARD,
  RANK_TIERS,
  STREAK_MILESTONES,
  STREAK_STEP,
  XP_BASE_REWARDS,
  type Difficulty,
  type XpSource,
} from "../config/xp";

/**
 * XpService — pure calculation layer. No DB access, no IO.
 * All functions are deterministic so they're trivial to unit test.
 */
export const XpService = {
  /** XP required to *reach* a given level from 0. */
  xpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(LEVEL_BASE * Math.pow(level - 1, LEVEL_EXPONENT));
  },

  /** XP needed to advance from `level` to `level + 1`. */
  xpForNextLevel(level: number): number {
    if (level >= MAX_LEVEL) return 0;
    return (
      this.xpRequiredForLevel(level + 1) - this.xpRequiredForLevel(level)
    );
  },

  /** Given total XP, derive the full level snapshot. */
  levelSnapshot(totalXp: number) {
    let level = 1;
    while (
      level < MAX_LEVEL &&
      totalXp >= this.xpRequiredForLevel(level + 1)
    ) {
      level += 1;
    }
    const floor = this.xpRequiredForLevel(level);
    const xpForNext = this.xpForNextLevel(level);
    const currentLevelXp = totalXp - floor;
    const xpToNext = xpForNext === 0 ? 0 : xpForNext - currentLevelXp;
    const progressPct =
      xpForNext === 0 ? 100 : Math.min(100, (currentLevelXp / xpForNext) * 100);
    return {
      level,
      currentLevelXp,
      xpToNext,
      progressPct,
      rank: this.rankFor(level),
    };
  },

  rankFor(level: number): string {
    let label = RANK_TIERS[0].label;
    for (const tier of RANK_TIERS) {
      if (level >= tier.minLevel) label = tier.label;
    }
    return label;
  },

  /** Streak multiplier, capped. */
  streakMultiplier(streakDays: number): number {
    const capped = Math.max(0, Math.min(streakDays, MAX_STREAK_DAYS));
    const bonus = Math.min(capped * STREAK_STEP, MAX_STREAK_BONUS);
    return 1 + bonus;
  },

  difficultyMultiplier(difficulty?: Difficulty): number {
    if (!difficulty) return 1;
    return DIFFICULTY_MULTIPLIERS[difficulty] ?? 1;
  },

  baseReward(source: XpSource, override?: number): number {
    if (typeof override === "number" && override >= 0) return override;
    return XP_BASE_REWARDS[source] ?? 0;
  },

  /**
   * Full award calculation. Returns final XP after all multipliers and
   * safety caps applied.
   */
  computeAward(params: {
    source: XpSource;
    base?: number;
    streakDays: number;
    difficulty?: Difficulty;
    dailyXpEarned: number;
  }) {
    const base = this.baseReward(params.source, params.base);
    const diffMult = this.difficultyMultiplier(params.difficulty);
    const streakMult = this.streakMultiplier(params.streakDays);
    const multiplier = Math.round(diffMult * streakMult * 100) / 100;

    let awarded = Math.round(base * multiplier);

    let softCapped = false;
    if (params.dailyXpEarned >= DAILY_XP_SOFT_CAP) {
      awarded = Math.round(awarded * DAILY_CAP_REDUCTION);
      softCapped = true;
    }

    awarded = Math.max(0, Math.min(awarded, MAX_XP_PER_AWARD));

    return {
      base,
      multiplier,
      difficultyMultiplier: diffMult,
      streakMultiplier: streakMult,
      streakBonus: streakMult - 1,
      finalAmount: awarded,
      softCapped,
    };
  },

  /** Detect streak milestones that have been crossed. */
  newMilestones(currentStreak: number, claimed: number[]): number[] {
    const alreadyClaimed = new Set(claimed);
    return STREAK_MILESTONES.filter(
      (m) => currentStreak >= m && !alreadyClaimed.has(m)
    );
  },

  /** Should the per-day XP counter be reset? */
  shouldResetDailyXp(lastReset?: Date | string): boolean {
    if (!lastReset) return true;
    const last = new Date(lastReset);
    const now = new Date();
    return (
      last.getFullYear() !== now.getFullYear() ||
      last.getMonth() !== now.getMonth() ||
      last.getDate() !== now.getDate()
    );
  },
};
