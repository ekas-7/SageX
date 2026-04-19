import { AnalyticsRepository } from "../repositories/analytics.repo";
import { XpService } from "./xp.service";
import { XP_SOURCES, type XpSource } from "../config/xp";
import type {
  LevelDistributionBucket,
  SourceBreakdown,
  TimeSeriesPoint,
  TopPlayer,
} from "../types/analytics";

const SOURCE_LABELS: Record<XpSource, string> = {
  [XP_SOURCES.QUEST_COMPLETE]: "Quest complete",
  [XP_SOURCES.QUEST_PERFECT]: "Perfect quest",
  [XP_SOURCES.ETHICS_SCENARIO]: "Ethics scenario",
  [XP_SOURCES.ETHICS_SCENARIO_PARTIAL]: "Ethics (partial)",
  [XP_SOURCES.VIBE_SUBMIT]: "Vibe submission",
  [XP_SOURCES.VIBE_VOTE_RECEIVED]: "Vibe upvote",
  [XP_SOURCES.DAILY_LOGIN]: "Daily login",
  [XP_SOURCES.STREAK_MILESTONE]: "Streak milestone",
  [XP_SOURCES.ONBOARDING_COMPLETE]: "Onboarding",
  [XP_SOURCES.FIELD_TRACK_STEP]: "Field track",
  [XP_SOURCES.SIDE_QUEST]: "Side quest",
  [XP_SOURCES.ARENA_SOLVED]: "Arena solved",
  [XP_SOURCES.ARENA_PARTIAL]: "Arena (partial)",
  [XP_SOURCES.MANUAL_GRANT]: "Manual grant",
};

export const AnalyticsService = {
  labelForSource(source: string): string {
    return SOURCE_LABELS[source as XpSource] ?? source;
  },

  /** Pad a time series so every day in [days] window has an entry. */
  fillTimeSeries(
    rows: Array<{ date: string; xp: number; events: number }>,
    days: number,
    now: Date
  ): TimeSeriesPoint[] {
    const map = new Map(rows.map((r) => [r.date, r]));
    const out: TimeSeriesPoint[] = [];
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - (days - 1));
    for (let i = 0; i < days; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      const hit = map.get(key);
      out.push({
        date: key,
        xp: hit?.xp ?? 0,
        events: hit?.events ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  },

  decorateSources(
    rows: Array<{ source: string; count: number; xp: number }>
  ): SourceBreakdown[] {
    return rows.map((r) => ({
      source: r.source,
      label: this.labelForSource(r.source),
      count: r.count,
      xp: r.xp,
    }));
  },

  decoratePlayers(
    players: Array<{
      name: string;
      avatar?: string;
      stats?: {
        totalXp?: number;
        level?: number;
        dailyStreak?: number;
        challengesCompleted?: number;
      };
    }>
  ): TopPlayer[] {
    return players.map((p) => {
      const totalXp = p.stats?.totalXp ?? 0;
      const snap = XpService.levelSnapshot(totalXp);
      return {
        name: p.name,
        avatar: p.avatar,
        level: p.stats?.level ?? snap.level,
        rank: snap.rank,
        totalXp,
        dailyStreak: p.stats?.dailyStreak ?? 0,
        challengesCompleted: p.stats?.challengesCompleted ?? 0,
      };
    });
  },

  async loadAll(days = 14) {
    const now = new Date();
    const [
      playerCounts,
      xpTotals,
      levelAgg,
      rawSeries,
      rawSources,
      levelDist,
      rawTopPlayers,
      content,
    ] = await Promise.all([
      AnalyticsRepository.playerCounts(now),
      AnalyticsRepository.xpTotals(now),
      AnalyticsRepository.levelAggregates(),
      AnalyticsRepository.xpTimeSeries(days, now),
      AnalyticsRepository.topSources(10),
      AnalyticsRepository.levelDistribution(),
      AnalyticsRepository.topPlayers(10),
      AnalyticsRepository.contentCounts(),
    ]);

    const xpOverTime = this.fillTimeSeries(rawSeries, days, now);
    const topSources = this.decorateSources(rawSources);
    const topPlayers = this.decoratePlayers(
      rawTopPlayers as unknown as Parameters<
        typeof AnalyticsService.decoratePlayers
      >[0]
    );
    const distribution: LevelDistributionBucket[] = levelDist;

    return {
      now,
      playerCounts,
      xpTotals,
      levelAgg,
      xpOverTime,
      topSources,
      distribution,
      topPlayers,
      content,
    };
  },
};
