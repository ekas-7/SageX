"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ethicsData from "../../src/data/ethicsScenarios.json";

/* ─── Types ─── */
type Choice = {
  id: string;
  text: string;
  feedback: string;
  isCorrect: boolean;
};

type Scenario = {
  id: string;
  title: string;
  difficulty: string;
  xp: number;
  context: string;
  question: string;
  choices: Choice[];
};

type Category = {
  id: string;
  label: string;
  icon: string;
  description: string;
  scenarios: Scenario[];
};

type CompletedScenario = {
  scenarioId: string;
  correct: boolean;
  choiceId: string;
  xpEarned: number;
  completedAt: string;
};

/* ─── Constants ─── */
const ETHICS_IMAGES = [
  "/assests/background/ethics/img-1.png",
  "/assests/background/ethics/img-2.png",
  "/assests/background/ethics/img-3.png",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  builder: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  competitive: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

const STORAGE_KEY = "sagex.ethicsCompleted";

function loadCompleted(): CompletedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompletedScenario[]) : [];
  } catch {
    return [];
  }
}

function saveCompleted(items: CompletedScenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* ─── Small Components ─── */
function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

function ProgressDots({ total, completedCount, correctCount }: { total: number; completedCount: number; correctCount: number }) {
  const dots = [];
  for (let i = 0; i < total; i++) {
    let color = "bg-[var(--surface-3)]";
    if (i < completedCount) {
      color = i < correctCount ? "bg-[var(--sagex-accent)]" : "bg-amber-500";
    }
    dots.push(<div key={i} className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${color}`} />);
  }
  return <div className="flex items-center gap-1.5">{dots}</div>;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  scale: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971ZM5.25 4.97 7.87 15.696c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  lightbulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19 3 8.5v3c0 5.523 4.477 10 10 10h1c5.523 0 10-4.477 10-10V8.5l-3.115-3.31A4 4 0 0 0 18 4h-9.17a4 4 0 0 0-2.715 1.19Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 15c2-2 4-3.5 8-4" />
    </svg>
  ),
};

/* ════════════════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════════════════ */
export default function EthicsPage() {
  const categories = ethicsData.categories as Category[];
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState<CompletedScenario[]>(() => loadCompleted());

  const totalXp = useMemo(() => completed.reduce((sum, c) => sum + c.xpEarned, 0), [completed]);
  const completedIds = useMemo(() => new Set(completed.map((c) => c.scenarioId)), [completed]);
  const totalScenarios = useMemo(() => categories.reduce((sum, cat) => sum + cat.scenarios.length, 0), [categories]);
  const correctCount = useMemo(() => completed.filter((c) => c.correct).length, [completed]);
  const progressPct = totalScenarios > 0 ? Math.round((completed.length / totalScenarios) * 100) : 0;

  const toggleCategory = (id: string) => setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  const openScenario = (scenario: Scenario) => { setActiveScenario(scenario); setSelectedChoice(null); setSubmitted(false); };
  const closeScenario = () => { setActiveScenario(null); setSelectedChoice(null); setSubmitted(false); };

  const handleSubmit = () => {
    if (!activeScenario || !selectedChoice) return;
    setSubmitted(true);
    const choice = activeScenario.choices.find((c) => c.id === selectedChoice);
    if (!choice || completedIds.has(activeScenario.id)) return;
    const xpEarned = choice.isCorrect
      ? activeScenario.xp
      : Math.round(activeScenario.xp * 0.25);
    const entry: CompletedScenario = {
      scenarioId: activeScenario.id,
      correct: choice.isCorrect,
      choiceId: selectedChoice,
      xpEarned,
      completedAt: new Date().toISOString(),
    };
    const updated = [...completed, entry];
    setCompleted(updated);
    saveCompleted(updated);

    // Fire-and-forget XP award to backend
    try {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("sagex.player")
          : null;
      if (!stored) return;
      const profile = JSON.parse(stored) as { name?: string };
      if (!profile.name) return;
      void fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          source: choice.isCorrect
            ? "ethics.scenario"
            : "ethics.scenario.partial",
          sourceRef: `ethics:${activeScenario.id}`,
          difficulty: activeScenario.difficulty,
          overrideBase: xpEarned,
          metadata: { choiceId: selectedChoice },
        }),
      });
    } catch {
      // Non-fatal — local state already updated.
    }
  };

  const selectedChoiceData = activeScenario?.choices.find((c) => c.id === selectedChoice);

  return (
    <div className="relative min-h-screen">
      {/* ─── Fixed background video ─── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/assests/background/ethics/background.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/55" />
      <div className="pointer-events-none fixed inset-0 z-0 backdrop-blur-[2px]" />

      {/* ════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════ */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sagex-accent)] opacity-[0.04] blur-[120px]" />
        </div>

        <h1 className="relative z-10 mb-10 text-center font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
          Welcome to the Ethics Courtyard
        </h1>

        {/* Hero Card */}
        <div className="relative z-10 mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--border-default)] bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface-1)] to-[var(--surface-0)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-transparent to-transparent" />
          <div className="relative grid md:grid-cols-[1.3fr_1fr]">
            {/* Left */}
            <div className="flex flex-col justify-center gap-6 p-8 md:p-12">
              <p className="font-display text-[0.65rem] font-medium uppercase tracking-[0.35em] text-[var(--sagex-accent)] opacity-80">Module E.1</p>
              <h2 className="font-display text-2xl font-semibold leading-snug text-[var(--text-primary)] md:text-3xl">Navigating AI Dilemmas</h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Real-world scenarios across bias, privacy, transparency, and accountability. Choose wisely -- your decisions shape your understanding of responsible AI.
              </p>
              <button
                type="button"
                onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-primary w-fit gap-2 text-sm"
              >
                Continue Learning
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Progress */}
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Progress</span>
                  <span className="font-display text-xs font-semibold text-[var(--sagex-accent)]">{progressPct}%</span>
                </div>
                <div className="relative">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[var(--sagex-accent)] to-emerald-400 transition-all duration-700" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
                    {categories.map((cat, i) => {
                      const catDone = cat.scenarios.filter((s) => completedIds.has(s.id)).length;
                      const allDone = catDone === cat.scenarios.length;
                      return (
                        <div key={cat.id} className={`h-3 w-3 rounded-full border-2 transition-all duration-500 ${
                          allDone ? "border-[var(--sagex-accent)] bg-[var(--sagex-accent)] shadow-[0_0_8px_var(--sagex-accent-glow)]"
                          : catDone > 0 ? "border-[var(--sagex-accent)] bg-[var(--surface-1)]"
                          : "border-[var(--surface-3)] bg-[var(--surface-1)]"
                        }`} style={{ marginLeft: i === 0 ? 0 : "auto" }} />
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">Scenarios: {completed.length}/{totalScenarios}</span>
                  <span className="font-display text-xs font-semibold text-[var(--sagex-accent)]">{totalXp} XP</span>
                </div>
              </div>
            </div>

            {/* Right: Alisa */}
            <div className="relative flex items-end justify-center overflow-hidden md:min-h-[420px]">
              <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--sagex-accent)] opacity-[0.06] blur-[80px]" />
              <Image src="/assests/npc/alisa.png" alt="Alisa — Ethics Guide NPC" width={380} height={480} className="relative z-10 h-auto w-64 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:w-80" priority />
            </div>
          </div>
        </div>

        <p className="relative z-10 mt-10 animate-pulse text-xs font-medium tracking-widest text-[var(--text-muted)]">Scroll to explore</p>
      </section>

      {/* ════════════════════════════════════════════
          MODULES SECTION
          ════════════════════════════════════════════ */}
      <section id="modules" className="relative z-10 px-6 pb-20 pt-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="page-label">Scenario Modules</p>
              <h2 className="mt-2 page-title text-2xl md:text-3xl">Choose a track</h2>
            </div>
            <div className="hidden items-center gap-4 sm:flex">
              <div className="text-right">
                <p className="text-[0.6rem] uppercase tracking-widest text-[var(--text-muted)]">Accuracy</p>
                <p className="font-display text-sm font-semibold text-[var(--text-primary)]">
                  {completed.length > 0 ? `${Math.round((correctCount / completed.length) * 100)}%` : "--"}
                </p>
              </div>
              <div className="h-8 w-px bg-[var(--border-default)]" />
              <div className="text-right">
                <p className="text-[0.6rem] uppercase tracking-widest text-[var(--text-muted)]">Total XP</p>
                <p className="font-display text-sm font-semibold text-[var(--sagex-accent)]">{totalXp}</p>
              </div>
            </div>
          </div>

          {/* Category cards */}
          <div className="flex flex-col gap-4">
            {categories.map((category, catIdx) => {
              const isOpen = openCategories[category.id] ?? false;
              const catCompleted = category.scenarios.filter((s) => completedIds.has(s.id)).length;
              const catCorrect = category.scenarios.filter((s) => completed.find((c) => c.scenarioId === s.id)?.correct).length;

              return (
                <div key={category.id} className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-gradient-to-r from-[var(--surface-1)] to-[var(--surface-0)] transition-all duration-300" style={{ borderColor: isOpen ? "var(--border-accent)" : undefined, boxShadow: isOpen ? "0 0 30px rgba(52,240,190,0.05)" : undefined }}>
                  {/* Header */}
                  <button type="button" onClick={() => toggleCategory(category.id)} className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.015]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] text-[var(--sagex-accent)]">
                      {CATEGORY_ICONS[category.icon] ?? CATEGORY_ICONS.shield}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">{category.label}</h3>
                        <span className="tag text-[0.55rem]">{category.scenarios.length} scenarios</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{category.description}</p>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      <ProgressDots total={category.scenarios.length} completedCount={catCompleted} correctCount={catCorrect} />
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[var(--text-muted)]">{catCompleted}/{category.scenarios.length}</span>
                    <ChevronDown open={isOpen} />
                  </button>

                  {/* Dropdown body */}
                  <div className={`grid transition-all duration-400 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-2.5 border-t border-[var(--border-subtle)] px-5 pb-5 pt-4">
                        {/* Banner image */}
                        <div className="relative mb-2 h-36 w-full overflow-hidden rounded-xl sm:h-44">
                          <Image src={ETHICS_IMAGES[catIdx % ETHICS_IMAGES.length]} alt={category.label} fill sizes="(min-width: 768px) 60vw, 90vw" className="object-cover" />
                          <div className="absolute bottom-3 left-4">
                            <p className="font-display text-xs font-semibold text-[var(--text-primary)] drop-shadow-lg">{category.label}</p>
                            <p className="text-[0.6rem] text-[var(--text-secondary)] drop-shadow-lg">{category.scenarios.length} scenarios &middot; {catCompleted} completed</p>
                          </div>
                        </div>

                        {/* Scenario rows */}
                        {category.scenarios.map((scenario, idx) => {
                          const isDone = completedIds.has(scenario.id);
                          const result = completed.find((c) => c.scenarioId === scenario.id);
                          return (
                            <button key={scenario.id} type="button" onClick={() => openScenario(scenario)} className="group flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 text-left transition-all duration-300 hover:border-[var(--border-hover)] hover:bg-[var(--surface-1)]">
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                                isDone ? result?.correct ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "border-amber-500/40 bg-amber-500/15 text-amber-400"
                                : "border-[var(--border-default)] text-[var(--text-muted)] group-hover:border-[var(--border-accent)] group-hover:text-[var(--sagex-accent)]"
                              }`}>
                                {isDone ? (
                                  result?.correct ? (
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                  ) : (
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                  )
                                ) : <span>{idx + 1}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--sagex-accent)]">{scenario.title}</h4>
                                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{scenario.context.slice(0, 90)}...</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <span className={`hidden rounded-full border px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider sm:inline-flex ${DIFFICULTY_COLORS[scenario.difficulty] ?? ""}`}>{scenario.difficulty}</span>
                                <span className="font-display text-xs font-semibold text-[var(--text-muted)]">
                                  {isDone && result ? <span className="text-[var(--sagex-accent)]">+{result.xpEarned}</span> : <span>{scenario.xp} XP</span>}
                                </span>
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[var(--text-muted)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--sagex-accent)]">
                                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <a href="/map" className="back-link mt-4">Back to map</a>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SCENARIO MODAL
          ════════════════════════════════════════════ */}
      {activeScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={closeScenario} />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--border-subtle)] p-6">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${DIFFICULTY_COLORS[activeScenario.difficulty] ?? ""}`}>{activeScenario.difficulty}</span>
                  <span className="font-display text-xs font-semibold text-[var(--sagex-accent)]">{activeScenario.xp} XP</span>
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">{activeScenario.title}</h2>
              </div>
              <button type="button" onClick={closeScenario} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
                <p className="section-label mb-2">Scenario</p>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{activeScenario.context}</p>
              </div>
              <p className="mt-6 font-display text-sm font-semibold text-[var(--text-primary)]">{activeScenario.question}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {activeScenario.choices.map((choice) => {
                  const isSelected = selectedChoice === choice.id;
                  let stateClasses = "border-[var(--border-default)] hover:border-[var(--border-hover)]";
                  if (submitted) {
                    if (choice.isCorrect) stateClasses = "border-emerald-500/50 bg-emerald-500/10";
                    else if (isSelected && !choice.isCorrect) stateClasses = "border-rose-500/50 bg-rose-500/10";
                    else stateClasses = "border-[var(--border-subtle)] opacity-50";
                  } else if (isSelected) {
                    stateClasses = "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)]";
                  }
                  return (
                    <button key={choice.id} type="button" onClick={() => { if (!submitted) setSelectedChoice(choice.id); }} disabled={submitted} className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-300 ${stateClasses} ${submitted ? "cursor-default" : "cursor-pointer"}`}>
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        submitted && choice.isCorrect ? "border-emerald-500 bg-emerald-500"
                        : submitted && isSelected && !choice.isCorrect ? "border-rose-500 bg-rose-500"
                        : isSelected ? "border-[var(--sagex-accent)] bg-[var(--sagex-accent)]"
                        : "border-[var(--border-default)]"
                      }`}>
                        {(isSelected || (submitted && choice.isCorrect)) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm ${submitted && choice.isCorrect ? "text-emerald-300" : submitted && isSelected && !choice.isCorrect ? "text-rose-300" : "text-[var(--text-secondary)]"}`}>{choice.text}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && selectedChoiceData && (
                <div className={`mt-5 rounded-xl border p-4 ${selectedChoiceData.isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                  <div className="flex items-center gap-2">
                    {selectedChoiceData.isCorrect ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-400"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-400"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                    )}
                    <p className={`text-xs font-semibold uppercase tracking-wider ${selectedChoiceData.isCorrect ? "text-emerald-400" : "text-amber-400"}`}>
                      {selectedChoiceData.isCorrect ? "Correct" : "Not quite"} &middot; +{selectedChoiceData.isCorrect ? activeScenario.xp : Math.round(activeScenario.xp * 0.25)} XP
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{selectedChoiceData.feedback}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] p-5">
              <button type="button" onClick={closeScenario} className="btn-ghost text-xs">{submitted ? "Close" : "Cancel"}</button>
              {!submitted ? (
                <button type="button" onClick={handleSubmit} disabled={!selectedChoice} className="btn-primary text-xs disabled:opacity-40 disabled:shadow-none disabled:hover:transform-none">Submit Answer</button>
              ) : (
                <button type="button" onClick={closeScenario} className="btn-primary text-xs">Continue</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
