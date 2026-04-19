"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const buildings = [
  {
    title: "AI Learning Lab",
    description: "Learn core concepts and unlock your first ability.",
    href: "/lab?seed=42",
    active: true,
  },
  {
    title: "Neural Data Center",
    description: "Practice data cleaning missions.",
    active: false,
  },
  {
    title: "AI Ethics Dock",
    description: "Decide on scenario-based ethics challenges.",
    active: false,
  },
  {
    title: "Coding Arena",
    description: "Solve advanced AI coding problems.",
    active: false,
  },
  {
    title: "AI History Hall",
    description: "Optional lore quests for bonus XP.",
    active: false,
  },
];

type PlayerProfile = {
  name: string;
  avatar: string;
  avatarName?: string;
  skill: string;
};

export default function HubPage() {
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

  const greeting = useMemo(() => {
    if (!profile) return "Welcome, Explorer";
    return `Welcome back, ${profile.name}`;
  }, [profile]);

  const avatarSrc =
    hydrated && profile?.avatar?.startsWith("/assests/")
      ? profile.avatar
      : "/assests/skins/skin-1.png";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.35em] text-sagex-teal/70">
          AI City Hub
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-5xl">
          {hydrated ? greeting : "Welcome, Explorer"}
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Your NPC guide highlights key buildings. Choose where to explore next
          and keep upgrading your Space Core.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <span className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10">
            <Image
              src={avatarSrc}
              alt={
                hydrated
                  ? profile?.avatarName
                    ? `${profile.avatarName} avatar`
                    : "Player avatar"
                  : "Player avatar"
              }
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
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
        {buildings.map((building) => (
          <div
            key={building.title}
            className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-white">
                {building.title}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {building.description}
              </p>
            </div>
            {building.active ? (
              <a
                href={building.href}
                className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-sagex-teal text-sm font-semibold text-slate-900"
              >
                Enter
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
