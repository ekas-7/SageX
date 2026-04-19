"use client";

import { Inter } from "next/font/google";
import { useState } from "react";
import AvatarCard from "../../components/AvatarCard";
import PreviewCard from "../../components/PreviewCard";
import SkillToggle from "../../components/SkillToggle";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const avatars = [
  {
    id: "orion",
    name: "Orion",
    src: "/assests/skins/skin-1.png",
    desc: "Charting the quiet edges of the galaxy.",
  },
  {
    id: "nova",
    name: "Nova",
    src: "/assests/skins/skin-2.png",
    desc: "Bright burst of energy and curiosity.",
  },
  {
    id: "vega",
    name: "Vega",
    src: "/assests/skins/skin-3.png",
    desc: "Cool-headed navigator with steady focus.",
  },
  {
    id: "atlas",
    name: "Atlas",
    src: "/assests/skins/skin-4.png",
    desc: "Heavy-lift explorer built for deep space.",
  },
];
const skillLevels = ["Beginner", "Builder", "Competitive"] as const;

type SkillLevel = (typeof skillLevels)[number];
type AvatarId = (typeof avatars)[number]["id"];

export default function OnboardingPage() {
  const [pilotName, setPilotName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>("orion");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("Beginner");
  const activeAvatar = avatars.find((avatar) => avatar.id === selectedAvatar) ??
    avatars[0];

  return (
    <div
      className={`${inter.className} relative min-h-screen overflow-hidden bg-[#0e0e0e] text-slate-100`}
    >
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assests/background/onboarding/hero.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 backdrop-blur-xs" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-14">
        <header className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.45em] text-slate-400">
            Onboarding
          </p>
          <h1 className="text-3xl font-bold text-white md:text-5xl">
            Choose your space identity.
          </h1>
          <p className="max-w-2xl text-base text-slate-400">
            Your avatar and skill level shape the pace of missions. You can
            update this later inside the hub.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-black/40 p-6">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Pilot Name
              <input
                value={pilotName}
                onChange={(event) => setPilotName(event.target.value)}
                placeholder="Enter your callsign"
                className="h-12 rounded-2xl border border-white/10 bg-black/60 px-4 text-white placeholder:text-slate-500"
              />
            </label>

            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-300">Select Avatar</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {avatars.map((option) => (
                  <AvatarCard
                    key={option.id}
                    name={option.name}
                    imageSrc={option.src}
                    selected={selectedAvatar === option.id}
                    onSelect={() => setSelectedAvatar(option.id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">Skill Level</p>
              <SkillToggle
                options={skillLevels}
                value={skillLevel}
                onChange={(value) => setSkillLevel(value as SkillLevel)}
              />
            </div>
          </div>

          <PreviewCard
            pilotName={pilotName.trim()}
            avatarName={activeAvatar.name}
            avatarSrc={activeAvatar.src}
            avatarDescription={activeAvatar.desc}
            skillLevel={skillLevel}
          />
        </section>
      </div>
    </div>
  );
}
