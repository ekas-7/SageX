import { OpencodeController } from "@/src/controllers/opencode.controller";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const payload = await OpencodeController.advise(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get advice";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
