import { PlayerController } from "@/src/controllers/player.controller";

export async function GET(request: Request) {
  try {
    const payload = await PlayerController.getStats(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load stats";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await PlayerController.updateStats(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update stats";
    return Response.json({ error: message }, { status: 500 });
  }
}
