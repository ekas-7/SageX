import { connectToDatabase } from "../lib/db";
import { ArenaProblemModel } from "../models/arenaProblem.model";
import { ArenaAttemptModel } from "../models/arenaAttempt.model";
import type { ArenaProblem, ArenaDifficulty } from "../types/arena";

export const ArenaRepository = {
  async findProblemById(problemId: string) {
    await connectToDatabase();
    return (await ArenaProblemModel.findOne({
      problemId,
    }).lean()) as unknown as ArenaProblem | null;
  },

  async findProblemBySlug(slug: string) {
    await connectToDatabase();
    return (await ArenaProblemModel.findOne({
      slug,
    }).lean()) as unknown as ArenaProblem | null;
  },

  async listProblems(limit = 30) {
    await connectToDatabase();
    return (await ArenaProblemModel.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()) as unknown as ArenaProblem[];
  },

  async listByDifficulty(difficulty: ArenaDifficulty, limit = 20) {
    await connectToDatabase();
    return (await ArenaProblemModel.find({ difficulty })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()) as unknown as ArenaProblem[];
  },

  async createProblem(problem: ArenaProblem) {
    await connectToDatabase();
    return ArenaProblemModel.create(problem);
  },

  async incrementProblemCounters(
    problemId: string,
    { attempts = 0, solved = 0 }: { attempts?: number; solved?: number }
  ) {
    await connectToDatabase();
    return ArenaProblemModel.updateOne(
      { problemId },
      { $inc: { attemptCount: attempts, solvedCount: solved } }
    );
  },

  async countAttemptsInWindow(playerId: string, sinceMs: number) {
    await connectToDatabase();
    const since = new Date(Date.now() - sinceMs);
    return ArenaAttemptModel.countDocuments({
      playerId,
      createdAt: { $gte: since },
    });
  },

  async saveAttempt(attempt: {
    playerId: string;
    problemId: string;
    prompt: string;
    score: number;
    passed: boolean;
    results: Array<{
      input: string;
      output: string;
      caseScore: number;
      feedback: string;
    }>;
    overallFeedback: string;
    model: string;
  }) {
    await connectToDatabase();
    return ArenaAttemptModel.create(attempt);
  },

  async recentAttempts(playerId: string, limit = 10) {
    await connectToDatabase();
    return ArenaAttemptModel.find({ playerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },
};
