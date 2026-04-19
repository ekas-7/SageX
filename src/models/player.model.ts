import { Schema, model, models } from "mongoose";

const PlayerStatsSchema = new Schema(
  {
    dailyStreak: { type: Number, default: 1 },
    lastStreakDate: { type: Date },
    challengesCompleted: { type: Number, default: 0 },
    totalChallenges: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  { _id: false }
);

const PlayerSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    avatar: { type: String },
    skill: { type: String },
    stats: { type: PlayerStatsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const PlayerModel = models.Player || model("Player", PlayerSchema);
