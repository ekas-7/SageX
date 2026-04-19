import { XpController } from "@/src/controllers/xp.controller";

export async function GET(request: Request) {
  try {
    const payload = await XpController.summary(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load XP summary";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
