"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AvatarCard from "../../components/AvatarCard";
import OnboardingSubmitSkeleton from "../../components/OnboardingSubmitSkeleton";
import { OAuthSignIn } from "../../components/OAuthSignIn";
import PreviewCard from "../../components/PreviewCard";
import SkillToggle from "../../components/SkillToggle";
import {
  buildOnboardingPayload,
  signInPlayer,
  writeStoredPlayer,
} from "@/src/lib/playerClient";

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>("orion");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("Beginner");
  const [interests, setInterests] = useState<InterestId[]>(["product"]);
  const trimmedName = pilotName.trim();
  const isNameValid = trimmedName.length > 0;
  const activeAvatar = avatars.find((avatar) => avatar.id === selectedAvatar) ??
    avatars[0];
  const selectedInterestLabels = interestOptions
    .filter((option) => interests.includes(option.id))
    .map((option) => option.label);

  const handleEnter = async () => {
    if (submitting) return;
    if (!isNameValid) {
      setSubmitError("Please enter a pilot name to continue.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    const draft = buildOnboardingPayload({
      name: trimmedName,
      avatar: activeAvatar.src,
      avatarName: activeAvatar.name,
      skill: skillLevel,
      interests,
    });

    // Persist locally immediately so the UI feels instant.
    writeStoredPlayer(draft);
    if (typeof window !== "undefined") {
      localStorage.setItem("sagex.firstQuestCompleted", "false");
    }

    try {
      // Persist to the server. If this fails, we still let the user
      // continue (signInPlayer is idempotent and will retry on next page).
      await signInPlayer(draft);
      router.push("/onboarding/guide");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Couldn't save your pilot. You can continue, we'll try again."
      );
      // Still let them continue — their local profile is saved.
      router.push("/onboarding/guide");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0">
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
      <div className="pointer-events-none absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 backdrop-blur-xs" />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-6 pt-10 sm:gap-8 sm:pt-14">
        <header className="shrink-0 flex flex-col gap-3 sm:gap-4">
          <p className="page-label">Onboarding</p>
          <h1 className="page-title text-3xl md:text-5xl">
            Choose your space identity.
          </h1>
          <p className="page-description max-w-2xl text-base">
            Your avatar and skill level shape the pace of missions. You can
            update this later inside the hub.
          </p>
          <div className="max-w-md">
            <OAuthSignIn callbackUrl="/onboarding/guide" />
          </div>
        </header>

        <section
          className="grid min-h-0 flex-1 grid-cols-1 items-start gap-8 overflow-y-auto overscroll-contain pb-2 md:grid-cols-[3fr_2fr] md:overflow-y-auto"
          aria-busy={submitting}
        >
          <div
            className={`glass-card flex w-full min-h-0 flex-col gap-6 rounded-2xl p-5 sm:gap-8 sm:p-6 md:max-h-[calc(100dvh-11rem)] md:overflow-y-auto ${submitting ? "pointer-events-none opacity-60" : ""}`}
          >
            <label
              className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]"
              htmlFor="pilot-name"
            >
              <span className="font-display text-xs font-medium uppercase tracking-widest">
                Pilot Name{" "}
                <span className="text-rose-400" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </span>
              <input
                id="pilot-name"
                name="pilotName"
                value={pilotName}
                onChange={(event) => setPilotName(event.target.value)}
                placeholder="Enter your callsign"
                required
                aria-required="true"
                autoComplete="nickname"
                className="h-12 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:border-[var(--border-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--sagex-accent)]/30"
              />
            </label>

            <div className="flex flex-col gap-4">
              <p className="font-display text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">Select Avatar</p>
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
              <p className="font-display text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">Skill Level</p>
              <SkillToggle
                options={skillLevels}
                value={skillLevel}
                onChange={(value) => setSkillLevel(value as SkillLevel)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-display text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">Interests</p>
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
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                        selected
                          ? "bg-[var(--sagex-accent)] text-[var(--surface-0)] shadow-[0_0_16px_var(--sagex-accent-glow)]"
                          : "border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Select one or more fields so SageX can tailor missions.
              </p>
            </div>
          </div>

          <div className="flex min-h-0 w-full flex-col gap-3 md:sticky md:top-0 md:self-start">
            {submitting ? (
              <OnboardingSubmitSkeleton />
            ) : (
              <PreviewCard
                pilotName={trimmedName}
                avatarName={activeAvatar.name}
                avatarSrc={activeAvatar.src}
                avatarDescription={activeAvatar.desc}
                skillLevel={skillLevel}
                interests={selectedInterestLabels}
                onEnter={handleEnter}
                disabled={!isNameValid}
              />
            )}
            {submitError && (
              <p className="text-xs text-rose-300">{submitError}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
