"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import fieldTracks from "@/src/data/fieldTracks.json";
import { readStoredPlayer, signInPlayer } from "@/src/lib/playerClient";

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
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    const stored = readStoredPlayer();
    if (!stored) return;
    setProfile({ name: stored.name, interests: stored.interests });
    void signInPlayer(stored);
  }, []);

  const selectedTracks = useMemo(() => {
    const interestKeys = profile?.interests ?? [];
    if (!interestKeys.length) return [fallbackTrack];
    const tracks = interestKeys
      .map((key) => fieldTracks[key as keyof typeof fieldTracks])
      .filter(Boolean) as FieldTrack[];
    return tracks.length ? tracks : [fallbackTrack];
  }, [profile]);

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-[url('/assests/background/field/background.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3">
          <p className="page-label">Field Missions</p>
          <h1 className="page-title text-3xl">
            {profile?.name ? `${profile.name}'s Field Lab` : "Field Lab"}
          </h1>
          <p className="page-description text-sm">
            Learn how to apply AI to your chosen fields with tailored missions and toolkits.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          {selectedTracks.map((track) => (
            <article
              key={track.label}
              className="glass-card glass-card-hover flex h-full flex-col gap-6 rounded-2xl p-6"
            >
              <div>
                <p className="section-label">{track.label}</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                  {track.hero}
                </h2>
              </div>

              <div>
                <p className="section-label">Focus areas</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {track.focus.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="section-label">Practice projects</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {track.projects.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sagex-accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <p className="section-label">Tool kit</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {track.tools.map((tool) => (
                    <span key={tool} className="tag">{tool}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="glass-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-label">Next step</p>
              <h2 className="mt-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                Turn a field challenge into an AI brief
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Pick one project above, define success metrics, and map the data or tools you already own.
              </p>
            </div>
            <button className="btn-primary text-xs">Start Field Mission</button>
          </div>
        </section>

        <a href="/map" className="back-link">Back to map</a>
      </div>
    </div>
  );
}
