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
        <p className="page-label">AI Learning Lab</p>
        <h1 className="page-title text-3xl md:text-5xl">
          Quest 01 Input &rarr; Output
        </h1>
        <p className="page-description max-w-2xl text-base">
          Follow the NPC guidance to understand how a model maps signals into
          labeled outputs.
        </p>
      </header>

      <section className="glass-card rounded-2xl p-6">
        {error ? (
          <p className="text-[var(--text-secondary)]">{error}</p>
        ) : !quest ? (
          <p className="text-[var(--text-secondary)]">Generating your quest...</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="surface-card rounded-xl p-5">
              <p className="section-label">Story Context</p>
              <p className="mt-2 text-base text-[var(--text-secondary)]">{quest.story}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="surface-card rounded-xl p-5">
                <p className="section-label">Dataset</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {quest.dataset.map((row: QuestDatasetRow) => (
                    <li key={row.input} className="flex justify-between">
                      <span>{row.input}</span>
                      <span className="font-mono text-[var(--sagex-accent)]">{row.output}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="surface-card rounded-xl p-5">
                <p className="section-label">Mission</p>
                <p className="mt-2 text-base text-[var(--text-primary)]">{quest.question}</p>
                <div className="mt-4 flex flex-col gap-2">
                  {quest.options.map((option: string, index: number) => (
                    <button
                      key={option}
                      onClick={() => setSelected(index)}
                      className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-300 ${
                        selected === index
                          ? "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] text-[var(--sagex-accent)]"
                          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="surface-card flex flex-col gap-4 rounded-xl p-5">
              <p className="section-label">Submit</p>
              <button
                onClick={handleSubmit}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:transform-none"
                disabled={selected === null || !!result}
              >
                Lock In Answer
              </button>
              {result && (
                <div className="glass-card space-y-2 rounded-xl p-4 text-sm text-[var(--text-secondary)]">
                  <p className={result.correct ? "text-[var(--sagex-accent)]" : "text-rose-400"}>
                    {feedback}
                  </p>
                  <p>Score: <span className="font-display font-semibold text-[var(--text-primary)]">{result.score}</span></p>
                  <p>Time: <span className="font-mono text-[var(--text-primary)]">{(result.durationMs / 1000).toFixed(1)}s</span></p>
                  <a href="/hub" className="btn-ghost mt-2 inline-flex text-sm">
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
