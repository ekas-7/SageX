import { z } from "zod";

export const vibePromptSchema = z.object({
  dateKey: z.string().trim().optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  buckets: z.array(z.string().trim()).min(1),
});

export const vibeSubmissionSchema = z.object({
  promptId: z.string().trim().min(1),
  authorName: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  code: z.object({
    html: z.string().default(""),
    css: z.string().default(""),
    js: z.string().default(""),
  }),
});

export const vibeVoteSchema = z.object({
  submissionId: z.string().trim().min(1),
  voterId: z.string().trim().min(1),
});
