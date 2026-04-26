import { VibeSubmissionRepository } from "../repositories/vibeSubmission.repo";

export const VibeSubmissionService = {
  async createSubmission(payload: {
    promptId: string;
    authorName: string;
    title: string;
    description?: string;
    code: { html: string; css: string; js: string };
  }) {
    return VibeSubmissionRepository.create(payload);
  },
  async getSubmission(id: string) {
    return VibeSubmissionRepository.findById(id);
  },
  async getSubmissionsByPrompt(promptId: string, limit = 20) {
    return VibeSubmissionRepository.findByPrompt(promptId, limit);
  },
};
