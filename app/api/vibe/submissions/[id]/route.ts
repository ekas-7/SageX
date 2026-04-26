import { VibeController } from "@/src/controllers/vibe.controller";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const payload = await VibeController.getSubmission(request, id);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submission";
    return Response.json({ error: message }, { status: 500 });
  }
}
