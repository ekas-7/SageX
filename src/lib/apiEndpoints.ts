/**
 * Canonical list of App Router API routes (path patterns + HTTP methods).
 * Keep in sync when adding or changing handlers under app/api/.
 */
export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiEndpoint = {
  /** Route pattern as in the filesystem (e.g. /api/arena/problem/[id]). */
  path: string;
  methods: HttpMethod[];
  /** Loose grouping for humans / filters. */
  group: string;
};

export const API_ENDPOINTS: ApiEndpoint[] = [
  { path: "/api/endpoints", methods: ["GET"], group: "meta" },
  { path: "/api/auth/[...nextauth]", methods: ["GET", "POST"], group: "auth" },
  { path: "/api/analytics", methods: ["GET"], group: "analytics" },
  { path: "/api/arena/next", methods: ["GET"], group: "arena" },
  { path: "/api/arena/problems", methods: ["GET"], group: "arena" },
  { path: "/api/arena/problem/[id]", methods: ["GET"], group: "arena" },
  { path: "/api/arena/submit", methods: ["POST"], group: "arena" },
  { path: "/api/livekit/token", methods: ["POST"], group: "livekit" },
  { path: "/api/opencode", methods: ["POST"], group: "opencode" },
  { path: "/api/player", methods: ["POST"], group: "player" },
  { path: "/api/player/rehydrate", methods: ["POST"], group: "player" },
  { path: "/api/quests/first", methods: ["GET"], group: "quests" },
  { path: "/api/stats", methods: ["GET", "POST"], group: "stats" },
  { path: "/api/token/quote", methods: ["GET"], group: "token" },
  { path: "/api/vibe/prompt", methods: ["GET", "POST"], group: "vibe" },
  { path: "/api/vibe/leaderboard", methods: ["GET"], group: "vibe" },
  { path: "/api/vibe/submissions", methods: ["GET", "POST"], group: "vibe" },
  { path: "/api/vibe/submissions/[id]", methods: ["GET"], group: "vibe" },
  { path: "/api/vibe/embed/[id]", methods: ["GET"], group: "vibe" },
  { path: "/api/vibe/vote", methods: ["POST"], group: "vibe" },
  { path: "/api/xp/award", methods: ["POST"], group: "xp" },
  { path: "/api/xp/summary", methods: ["GET"], group: "xp" },
];
