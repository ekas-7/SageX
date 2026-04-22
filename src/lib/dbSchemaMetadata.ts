/**
 * High-level DB + auth notes for /api/endpoints and docs (not a full JSON Schema export).
 */
export const dbSchemaMetadata = {
  engine: "mongodb" as const,
  database: "sagex",
  collections: {
    players: {
      model: "Player",
      primaryKey: "playerId",
      oauth: {
        fields: ["email", "accountProvider", "accountId"] as const,
        compoundUnique: ["accountProvider", "accountId"],
      },
    },
  },
} as const;

export const authMetadata = {
  framework: "Auth.js (NextAuth v5)",
  basePath: "/api/auth",
  catchAll: "[...nextauth]",
  providers: ["google", "github"] as const,
  session: {
    exposesPlayerId: "session.user.playerId" as const,
  },
} as const;
