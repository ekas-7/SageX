import { connectToDatabase } from "../lib/db";
import { VibePromptModel } from "../models/vibePrompt.model";

export const VibePromptRepository = {
  async findByDateKey(dateKey: string) {
    await connectToDatabase();
    return VibePromptModel.findOne({ dateKey }).lean();
  },
  async create(data: {
    dateKey: string;
    title: string;
    description: string;
    buckets: string[];
  }) {
    await connectToDatabase();
    return VibePromptModel.create(data);
  },
};
