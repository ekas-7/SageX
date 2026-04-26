import { PlayerController } from "@/src/controllers/player.controller";

export async function POST(request: Request) {
  try {
    const payload = await PlayerController.rehydrate(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to rehydrate player";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
