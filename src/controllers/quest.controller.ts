import { questQuerySchema } from "../vali/quest.vali";
import { QuestOrchestrator } from "../orchestrators/quest.orchestrator";

export const QuestController = {
  async getQuest(request: Request, templateId: string) {
    const { searchParams } = new URL(request.url);
    const payload = questQuerySchema.parse({
      seed: searchParams.get("seed") ?? undefined,
      templateId,
    });

    const quest = await QuestOrchestrator.getQuestBySeed(
      payload.seed,
      payload.templateId
    );

    return quest;
  },
};
