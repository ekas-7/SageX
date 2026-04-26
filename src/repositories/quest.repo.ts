import { QuestModel } from "../models/quest.model";
import { connectToDatabase } from "../lib/db";
import type { QuestRecord } from "../types/quest";

export const QuestRepository = {
  async findBySeed(seed: number, templateId: string) {
    await connectToDatabase();
    const result = await QuestModel.findOne({ seed, templateId }).lean();
    return result as unknown as QuestRecord | null;
  },
  async create(data: {
    seed: number;
    templateId: string;
    difficulty: string;
    type: string;
    payload: unknown;
  }) {
    await connectToDatabase();
    return QuestModel.create(data);
  },
};
