import { ArenaController } from "@/src/controllers/arena.controller";

export async function GET(request: Request) {
  try {
    const payload = await ArenaController.next(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch problem";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
