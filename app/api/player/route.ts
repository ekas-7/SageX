import { PlayerController } from "@/src/controllers/player.controller";

export async function POST(request: Request) {
  try {
    const payload = await PlayerController.upsertProfile(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save player";
    return Response.json({ error: message }, { status: 500 });
  }
}
