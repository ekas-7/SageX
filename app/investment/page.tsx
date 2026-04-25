"use client";

import { useEffect, useState } from "react";
import { InvestmentNewsPanel } from "@/components/InvestmentNewsPanel";
import { NewsMapPlayfield } from "@/components/NewsMapPlayfield";

export default function InvestmentPage() {
  const [showMap, setShowMap] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsSheetIn, setNewsSheetIn] = useState(false);

  useEffect(() => {
    if (!newsOpen) {
      setNewsSheetIn(false);
      return;
    }
    const t = window.setTimeout(() => setNewsSheetIn(true), 0);
    return () => window.clearTimeout(t);
  }, [newsOpen]);

  useEffect(() => {
    if (showMap) return;
    const timeout = window.setTimeout(() => {
      setShowMap(true);
    }, 7000);
    return () => window.clearTimeout(timeout);
  }, [showMap]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {!showMap && (
        <div className="absolute inset-0 z-0">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={() => setShowMap(true)}
            onError={() => setShowMap(true)}
          >
            <source
              src="/assests/background/investement/intro.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      )}
      {showMap && (
        <div className="absolute inset-0 z-0 min-h-0 w-full min-w-0">
          <NewsMapPlayfield
            newsPanelOpen={newsOpen}
            onOpenNewsPanel={() => setNewsOpen(true)}
          />
          {newsOpen && (
            <div
              className="absolute inset-0 z-[60] flex min-h-0 w-full"
              role="dialog"
              aria-modal="true"
              aria-label="Hacker News front page"
            >
              <div
                className={`flex h-full min-h-0 w-full min-w-0 max-w-md shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--surface-1)] shadow-[6px_0_40px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out sm:max-w-md ${
                  newsSheetIn ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <div className="pointer-events-auto flex min-h-0 min-w-0 flex-1 flex-col">
                  <InvestmentNewsPanel
                    onClose={() => setNewsOpen(false)}
                  />
                </div>
              </div>
              <button
                type="button"
                className="min-h-0 min-w-0 flex-1 cursor-default border-0 bg-black/20 backdrop-blur-[1px] transition-[background-color] hover:bg-black/30"
                aria-label="Close news"
                onClick={() => setNewsOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {!showMap && (
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="btn-ghost absolute bottom-6 right-6 z-20 text-xs"
        >
          Skip intro
        </button>
      )}
    </div>
  );
}
