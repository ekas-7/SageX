import { PlayerRepository } from "../repositories/player.repo";
import type { LeaderboardEntry, PlayerProfile } from "../types/player";

const startOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const diffInDays = (from: Date, to: Date) => {
  const fromDay = startOfDay(from).getTime();
  const toDay = startOfDay(to).getTime();
  return Math.round((toDay - fromDay) / (1000 * 60 * 60 * 24));
};

export const PlayerService = {
  async getOrCreatePlayer(payload: {
    name: string;
    avatar?: string;
    skill?: string;
    interests?: string[];
  }) {
    let player = await PlayerRepository.findByName(payload.name);
    if (!player) {
      await PlayerRepository.create(payload);
      player = await PlayerRepository.findByName(payload.name);
    }

    if (!player) {
      throw new Error("Failed to load player");
    }

    const now = new Date();
    const lastStreakDate = player.stats?.lastStreakDate
      ? new Date(player.stats.lastStreakDate)
      : undefined;
    let dailyStreak = player.stats?.dailyStreak ?? 1;

    if (!lastStreakDate) {
      dailyStreak = 1;
    } else {
      const dayDiff = diffInDays(lastStreakDate, now);
      if (dayDiff === 1) {
        dailyStreak += 1;
      } else if (dayDiff > 1) {
        dailyStreak = 1;
      }
    }

    const updatedPlayer = await PlayerRepository.updateByName(payload.name, {
      avatar: payload.avatar ?? player.avatar,
      skill: payload.skill ?? player.skill,
      interests: payload.interests ?? player.interests,
      stats: {
        ...player.stats,
        dailyStreak,
        lastStreakDate: now,
        lastActiveAt: now,
      },
    });

    return (updatedPlayer ?? player) as PlayerProfile;
  },

  async updateStats(payload: {
    name: string;
    deltaChallenges?: number;
    deltaXp?: number;
  }) {
    const player = await PlayerRepository.findByName(payload.name);
    if (!player) {
      throw new Error("Player not found");
    }

    const challengesCompleted =
      (player.stats?.challengesCompleted ?? 0) + (payload.deltaChallenges ?? 0);
    const totalXp = (player.stats?.totalXp ?? 0) + (payload.deltaXp ?? 0);
    const totalChallenges = Math.max(
      player.stats?.totalChallenges ?? 0,
      challengesCompleted
    );

    const updated = await PlayerRepository.updateByName(payload.name, {
      stats: {
        ...player.stats,
        challengesCompleted,
        totalChallenges,
        totalXp,
        lastActiveAt: new Date(),
      },
    });

    return (updated ?? player) as PlayerProfile;
  },

  async getLeaderboard(player: PlayerProfile) {
    const [leaderboardRaw, higherCount] = await Promise.all([
      PlayerRepository.getLeaderboard(5),
      PlayerRepository.countHigherXp(player.stats?.totalXp ?? 0),
    ]);

    const leaderboard = (leaderboardRaw ?? []).map((entry, index) => ({
      name: entry.name,
      avatar: entry.avatar,
      skill: entry.skill,
      rank: index + 1,
      totalXp: entry.stats?.totalXp ?? 0,
      dailyStreak: entry.stats?.dailyStreak ?? 0,
      challengesCompleted: entry.stats?.challengesCompleted ?? 0,
    })) as LeaderboardEntry[];

    const rank = higherCount + 1;

    return { leaderboard, rank };
  },
};
