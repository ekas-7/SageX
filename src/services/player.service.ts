import { PlayerRepository } from "../repositories/player.repo";
import { XpService } from "./xp.service";
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

/**
 * PlayerService — thin profile/stat operations.
 * XP awards go through XpOrchestrator, not here. This service still
 * owns profile upserts, streak rollover, and leaderboard shaping.
 */
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

  /**
   * Update challenge counters. XP is no longer awarded here — callers
   * should invoke XpOrchestrator.award directly for typed XP flows.
   * `deltaXp` is kept for legacy compatibility and routed through a
   * manual-grant style patch that also updates level.
   */
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
    const totalChallenges = Math.max(
      player.stats?.totalChallenges ?? 0,
      challengesCompleted
    );

    const statPatch: Record<string, unknown> = {
      challengesCompleted,
      totalChallenges,
      lastActiveAt: new Date(),
    };

    if (payload.deltaXp && payload.deltaXp > 0) {
      const totalXp = (player.stats?.totalXp ?? 0) + payload.deltaXp;
      const snap = XpService.levelSnapshot(totalXp);
      statPatch.totalXp = totalXp;
      statPatch.level = snap.level;
      statPatch.currentLevelXp = snap.currentLevelXp;
      statPatch.xpToNext = snap.xpToNext;
    }

    const updated = await PlayerRepository.patchStats(payload.name, statPatch);
    return (updated ?? player) as PlayerProfile;
  },

  async getLeaderboard(player: PlayerProfile) {
    const [leaderboardRaw, higherCount] = await Promise.all([
      PlayerRepository.getLeaderboard(5),
      PlayerRepository.countHigherXp(player.stats?.totalXp ?? 0),
    ]);

    const leaderboard = (leaderboardRaw ?? []).map((entry, index) => {
      const totalXp = entry.stats?.totalXp ?? 0;
      const snap = XpService.levelSnapshot(totalXp);
      return {
        name: entry.name,
        avatar: entry.avatar,
        skill: entry.skill,
        rank: index + 1,
        totalXp,
        level: snap.level,
        rankTier: snap.rank,
        dailyStreak: entry.stats?.dailyStreak ?? 0,
        challengesCompleted: entry.stats?.challengesCompleted ?? 0,
      };
    }) as LeaderboardEntry[];

    const rank = higherCount + 1;

    return { leaderboard, rank };
  },
};
