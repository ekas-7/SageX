import { VibeController } from "@/src/controllers/vibe.controller";

export async function GET(request: Request) {
  try {
    const payload = await VibeController.listSubmissions(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submissions";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await VibeController.submit(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit entry";
    return Response.json({ error: message }, { status: 500 });
  }
}
