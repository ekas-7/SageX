import type { Difficulty, XpSource } from "../config/xp";

export type XpEventRecord = {
  playerId: string;
  playerName: string;
  source: XpSource;
  sourceRef?: string;
  baseAmount: number;
  multiplier: number;
  finalAmount: number;
  difficulty?: Difficulty;
  levelBefore: number;
  levelAfter: number;
  totalXpAfter: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type XpAwardInput = {
  playerId: string;
  name?: string; // optional display-name fallback for first-time create
  source: XpSource;
  sourceRef?: string;
  difficulty?: Difficulty;
  overrideBase?: number;
  metadata?: Record<string, unknown>;
};

export type XpAwardResult = {
  awarded: number;
  base: number;
  multiplier: number;
  streakBonus: number;
  difficultyMultiplier: number;
  softCapped: boolean;
  duplicate: boolean;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  levelsGained: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNext: number;
  progressPct: number;
  rank: string;
  event?: XpEventRecord;
};

export type XpSummary = {
  playerId: string;
  name: string;
  totalXp: number;
  level: number;
  currentLevelXp: number;
  xpToNext: number;
  progressPct: number;
  rank: string;
  dailyStreak: number;
  streakMultiplier: number;
  dailyXpEarned: number;
  dailyCapHit: boolean;
  recentEvents: XpEventRecord[];
};
