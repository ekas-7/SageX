import { VibePromptService } from "../services/vibePrompt.service";
import { VibeSubmissionService } from "../services/vibeSubmission.service";
import { VibeVoteService } from "../services/vibeVote.service";
import { VibeLeaderboardService } from "../services/vibeLeaderboard.service";

export const VibeOrchestrator = {
  async getTodayPrompt() {
    return VibePromptService.getOrCreateTodayPrompt();
  },
  async createPrompt(payload: {
    dateKey?: string;
    title: string;
    description: string;
    buckets: string[];
  }) {
    return VibePromptService.createPrompt(payload);
  },
  async submit(payload: {
    promptId: string;
    authorName: string;
    title: string;
    description?: string;
    code: { html: string; css: string; js: string };
  }) {
    return VibeSubmissionService.createSubmission(payload);
  },
  async getSubmission(id: string) {
    return VibeSubmissionService.getSubmission(id);
  },
  async listSubmissions(promptId: string, limit = 20) {
    return VibeSubmissionService.getSubmissionsByPrompt(promptId, limit);
  },
  async vote(payload: { submissionId: string; voterId: string }) {
    return VibeVoteService.vote(payload);
  },
  async getLeaderboard(promptId: string, limit = 10) {
    return VibeLeaderboardService.getLeaderboard(promptId, limit);
  },
};
