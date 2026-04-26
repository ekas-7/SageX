import { QuestRepository } from "../repositories/quest.repo";

export const QuestService = {
  async getQuest(seed: number, templateId: string) {
    return QuestRepository.findBySeed(seed, templateId);
  },
  async saveQuest(data: {
    seed: number;
    templateId: string;
    difficulty: string;
    type: string;
    payload: unknown;
  }) {
    return QuestRepository.create(data);
  },
};
