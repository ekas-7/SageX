import { ArenaOrchestrator } from "../orchestrators/arena.orchestrator";
import {
  arenaListQuerySchema,
  arenaNextQuerySchema,
  arenaSubmitSchema,
} from "../vali/arena.vali";
import type { ArenaDifficulty } from "../types/arena";

export const ArenaController = {
  async list(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = arenaListQuerySchema.safeParse({
      playerId: searchParams.get("playerId") ?? "",
    });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues.map((i) => i.message).join("; ") ||
          "Invalid query"
      );
    }
    const problems = await ArenaOrchestrator.listProblems(parsed.data.playerId);
    return { ok: true, problems };
  },

  async next(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = arenaNextQuerySchema.safeParse({
      playerId: searchParams.get("playerId") ?? "",
      difficulty: searchParams.get("difficulty") ?? undefined,
    });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues.map((i) => i.message).join("; ") ||
          "Invalid query"
      );
    }
    const problem = await ArenaOrchestrator.nextProblem(
      parsed.data.playerId,
      parsed.data.difficulty as ArenaDifficulty | undefined
    );
    if (!problem) {
      throw new Error(
        "No problems available. Check GROQ_API_KEY is configured."
      );
    }
    return { ok: true, problem };
  },

  async problem(problemId: string) {
    if (!problemId) throw new Error("problemId is required");
    const problem = await ArenaOrchestrator.getProblem(problemId);
    if (!problem) throw new Error("Problem not found");
    return { ok: true, problem };
  },

  async submit(request: Request) {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = arenaSubmitSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues.map((i) => i.message).join("; ") ||
          "Invalid submission"
      );
    }
    const result = await ArenaOrchestrator.submit(parsed.data);
    return { ok: true, ...result };
  },
};
