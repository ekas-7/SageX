export default function ToolsPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3">
          <p className="page-label">Learn Tools</p>
          <h1 className="page-title text-3xl">AI Tools Workshop</h1>
          <p className="page-description text-sm">
            Master the tools that power SageX agents. Explore prompt crafting, workflows, and safe deployment.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Prompt Studio",
              description: "Design prompts that stay on track and produce structured outputs.",
              tag: "Beginner",
            },
            {
              title: "Tool Chains",
              description: "Connect APIs, data sources, and memory to build richer agents.",
              tag: "Builder",
            },
            {
              title: "Safety Checks",
              description: "Learn red-teaming and guardrails for responsible AI workflows.",
              tag: "Essential",
            },
            {
              title: "Evaluation Lab",
              description: "Score outputs, catch regressions, and automate quality checks.",
              tag: "Advanced",
            },
            {
              title: "Deployment Runbook",
              description: "Ship your agents with monitoring, rollback, and alerting.",
              tag: "Ops",
            },
            {
              title: "Team Playbooks",
              description: "Collaborate with squads and keep shared agent knowledge.",
              tag: "Collab",
            },
          ].map((item) => (
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
              <button className="btn-ghost mt-auto text-xs">
                Open Module
              </button>
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
