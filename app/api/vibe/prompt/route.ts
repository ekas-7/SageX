import { VibeController } from "@/src/controllers/vibe.controller";

export async function GET() {
  try {
    const payload = await VibeController.getPrompt();
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load prompt";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await VibeController.createPrompt(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create prompt";
    return Response.json({ error: message }, { status: 500 });
  }
}
