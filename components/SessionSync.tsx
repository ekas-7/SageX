"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { writeStoredPlayer } from "@/src/lib/playerClient";

/**
 * When the user signs in with OAuth, mirror session identity into localStorage
 * so existing client flows (playerId in API calls) stay consistent.
 */
export function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.playerId) return;
    const name = session.user.name?.trim() || "Pilot";
    writeStoredPlayer({
      playerId: session.user.playerId,
      name,
      avatar: session.user.image ?? undefined,
    });
  }, [session, status]);

  return null;
}
