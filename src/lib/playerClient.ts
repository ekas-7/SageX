"use client";

/**
 * Client-side player identity helper.
 *
 * Responsibilities:
 *  - Own the localStorage contract for `sagex.player` + `sagex.playerId`
 *  - Ensure every visitor has a stable UUID playerId
 *  - Migrate legacy users (name only) by calling /api/player/rehydrate
 *  - Perform sign-in upsert to /api/player so the backend always knows
 *    about the player before any XP award, stats read, etc.
 */

export type StoredPlayer = {
  playerId: string;
  name: string;
  avatar?: string;
  avatarName?: string;
  skill?: string;
  interests?: string[];
  createdAt?: string;
};

const STORAGE_KEY = "sagex.player";
const ID_KEY = "sagex.playerId";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random bytes
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function readStoredPlayer(): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPlayer>;
    if (!parsed.name) return null;
    // Back-compat: if id is on the top-level or in its own key, honor it.
    const id =
      parsed.playerId ||
      window.localStorage.getItem(ID_KEY) ||
      undefined;
    return id
      ? ({ ...parsed, playerId: id } as StoredPlayer)
      : (parsed as StoredPlayer);
  } catch {
    return null;
  }
}

export function writeStoredPlayer(player: StoredPlayer) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  window.localStorage.setItem(ID_KEY, player.playerId);
}

/**
 * Ensure the player in localStorage has a stable playerId.
 * - If playerId already exists → returned as-is.
 * - If only a name exists → ask the backend whether a player with that
 *   name already exists; adopt their playerId if so, otherwise mint a new one.
 */
export async function ensurePlayerId(
  stored: StoredPlayer
): Promise<StoredPlayer> {
  if (stored.playerId) return stored;

  // Legacy: try to rehydrate by name.
  try {
    const res = await fetch("/api/player/rehydrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: stored.name }),
    });
    if (res.ok) {
      const payload = (await res.json()) as {
        ok: boolean;
        player: { playerId: string; name: string } | null;
      };
      if (payload.ok && payload.player?.playerId) {
        const hydrated: StoredPlayer = {
          ...stored,
          playerId: payload.player.playerId,
          name: payload.player.name,
        };
        writeStoredPlayer(hydrated);
        return hydrated;
      }
    }
  } catch {
    // Offline or server error — fall through to fresh ID.
  }

  const fresh: StoredPlayer = { ...stored, playerId: generateId() };
  writeStoredPlayer(fresh);
  return fresh;
}

/**
 * Idempotent sign-in: ensures the player exists in the DB, advances
 * their daily streak, and returns the canonical server profile.
 * Safe to call on every page load.
 */
export async function signInPlayer(
  stored: StoredPlayer
): Promise<StoredPlayer> {
  const withId = await ensurePlayerId(stored);
  try {
    const res = await fetch("/api/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: withId.playerId,
        name: withId.name,
        avatar: withId.avatar,
        skill: withId.skill,
        interests: withId.interests,
      }),
    });
    if (res.ok) {
      const payload = (await res.json()) as {
        ok: boolean;
        player: { playerId: string; name: string; avatar?: string; skill?: string };
      };
      if (payload.ok && payload.player?.playerId) {
        const next: StoredPlayer = {
          ...withId,
          playerId: payload.player.playerId,
          name: payload.player.name,
          avatar: payload.player.avatar ?? withId.avatar,
          skill: payload.player.skill ?? withId.skill,
        };
        writeStoredPlayer(next);
        return next;
      }
    }
  } catch {
    // Network issue — still return local copy; next page load will retry.
  }
  return withId;
}

/** Create a brand-new player record at onboarding. */
export function buildOnboardingPayload(fields: {
  name: string;
  avatar: string;
  avatarName?: string;
  skill: string;
  interests: string[];
}): StoredPlayer {
  return {
    playerId: generateId(),
    name: fields.name.trim() || "Unnamed Pilot",
    avatar: fields.avatar,
    avatarName: fields.avatarName,
    skill: fields.skill,
    interests: fields.interests,
    createdAt: new Date().toISOString(),
  };
}
