"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const avatars = [
  {
    id: "skin-1",
    name: "Orion",
    src: "/assests/skins/skin-1.png",
  },
  {
    id: "skin-2",
    name: "Nova",
    src: "/assests/skins/skin-2.png",
  },
  {
    id: "skin-3",
    name: "Vega",
    src: "/assests/skins/skin-3.png",
  },
  {
    id: "skin-4",
    name: "Atlas",
    src: "/assests/skins/skin-4.png",
  },
];
const skillLevels = ["Beginner", "Builder", "Competitive"] as const;

type SkillLevel = (typeof skillLevels)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [skill, setSkill] = useState<SkillLevel>("Beginner");

  const handleStart = () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      avatar: avatar.src,
      avatarName: avatar.name,
      skill,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("sagex.player", JSON.stringify(payload));
    localStorage.setItem("sagex.firstQuestCompleted", "false");
    router.push("/map");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 pb-16 pt-14">
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.35em] text-sagex-teal/70">
          Onboarding
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-5xl">
          Choose your space identity.
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Your avatar and skill level shape the pace of missions. You can update
          this later inside the hub.
        </p>
      </header>

      <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Pilot Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your callsign"
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white placeholder:text-slate-500"
            />
          </label>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">Select Avatar</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {avatars.map((option) => (
                <div
                  key={option.id}
                  className={`flex flex-col items-center gap-4 rounded-3xl border px-4 py-5 text-center transition ${
                    avatar.id === option.id
                      ? "border-sagex-teal bg-sagex-teal/20"
                      : "border-white/10 bg-slate-950/70"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">
                    {option.name}
                  </div>
                  <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-white/10">
                    <Image
                      src={option.src}
                      alt={`${option.name} avatar`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvatar(option)}
                    className={`h-10 w-full rounded-full border text-sm font-semibold transition ${
                      avatar.id === option.id
                        ? "border-sagex-teal bg-sagex-teal text-slate-900"
                        : "border-white/10 text-slate-200 hover:border-sagex-teal/60"
                    }`}
                  >
                    {avatar.id === option.id ? "Selected" : "Choose"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-300">Skill Level</p>
            <div className="flex flex-wrap gap-3">
              {skillLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSkill(level)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    skill === level
                      ? "border-sagex-teal bg-sagex-teal/20 text-white"
                      : "border-white/10 text-slate-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <h2 className="text-lg font-semibold">Preview</h2>
          <div className="flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10">
              <Image
                src={avatar.src}
                alt={`${avatar.name} avatar`}
                fill
                sizes="48px"
                className="object-cover"
              />
            </span>
            <span className="text-base text-slate-200">
              {name.trim() || "Unnamed Pilot"}
            </span>
          </div>
          <p className="text-sm text-slate-400">Skill: {skill}</p>
          <button
            onClick={handleStart}
            className="mt-auto h-12 rounded-full bg-sagex-teal text-base font-semibold text-slate-900 shadow-lg shadow-sagex-teal/25 disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={!name.trim()}
          >
            Enter AI City
          </button>
        </aside>
      </section>
    </div>
  );
}
