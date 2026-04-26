import { ArenaController } from "@/src/controllers/arena.controller";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const payload = await ArenaController.problem(id);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch problem";
    return Response.json({ ok: false, error: message }, { status: 404 });
  }
}
