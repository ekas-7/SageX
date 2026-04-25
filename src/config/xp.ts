/**
 * SageX XP System Configuration
 *
 * Core RPG economy: defines XP sources, reward weights, level curve,
 * streak multipliers, and anti-farm caps. All XP math lives here so
 * the rest of the codebase stays declarative.
 */

// ───────────────────────────────────────────────────────────────────
// Level curve
// ───────────────────────────────────────────────────────────────────
//
// Classic RPG curve: xpToReach(level) = BASE * level^EXPONENT.
// Level 1 requires 0 XP. Level 2 requires BASE. Each level gets harder.
//
// With BASE=100, EXPONENT=1.55:
//   Lv 2 -> 100 XP total
//   Lv 5 -> ~1120 XP total
//   Lv 10 -> ~3548 XP total
//   Lv 25 -> ~15000 XP total
//   Lv 50 -> ~44000 XP total

export const LEVEL_BASE = 100;
export const LEVEL_EXPONENT = 1.55;
export const MAX_LEVEL = 100;

// ───────────────────────────────────────────────────────────────────
// XP sources — every action that can grant XP must be declared here
// ───────────────────────────────────────────────────────────────────

export const XP_SOURCES = {
  QUEST_COMPLETE: "quest.complete",
  QUEST_PERFECT: "quest.perfect",
  ETHICS_SCENARIO: "ethics.scenario",
  ETHICS_SCENARIO_PARTIAL: "ethics.scenario.partial",
  VIBE_SUBMIT: "vibe.submit",
  VIBE_VOTE_RECEIVED: "vibe.vote.received",
  DAILY_LOGIN: "daily.login",
  /** Visiting the investment / news playfield; once per local calendar day. */
  DAILY_NEWS_READ: "daily.news.read",
  STREAK_MILESTONE: "streak.milestone",
  ONBOARDING_COMPLETE: "onboarding.complete",
  FIELD_TRACK_STEP: "field.track.step",
  SIDE_QUEST: "sidequest.complete",
  ARENA_SOLVED: "arena.solved",
  ARENA_PARTIAL: "arena.partial",
  MANUAL_GRANT: "manual.grant",
} as const;

export type XpSource = (typeof XP_SOURCES)[keyof typeof XP_SOURCES];

// Base reward (pre-multiplier) per source. Reward intensity scales with
// difficulty inside the orchestrator; values here are the baseline.
export const XP_BASE_REWARDS: Record<XpSource, number> = {
  [XP_SOURCES.QUEST_COMPLETE]: 50,
  [XP_SOURCES.QUEST_PERFECT]: 80,
  [XP_SOURCES.ETHICS_SCENARIO]: 40,
  [XP_SOURCES.ETHICS_SCENARIO_PARTIAL]: 10,
  [XP_SOURCES.VIBE_SUBMIT]: 25,
  [XP_SOURCES.VIBE_VOTE_RECEIVED]: 5,
  [XP_SOURCES.DAILY_LOGIN]: 15,
  [XP_SOURCES.DAILY_NEWS_READ]: 20,
  [XP_SOURCES.STREAK_MILESTONE]: 100,
  [XP_SOURCES.ONBOARDING_COMPLETE]: 75,
  [XP_SOURCES.FIELD_TRACK_STEP]: 35,
  [XP_SOURCES.SIDE_QUEST]: 60,
  [XP_SOURCES.ARENA_SOLVED]: 90,
  [XP_SOURCES.ARENA_PARTIAL]: 20,
  [XP_SOURCES.MANUAL_GRANT]: 0,
};

// Difficulty multipliers for sources that support it.
export const DIFFICULTY_MULTIPLIERS = {
  beginner: 1,
  builder: 1.5,
  competitive: 2.25,
} as const;

export type Difficulty = keyof typeof DIFFICULTY_MULTIPLIERS;

// ───────────────────────────────────────────────────────────────────
// Streak multiplier — rewards daily engagement
// ───────────────────────────────────────────────────────────────────
//
// streakMultiplier = 1 + min(streak, MAX_STREAK_DAYS) * STREAK_STEP
// e.g. 7-day streak = 1.35x, 14-day = 1.7x, cap = 2x at 20+ days.

export const STREAK_STEP = 0.05;
export const MAX_STREAK_BONUS = 1.0; // Caps the +bonus portion at +100%
export const MAX_STREAK_DAYS = 20;

// Streak milestones that trigger a one-shot bonus award.
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

// ───────────────────────────────────────────────────────────────────
// Anti-farm / safety
// ───────────────────────────────────────────────────────────────────

// Hard cap per single award so a misconfigured client can't grant 1M XP.
export const MAX_XP_PER_AWARD = 5000;

// Daily XP soft cap. Past this, rewards are halved. Prevents AFK farms.
export const DAILY_XP_SOFT_CAP = 2500;
export const DAILY_CAP_REDUCTION = 0.5;

// Per-source idempotency window (ms). A (source, sourceRef) awarded
// within this window is rejected as duplicate.
export const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

// ───────────────────────────────────────────────────────────────────
// Tier / rank labels by level band — flavor only
// ───────────────────────────────────────────────────────────────────

export const RANK_TIERS: Array<{ minLevel: number; label: string }> = [
  { minLevel: 1, label: "Cadet" },
  { minLevel: 5, label: "Pilot" },
  { minLevel: 10, label: "Navigator" },
  { minLevel: 20, label: "Operative" },
  { minLevel: 35, label: "Architect" },
  { minLevel: 50, label: "Sage" },
  { minLevel: 75, label: "Ascendant" },
  { minLevel: 100, label: "Singularity" },
];
