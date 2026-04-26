"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import AvatarCard from "../../components/AvatarCard";
import OnboardingStepper from "../../components/OnboardingStepper";
import OnboardingSubmitSkeleton from "../../components/OnboardingSubmitSkeleton";
import PreviewCard from "../../components/PreviewCard";
import SkillToggle from "../../components/SkillToggle";
import {
  buildOnboardingPayload,
  readStoredPlayer,
  signInPlayerStrict,
  writeStoredPlayer,
} from "@/src/lib/playerClient";

const STEPS = [
  { id: "account", label: "Account" },
  { id: "avatar", label: "Avatar" },
  { id: "skill", label: "Skill" },
  { id: "interests", label: "Interests" },
  { id: "review", label: "Launch" },
] as const;

const STEP_COPY = [
  { title: "Set up your account", hint: "Callsign and a password protect your progress." },
  { title: "Choose your look", hint: "Select the avatar other pilots will see in the hub." },
  { title: "Set your skill level", hint: "We’ll match mission pacing to your comfort." },
  { title: "What interests you?", hint: "Pick one or more so SageX can tailor content." },
  { title: "You’re ready", hint: "Review your pilot and enter AI City." },
] as const;

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

const LAST_STEP = STEPS.length - 1;

type SkillLevel = (typeof skillLevels)[number];
type AvatarId = (typeof avatars)[number]["id"];
type InterestId = (typeof interestOptions)[number]["id"];

const UNAVAILABLE_NAME_MSG = "This callsign is not available.";

const inputClass =
  "h-10 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:border-[var(--border-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--sagex-accent)]/30 sm:h-11 sm:px-4";
const labelRowClass =
  "font-display text-[0.65rem] font-medium uppercase tracking-widest sm:text-xs";
const stepHeadingClass = "font-display text-[0.7rem] font-medium uppercase tracking-widest text-[var(--text-secondary)] sm:text-xs";

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [checkingPilotName, setCheckingPilotName] = useState(false);
  /** Only for callsign availability / server check (shown under pilot name) — not password issues. */
  const [pilotNameInlineError, setPilotNameInlineError] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>("orion");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("Beginner");
  const [interests, setInterests] = useState<InterestId[]>(["product"]);
  const trimmedName = pilotName.trim();
  const isNameValid = trimmedName.length > 0;
  const pw = password;
  const isPasswordValid = pw.length >= 8;
  const passwordsMatch = pw.length > 0 && pw === passwordConfirm;
  const isFormValid = isNameValid && isPasswordValid && passwordsMatch;
  const activeAvatar = avatars.find((avatar) => avatar.id === selectedAvatar) ?? avatars[0];
  const selectedInterestLabels = interestOptions
    .filter((option) => interests.includes(option.id))
    .map((option) => option.label);

  const goBack = () => {
    setStepError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const validateCurrentStep = (): boolean => {
    setStepError(null);
    if (stepIndex === 0) {
      if (!isNameValid) {
        setStepError("Enter a pilot name to continue.");
        return false;
      }
      if (!isPasswordValid) {
        setStepError("Use a password with at least 8 characters.");
        return false;
      }
      if (!passwordsMatch) {
        setStepError("Passwords do not match.");
        return false;
      }
    }
    if (stepIndex === 3 && interests.length === 0) {
      setStepError("Select at least one interest.");
      return false;
    }
    return true;
  };

  const checkPilotNameRemote = useCallback(async (): Promise<boolean> => {
    if (!trimmedName) {
      setPilotNameInlineError(null);
      return true;
    }
    setCheckingPilotName(true);
    setPilotNameInlineError(null);
    try {
      const params = new URLSearchParams();
      params.set("name", trimmedName);
      const existing = readStoredPlayer();
      if (existing?.playerId) {
        params.set("playerId", existing.playerId);
      }
      const res = await fetch(`/api/player/check-name?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        available?: boolean;
        error?: string;
      };
      if (!res.ok || data.available === false) {
        setPilotNameInlineError(UNAVAILABLE_NAME_MSG);
        return false;
      }
      return true;
    } catch {
      setPilotNameInlineError(
        "Couldn’t verify your callsign. Check your connection and try again."
      );
      return false;
    } finally {
      setCheckingPilotName(false);
    }
  }, [trimmedName]);

  const goNext = async () => {
    if (checkingPilotName) return;
    if (!validateCurrentStep()) return;

    if (stepIndex === 0) {
      if (pilotNameInlineError === UNAVAILABLE_NAME_MSG) {
        return;
      }
      const ok = await checkPilotNameRemote();
      if (!ok) return;
    }

    setStepIndex((i) => Math.min(LAST_STEP, i + 1));
  };

  const handleEnter = async () => {
    if (submitting) return;
    if (!isFormValid) {
      setSubmitError("Please complete all required fields.");
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

    try {
      const saved = await signInPlayerStrict(draft, { password: pw });
      writeStoredPlayer(saved);
      if (typeof window !== "undefined") {
        localStorage.setItem("sagex.firstQuestCompleted", "false");
      }
      router.push("/onboarding/guide");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/(already taken|not available|NAME_TAKEN)/i.test(msg)) {
        setStepIndex(0);
        setPilotNameInlineError(UNAVAILABLE_NAME_MSG);
        setSubmitError(null);
      } else {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Couldn't save your pilot. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copy = STEP_COPY[stepIndex] ?? STEP_COPY[0];
  const atReview = stepIndex === LAST_STEP;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full min-h-[100dvh]">
        <video
          className="absolute inset-0 h-full w-full min-h-full min-w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assests/background/onboarding/hero.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] h-[100dvh] min-h-[100dvh] bg-black/45" />
      <div className="pointer-events-none fixed inset-0 z-[1] h-[100dvh] min-h-[100dvh] backdrop-blur-xs" />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4 md:max-w-4xl">
        <header className="shrink-0 text-center sm:text-left">
          <p className="page-label text-[0.7rem] sm:text-xs">Onboarding</p>
          <h1 className="page-title mt-1 text-xl leading-tight sm:text-2xl md:text-3xl">
            {copy.title}
          </h1>
          <p className="page-description mx-auto mt-1 max-w-2xl text-sm leading-snug sm:mx-0 sm:text-base">
            {copy.hint}
          </p>
        </header>

        <div className="shrink-0">
          <OnboardingStepper currentIndex={stepIndex} steps={STEPS} />
        </div>

        <section
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-2 overflow-y-auto sm:gap-3"
          aria-busy={submitting}
        >
          <div
            className={`mx-auto w-full min-w-0 ${
              atReview ? "max-w-xl" : "max-w-2xl"
            } ${submitting && atReview ? "pointer-events-none opacity-60" : ""}`}
          >
            {atReview ? (
              <div className="flex min-h-0 flex-col gap-2">
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
                    disabled={!isFormValid}
                  />
                )}
                {submitError && !submitting && (
                  <p className="text-center text-sm text-rose-300" role="alert">
                    {submitError}
                  </p>
                )}
              </div>
            ) : (
              <div className="glass-card flex w-full min-w-0 flex-col gap-3 rounded-2xl p-4 sm:gap-4 sm:p-5">
                {stepIndex === 0 && (
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <label
                      className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]"
                      htmlFor="pilot-name"
                    >
                      <span className={labelRowClass}>
                        Pilot Name <span className="text-rose-400" aria-hidden>
                          *
                        </span>
                        <span className="sr-only">(required)</span>
                      </span>
                      <input
                        id="pilot-name"
                        name="pilotName"
                        value={pilotName}
                        onChange={(e) => {
                          setPilotName(e.target.value);
                          setPilotNameInlineError(null);
                        }}
                        placeholder="Enter your callsign"
                        required
                        autoComplete="nickname"
                        aria-invalid={pilotNameInlineError === UNAVAILABLE_NAME_MSG}
                        className={`${inputClass} ${
                          pilotNameInlineError === UNAVAILABLE_NAME_MSG
                            ? "border-rose-500/60"
                            : ""
                        }`}
                      />
                      {checkingPilotName && stepIndex === 0 && (
                        <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
                          Checking your callsign…
                        </p>
                      )}
                      {pilotNameInlineError && !checkingPilotName && stepIndex === 0 && (
                        <p className="text-xs text-rose-300" role="alert">
                          {pilotNameInlineError}
                        </p>
                      )}
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                      <label
                        className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]"
                        htmlFor="pilot-password"
                      >
                        <span className={labelRowClass}>
                          Password <span className="text-rose-400" aria-hidden>
                            *
                          </span>
                        </span>
                        <input
                          id="pilot-password"
                          name="pilotPassword"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => {
                            if (stepIndex === 0 && trimmedName) {
                              void checkPilotNameRemote();
                            }
                          }}
                          autoComplete="new-password"
                          placeholder="Min. 8 characters"
                          className={inputClass}
                        />
                      </label>
                      <label
                        className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]"
                        htmlFor="pilot-password-confirm"
                      >
                        <span className={labelRowClass}>
                          Confirm <span className="text-rose-400" aria-hidden>
                            *
                          </span>
                        </span>
                        <input
                          id="pilot-password-confirm"
                          name="pilotPasswordConfirm"
                          type="password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          onFocus={() => {
                            if (stepIndex === 0 && trimmedName) {
                              void checkPilotNameRemote();
                            }
                          }}
                          autoComplete="new-password"
                          placeholder="Repeat password"
                          className={inputClass}
                        />
                      </label>
                    </div>
                    <p className="text-[0.65rem] leading-snug text-[var(--text-muted)] sm:text-xs">
                      Stored as a secure hash on the server — we never keep your password in
                      the browser.
                    </p>
                  </div>
                )}

                {stepIndex === 1 && (
                  <div className="flex flex-col gap-3">
                    <p className={stepHeadingClass}>Select Avatar</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4">
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
                )}

                {stepIndex === 2 && (
                  <div className="flex flex-col gap-3">
                    <p className={stepHeadingClass}>Skill Level</p>
                    <SkillToggle
                      options={skillLevels}
                      value={skillLevel}
                      onChange={(value) => setSkillLevel(value as SkillLevel)}
                    />
                  </div>
                )}

                {stepIndex === 3 && (
                  <div className="flex flex-col gap-3">
                    <p className={stepHeadingClass}>Interests</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                            className={`rounded-full px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] transition sm:px-4 sm:text-xs ${
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
                )}
              </div>
            )}
          </div>

          {!atReview && stepError && (
            <p
              className="mx-auto w-full max-w-2xl shrink-0 text-center text-sm text-rose-300"
              role="alert"
            >
              {stepError}
            </p>
          )}

          <div
            className={`mx-auto mt-2 flex w-full max-w-2xl shrink-0 items-center border-t border-[var(--border-default)]/40 pt-3 sm:pt-4 ${
              atReview ? "justify-start" : "justify-between"
            }`}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition enabled:hover:border-[var(--border-accent)] enabled:hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            {!atReview && (
              <button
                type="button"
                onClick={() => {
                  void goNext();
                }}
                disabled={checkingPilotName}
                className="btn-primary min-w-[6.5rem] px-6 py-2.5 disabled:cursor-wait disabled:opacity-80"
              >
                {checkingPilotName ? "Checking…" : "Next"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
