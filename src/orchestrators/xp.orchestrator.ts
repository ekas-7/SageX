import {
  IDEMPOTENCY_WINDOW_MS,
  STREAK_MILESTONES,
  XP_BASE_REWARDS,
  XP_SOURCES,
  type XpSource,
} from "../config/xp";
import { PlayerRepository } from "../repositories/player.repo";
import { XpEventRepository } from "../repositories/xpEvent.repo";
import { XpService } from "../services/xp.service";
import type {
  XpAwardInput,
  XpAwardResult,
  XpEventRecord,
  XpSummary,
} from "../types/xp";
import type { PlayerProfile } from "../types/player";

/**
 * XpOrchestrator — all XP awards flow through this. Keyed by playerId.
 *
 * If a client awards XP for a playerId we don't have on record yet (e.g.
 * because the onboarding upsert call failed silently), we create a
 * best-effort placeholder player so their XP is never lost. The display
 * name, if provided, is used; otherwise defaults to "Pilot".
 */
export const XpOrchestrator = {
  async award(input: XpAwardInput): Promise<XpAwardResult> {
    if (!input.playerId) {
      throw new Error("playerId is required to award XP");
    }

    let player = await PlayerRepository.findById(input.playerId);
    if (!player) {
      // Auto-heal: create the player from the minimal info we have so
      // this XP award (and any subsequent ones) land in their profile
      // instead of being lost.
      player = (await PlayerRepository.upsertById({
        playerId: input.playerId,
        name: input.name?.trim() || "Pilot",
      })) as PlayerProfile;
    }

    const stats = player.stats ?? ({} as PlayerProfile["stats"]);

    // ── Idempotency: reject duplicate sourceRef awards within window ──
    if (input.sourceRef) {
      const existing = await XpEventRepository.findBySourceRef(
        input.playerId,
        input.source,
        input.sourceRef
      );
      if (existing) {
        const createdAt = (existing as { createdAt?: Date }).createdAt;
        const age = createdAt
          ? Date.now() - new Date(createdAt).getTime()
          : Number.POSITIVE_INFINITY;
        if (age < IDEMPOTENCY_WINDOW_MS) {
          return this.buildDuplicateResult(player);
        }
      }
    }

    // ── Reset daily counter if day rolled over ──
    const dailyXpEarned = XpService.shouldResetDailyXp(stats.dailyXpResetAt)
      ? 0
      : stats.dailyXpEarned ?? 0;

    // ── Compute award ──
    const calc = XpService.computeAward({
      source: input.source,
      base: input.overrideBase,
      streakDays: stats.dailyStreak ?? 1,
      difficulty: input.difficulty,
      dailyXpEarned,
    });

    const levelBefore = stats.level ?? 1;
    const totalXpBefore = stats.totalXp ?? 0;
    const totalXpAfter = totalXpBefore + calc.finalAmount;
    const snapshot = XpService.levelSnapshot(totalXpAfter);
    const leveledUp = snapshot.level > levelBefore;

    // ── Persist event FIRST (so idempotency index holds) ──
    let eventRecord: XpEventRecord | undefined;
    if (calc.finalAmount > 0) {
      try {
        const doc = await XpEventRepository.create({
          playerId: input.playerId,
          playerName: player.name,
          source: input.source,
          sourceRef: input.sourceRef,
          baseAmount: calc.base,
          multiplier: calc.multiplier,
          finalAmount: calc.finalAmount,
          difficulty: input.difficulty,
          levelBefore,
          levelAfter: snapshot.level,
          totalXpAfter,
          metadata: input.metadata,
        });
        eventRecord = {
          playerId: input.playerId,
          playerName: player.name,
          source: input.source,
          sourceRef: input.sourceRef,
          baseAmount: calc.base,
          multiplier: calc.multiplier,
          finalAmount: calc.finalAmount,
          difficulty: input.difficulty,
          levelBefore,
          levelAfter: snapshot.level,
          totalXpAfter,
          metadata: input.metadata,
          createdAt: (doc as { createdAt?: Date }).createdAt?.toISOString(),
        };
      } catch (err) {
        if ((err as { code?: number }).code === 11000) {
          return this.buildDuplicateResult(player);
        }
        throw err;
      }
    }

    // ── Patch player stats ──
    await PlayerRepository.patchStats(input.playerId, {
      totalXp: totalXpAfter,
      level: snapshot.level,
      currentLevelXp: snapshot.currentLevelXp,
      xpToNext: snapshot.xpToNext,
      dailyXpEarned: dailyXpEarned + calc.finalAmount,
      dailyXpResetAt: XpService.shouldResetDailyXp(stats.dailyXpResetAt)
        ? new Date()
        : stats.dailyXpResetAt ?? new Date(),
      lastActiveAt: new Date(),
    });

    // ── Streak milestone cascade ──
    if (input.source !== XP_SOURCES.STREAK_MILESTONE) {
      await this.processMilestones(input.playerId, player.name);
    }

    return {
      awarded: calc.finalAmount,
      base: calc.base,
      multiplier: calc.multiplier,
      streakBonus: calc.streakBonus,
      difficultyMultiplier: calc.difficultyMultiplier,
      softCapped: calc.softCapped,
      duplicate: false,
      levelBefore,
      levelAfter: snapshot.level,
      leveledUp,
      levelsGained: Math.max(0, snapshot.level - levelBefore),
      totalXp: totalXpAfter,
      currentLevelXp: snapshot.currentLevelXp,
      xpToNext: snapshot.xpToNext,
      progressPct: snapshot.progressPct,
      rank: snapshot.rank,
      event: eventRecord,
    };
  },

  async processMilestones(playerId: string, playerName: string) {
    const player = await PlayerRepository.findById(playerId);
    if (!player) return;
    const streak = player.stats?.dailyStreak ?? 1;
    const claimed = player.stats?.milestonesClaimed ?? [];
    const newOnes = XpService.newMilestones(streak, claimed);
    for (const milestone of newOnes) {
      const tierIndex = STREAK_MILESTONES.indexOf(milestone);
      const bonusBase =
        XP_BASE_REWARDS[XP_SOURCES.STREAK_MILESTONE] * (1 + tierIndex * 0.5);
      await this.award({
        playerId,
        name: playerName,
        source: XP_SOURCES.STREAK_MILESTONE,
        sourceRef: `streak-${milestone}`,
        overrideBase: Math.round(bonusBase),
        metadata: { milestone },
      });
      await PlayerRepository.pushMilestone(playerId, milestone);
    }
  },

  async getSummary(playerId: string): Promise<XpSummary> {
    const player = await PlayerRepository.findById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    const stats = player.stats ?? ({} as PlayerProfile["stats"]);
    const snapshot = XpService.levelSnapshot(stats.totalXp ?? 0);
    const recentEvents = await XpEventRepository.recentForPlayer(playerId, 10);
    const dailyXpEarned = XpService.shouldResetDailyXp(stats.dailyXpResetAt)
      ? 0
      : stats.dailyXpEarned ?? 0;
    return {
      playerId: player.playerId,
      name: player.name,
      totalXp: stats.totalXp ?? 0,
      level: snapshot.level,
      currentLevelXp: snapshot.currentLevelXp,
      xpToNext: snapshot.xpToNext,
      progressPct: snapshot.progressPct,
      rank: snapshot.rank,
      dailyStreak: stats.dailyStreak ?? 1,
      streakMultiplier: XpService.streakMultiplier(stats.dailyStreak ?? 1),
      dailyXpEarned,
      dailyCapHit:
        dailyXpEarned >= (stats.dailyXpEarned ?? 0) && dailyXpEarned > 0,
      recentEvents: recentEvents.map((event) => {
        const raw = (event as { createdAt?: unknown }).createdAt;
        const createdAt =
          raw instanceof Date
            ? raw.toISOString()
            : typeof raw === "string"
              ? raw
              : undefined;
        return { ...event, createdAt };
      }) as XpEventRecord[],
    };
  },

  buildDuplicateResult(player: PlayerProfile): XpAwardResult {
    const total = player.stats?.totalXp ?? 0;
    const snap = XpService.levelSnapshot(total);
    const level = player.stats?.level ?? snap.level;
    return {
      awarded: 0,
      base: 0,
      multiplier: 1,
      streakBonus: 0,
      difficultyMultiplier: 1,
      softCapped: false,
      duplicate: true,
      levelBefore: level,
      levelAfter: level,
      leveledUp: false,
      levelsGained: 0,
      totalXp: total,
      currentLevelXp: snap.currentLevelXp,
      xpToNext: snap.xpToNext,
      progressPct: snap.progressPct,
      rank: snap.rank,
    };
  },

  sources(): Record<string, XpSource> {
    return { ...XP_SOURCES };
  },
};
