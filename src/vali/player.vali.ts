import { z } from "zod";

export const playerProfileSchema = z.object({
  playerId: z.string().trim().min(8, "playerId is required"),
  name: z.string().trim().min(1, "Player name is required"),
  avatar: z.string().trim().optional(),
  skill: z.string().trim().optional(),
  interests: z.array(z.string().trim()).optional(),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;

export const playerRehydrateSchema = z.object({
  name: z.string().trim().min(1, "Player name is required"),
});

export type PlayerRehydrateInput = z.infer<typeof playerRehydrateSchema>;
