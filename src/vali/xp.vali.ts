import { z } from "zod";
import {
  DIFFICULTY_MULTIPLIERS,
  MAX_XP_PER_AWARD,
  XP_SOURCES,
} from "../config/xp";

const xpSourceValues = Object.values(XP_SOURCES) as [string, ...string[]];
const difficultyValues = Object.keys(DIFFICULTY_MULTIPLIERS) as [
  string,
  ...string[],
];

export const xpAwardSchema = z.object({
  playerId: z.string().trim().min(8, "playerId is required"),
  name: z.string().trim().min(1).optional(),
  source: z.enum(xpSourceValues),
  sourceRef: z.string().trim().min(1).max(200).optional(),
  difficulty: z.enum(difficultyValues).optional(),
  overrideBase: z.number().int().min(0).max(MAX_XP_PER_AWARD).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type XpAwardBody = z.infer<typeof xpAwardSchema>;

export const xpSummaryQuerySchema = z.object({
  playerId: z.string().trim().min(8, "playerId is required"),
});

export type XpSummaryQuery = z.infer<typeof xpSummaryQuerySchema>;
