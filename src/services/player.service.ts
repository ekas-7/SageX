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
 * PlayerService — profile operations keyed by stable playerId.
 * Identity is now:
 *   - playerId (UUID, required, unique) → true primary key
 *   - name (display only, may be duplicated across players)
 */
export const PlayerService = {
  /**
   * Idempotent sign-in. Upserts the player by playerId, refreshes their
   * profile fields, advances the daily streak, and returns the full profile.
   */
  async signIn(payload: {
    playerId: string;
    name: string;
    avatar?: string;
    skill?: string;
    interests?: string[];
  }) {
    if (!payload.playerId) {
      throw new Error("playerId is required");
    }

    // Atomic upsert so two onboarding calls can't race-duplicate a player.
    const upserted = await PlayerRepository.upsertById({
      playerId: payload.playerId,
      name: payload.name,
      avatar: payload.avatar,
      skill: payload.skill,
      interests: payload.interests,
    });

    const now = new Date();
    const lastStreakDate = upserted.stats?.lastStreakDate
      ? new Date(upserted.stats.lastStreakDate)
      : undefined;
    let dailyStreak = upserted.stats?.dailyStreak ?? 1;

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

    const patched = await PlayerRepository.patchStats(payload.playerId, {
      dailyStreak,
      lastStreakDate: now,
      lastActiveAt: now,
    });

    return (patched ?? upserted) as PlayerProfile;
  },

  /**
   * Legacy helper: rehydrate by name only (used once when a legacy client
   * has `sagex.player` but not `sagex.playerId`). Returns the first match
   * or null. Callers must persist the returned playerId back to localStorage.
   */
  async rehydrateByName(name: string) {
    const player = await PlayerRepository.findByName(name);
    return player ?? null;
  },

  /**
   * Legacy challenge-counter updates. XP flows should go through
   * XpOrchestrator.award, not here.
   */
  async updateStats(payload: {
    playerId: string;
    deltaChallenges?: number;
    deltaXp?: number;
  }) {
    const player = await PlayerRepository.findById(payload.playerId);
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

    const updated = await PlayerRepository.patchStats(
      payload.playerId,
      statPatch
    );
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
        playerId: entry.playerId,
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
