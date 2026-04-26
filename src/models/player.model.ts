import { Schema, model, models } from "mongoose";

const PlayerStatsSchema = new Schema(
  {
    dailyStreak: { type: Number, default: 1 },
    lastStreakDate: { type: Date },
    challengesCompleted: { type: Number, default: 0 },
    totalChallenges: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentLevelXp: { type: Number, default: 0 },
    xpToNext: { type: Number, default: 100 },
    dailyXpEarned: { type: Number, default: 0 },
    dailyXpResetAt: { type: Date },
    milestonesClaimed: { type: [Number], default: [] },
    arenaSolved: { type: [String], default: [] },
    arenaAttempts: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  { _id: false }
);

const PlayerSchema = new Schema(
  {
    // Stable identifier (UUID). Generated client-side at onboarding.
    // This is the true primary key for player lookups going forward.
    playerId: { type: String, required: true, unique: true, index: true },
    // Display name. Enforced unique (case-insensitive) in PlayerService; index supports lookups.
    name: { type: String, required: true, index: true },
    // OAuth / account linking (sparse — anonymous players have none)
    email: { type: String, sparse: true, unique: true, index: true },
    accountProvider: { type: String, sparse: true, index: true },
    accountId: { type: String, sparse: true, index: true },
    avatar: { type: String },
    skill: { type: String },
    interests: { type: [String], default: [] },
    // bcrypt hash only — never return to clients; see repository `.select("-passwordHash")` on reads.
    passwordHash: { type: String, select: false },
    stats: { type: PlayerStatsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

PlayerSchema.index(
  { accountProvider: 1, accountId: 1 },
  { unique: true, sparse: true }
);

export const PlayerModel = models.Player || model("Player", PlayerSchema);
