"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuestDatasetRow, QuestResponse } from "@/src/types/quest";

export default function LabPage() {
  const [quest, setQuest] = useState<QuestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{
    score: number;
    correct: boolean;
    durationMs: number;
  } | null>(null);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const seed = new URLSearchParams(window.location.search).get("seed") ?? "42";
    fetch(`/api/quests/first?seed=${seed}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }
        setQuest(data as QuestResponse);
      })
      .catch(() => setError("Unable to load quest."));
  }, []);

  const handleSubmit = () => {
    if (!quest || selected === null) return;
    const durationMs = Date.now() - startedAt;
    const correct = selected === quest.answerIndex;
    const accuracy = correct ? 100 : 0;
    const speed = Math.max(20, Math.round(120 - durationMs / 250));
    const efficiency = 80;
    const modelQuality = 75;
    const score = Math.round(accuracy + speed + efficiency + modelQuality);

    setResult({ score, correct, durationMs });
    localStorage.setItem("sagex.firstQuestCompleted", "true");
  };

  const feedback = useMemo(() => {
    if (!result) return null;
    return result.correct
      ? "Correct! Your Space Core gained its first spark."
      : "Not quite. Review the input/output pattern and try again.";
  }, [result]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 pb-16 pt-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-sagex-teal/70">
          AI Learning Lab
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-5xl">
          Quest 01 Input → Output
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Follow the NPC guidance to understand how a model maps signals into
          labeled outputs.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {error ? (
          <p className="text-slate-300">{error}</p>
        ) : !quest ? (
          <p className="text-slate-300">Generating your quest...</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Story Context
              </p>
              <p className="mt-2 text-base text-slate-200">{quest.story}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  Dataset
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {quest.dataset.map((row: QuestDatasetRow) => (
                    <li key={row.input} className="flex justify-between">
                      <span>{row.input}</span>
                      <span className="text-sagex-teal">{row.output}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  Mission
                </p>
                <p className="mt-2 text-base text-white">{quest.question}</p>
                <div className="mt-4 flex flex-col gap-2">
                  {quest.options.map((option: string, index: number) => (
                    <button
                      key={option}
                      onClick={() => setSelected(index)}
                      className={`rounded-2xl border px-4 py-2 text-left text-sm transition ${
                        selected === index
                          ? "border-sagex-teal bg-sagex-teal/20"
                          : "border-white/10"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Submit
              </p>
              <button
                onClick={handleSubmit}
                className="h-12 rounded-full bg-sagex-teal text-base font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-700"
                disabled={selected === null || !!result}
              >
                Lock In Answer
              </button>
              {result && (
                <div className="space-y-2 text-sm text-slate-200">
                  <p>{feedback}</p>
                  <p>Score: {result.score}</p>
                  <p>Time: {(result.durationMs / 1000).toFixed(1)}s</p>
                  <a
                    href="/hub"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 text-sm"
                  >
                    Return to Hub
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
