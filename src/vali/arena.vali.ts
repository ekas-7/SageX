import { z } from "zod";

export const arenaListQuerySchema = z.object({
  playerId: z.string().trim().min(1, "playerId is required"),
});

export const arenaNextQuerySchema = z.object({
  playerId: z.string().trim().min(1, "playerId is required"),
  difficulty: z.enum(["beginner", "builder", "competitive"]).optional(),
});

export const arenaSubmitSchema = z.object({
  playerId: z.string().trim().min(1, "playerId is required"),
  playerName: z.string().trim().min(1, "playerName is required"),
  problemId: z.string().trim().min(1, "problemId is required"),
  prompt: z
    .string()
    .trim()
    .min(5, "Prompt is too short")
    .max(4000, "Prompt exceeds 4000 characters"),
});

export type ArenaSubmitBody = z.infer<typeof arenaSubmitSchema>;
