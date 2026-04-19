import { VibeSubmissionRepository } from "../repositories/vibeSubmission.repo";

export const VibeLeaderboardService = {
  async getLeaderboard(promptId: string, limit = 10) {
    return VibeSubmissionRepository.findByPrompt(promptId, limit);
  },
};
