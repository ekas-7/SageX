import type { QuestPayload, QuestResponse } from "../types/quest";
import { getTemplateById } from "../data/questTemplates";
import { AiService } from "../services/ai.service";
import { QuestService } from "../services/quest.service";

type DatasetRow = { input: string; output: string };

const isDatasetRow = (row: unknown): row is DatasetRow => {
  return (
    typeof row === "object" &&
    row !== null &&
    "input" in row &&
    "output" in row
  );
};

const isValidPayload = (payload: unknown): payload is QuestPayload => {
  if (typeof payload !== "object" || payload === null) return false;
  const record = payload as QuestPayload;
  if (typeof record.story !== "string") return false;
  if (!Array.isArray(record.dataset)) return false;
  if (!record.dataset.every((row) => isDatasetRow(row))) return false;
  if (typeof record.question !== "string") return false;
  if (!Array.isArray(record.options) || record.options.length < 2) {
    return false;
  }
  if (typeof record.answerIndex !== "number") return false;
  return record.answerIndex >= 0 && record.answerIndex < record.options.length;
};

export const QuestOrchestrator = {
  async getQuestBySeed(seed: number, templateId: string) {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error("Quest template not found");
    }

    const cached = await QuestService.getQuest(seed, templateId);
    if (cached) {
      return {
        questId: cached._id.toString(),
        seed,
        templateId,
        difficulty: template.difficulty,
        type: template.type,
        ...(cached.payload as QuestPayload),
      } satisfies QuestResponse;
    }

    const aiPayload = await AiService.generateQuest(template, seed);
    const payload = isValidPayload(aiPayload)
      ? aiPayload
      : template.fallback(seed);

    const saved = await QuestService.saveQuest({
      seed,
      templateId,
      difficulty: template.difficulty,
      type: template.type,
      payload,
    });

    return {
      questId: saved._id.toString(),
      seed,
      templateId,
      difficulty: template.difficulty,
      type: template.type,
      ...(payload as QuestPayload),
    } satisfies QuestResponse;
  },
};
