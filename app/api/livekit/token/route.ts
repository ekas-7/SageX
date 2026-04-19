import { AccessToken } from "livekit-server-sdk";

import { env } from "@/src/config/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const room = typeof body?.room === "string" ? body.room.trim() : "";
    const identity = typeof body?.identity === "string" ? body.identity.trim() : "";

    if (!room || !identity) {
      return Response.json(
        { error: "Room and identity are required." },
        { status: 400 }
      );
    }

    if (!env.livekitApiKey || !env.livekitApiSecret) {
      return Response.json(
        { error: "LiveKit server credentials are missing." },
        { status: 500 }
      );
    }

    const at = new AccessToken(env.livekitApiKey, env.livekitApiSecret, {
      identity,
    });
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // livekit-server-sdk v2: toJwt() is async
    const token = await at.toJwt();

    return Response.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to issue token";
    return Response.json({ error: message }, { status: 500 });
  }
}
