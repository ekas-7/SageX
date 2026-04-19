import { PlayerModel } from "../models/player.model";
import { connectToDatabase } from "../lib/db";
import type { PlayerProfile } from "../types/player";

export const PlayerRepository = {
  async findByName(name: string) {
    await connectToDatabase();
    return PlayerModel.findOne({ name }).lean() as unknown as PlayerProfile | null;
  },
  async create(data: { name: string; avatar?: string; skill?: string }) {
    await connectToDatabase();
    return PlayerModel.create({
      name: data.name,
      avatar: data.avatar,
      skill: data.skill,
      stats: {
        dailyStreak: 1,
        challengesCompleted: 0,
        totalChallenges: 0,
        totalXp: 0,
        lastActiveAt: new Date(),
        lastStreakDate: new Date(),
      },
    });
  },
  async updateByName(
    name: string,
    update: Partial<{ avatar: string; skill: string; stats: Record<string, unknown> }>
  ) {
    await connectToDatabase();
    return (PlayerModel.findOneAndUpdate({ name }, update, { new: true }).lean() as unknown) as
      | PlayerProfile
      | null;
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
};
