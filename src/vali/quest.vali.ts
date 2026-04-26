import { z } from "zod";

const seedSchema = z
  .string()
  .optional()
  .transform((value) => (value ? Number(value) : 42))
  .refine((value) => Number.isFinite(value), {
    message: "seed must be a number",
  });

export const questQuerySchema = z.object({
  seed: seedSchema,
  templateId: z.string(),
});

export type QuestQueryDto = z.infer<typeof questQuerySchema>;
