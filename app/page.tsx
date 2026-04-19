export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-sagex-gradient">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-20 pt-16">
        <header className="flex flex-col gap-6">
          <p className="text-sm uppercase tracking-[0.4em] text-sagex-teal/80">
            SageX — Space Academy
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            Learn AI by exploring a living 2D universe.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Step into the AI City, complete quests generated from real AI
            concepts, and unlock abilities as your space core evolves.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="/onboarding"
              className="inline-flex h-12 items-center justify-center rounded-full bg-sagex-teal px-6 text-base font-semibold text-slate-900 shadow-lg shadow-sagex-teal/30 transition hover:-translate-y-0.5"
            >
              Start Journey
            </a>
            <button className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-base font-semibold text-white/80">
              View Map Preview
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">AI City Map Preview</h2>
              <span className="text-xs text-slate-300">MVP Layout</span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              {[
                "AI Learning Lab",
                "Neural Data Center",
                "Ethics Dock",
                "Coding Arena",
                "AI History Hall",
                "Space Core",
              ].map((label) => (
                <div
                  key={label}
                  className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-center text-slate-200"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
            <h3 className="text-xl font-semibold">First Quest: Input ➜ Output</h3>
            <p className="text-slate-300">
              Meet your NPC guide, learn how models transform signals, and earn
              your first Space Core upgrade.
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">Core Loop</p>
              <p className="mt-2 text-base text-white">
                Explore → Receive AI quest → Solve → Score → Unlock ability
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
