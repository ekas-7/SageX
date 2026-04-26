import { AnalyticsService } from "../services/analytics.service";
import type { AnalyticsPayload } from "../types/analytics";

export const AnalyticsOrchestrator = {
  async getGlobalDashboard(days = 14): Promise<AnalyticsPayload> {
    const data = await AnalyticsService.loadAll(days);

    return {
      generatedAt: data.now.toISOString(),
      totals: {
        players: data.playerCounts.players,
        activePlayers7d: data.playerCounts.active7d,
        activePlayersToday: data.playerCounts.activeToday,
        xpEvents: data.xpTotals.xpEvents,
        totalXpAwarded: data.xpTotals.totalXpAwarded,
        totalXpAwarded24h: data.xpTotals.totalXpAwarded24h,
        avgLevel: Math.round((data.levelAgg.avgLevel ?? 0) * 10) / 10,
        maxLevel: data.levelAgg.maxLevel ?? 0,
        vibeSubmissions: data.content.vibeSubmissions,
        vibeVotes: data.content.vibeVotes,
        quests: data.content.quests,
      },
      xpOverTime: data.xpOverTime,
      topSources: data.topSources,
      levelDistribution: data.distribution,
      topPlayers: data.topPlayers,
    };
  },
};
