"use client";

import { useMemo, useState } from "react";
import fieldTracks from "@/src/data/fieldTracks.json";

type PlayerProfile = {
  name: string;
  interests?: string[];
};

type FieldTrack = {
  label: string;
  hero: string;
  focus: string[];
  projects: string[];
  tools: string[];
};

const fallbackTrack: FieldTrack = {
  label: "General",
  hero: "Apply AI to your field",
  focus: [
    "Identify repetitive workflows",
    "Prototype small AI assistants",
    "Measure impact and iterate",
  ],
  projects: [
    "Draft an AI workflow map",
    "Create a lightweight demo agent",
    "Share results with your team",
  ],
  tools: ["Prompt frameworks", "Automation templates", "Feedback loops"],
};

export default function FieldPage() {
  const [profile] = useState<PlayerProfile | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("sagex.player");
    return stored ? (JSON.parse(stored) as PlayerProfile) : null;
  });

  const selectedTracks = useMemo(() => {
    const interestKeys = profile?.interests ?? [];
    if (!interestKeys.length) return [fallbackTrack];
    const tracks = interestKeys
      .map((key) => fieldTracks[key as keyof typeof fieldTracks])
      .filter(Boolean) as FieldTrack[];
    return tracks.length ? tracks : [fallbackTrack];
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Field Missions
          </p>
          <h1 className="text-3xl font-semibold">
            {profile?.name ? `${profile.name}'s Field Lab` : "Field Lab"}
          </h1>
          <p className="text-sm text-slate-400">
            Learn how to apply AI to your chosen fields with tailored missions and toolkits.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          {selectedTracks.map((track) => (
            <article
              key={track.label}
              className="flex h-full flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {track.label}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {track.hero}
                </h2>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Focus areas</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {track.focus.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Practice projects</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {track.projects.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tool kit</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {track.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-300"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Next step</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Turn a field challenge into an AI brief</h2>
              <p className="mt-2 text-sm text-slate-400">
                Pick one project above, define success metrics, and map the data or tools you already own.
              </p>
            </div>
            <button className="rounded-full bg-sagex-teal px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950">
              Start Field Mission
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
