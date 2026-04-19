import { XpEventModel } from "../models/xpEvent.model";
import { connectToDatabase } from "../lib/db";
import type { XpEventRecord } from "../types/xp";

export const XpEventRepository = {
  async create(event: Omit<XpEventRecord, "createdAt">) {
    await connectToDatabase();
    return XpEventModel.create(event);
  },

  async findBySourceRef(playerId: string, source: string, sourceRef: string) {
    await connectToDatabase();
    return XpEventModel.findOne({ playerId, source, sourceRef }).lean();
  },

  async recentForPlayer(playerId: string, limit = 10) {
    await connectToDatabase();
    const docs = await XpEventModel.find({ playerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs as unknown as XpEventRecord[];
  },

  async sumXpSince(playerId: string, since: Date) {
    await connectToDatabase();
    const result = await XpEventModel.aggregate<{ total: number }>([
      { $match: { playerId, createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);
    return result[0]?.total ?? 0;
  },
};
