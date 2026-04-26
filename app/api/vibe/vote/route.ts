import { VibeController } from "@/src/controllers/vibe.controller";

export async function POST(request: Request) {
  try {
    const payload = await VibeController.vote(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to vote";
    return Response.json({ error: message }, { status: 500 });
  }
}
