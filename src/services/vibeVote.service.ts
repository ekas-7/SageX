import { VibeVoteRepository } from "../repositories/vibeVote.repo";
import { VibeSubmissionRepository } from "../repositories/vibeSubmission.repo";

export const VibeVoteService = {
  async vote(payload: { submissionId: string; voterId: string }) {
    try {
      await VibeVoteRepository.create(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("duplicate") || message.includes("E11000")) {
        return { alreadyVoted: true };
      }
      throw error;
    }

    const updated = await VibeSubmissionRepository.incrementUpvotes(
      payload.submissionId,
      1
    );

    return { alreadyVoted: false, submission: updated };
  },
};
