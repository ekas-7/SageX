import { XpController } from "@/src/controllers/xp.controller";

export async function POST(request: Request) {
  try {
    const payload = await XpController.award(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to award XP";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
