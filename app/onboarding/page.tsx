"use client";

import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
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
const interestOptions = [
  { id: "product", label: "Product & UX" },
  { id: "education", label: "Education" },
  { id: "healthcare", label: "Healthcare" },
  { id: "finance", label: "Finance" },
  { id: "marketing", label: "Marketing" },
  { id: "engineering", label: "Engineering" },
] as const;

type SkillLevel = (typeof skillLevels)[number];
type AvatarId = (typeof avatars)[number]["id"];
type InterestId = (typeof interestOptions)[number]["id"];

export default function OnboardingPage() {
  const router = useRouter();
  const [pilotName, setPilotName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>("orion");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("Beginner");
  const [interests, setInterests] = useState<InterestId[]>(["product"]);
  const activeAvatar = avatars.find((avatar) => avatar.id === selectedAvatar) ??
    avatars[0];
  const selectedInterestLabels = interestOptions
    .filter((option) => interests.includes(option.id))
    .map((option) => option.label);

  const handleEnter = () => {
    if (typeof window !== "undefined") {
      const payload = {
        name: pilotName.trim() || "Unnamed Pilot",
        avatar: activeAvatar.src,
        avatarName: activeAvatar.name,
        skill: skillLevel,
        interests,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("sagex.player", JSON.stringify(payload));
      localStorage.setItem("sagex.firstQuestCompleted", "false");
    }
    router.push("/map");
  };

  return (
    <div
      className={`${inter.className} relative min-h-screen overflow-hidden bg-[#0e0e0e] text-slate-100`}
    >
      <div className="absolute inset-0 pointer-events-none">
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
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="absolute inset-0 backdrop-blur-xs pointer-events-none" />
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
                className="h-12 rounded-2xl border border-white/10  px-4 text-white placeholder:text-slate-500"
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

            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">Interests</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((option) => {
                  const selected = interests.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setInterests((current) =>
                          current.includes(option.id)
                            ? current.filter((item) => item !== option.id)
                            : [...current, option.id]
                        );
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        selected
                          ? "bg-[#00E5A0] text-slate-900"
                          : "border border-white/10 bg-black/40 text-slate-200 hover:border-[#00E5A0]/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Select one or more fields so SageX can tailor missions.
              </p>
            </div>
          </div>

          <PreviewCard
            pilotName={pilotName.trim()}
            avatarName={activeAvatar.name}
            avatarSrc={activeAvatar.src}
            avatarDescription={activeAvatar.desc}
            skillLevel={skillLevel}
            interests={selectedInterestLabels}
            onEnter={handleEnter}
          />
        </section>
      </div>
    </div>
  );
}
