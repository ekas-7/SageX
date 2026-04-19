import { VibeController } from "@/src/controllers/vibe.controller";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const payload = await VibeController.getSubmission(request, params.id);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submission";
    return Response.json({ error: message }, { status: 500 });
  }
}
