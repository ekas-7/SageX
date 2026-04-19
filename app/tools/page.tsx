export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Learn Tools</p>
          <h1 className="text-3xl font-semibold">AI Tools Workshop</h1>
          <p className="text-sm text-slate-400">
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
              className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  {item.tag}
                </span>
              </div>
              <p className="text-sm text-slate-300">{item.description}</p>
              <button className="mt-auto rounded-full bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Open Module
              </button>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Next Mission</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Build your first tool-powered agent</h2>
              <p className="mt-2 text-sm text-slate-400">
                Follow the guided checklist to connect a knowledge base, add safety filters, and test end-to-end.
              </p>
            </div>
            <button className="rounded-full bg-sagex-teal px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950">
              Start Mission
            </button>
          </div>
        </section>

        <a href="/map" className="text-sm text-sagex-teal">
          Back to map
        </a>
      </div>
    </div>
  );
}
