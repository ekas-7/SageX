export default function SideQuestsPage() {
  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="page-label">Side Quest: LiveKit Lab</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="page-title text-3xl">Collaborative Agent Builder</h1>
              <p className="mt-2 page-description text-sm">
                Spin up a LiveKit-style call room to co-build AI agents, share prompts, and test workflows together.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary text-xs">
                Start Room
              </button>
              <button className="btn-ghost text-xs">
                Invite Collaborators
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <section className="glass-card flex flex-col gap-6 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">LiveKit Call Room</h2>
                <p className="text-xs text-[var(--text-muted)]">Room status: Ready &middot; 3 seats available</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="tag-accent">Live</span>
                <span className="tag font-mono">00:12:45</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {["You", "Zoe", "Atlas", "Nova"].map((name) => (
                <div
                  key={name}
                  className="relative flex h-48 flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface-1)] to-[var(--surface-0)] p-4"
                >
                  <div className="section-label">Video Feed</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--text-primary)]">{name}</span>
                    <span className="tag text-[0.6rem]">Mic on</span>
                  </div>
                  <div className="absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
              <div className="flex items-center gap-3">
                {["Mute", "Camera", "Share", "Record"].map((action) => (
                  <span key={action} className="tag cursor-pointer transition hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]">
                    {action}
                  </span>
                ))}
              </div>
              <button className="inline-flex h-8 items-center rounded-full bg-rose-500/80 px-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-rose-500">
                End Session
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="glass-card rounded-2xl p-5">
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Agent Blueprint</h3>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                {[
                  { label: "Mission", content: "Design a helper agent that drafts onboarding flows for new players." },
                  { label: "Persona", content: "Supportive strategist \u00B7 Focus on clarity, empathy, and action steps." },
                ].map((item) => (
                  <div key={item.label} className="surface-card rounded-xl p-3">
                    <p className="section-label">{item.label}</p>
                    <p className="mt-2">{item.content}</p>
                  </div>
                ))}
                <div className="surface-card rounded-xl p-3">
                  <p className="section-label">Tools</p>
                  <ul className="mt-2 space-y-1 text-[var(--text-secondary)]">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                      Player profile lookup
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                      Quest recommendation API
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                      LiveKit transcript summarizer
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="glass-card rounded-2xl p-5">
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Collaboration Feed</h3>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="surface-card rounded-xl p-3">
                  <p className="section-label">Live Notes</p>
                  <p className="mt-2">Zoe: We should add a &ldquo;first quest summary&rdquo; tool.</p>
                </div>
                <div className="surface-card rounded-xl p-3">
                  <p className="section-label">Action Items</p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                      Define success metrics for onboarding.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                      Agree on agent tone and safe responses.
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <a href="/map" className="back-link">Back to map</a>
      </div>
    </div>
  );
}
