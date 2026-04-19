import Link from "next/link";

const TOOL_MODULES = [
  {
    slug: "prompt-studio",
    title: "Prompt Studio",
    description: "Design prompts that stay on track and produce structured outputs.",
    tag: "Beginner",
  },
  {
    slug: "tool-chains",
    title: "Tool Chains",
    description: "Connect APIs, data sources, and memory to build richer agents.",
    tag: "Builder",
  },
  {
    slug: "safety-checks",
    title: "Safety Checks",
    description: "Learn red-teaming and guardrails for responsible AI workflows.",
    tag: "Essential",
  },
  {
    slug: "evaluation-lab",
    title: "Evaluation Lab",
    description: "Score outputs, catch regressions, and automate quality checks.",
    tag: "Advanced",
  },
  {
    slug: "deployment-runbook",
    title: "Deployment Runbook",
    description: "Ship your agents with monitoring, rollback, and alerting.",
    tag: "Ops",
  },
  {
    slug: "team-playbooks",
    title: "Team Playbooks",
    description: "Collaborate with squads and keep shared agent knowledge.",
    tag: "Collab",
  },
];

export default function ToolsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assests/background/tools/background.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <div className="absolute inset-0 backdrop-blur-xs pointer-events-none" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3">
          <p className="page-label">Learn Tools</p>
          <h1 className="page-title text-3xl">AI Tools Workshop</h1>
          <p className="page-description text-sm">
            Master the tools that power SageX agents. Explore prompt crafting, workflows, and safe deployment.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TOOL_MODULES.map((item) => (
            <article
              key={item.title}
              className="glass-card glass-card-hover flex h-full flex-col gap-4 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h2>
                <span className="tag">{item.tag}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
              <Link href={`/tools/${item.slug}`} className="btn-ghost mt-auto text-xs">
                Open Module
              </Link>
            </article>
          ))}
        </section>

        <section className="glass-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-label">Next Mission</p>
              <h2 className="mt-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                Build your first tool-powered agent
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Follow the guided checklist to connect a knowledge base, add safety filters, and test end-to-end.
              </p>
            </div>
            <button className="btn-primary text-xs">Start Mission</button>
          </div>
        </section>

        <a href="/map" className="back-link">Back to map</a>
      </div>
    </div>
  );
}
