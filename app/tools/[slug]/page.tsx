import Link from "next/link";

const TOOL_MODULES = {
  "prompt-studio": {
    title: "Prompt Studio",
    tag: "Beginner",
    intro: "Craft prompt patterns that keep agents focused and reliable.",
    outcomes: [
      "Write system + user prompt stacks that reduce drift.",
      "Design structured response templates for tool outputs.",
      "Test prompt variations and compare response quality.",
    ],
  },
  "tool-chains": {
    title: "Tool Chains",
    tag: "Builder",
    intro: "Connect APIs and data sources into a single agent workflow.",
    outcomes: [
      "Map each tool call to a clear agent objective.",
      "Decide what data is cached versus fetched live.",
      "Add fallback logic when tools return partial data.",
    ],
  },
  "safety-checks": {
    title: "Safety Checks",
    tag: "Essential",
    intro: "Learn how to guardrail agents before they go live.",
    outcomes: [
      "Create red-team prompts to test risky outputs.",
      "Add policy filters for sensitive content.",
      "Log and review incidents with clear playbooks.",
    ],
  },
  "evaluation-lab": {
    title: "Evaluation Lab",
    tag: "Advanced",
    intro: "Score responses, detect regressions, and automate quality checks.",
    outcomes: [
      "Define success metrics for each agent flow.",
      "Run evals on new prompt or tool versions.",
      "Track accuracy and latency over time.",
    ],
  },
  "deployment-runbook": {
    title: "Deployment Runbook",
    tag: "Ops",
    intro: "Ship agents with monitoring, rollback, and alerting ready.",
    outcomes: [
      "Set launch checklists for every release.",
      "Monitor uptime, errors, and response quality.",
      "Create safe rollback triggers for regressions.",
    ],
  },
  "team-playbooks": {
    title: "Team Playbooks",
    tag: "Collab",
    intro: "Keep teams aligned with shared agent knowledge.",
    outcomes: [
      "Document workflows so anyone can support the agent.",
      "Create shared prompt libraries for consistency.",
      "Run weekly reviews to capture lessons learned.",
    ],
  },
} as const;

type ToolSlug = keyof typeof TOOL_MODULES;

type ToolsModulePageProps = {
  params: {
    slug: string;
  };
};

export default function ToolsModulePage({ params }: ToolsModulePageProps) {
  const moduleKey = params.slug as ToolSlug;
  const moduleData = TOOL_MODULES[moduleKey];

  if (!moduleData) {
    return (
      <div className="min-h-screen px-6 py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <p className="page-label">Tools Module</p>
          <h1 className="page-title text-3xl">Module not found</h1>
          <p className="page-description text-sm">
            We couldn’t find that module yet. Head back and pick another lesson.
          </p>
          <Link href="/tools" className="btn-ghost w-fit text-xs">
            Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-3">
          <p className="page-label">Tools Module</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title text-3xl">{moduleData.title}</h1>
            <span className="tag">{moduleData.tag}</span>
          </div>
          <p className="page-description text-sm">{moduleData.intro}</p>
        </header>

        <section className="glass-card rounded-2xl p-6">
          <p className="section-label">What you’ll do</p>
          <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
            {moduleData.outcomes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card rounded-2xl p-6">
          <p className="section-label">Next step</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Start the guided checklist and track your progress as you build. Once done, return to the Tools Workshop for the next module.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-primary text-xs">Start Checklist</button>
            <Link href="/tools" className="btn-ghost text-xs">
              Back to Tools
            </Link>
          </div>
        </section>

        <Link href="/map" className="back-link">Back to map</Link>
      </div>
    </div>
  );
}
