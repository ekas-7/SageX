"use client";

import { useEffect, useState } from "react";
import { NewsMapPlayfield } from "@/components/NewsMapPlayfield";

export default function InvestmentPage() {
  const [showMap, setShowMap] = useState(false);

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
        <div className="absolute inset-0 z-0 min-h-screen">
          <NewsMapPlayfield />
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
