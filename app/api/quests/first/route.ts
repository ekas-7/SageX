import { QuestController } from "@/src/controllers/quest.controller";

export async function GET(request: Request) {
  try {
    const quest = await QuestController.getQuest(
      request,
      "intro-classification"
    );
    return Response.json(quest);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate quest";
    return Response.json({ error: message }, { status: 500 });
  }
}
