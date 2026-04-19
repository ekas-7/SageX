"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readStoredPlayer, signInPlayer } from "@/src/lib/playerClient";
import type {
  ArenaCaseResult,
  ArenaDifficulty,
  ArenaListEntry,
  ArenaProblem,
} from "@/src/types/arena";

type Player = {
  playerId: string;
  name: string;
};

type SubmitResponse = {
  ok?: boolean;
  error?: string;
  score?: number;
  passed?: boolean;
  results?: ArenaCaseResult[];
  overallFeedback?: string;
  attemptsUsedThisHour?: number;
  attemptLimitPerHour?: number;
  xpAwarded?: number;
  leveledUp?: boolean;
  levelAfter?: number;
  rank?: string;
  totalXp?: number;
};

const DIFFICULTY_LABELS: Record<ArenaDifficulty, string> = {
  beginner: "Beginner",
  builder: "Builder",
  competitive: "Competitive",
};

const DIFFICULTY_COLORS: Record<ArenaDifficulty, string> = {
  beginner: "text-emerald-400 border-emerald-400/40",
  builder: "text-amber-300 border-amber-300/40",
  competitive: "text-rose-400 border-rose-400/40",
};

export default function ArenaPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [problemList, setProblemList] = useState<ArenaListEntry[] | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [activeProblem, setActiveProblem] = useState<ArenaProblem | null>(null);
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemError, setProblemError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const [difficulty, setDifficulty] = useState<ArenaDifficulty | "">("");

  // ─── Identity ─────────────────────────────────────────
  useEffect(() => {
    const stored = readStoredPlayer();
    if (!stored) return;
    void signInPlayer(stored).then((next) => {
      setPlayer({ playerId: next.playerId, name: next.name });
    });
  }, []);

  // ─── Load problem list ────────────────────────────────
  const reloadList = async (playerId: string) => {
    try {
      setListLoading(true);
      setListError(null);
      const res = await fetch(
        `/api/arena/problems?playerId=${encodeURIComponent(playerId)}`
      );
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        problems?: ArenaListEntry[];
      };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to load problems");
      }
      setProblemList(payload.problems ?? []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!player?.playerId) return;
    void reloadList(player.playerId);
  }, [player?.playerId]);

  // ─── Problem selection ────────────────────────────────
  const loadProblem = async (problemId: string) => {
    setProblemLoading(true);
    setProblemError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/arena/problem/${encodeURIComponent(problemId)}`);
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        problem?: ArenaProblem;
      };
      if (!res.ok || !payload.ok || !payload.problem) {
        throw new Error(payload.error ?? "Problem not found");
      }
      setActiveProblem(payload.problem);
      setPrompt(payload.problem.starterPrompt ?? "");
    } catch (err) {
      setProblemError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setProblemLoading(false);
    }
  };

  const loadNext = async () => {
    if (!player?.playerId) return;
    setProblemLoading(true);
    setProblemError(null);
    setResult(null);
    try {
      const qs = new URLSearchParams({ playerId: player.playerId });
      if (difficulty) qs.set("difficulty", difficulty);
      const res = await fetch(`/api/arena/next?${qs.toString()}`);
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        problem?: ArenaProblem;
      };
      if (!res.ok || !payload.ok || !payload.problem) {
        throw new Error(payload.error ?? "Failed to fetch problem");
      }
      setActiveProblem(payload.problem);
      setPrompt(payload.problem.starterPrompt ?? "");
      await reloadList(player.playerId);
    } catch (err) {
      setProblemError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setProblemLoading(false);
    }
  };

  // ─── Submit ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!player || !activeProblem) return;
    if (!prompt.trim()) {
      setSubmitError("Write a prompt first.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const res = await fetch("/api/arena/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.playerId,
          playerName: player.name,
          problemId: activeProblem.problemId,
          prompt,
        }),
      });
      const payload = (await res.json()) as SubmitResponse;
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error ?? "Submission failed");
      }
      setResult(payload);
      if (payload.passed) {
        void reloadList(player.playerId);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    if (!problemList) return { total: 0, solved: 0 };
    return {
      total: problemList.length,
      solved: problemList.filter((p) => p.solved).length,
    };
  }, [problemList]);

  // ─── Render ───────────────────────────────────────────
  if (!player) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="page-label">Coding Arena</p>
        <h1 className="page-title text-3xl">Sign in to enter the arena</h1>
        <p className="page-description text-sm">
          Create a pilot first, then come back to tackle prompt challenges.
        </p>
        <Link href="/onboarding" className="btn-primary text-xs">
          Create Pilot
        </Link>
        <Link href="/map" className="back-link">
          Back to map
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assests/background/codearea/background.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      <div className="absolute inset-0 backdrop-blur-[1px] pointer-events-none" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* ─── Header ──────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="page-label">Coding Arena</p>
            <h1 className="page-title text-3xl md:text-4xl">
              Agent Prompt Dojo
            </h1>
            <p className="mt-2 page-description text-sm max-w-2xl">
              LeetCode for prompt engineering. Each problem ships with real
              test cases. Write a system prompt, click Submit, and Groq will
              run + grade it. Solve it clean to earn XP.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="tag-accent text-[0.65rem]">
                {counts.solved} / {counts.total} solved
              </span>
              <span className="tag font-mono text-[0.65rem]">
                {player.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {(["", "beginner", "builder", "competitive"] as const).map(
                (opt) => (
                  <button
                    key={opt || "any"}
                    type="button"
                    onClick={() =>
                      setDifficulty(opt as ArenaDifficulty | "")
                    }
                    className={`rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider transition ${
                      difficulty === opt
                        ? "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] text-[var(--sagex-accent)]"
                        : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    {opt === "" ? "Any" : DIFFICULTY_LABELS[opt]}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={loadNext}
              disabled={problemLoading}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {problemLoading ? "Loading..." : "Load Next Problem"}
            </button>
          </div>
        </header>

        {/* ─── Two-pane layout: problem list + editor ──────── */}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Problem list */}
          <aside className="glass-card flex max-h-[75vh] flex-col gap-2 overflow-hidden rounded-2xl p-3">
            <div className="px-2 pt-2">
              <p className="section-label">Problems</p>
              <p className="mt-1 text-[0.65rem] text-[var(--text-muted)]">
                Click to open. New ones generate on demand.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {listLoading && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={`skel-${i}`}
                      className="h-12 animate-pulse rounded-xl bg-white/5"
                    />
                  ))}
                </div>
              )}
              {listError && (
                <p className="px-3 py-2 text-xs text-rose-300">{listError}</p>
              )}
              {!listLoading && problemList?.length === 0 && (
                <div className="flex flex-col items-center gap-3 p-4 text-center">
                  <p className="text-xs text-[var(--text-muted)]">
                    No problems yet. Generate the first one.
                  </p>
                  <button
                    type="button"
                    onClick={loadNext}
                    className="btn-primary text-xs"
                  >
                    Generate Problem
                  </button>
                </div>
              )}
              <div className="space-y-1 p-2">
                {problemList?.map((p) => {
                  const active = activeProblem?.problemId === p.problemId;
                  return (
                    <button
                      key={p.problemId}
                      type="button"
                      onClick={() => loadProblem(p.problemId)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)]"
                          : "border-[var(--border-subtle)] bg-[var(--surface-0)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                          {p.title}
                        </p>
                        {p.solved && (
                          <span
                            aria-label="Solved"
                            className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--sagex-accent)] text-[var(--surface-0)]"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3 w-3"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[0.6rem] uppercase tracking-wider">
                        <span
                          className={`rounded-full border px-1.5 py-0.5 ${
                            DIFFICULTY_COLORS[p.difficulty]
                          }`}
                        >
                          {DIFFICULTY_LABELS[p.difficulty]}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {p.topic}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right pane: problem + editor */}
          <main className="flex flex-col gap-5">
            {!activeProblem && !problemLoading && (
              <div className="glass-card flex h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center">
                <p className="page-label">Ready when you are</p>
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  Pick a problem, or generate a new one.
                </h2>
                <p className="max-w-md text-sm text-[var(--text-secondary)]">
                  Each challenge gives you a real-world scenario. Write a
                  system prompt that would make an LLM handle every test case
                  correctly.
                </p>
                <button
                  type="button"
                  onClick={loadNext}
                  className="btn-primary text-xs"
                >
                  Generate Problem
                </button>
              </div>
            )}

            {problemLoading && (
              <div className="glass-card h-[60vh] animate-pulse rounded-2xl p-8" />
            )}

            {problemError && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                {problemError}
              </div>
            )}

            {activeProblem && !problemLoading && (
              <>
                {/* Problem statement */}
                <section className="glass-card rounded-2xl p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                        DIFFICULTY_COLORS[activeProblem.difficulty]
                      }`}
                    >
                      {DIFFICULTY_LABELS[activeProblem.difficulty]}
                    </span>
                    <span className="tag text-[0.6rem]">
                      {activeProblem.topic}
                    </span>
                    <span className="ml-auto text-[0.65rem] text-[var(--text-muted)]">
                      {activeProblem.solvedCount} solved ·{" "}
                      {activeProblem.attemptCount} attempts
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-semibold text-[var(--text-primary)]">
                    {activeProblem.title}
                  </h2>
                  <p className="mt-3 text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                    {activeProblem.scenario}
                  </p>
                  <div className="mt-4 rounded-xl border border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] p-3">
                    <p className="section-label text-[var(--sagex-accent)]">
                      Task
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {activeProblem.task}
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="section-label">Test cases</p>
                    <div className="mt-2 grid gap-2">
                      {activeProblem.testCases.map((tc, idx) => (
                        <div
                          key={`tc-${idx}`}
                          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3 text-xs"
                        >
                          <p className="font-semibold text-[var(--text-primary)]">
                            Case {idx + 1}
                          </p>
                          <p className="mt-1 font-mono text-[0.7rem] text-[var(--text-secondary)]">
                            <span className="text-[var(--text-muted)]">
                              input:
                            </span>{" "}
                            {tc.input}
                          </p>
                          <p className="mt-1 font-mono text-[0.7rem] text-[var(--text-secondary)]">
                            <span className="text-[var(--text-muted)]">
                              expected:
                            </span>{" "}
                            {tc.expected}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Prompt editor */}
                <section className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-label">Your system prompt</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        This is what&apos;ll be sent as the model&apos;s
                        instructions before each test case runs.
                      </p>
                    </div>
                    <span className="text-[0.65rem] text-[var(--text-muted)]">
                      {prompt.length} / 4000
                    </span>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="You are a precise assistant. Your job is to..."
                    spellCheck={false}
                    rows={10}
                    className="mt-3 w-full resize-y rounded-xl border border-[var(--border-default)] bg-[var(--surface-0)] p-3 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--sagex-accent)]/30"
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {submitError && (
                      <p className="text-xs text-rose-400">{submitError}</p>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPrompt(activeProblem.starterPrompt ?? "")
                        }
                        className="btn-ghost text-xs"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || prompt.trim().length < 5}
                        className="btn-primary text-xs disabled:opacity-50"
                      >
                        {submitting ? "Grading..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Result */}
                {result && (
                  <section className="glass-card rounded-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="section-label">Verdict</p>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className={`font-display text-3xl font-semibold ${
                              result.passed
                                ? "text-[var(--sagex-accent)]"
                                : (result.score ?? 0) >= 40
                                  ? "text-amber-300"
                                  : "text-rose-400"
                            }`}
                          >
                            {result.score ?? 0}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            / 100
                          </span>
                          <span
                            className={`ml-2 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                              result.passed
                                ? "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] text-[var(--sagex-accent)]"
                                : "border-[var(--border-default)] text-[var(--text-muted)]"
                            }`}
                          >
                            {result.passed ? "Accepted" : "Not yet"}
                          </span>
                        </div>
                      </div>
                      {(result.xpAwarded ?? 0) > 0 && (
                        <div className="text-right">
                          <p className="font-display text-lg font-semibold text-[var(--sagex-accent)]">
                            +{result.xpAwarded} XP
                          </p>
                          {result.leveledUp && (
                            <p className="text-xs text-[var(--text-primary)]">
                              Level up &middot; Lv {result.levelAfter}{" "}
                              &middot; {result.rank}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {result.overallFeedback && (
                      <p className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3 text-sm text-[var(--text-secondary)]">
                        {result.overallFeedback}
                      </p>
                    )}

                    <div className="mt-4 grid gap-2">
                      {result.results?.map((r, idx) => {
                        const pass = r.caseScore >= 70;
                        return (
                          <details
                            key={`res-${idx}`}
                            className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)]"
                          >
                            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs">
                              <span className="font-semibold text-[var(--text-primary)]">
                                Case {idx + 1}
                              </span>
                              <span
                                className={`ml-auto rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                                  pass
                                    ? "border-emerald-400/40 text-emerald-400"
                                    : r.caseScore >= 40
                                      ? "border-amber-300/40 text-amber-300"
                                      : "border-rose-400/40 text-rose-400"
                                }`}
                              >
                                {r.caseScore}/100
                              </span>
                            </summary>
                            <div className="border-t border-[var(--border-subtle)] p-3 font-mono text-[0.7rem] text-[var(--text-secondary)]">
                              <p className="text-[var(--text-muted)]">input:</p>
                              <pre className="mt-1 whitespace-pre-wrap">
                                {r.input}
                              </pre>
                              <p className="mt-2 text-[var(--text-muted)]">
                                model output:
                              </p>
                              <pre className="mt-1 whitespace-pre-wrap text-[var(--text-primary)]">
                                {r.output || "(empty)"}
                              </pre>
                              {r.feedback && (
                                <>
                                  <p className="mt-2 text-[var(--text-muted)]">
                                    grader note:
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap font-sans">
                                    {r.feedback}
                                  </p>
                                </>
                              )}
                            </div>
                          </details>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-[0.65rem] text-[var(--text-muted)]">
                      Attempts this hour: {result.attemptsUsedThisHour} /{" "}
                      {result.attemptLimitPerHour}
                    </p>
                  </section>
                )}
              </>
            )}
          </main>
        </div>

        <Link href="/map" className="back-link">
          Back to map
        </Link>
      </div>
    </div>
  );
}
