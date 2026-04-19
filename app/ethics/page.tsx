"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const ethicsStories = [
  {
    id: 1,
    title: "The Robot Umpire",
    story:
      "A baseball team gets a robot umpire. It is perfect at calling strikes for the taller kids, but constantly makes mistakes for the shortest players. It turns out the robot was only trained by watching adult baseball games.",
    lessonTitle: "Bias",
    lesson:
      "AI only knows what it is taught. If the data used to teach it ignores certain groups of people, the AI will treat them unfairly.",
    question: "Why did the robot umpire treat the shortest players unfairly?",
    options: [
      "It was trained only on adult baseball games.",
      "It was programmed to favor tall players.",
      "The field sensors were broken.",
      "The shortest players cheated.",
    ],
    correctIndex: 0,
  },
  {
    id: 2,
    title: "Pip the Mimic Bird",
    story:
      "Pip is a mechanical parrot that can perfectly copy anyone's voice. A mischievous student uses Pip to mimic the principal's voice over the loudspeaker, announcing that school is canceled.",
    lessonTitle: "Deepfakes & Misinformation",
    lesson:
      "Just because a voice or video sounds exactly like someone doesn't mean it is real. We must question our sources and verify facts.",
    question: "What should listeners do when they hear Pip's announcement?",
    options: [
      "Verify it with a trusted source.",
      "Assume it is always true.",
      "Spread it quickly to friends.",
      "Ignore all announcements forever.",
    ],
    correctIndex: 0,
  },
  {
    id: 3,
    title: "The Helpful Toy Box",
    story:
      "A \"smart\" toy box watches a child play to learn what games to suggest next. It is very helpful. However, it also observes where the child hides a secret diary and later tells a nosey older sibling.",
    lessonTitle: "Privacy",
    lesson:
      "Devices that constantly watch, listen, and learn can collect our personal secrets. We need to be careful about what information AI is allowed to gather and share.",
    question: "What privacy mistake did the toy box make?",
    options: [
      "It shared private information without permission.",
      "It suggested too many games.",
      "It stopped working at night.",
      "It refused to watch the child play.",
    ],
    correctIndex: 0,
  },
  {
    id: 4,
    title: "The Auto-Bike's Choice",
    story:
      "A self-steering bicycle is zooming down a path. Suddenly, a dog runs into the way. The bike must choose: swerve left into a deep mud puddle (ruining a bystander's clean clothes), or swerve right into a thorny bush (scratching the rider).",
    lessonTitle: "Safety & The Trolley Problem",
    lesson:
      "AI sometimes has to make hard decisions where someone loses. Humans have to decide beforehand what rules the AI should follow in emergencies.",
    question: "What should humans decide before emergencies happen?",
    options: [
      "The rules the AI should follow in tough choices.",
      "To always choose the left path.",
      "To never let bikes steer themselves.",
      "That bikes should stop forever.",
    ],
    correctIndex: 0,
  },
  {
    id: 5,
    title: "The Magic Paintbrush",
    story:
      "A child finds a smart paintbrush that paints masterpieces just by hearing a single word. The child wins an art contest with it, but the town's real artists are upset because the brush copied their specific painting styles without permission.",
    lessonTitle: "Copyright & Plagiarism",
    lesson:
      "AI creates things by studying real human creators. Taking credit for AI work, or letting AI copy others without credit or permission, is unfair.",
    question: "Why were the artists upset about the paintbrush?",
    options: [
      "It copied their styles without permission.",
      "It used the wrong colors.",
      "It was too expensive.",
      "It only worked at night.",
    ],
    correctIndex: 0,
  },
];

export default function EthicsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const activeStory = ethicsStories[activeIndex];
  const completedStories = useMemo(
    () => (isSubmitted && selectedIndex === activeStory.correctIndex ? activeIndex + 1 : activeIndex),
    [activeIndex, activeStory.correctIndex, isSubmitted, selectedIndex]
  );
  const progressPercent = Math.round((completedStories / ethicsStories.length) * 100);
  const isCorrect = selectedIndex === activeStory.correctIndex;
  const canContinue = isSubmitted && isCorrect;

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setIsSubmitted(true);
  };

  const handleContinue = () => {
    const nextIndex = Math.min(activeIndex + 1, ethicsStories.length - 1);
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
      setSelectedIndex(null);
      setIsSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07060f] px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/60">Welcome to SageX School</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-wide md:text-3xl">AI Ethics Academy</h1>
        </header>

        <section className="w-full rounded-[28px] border border-[#2c2a4c] bg-gradient-to-br from-[#2b2a54] via-[#241f3f] to-[#141222] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/70">Module 1.1</p>
                <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{activeStory.title}</h2>
                <p className="mt-3 text-sm text-indigo-100/80 md:text-base">{activeStory.story}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="rounded-full bg-indigo-500/80 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(76,81,191,0.45)] disabled:cursor-not-allowed disabled:bg-indigo-500/40"
                  onClick={handleContinue}
                  disabled={!canContinue}
                >
                  Continue to Next Story ▸
                </button>
                <span className="text-xs uppercase tracking-[0.3em] text-indigo-100/70">
                  Lesson: {activeStory.lessonTitle}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-100/70">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-300 to-fuchsia-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-indigo-100/60">
                  <span>Quiz checks: {completedStories}/{ethicsStories.length}</span>
                  <span className="text-rose-300">{100 - progressPercent}% left</span>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Quick Check</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{activeStory.question}</h3>
                <div className="mt-4 grid gap-3">
                  {activeStory.options.map((option, index) => {
                    const isSelected = selectedIndex === index;
                    const showCorrect = isSubmitted && index === activeStory.correctIndex;
                    const showWrong = isSubmitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={option}
                        onClick={() => setSelectedIndex(index)}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                          showCorrect
                            ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                            : showWrong
                            ? "border-rose-400/60 bg-rose-500/20 text-rose-100"
                            : isSelected
                            ? "border-indigo-400/70 bg-indigo-500/20 text-indigo-100"
                            : "border-indigo-500/20 bg-slate-950/40 text-indigo-100/80 hover:border-indigo-400/40"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:bg-indigo-500/40"
                    disabled={selectedIndex === null || isSubmitted}
                  >
                    Submit Answer
                  </button>
                  {isSubmitted ? (
                    <p className={`text-xs font-semibold ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}>
                      {isCorrect ? "Correct! You can move on." : "Not quite. Try again."}
                    </p>
                  ) : (
                    <p className="text-xs text-indigo-100/60">Choose one answer to unlock the next story.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="relative">
                <Image
                  src="/assests/skins/skin-3.png"
                  alt="Ethics guide"
                  width={260}
                  height={260}
                  className="drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid w-full gap-4 md:grid-cols-3">
          {ethicsStories.map((story, index) => (
            <article
              key={story.id}
              className={`flex h-full flex-col gap-3 rounded-2xl border p-5 transition ${
                index === activeIndex
                  ? "border-indigo-400/70 bg-indigo-500/10"
                  : "border-slate-800 bg-slate-900/30"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Story {story.id}</p>
              <h3 className="text-lg font-semibold text-slate-100">{story.title}</h3>
              <p className="text-sm text-slate-300">{story.lesson}</p>
              <span className="mt-auto text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
                {story.lessonTitle}
              </span>
            </article>
          ))}
        </section>

        <a href="/map" className="text-sm text-sagex-teal">
          Back to map
        </a>
      </div>
    </div>
  );
}
