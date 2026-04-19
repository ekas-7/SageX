"use client";

import Image from "next/image";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type GuideStep = {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  helper: string;
  imageSrc: string;
};

const guideSteps: GuideStep[] = [
  {
    id: "basics",
    title: "Welcome to SageX",
    subtitle: "Your missions are short, focused, and always teach something new.",
    bullets: [
      "Travel the galaxy map to unlock quests and team challenges.",
      "Each quest is tied to your interests and skill level.",
      "Completing tasks upgrades your pilot profile and unlocks new hubs.",
    ],
    helper: "You can replay any quest for practice and better rewards.",
    imageSrc: "/assests/background/onboarding-guide/img-1.png",
  },
  {
    id: "controls",
    title: "Game Controls",
    subtitle: "Use simple inputs to move, interact, and manage your loadout.",
    bullets: [
      "Move: WASD or Arrow Keys",
      "Interact: E or Space",
      "Map & Inventory: M and I",
      "Pause: Esc",
    ],
    helper: "Touch devices show on-screen controls automatically.",
    imageSrc: "/assests/background/onboarding-guide/img-2.png",
  },
  {
    id: "support",
    title: "How SageX Helps You",
    subtitle: "You’ll get guidance, feedback, and a clear path forward.",
    bullets: [
      "Smart tips appear when you’re stuck or short on time.",
      "Progress dashboards track skills, streaks, and mission rewards.",
      "Your hub recommends next quests based on your goals.",
    ],
    helper: "You can change your interests and difficulty at any time in the hub.",
    imageSrc: "/assests/background/onboarding-guide/img-3.png",
  },
];

export default function OnboardingGuidePage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = useMemo(() => guideSteps[stepIndex], [stepIndex]);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === guideSteps.length - 1;

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
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <div className="absolute inset-0 backdrop-blur-xs pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between gap-10 px-6 pb-16 pt-14">
        <header className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Guide</p>
          <h1 className="text-3xl font-bold text-white md:text-5xl">
            {currentStep.title}
          </h1>
          <p className="max-w-3xl text-base text-slate-300 md:text-lg">
            {currentStep.subtitle}
          </p>
        </header>

        <section className="grid gap-8 rounded-3xl border border-white/10 bg-black/45 p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] md:p-10">
          <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-3xl md:mx-auto">
            <Image
              src={currentStep.imageSrc}
              alt={currentStep.title}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover animate-flot"
              priority
            />
          </div>
          <div className="flex flex-col justify-center">
            <ul className="grid gap-4">
              {currentStep.bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#00E5A0]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-400">{currentStep.helper}</p>
          </div>
        </section>

        <footer className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            {guideSteps.map((step, index) => (
              <span
                key={step.id}
                className={`h-2 w-10 rounded-full transition ${
                  index === stepIndex ? "bg-[#00E5A0]" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 hover:border-[#00E5A0]/60"
              >
                Back to Setup
              </button>
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                  className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 hover:border-[#00E5A0]/60"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/map")}
                className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 hover:border-[#00E5A0]/60"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLast) {
                    router.push("/map");
                  } else {
                    setStepIndex((prev) => Math.min(guideSteps.length - 1, prev + 1));
                  }
                }}
                className="rounded-full bg-[#00E5A0] px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900"
              >
                {isLast ? "Launch" : "Next"}
              </button>
            </div>
          </div>
        </footer>
      </div>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        :global(.animate-float) {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
