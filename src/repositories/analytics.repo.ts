import { connectToDatabase } from "../lib/db";
import { PlayerModel } from "../models/player.model";
import { XpEventModel } from "../models/xpEvent.model";
import { VibeSubmissionModel } from "../models/vibeSubmission.model";
import { VibeVoteModel } from "../models/vibeVote.model";
import { QuestModel } from "../models/quest.model";

/**
 * Aggregation helpers for the analytics dashboard.
 * All methods are read-only and hit Mongo directly through Mongoose models.
 */
export const AnalyticsRepository = {
  async playerCounts(now: Date) {
    await connectToDatabase();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [players, activeToday, active7d] = await Promise.all([
      PlayerModel.countDocuments({}),
      PlayerModel.countDocuments({ "stats.lastActiveAt": { $gte: startOfToday } }),
      PlayerModel.countDocuments({ "stats.lastActiveAt": { $gte: sevenDaysAgo } }),
    ]);

    return { players, activeToday, active7d };
  },

  async xpTotals(now: Date) {
    await connectToDatabase();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [[totalsAll], [totals24h], countAll] = await Promise.all([
      XpEventModel.aggregate<{ _id: null; xp: number }>([
        { $group: { _id: null, xp: { $sum: "$finalAmount" } } },
      ]),
      XpEventModel.aggregate<{ _id: null; xp: number }>([
        { $match: { createdAt: { $gte: last24h } } },
        { $group: { _id: null, xp: { $sum: "$finalAmount" } } },
      ]),
      XpEventModel.countDocuments({}),
    ]);

    return {
      totalXpAwarded: totalsAll?.xp ?? 0,
      totalXpAwarded24h: totals24h?.xp ?? 0,
      xpEvents: countAll,
    };
  },

  async levelAggregates() {
    await connectToDatabase();
    const pipeline = [
      {
        $group: {
          _id: null,
          avgLevel: { $avg: "$stats.level" },
          maxLevel: { $max: "$stats.level" },
        },
      },
    ];
    const result = await PlayerModel.aggregate<{
      avgLevel: number;
      maxLevel: number;
    }>(pipeline);
    return {
      avgLevel: result[0]?.avgLevel ?? 0,
      maxLevel: result[0]?.maxLevel ?? 0,
    };
  },

  async xpTimeSeries(days: number, now: Date) {
    await connectToDatabase();
    const since = new Date(now);
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const rows = await XpEventModel.aggregate<{
      _id: string;
      xp: number;
      events: number;
    }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          xp: { $sum: "$finalAmount" },
          events: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return rows.map((r) => ({ date: r._id, xp: r.xp, events: r.events }));
  },

  async topSources(limit = 8) {
    await connectToDatabase();
    const rows = await XpEventModel.aggregate<{
      _id: string;
      count: number;
      xp: number;
    }>([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
          xp: { $sum: "$finalAmount" },
        },
      },
      { $sort: { xp: -1 } },
      { $limit: limit },
    ]);
    return rows.map((r) => ({ source: r._id, count: r.count, xp: r.xp }));
  },

  async levelDistribution() {
    await connectToDatabase();
    const bands = [
      { band: "1-4", min: 1, max: 4 },
      { band: "5-9", min: 5, max: 9 },
      { band: "10-19", min: 10, max: 19 },
      { band: "20-34", min: 20, max: 34 },
      { band: "35-49", min: 35, max: 49 },
      { band: "50+", min: 50, max: Number.POSITIVE_INFINITY },
    ];

    const results = await Promise.all(
      bands.map(async (b) => {
        const filter: Record<string, unknown> =
          b.max === Number.POSITIVE_INFINITY
            ? { "stats.level": { $gte: b.min } }
            : { "stats.level": { $gte: b.min, $lte: b.max } };
        const count = await PlayerModel.countDocuments(filter);
        return { band: b.band, count };
      })
    );
    return results;
  },

  async topPlayers(limit = 10) {
    await connectToDatabase();
    return PlayerModel.find({})
      .sort({ "stats.totalXp": -1, "stats.level": -1 })
      .limit(limit)
      .lean();
  },

  async contentCounts() {
    await connectToDatabase();
    const [vibeSubmissions, vibeVotes, quests] = await Promise.all([
      VibeSubmissionModel.countDocuments({}),
      VibeVoteModel.countDocuments({}),
      QuestModel.countDocuments({}),
    ]);
    return { vibeSubmissions, vibeVotes, quests };
  },
};
