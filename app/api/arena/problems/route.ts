import { ArenaController } from "@/src/controllers/arena.controller";

export async function GET(request: Request) {
  try {
    const payload = await ArenaController.list(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list problems";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
