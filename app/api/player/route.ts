import { PlayerController } from "@/src/controllers/player.controller";

function isNameTakenError(message: string) {
  return message.includes("already taken");
}

export async function POST(request: Request) {
  try {
    const payload = await PlayerController.upsertProfile(request);
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save player";
    const status = isNameTakenError(message) ? 409 : 500;
    return Response.json({ error: message, code: status === 409 ? "NAME_TAKEN" : undefined }, { status });
  }
}
