import { PlayerController } from "@/src/controllers/player.controller";

export async function GET(request: Request) {
  try {
    const result = await PlayerController.checkPilotNameAvailable(request);
    const status = "error" in result && !result.available && result.error === "Name is required" ? 400 : 200;
    return Response.json(result, { status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check name";
    return Response.json(
      { available: false, error: message },
      { status: 500 }
    );
  }
}
