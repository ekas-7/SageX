import { connectToDatabase } from "../lib/db";
import { VibeSubmissionModel } from "../models/vibeSubmission.model";

export const VibeSubmissionRepository = {
  async create(data: {
    promptId: string;
    authorName: string;
    title: string;
    description?: string;
    code: { html: string; css: string; js: string };
  }) {
    await connectToDatabase();
    return VibeSubmissionModel.create({
      promptId: data.promptId,
      authorName: data.authorName,
      title: data.title,
      description: data.description,
      code: data.code,
    });
  },
  async findById(id: string) {
    await connectToDatabase();
    return VibeSubmissionModel.findById(id).lean();
  },
  async findByPrompt(promptId: string, limit = 20) {
    await connectToDatabase();
    return VibeSubmissionModel.find({ promptId })
      .sort({ "stats.upvotes": -1, createdAt: -1 })
      .limit(limit)
      .lean();
  },
  async incrementUpvotes(submissionId: string, delta: number) {
    await connectToDatabase();
    return VibeSubmissionModel.findByIdAndUpdate(
      submissionId,
      { $inc: { "stats.upvotes": delta } },
      { new: true }
    ).lean();
  },
};
