import { z } from "zod";

export const playerProfileSchema = z.object({
  playerId: z.string().trim().min(8, "playerId is required"),
  name: z.string().trim().min(1, "Player name is required"),
  avatar: z.string().trim().optional(),
  skill: z.string().trim().optional(),
  interests: z.array(z.string().trim()).optional(),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;

/** POST /api/player — same as profile plus optional sign-up password (hashed on server, never stored). */
export const playerProfileUpsertSchema = playerProfileSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .optional(),
});

export type PlayerProfileUpsertInput = z.infer<typeof playerProfileUpsertSchema>;

export const playerRehydrateSchema = z.object({
  name: z.string().trim().min(1, "Player name is required"),
});

export type PlayerRehydrateInput = z.infer<typeof playerRehydrateSchema>;
