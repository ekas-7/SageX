import { connectToDatabase } from "../lib/db";
import { VibeVoteModel } from "../models/vibeVote.model";

export const VibeVoteRepository = {
  async create(data: { submissionId: string; voterId: string }) {
    await connectToDatabase();
    return VibeVoteModel.create(data);
  },
};
