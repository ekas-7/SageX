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

/**
 * XpOrchestrator — coordinates XP awards across:
 *  - player profile (streak, daily cap, totalXp, level)
 *  - xp event log (audit trail + idempotency)
 *  - milestone bonuses (cascading streak rewards)
 *
 * Flow: validate source → compute multipliers → idempotency check →
 *       persist event → patch player stats → check level-up / milestones →
 *       return enriched result.
 */
export const XpOrchestrator = {
  async award(input: XpAwardInput): Promise<XpAwardResult> {
    const player = await PlayerRepository.findByName(input.name);
    if (!player) {
      throw new Error(`Player "${input.name}" not found`);
    }

    const stats = player.stats ?? ({} as typeof player.stats);

    // ── Idempotency: reject duplicate sourceRef awards within window ──
    if (input.sourceRef) {
      const existing = await XpEventRepository.findBySourceRef(
        input.name,
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
          playerName: input.name,
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
          playerName: input.name,
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
        // Duplicate key race — treat as duplicate rather than double-award.
        if ((err as { code?: number }).code === 11000) {
          return this.buildDuplicateResult(player);
        }
        throw err;
      }
    }

    // ── Patch player stats ──
    await PlayerRepository.patchStats(input.name, {
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

    // ── Streak milestone cascade (fire-and-forget, but awaited) ──
    // Only fire milestones when the *primary* source wasn't itself a milestone
    // award, to prevent infinite recursion.
    if (input.source !== XP_SOURCES.STREAK_MILESTONE) {
      await this.processMilestones(input.name);
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

  async processMilestones(playerName: string) {
    const player = await PlayerRepository.findByName(playerName);
    if (!player) return;
    const streak = player.stats?.dailyStreak ?? 1;
    const claimed = player.stats?.milestonesClaimed ?? [];
    const newOnes = XpService.newMilestones(streak, claimed);
    for (const milestone of newOnes) {
      // Grant a flat bonus scaled by which milestone tier.
      const tierIndex = STREAK_MILESTONES.indexOf(milestone);
      const bonusBase =
        XP_BASE_REWARDS[XP_SOURCES.STREAK_MILESTONE] * (1 + tierIndex * 0.5);
      await this.award({
        name: playerName,
        source: XP_SOURCES.STREAK_MILESTONE,
        sourceRef: `streak-${milestone}`,
        overrideBase: Math.round(bonusBase),
        metadata: { milestone },
      });
      await PlayerRepository.pushMilestone(playerName, milestone);
    }
  },

  async getSummary(playerName: string): Promise<XpSummary> {
    const player = await PlayerRepository.findByName(playerName);
    if (!player) {
      throw new Error(`Player "${playerName}" not found`);
    }
    const stats = player.stats ?? ({} as typeof player.stats);
    const snapshot = XpService.levelSnapshot(stats.totalXp ?? 0);
    const recentEvents = await XpEventRepository.recentForPlayer(playerName, 10);
    const dailyXpEarned = XpService.shouldResetDailyXp(stats.dailyXpResetAt)
      ? 0
      : stats.dailyXpEarned ?? 0;
    return {
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
      dailyCapHit: dailyXpEarned >= (stats.dailyXpEarned ?? 0) && dailyXpEarned > 0,
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

  buildDuplicateResult(player: {
    stats?: {
      level?: number;
      totalXp?: number;
    };
  }): XpAwardResult {
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

  /**
   * Convenience helper used by other orchestrators (quest, ethics, vibe)
   * so they don't have to remember every source key.
   */
  sources(): Record<string, XpSource> {
    return { ...XP_SOURCES };
  },
};
