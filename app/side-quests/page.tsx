export default function SideQuestsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Side Quest: LiveKit Lab</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Collaborative Agent Builder</h1>
              <p className="mt-2 text-sm text-slate-400">
                Spin up a LiveKit-style call room to co-build AI agents, share prompts, and test workflows together.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.35)]">
                Start Room
              </button>
              <button className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                Invite Collaborators
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <section className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">LiveKit Call Room</h2>
                <p className="text-xs text-slate-400">Room status: Ready · 3 seats available</p>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">Live</span>
                <span className="rounded-full bg-slate-800 px-3 py-1">00:12:45</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {["You", "Zoe", "Atlas", "Nova"].map((name) => (
                <div
                  key={name}
                  className="relative flex h-48 flex-col justify-between rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Video Feed</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{name}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      Mic on
                    </span>
                  </div>
                  <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span className="rounded-full bg-slate-800 px-3 py-1">Mute</span>
                <span className="rounded-full bg-slate-800 px-3 py-1">Camera</span>
                <span className="rounded-full bg-slate-800 px-3 py-1">Share</span>
                <span className="rounded-full bg-slate-800 px-3 py-1">Record</span>
              </div>
              <button className="rounded-full bg-rose-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                End Session
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-base font-semibold">Agent Blueprint</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mission</p>
                  <p className="mt-2">Design a helper agent that drafts onboarding flows for new players.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Persona</p>
                  <p className="mt-2">Supportive strategist · Focus on clarity, empathy, and action steps.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tools</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Player profile lookup</li>
                    <li>• Quest recommendation API</li>
                    <li>• LiveKit transcript summarizer</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-base font-semibold">Collaboration Feed</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Notes</p>
                  <p className="mt-2">Zoe: We should add a “first quest summary” tool.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Action Items</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Define success metrics for onboarding.</li>
                    <li>• Agree on agent tone and safe responses.</li>
                  </ul>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <a href="/map" className="text-sm text-sagex-teal">
          Back to map
        </a>
      </div>
    </div>
  );
}
