import { VibeController } from "@/src/controllers/vibe.controller";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const payload = await VibeController.embed(request, params.id);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load embed";
    return Response.json({ error: message }, { status: 500 });
  }
}
