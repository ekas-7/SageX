"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";

const mapNodes = [
  {
    id: "hub",
    title: "AI City Hub",
    description: "Meet your NPC guide and pick your next building.",
    href: "/hub",
    status: "active",
  },
  {
    id: "lab",
    title: "AI Learning Lab",
    description: "Begin the forced quest: Input → Output.",
    href: "/lab?seed=42",
    status: "quest",
  },
  {
    id: "data-center",
    title: "Neural Data Center",
    description: "Data cleaning missions unlock soon.",
    status: "locked",
  },
  {
    id: "ethics",
    title: "AI Ethics Dock",
    description: "Scenario-based decision quests.",
    status: "locked",
  },
  {
    id: "arena",
    title: "Coding Arena",
    description: "Advanced AI coding challenges.",
    status: "locked",
  },
];

type PlayerProfile = {
  name: string;
  avatar: string;
  skill: string;
};

export default function MapPage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [questCompleted, setQuestCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sagex.player");
    const completed = localStorage.getItem("sagex.firstQuestCompleted");
    if (stored) {
      setProfile(JSON.parse(stored) as PlayerProfile);
    }
    setQuestCompleted(completed === "true");
    setHydrated(true);
  }, []);

  const subtitle = useMemo(() => {
    if (!profile) return "Global Metaverse Map";
    return `${profile.name}'s navigation feed`;
  }, [profile]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.35em] text-sagex-teal/70">
          Metaverse Map
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-5xl">
          {hydrated ? subtitle : "Global Metaverse Map"}
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Chart your route through the AI city. The Learning Lab quest is your
          mandatory first jump before deeper exploration.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 text-2xl">
          <span>{hydrated ? profile?.avatar ?? "🧑‍🚀" : "🧑‍🚀"}</span>
          <div>
            <p className="text-base font-semibold text-white">
              {hydrated ? profile?.name ?? "Unnamed Pilot" : "Loading..."}
            </p>
            <p className="text-xs text-slate-400">
              Skill: {hydrated ? profile?.skill ?? "--" : "--"}
            </p>
          </div>
        </div>
        <div className="ml-auto flex flex-col gap-1 text-right">
          <span className="text-sm text-slate-300">Space Core Status</span>
          <span className="text-base font-semibold text-white">
            {hydrated
              ? questCompleted
                ? "Core Ignited"
                : "Core Dormant"
              : "Syncing"}
          </span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {mapNodes.map((node) => (
          <div
            key={node.id}
            className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-white">{node.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{node.description}</p>
            </div>
            {node.href ? (
              <a
                href={node.href}
                className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-sagex-teal text-sm font-semibold text-slate-900"
              >
                Warp
              </a>
            ) : (
              <div className="mt-auto inline-flex h-11 items-center justify-center rounded-full border border-white/10 text-sm text-slate-500">
                Locked — Coming soon
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
