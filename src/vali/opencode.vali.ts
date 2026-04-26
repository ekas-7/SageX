import { z } from "zod";

export const opencodeAdviseSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Query is required")
    .max(1000, "Query is too long"),
  playerName: z.string().trim().optional(),
  playerId: z.string().trim().optional(),
});

export type OpencodeAdviseBody = z.infer<typeof opencodeAdviseSchema>;
