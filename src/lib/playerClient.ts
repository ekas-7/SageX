"use client";

import {
  DEFAULT_SAGEX_AVATAR_DISPLAY_NAME,
  DEFAULT_SAGEX_AVATAR_SRC,
} from "@/src/config/playerAppearance";

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
const DEFAULT_AVATAR = DEFAULT_SAGEX_AVATAR_SRC;
const DEFAULT_AVATAR_NAME = DEFAULT_SAGEX_AVATAR_DISPLAY_NAME;
const DEFAULT_SKILL = "Beginner";
const DEFAULT_INTERESTS = ["product"];

export function withPlayerDefaults(player: StoredPlayer): StoredPlayer {
  return {
    ...player,
    name: player.name.trim() || "Pilot",
    avatar: player.avatar ?? DEFAULT_AVATAR,
    avatarName: player.avatarName ?? DEFAULT_AVATAR_NAME,
    skill: player.skill ?? DEFAULT_SKILL,
    interests: player.interests?.length ? player.interests : DEFAULT_INTERESTS,
  };
}

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
    const stored = id
      ? ({ ...parsed, playerId: id } as StoredPlayer)
      : (parsed as StoredPlayer);
    return withPlayerDefaults(stored);
  } catch {
    return null;
  }
}

export function writeStoredPlayer(player: StoredPlayer) {
  if (typeof window === "undefined") return;
  const normalized = withPlayerDefaults(player);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.setItem(ID_KEY, normalized.playerId);
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

type SignInOutcome = {
  player: StoredPlayer;
  serverPersisted: boolean;
  error?: Error;
};

export type SignInOptions = {
  /** Only for initial signup / password set. Never stored in localStorage. */
  password?: string;
};

/**
 * Internal: does the actual sign-in fetch and returns both the resolved
 * player *and* whether the server actually persisted the record.
 */
async function performSignIn(
  stored: StoredPlayer,
  options?: SignInOptions
): Promise<SignInOutcome> {
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
        ...(options?.password != null && options.password !== ""
          ? { password: options.password }
          : {}),
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      player?: {
        playerId: string;
        name: string;
        avatar?: string;
        skill?: string;
      };
    };
    if (res.ok && payload.ok && payload.player?.playerId) {
      const next: StoredPlayer = {
        ...withId,
        playerId: payload.player.playerId,
        name: payload.player.name,
        avatar: payload.player.avatar ?? withId.avatar,
        skill: payload.player.skill ?? withId.skill,
      };
      writeStoredPlayer(next);
      return { player: next, serverPersisted: true };
    }
    return {
      player: withId,
      serverPersisted: false,
      error: new Error(
        payload.error ?? `Sign-in failed with status ${res.status}`
      ),
    };
  } catch (err) {
    return {
      player: withId,
      serverPersisted: false,
      error: err instanceof Error ? err : new Error("Network error"),
    };
  }
}

/**
 * Idempotent sign-in: ensures the player exists in the DB, advances
 * their daily streak, and returns the canonical server profile.
 *
 * Safe for fire-and-forget use — never throws. If the server call fails,
 * the returned profile contains the locally-known data and `lastSignInError`
 * on window captures the error for diagnostics.
 */
export async function signInPlayer(
  stored: StoredPlayer,
  options?: SignInOptions
): Promise<StoredPlayer> {
  const outcome = await performSignIn(stored, options);
  if (outcome.error && typeof window !== "undefined") {
    (window as unknown as { __sagexLastSignInError?: Error }).__sagexLastSignInError =
      outcome.error;
  }
  return outcome.player;
}

/**
 * Strict variant of signInPlayer. Throws if the server didn't confirm
 * persistence. Use for flows that MUST have the player in the DB (stats,
 * XP awards) so callers can retry or show an error.
 */
export async function signInPlayerStrict(
  stored: StoredPlayer,
  options?: SignInOptions
): Promise<StoredPlayer> {
  const outcome = await performSignIn(stored, options);
  if (!outcome.serverPersisted) {
    throw outcome.error ?? new Error("Sign-in did not persist to server");
  }
  return outcome.player;
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
