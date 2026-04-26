import { vibePrompts } from "../data/vibePrompts";
import { VibePromptRepository } from "../repositories/vibePrompt.repo";

const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const dayOfYear = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

export const VibePromptService = {
  getDateKey,
  async getOrCreateTodayPrompt() {
    const dateKey = getDateKey();
    const existing = await VibePromptRepository.findByDateKey(dateKey);
    if (existing) return existing;

    const index = dayOfYear(new Date()) % vibePrompts.length;
    const template = vibePrompts[index];
    return VibePromptRepository.create({
      dateKey,
      title: template.title,
      description: template.description,
      buckets: template.buckets,
    });
  },
  async createPrompt(payload: {
    dateKey?: string;
    title: string;
    description: string;
    buckets: string[];
  }) {
    const dateKey = payload.dateKey ?? getDateKey();
    return VibePromptRepository.create({
      dateKey,
      title: payload.title,
      description: payload.description,
      buckets: payload.buckets,
    });
  },
};
