import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { PlayerOrchestrator } from "../orchestrators/player.orchestrator";
import { PlayerService } from "../services/player.service";
import { PlayerRepository } from "../repositories/player.repo";
import {
  playerProfileUpsertSchema,
  playerRehydrateSchema,
} from "../vali/player.vali";

export const PlayerController = {
  /**
   * POST /api/player — idempotent sign-in. Creates the player on first
   * call, updates profile on subsequent calls. Always returns 200 with
   * the canonical profile.
   *
   * If the request has a valid OAuth session, `playerId` is taken from the
   * session (server-side) so clients cannot spoof another account.
   */
  async upsertProfile(request: Request) {
    const session = await auth();
    const body = (await request.json().catch(() => ({}))) as unknown;
    const merged =
      typeof body === "object" && body !== null
        ? { ...(body as Record<string, unknown>) }
        : {};
    if (session?.user?.playerId) {
      merged.playerId = session.user.playerId;
    }
    const parsed = playerProfileUpsertSchema.safeParse(merged);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues.map((i) => i.message).join("; ") ||
          "Invalid player profile"
      );
    }
    const player = await PlayerOrchestrator.upsertProfile(parsed.data);
    return { ok: true, player };
  },

  /**
   * GET /api/player/check-name — preflight: is this display name free for
   * a *new* player, or for `playerId` if they are updating their own profile.
   * Uses the same case-insensitive rule as `POST /api/player` upsert.
   */
  async checkPilotNameAvailable(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")?.trim() ?? "";
    const clientId = searchParams.get("playerId")?.trim();
    if (!name) {
      return { available: false as const, error: "Name is required" };
    }
    if (name.length > 100) {
      return { available: false as const, error: "Name is too long" };
    }
    const excludeId =
      clientId && clientId.length >= 8
        ? clientId
        : `new-onboarding-${randomUUID()}`;
    const taken = await PlayerRepository.existsOtherPlayerWithName(
      excludeId,
      name
    );
    if (taken) {
      return {
        available: false as const,
        error:
          "This pilot name is already taken. Choose a different callsign.",
      };
    }
    return { available: true as const };
  },

  /**
   * POST /api/player/rehydrate — legacy clients who stored a name but no
   * playerId call this once to find their record by name and adopt its
   * playerId. Returns 200 with the player if found, or `{ ok: true, player: null }`.
   */
  async rehydrate(request: Request) {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = playerRehydrateSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues.map((i) => i.message).join("; ") ||
          "Invalid rehydrate request"
      );
    }
    const player = await PlayerOrchestrator.rehydrateByName(parsed.data.name);
    return { ok: true, player };
  },

  async getStats(request: Request) {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    const name = searchParams.get("name");

    if (!playerId && !name) {
      throw new Error("playerId or name is required");
    }

    const player = playerId
      ? await PlayerRepository.findById(playerId)
      : await PlayerRepository.findByName(name ?? "");

    if (!player) {
      throw new Error("Player not found");
    }

    const { leaderboard, rank } = await PlayerService.getLeaderboard(player);

    return {
      player: {
        ...player,
        rank,
      },
      leaderboard,
    };
  },

  async updateStats(request: Request) {
    const body = (await request.json().catch(() => ({}))) as {
      playerId?: string;
      name?: string;
      deltaChallenges?: number;
      deltaXp?: number;
    };

    let playerId = body?.playerId;
    if (!playerId && body?.name) {
      const legacy = await PlayerRepository.findByName(body.name);
      playerId = legacy?.playerId;
    }
    if (!playerId) {
      throw new Error("playerId is required");
    }

    const player = await PlayerService.updateStats({
      playerId,
      deltaChallenges: body.deltaChallenges,
      deltaXp: body.deltaXp,
    });
    const { leaderboard, rank } = await PlayerService.getLeaderboard(player);

    return {
      player: {
        ...player,
        rank,
      },
      leaderboard,
    };
  },
};
