import { ArenaController } from "@/src/controllers/arena.controller";

export const maxDuration = 60; // grading can take multiple LLM calls

export async function POST(request: Request) {
  try {
    const payload = await ArenaController.submit(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit";
    const status = message.includes("arena attempts")
      ? 429
      : message.includes("not found")
        ? 404
        : 400;
    return Response.json({ ok: false, error: message }, { status });
  }
}
