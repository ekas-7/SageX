import { PlayerModel } from "../models/player.model";
import { connectToDatabase } from "../lib/db";
import type { PlayerProfile } from "../types/player";

type CreateData = {
  playerId: string;
  name: string;
  avatar?: string;
  skill?: string;
  interests?: string[];
};

const defaultStats = () => ({
  dailyStreak: 1,
  challengesCompleted: 0,
  totalChallenges: 0,
  totalXp: 0,
  level: 1,
  currentLevelXp: 0,
  xpToNext: 100,
  dailyXpEarned: 0,
  dailyXpResetAt: new Date(),
  milestonesClaimed: [],
  lastActiveAt: new Date(),
  lastStreakDate: new Date(),
});

export const PlayerRepository = {
  async findById(playerId: string) {
    await connectToDatabase();
    return PlayerModel.findOne({ playerId }).lean() as unknown as PlayerProfile | null;
  },

  /**
   * Legacy: lookup by name only. Returns the **first** match. Ambiguous
   * with the new schema (duplicates allowed), so only use this for
   * legacy-user rehydration, never for auth-sensitive operations.
   */
  async findByName(name: string) {
    await connectToDatabase();
    return PlayerModel.findOne({ name }).lean() as unknown as PlayerProfile | null;
  },

  async create(data: CreateData) {
    await connectToDatabase();
    return PlayerModel.create({
      playerId: data.playerId,
      name: data.name,
      avatar: data.avatar,
      skill: data.skill,
      interests: data.interests ?? [],
      stats: defaultStats(),
    });
  },

  /**
   * Atomic upsert keyed by playerId. Creates if missing, otherwise only
   * updates the provided profile fields. Stats are never overwritten here.
   */
  async upsertById(data: CreateData) {
    await connectToDatabase();
    const now = new Date();
    return (
      PlayerModel.findOneAndUpdate(
        { playerId: data.playerId },
        {
          $set: {
            playerId: data.playerId,
            name: data.name,
            ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
            ...(data.skill !== undefined ? { skill: data.skill } : {}),
            ...(data.interests !== undefined ? { interests: data.interests } : {}),
            "stats.lastActiveAt": now,
          },
          $setOnInsert: {
            stats: defaultStats(),
            createdAt: now,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean() as unknown
    ) as PlayerProfile;
  },

  async updateById(
    playerId: string,
    update: Partial<{
      name: string;
      avatar: string;
      skill: string;
      interests: string[];
      stats: Record<string, unknown>;
    }>
  ) {
    await connectToDatabase();
    return (
      PlayerModel.findOneAndUpdate({ playerId }, update, { new: true }).lean() as unknown
    ) as PlayerProfile | null;
  },

  async patchStats(playerId: string, statPatch: Record<string, unknown>) {
    await connectToDatabase();
    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(statPatch)) {
      update[`stats.${key}`] = value;
    }
    return (
      PlayerModel.findOneAndUpdate({ playerId }, { $set: update }, { new: true }).lean() as unknown
    ) as PlayerProfile | null;
  },

  async pushMilestone(playerId: string, milestone: number) {
    await connectToDatabase();
    return (
      PlayerModel.findOneAndUpdate(
        { playerId },
        { $addToSet: { "stats.milestonesClaimed": milestone } },
        { new: true }
      ).lean() as unknown
    ) as PlayerProfile | null;
  },

  async countHigherXp(totalXp: number) {
    await connectToDatabase();
    return PlayerModel.countDocuments({ "stats.totalXp": { $gt: totalXp } });
  },

  async getLeaderboard(limit = 5) {
    await connectToDatabase();
    return PlayerModel.find({})
      .sort({ "stats.totalXp": -1, "stats.dailyStreak": -1 })
      .limit(limit)
      .lean();
  },

  /**
   * Legacy backfill: set playerId on a document that was created before
   * playerId existed. Uses the Mongo _id as the stable identifier.
   */
  async assignPlayerIdByMongoId(mongoId: string, playerId: string) {
    await connectToDatabase();
    return PlayerModel.updateOne(
      { _id: mongoId },
      { $set: { playerId } }
    );
  },
};
