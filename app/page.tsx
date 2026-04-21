"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";

export default function Home() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const headlineWords = useMemo(
    () => "Learn AI by exploring a living 2D universe.".split(" "),
    []
  );

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      containerRef.current
        ?.querySelectorAll(".home-reveal")
        .forEach((element) => {
          (element as HTMLElement).style.opacity = "1";
          (element as HTMLElement).style.transform = "translateY(0)";
        });
      return;
    }

    const context = gsap.context(() => {
      gsap.set(".home-reveal", { opacity: 0, y: 24 });
      gsap.to(".home-reveal", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.1,
      });

      gsap.fromTo(
        ".headline-word",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: "power3.out",
          delay: 0.2,
        }
      );

      gsap.to(".home-astronaut", {
        y: -12,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, containerRef);

    const parallaxTarget = parallaxRef.current;
    const xTo = parallaxTarget
      ? gsap.quickTo(parallaxTarget, "x", {
          duration: 0.4,
          ease: "power2.out",
        })
      : null;
    const yTo = parallaxTarget
      ? gsap.quickTo(parallaxTarget, "y", {
          duration: 0.4,
          ease: "power2.out",
        })
      : null;

    const handleMove = (event: MouseEvent) => {
      if (!xTo || !yTo) return;
      const { innerWidth, innerHeight } = window;
      const x = (event.clientX / innerWidth - 0.5) * 12;
      const y = (event.clientY / innerHeight - 0.5) * 12;
      xTo(x);
      yTo(y);
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      context.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="home-scene flex min-h-screen flex-col bg-sagex-gradient"
    >
      <div className="absolute inset-0 pointer-events-none">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source
            src="/assests/background/onboarding/hero.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="home-video-overlay" aria-hidden="true" />

      <main className="home-content relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-20 pt-16">
        <section className="flex flex-col items-center gap-12 md:flex-row md:items-center">
          <div className="flex w-full justify-center md:w-1/2 md:justify-start">
            <div ref={parallaxRef} className="home-parallax relative">
              <div className="home-glow" aria-hidden="true" />
              <Image
                src="/assests/skins/skin-4.png"
                alt="SageX astronaut avatar"
                width={360}
                height={360}
                className="home-astronaut h-auto w-64 bg-transparent sm:w-80"
                priority
              />
            </div>
          </div>

          <header className="flex w-full flex-col gap-7 md:w-1/2">
            <p className="home-reveal page-label">
              SageX Space Academy
            </p>

            <h1 className="home-reveal hero-display-h1 text-white">
              {headlineWords.map((word, index) => (
                <span key={`${word}-${index}`} className="headline-word">
                  {word}
                  {index < headlineWords.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>

            <p className="home-reveal text-subtext-cinematic max-w-2xl">
              Step into the AI City, complete quests generated from real AI
              concepts, and unlock abilities as your space core evolves.
            </p>

            <div className="home-reveal flex flex-col gap-4 sm:flex-row">
              <a href="/onboarding" className="btn-primary">
                Start Journey
              </a>
              <button className="btn-ghost">
                View Map Preview
              </button>
            </div>
          </header>
        </section>
      </main>
    </div>
  );
}
