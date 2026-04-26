import { AiService } from "../services/ai.service";
import { ArenaService } from "../services/arena.service";
import { ArenaRepository } from "../repositories/arena.repo";
import { PlayerRepository } from "../repositories/player.repo";
import { XpOrchestrator } from "./xp.orchestrator";
import { XP_SOURCES } from "../config/xp";
import type {
  ArenaAttemptResult,
  ArenaDifficulty,
  ArenaListEntry,
  ArenaProblem,
} from "../types/arena";
import type { PlayerProfile } from "../types/player";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 30; // attempts per hour

/**
 * Cap how much Groq-generated content we keep in the pool. Keeps DB
 * small and forces fresh problems for active users.
 */
const POOL_TARGET_PER_DIFFICULTY = 10;

export const ArenaOrchestrator = {
  async listProblems(playerId: string): Promise<ArenaListEntry[]> {
    const [problems, player] = await Promise.all([
      ArenaRepository.listProblems(30),
      playerId ? PlayerRepository.findById(playerId) : Promise.resolve(null),
    ]);

    const solvedSet = new Set<string>(player?.stats?.arenaSolved ?? []);

    return problems.map((p) => ({
      problemId: p.problemId,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      topic: p.topic,
      solvedCount: p.solvedCount,
      attemptCount: p.attemptCount,
      solved: solvedSet.has(p.problemId),
    }));
  },

  async getProblem(problemId: string): Promise<ArenaProblem | null> {
    return ArenaRepository.findProblemById(problemId);
  },

  /**
   * Get an unsolved problem at the requested difficulty (or any). If the
   * pool is small for that difficulty, generate a fresh one from Groq
   * before returning.
   */
  async nextProblem(
    playerId: string,
    difficulty?: ArenaDifficulty
  ): Promise<ArenaProblem | null> {
    const player = playerId
      ? await PlayerRepository.findById(playerId)
      : null;
    const solvedSet = new Set<string>(player?.stats?.arenaSolved ?? []);

    // 1. Try cache for unsolved problem at this difficulty.
    const pool = difficulty
      ? await ArenaRepository.listByDifficulty(difficulty, 20)
      : await ArenaRepository.listProblems(20);

    const unsolved = pool.find((p) => !solvedSet.has(p.problemId));
    if (unsolved && pool.length >= POOL_TARGET_PER_DIFFICULTY) {
      return unsolved;
    }

    // 2. Generate a new one.
    const gen = await AiService.generateArenaProblem(difficulty ?? "beginner");
    const normalized = ArenaService.normalizeGenerated(
      gen,
      difficulty ?? "beginner"
    );
    if (!normalized) {
      return unsolved ?? pool[0] ?? null;
    }

    try {
      await ArenaRepository.createProblem(normalized);
    } catch {
      // Ignore duplicate slug errors; we'll still return the problem.
    }
    return normalized;
  },

  async submit(args: {
    playerId: string;
    playerName: string;
    problemId: string;
    prompt: string;
  }): Promise<ArenaAttemptResult> {
    const { playerId, playerName, problemId, prompt } = args;

    if (!prompt.trim()) {
      throw new Error("Prompt is empty");
    }
    if (prompt.length > 4000) {
      throw new Error("Prompt is too long (max 4000 chars)");
    }

    // Rate limit.
    const attemptsInWindow = await ArenaRepository.countAttemptsInWindow(
      playerId,
      RATE_LIMIT_WINDOW_MS
    );
    if (attemptsInWindow >= RATE_LIMIT_MAX) {
      throw new Error(
        `You've used your ${RATE_LIMIT_MAX} arena attempts for this hour. Come back soon.`
      );
    }

    const problem = await ArenaRepository.findProblemById(problemId);
    if (!problem) {
      throw new Error("Problem not found");
    }

    // Grade.
    const graded = await AiService.gradeArenaSubmission({
      problem,
      userPrompt: prompt,
    });
    if (!graded) {
      throw new Error(
        "Grader unavailable. Check your GROQ_API_KEY and try again."
      );
    }

    const { score, passed, partial, xpFactor } = ArenaService.verdict(
      graded.score
    );

    // Persist the attempt.
    await ArenaRepository.saveAttempt({
      playerId,
      problemId,
      prompt,
      score,
      passed,
      results: graded.results,
      overallFeedback: graded.overallFeedback,
      model: graded.model,
    });

    // Bump counters.
    await ArenaRepository.incrementProblemCounters(problemId, {
      attempts: 1,
      solved: passed ? 1 : 0,
    });

    // Mark as solved on the player if this is their first pass.
    let firstSolve = false;
    if (passed) {
      const player = await PlayerRepository.findById(playerId);
      const alreadySolved = player?.stats?.arenaSolved?.includes(problemId);
      if (!alreadySolved) {
        firstSolve = true;
        await PlayerRepository.pushArenaSolved(playerId, problemId);
      }
    }

    await PlayerRepository.patchStats(playerId, {
      arenaAttempts: (
        (await PlayerRepository.findById(playerId))?.stats?.arenaAttempts ?? 0
      ) + 1,
      lastActiveAt: new Date(),
    });

    // Award XP: only on first solve (full) or partial credit on >=40 score.
    let xpAwarded = 0;
    let leveledUp = false;
    let levelAfter = 1;
    let rank = "Cadet";
    let totalXp = 0;

    if (firstSolve) {
      const award = await XpOrchestrator.award({
        playerId,
        name: playerName,
        source: XP_SOURCES.ARENA_SOLVED,
        sourceRef: `arena:${problemId}`,
        difficulty: problem.difficulty,
        overrideBase: Math.round(90 * xpFactor),
        metadata: { score, problemId },
      });
      xpAwarded = award.awarded;
      leveledUp = award.leveledUp;
      levelAfter = award.levelAfter;
      rank = award.rank;
      totalXp = award.totalXp;
    } else if (partial) {
      // Partial credit, at most once per problem per day (idempotent).
      const today = new Date().toISOString().slice(0, 10);
      const award = await XpOrchestrator.award({
        playerId,
        name: playerName,
        source: XP_SOURCES.ARENA_PARTIAL,
        sourceRef: `arena-partial:${problemId}:${today}`,
        difficulty: problem.difficulty,
        overrideBase: Math.round(20 * xpFactor),
        metadata: { score, problemId },
      });
      xpAwarded = award.awarded;
      leveledUp = award.leveledUp;
      levelAfter = award.levelAfter;
      rank = award.rank;
      totalXp = award.totalXp;
    } else {
      // Score < 40: no XP, but surface current profile so UI can show level.
      const player = (await PlayerRepository.findById(playerId)) as
        | PlayerProfile
        | null;
      totalXp = player?.stats?.totalXp ?? 0;
      levelAfter = player?.stats?.level ?? 1;
    }

    return {
      score,
      passed,
      results: graded.results,
      overallFeedback: graded.overallFeedback,
      attemptsUsedThisHour: attemptsInWindow + 1,
      attemptLimitPerHour: RATE_LIMIT_MAX,
      xpAwarded,
      leveledUp,
      levelAfter,
      rank,
      totalXp,
    };
  },
};
