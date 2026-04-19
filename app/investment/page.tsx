"use client";

import { useEffect, useState } from "react";

type HackerNewsHit = {
  objectID: string;
  title: string;
  url: string | null;
  author: string;
  created_at: string;
  points: number | null;
};

type HackerNewsResponse = {
  hits: HackerNewsHit[];
};

export default function InvestmentPage() {
  const [stories, setStories] = useState<HackerNewsHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNews, setShowNews] = useState(false);

  useEffect(() => {
    if (showNews) return;
    const timeout = window.setTimeout(() => {
      setShowNews(true);
    }, 7000);
    return () => window.clearTimeout(timeout);
  }, [showNews]);

  useEffect(() => {
    let active = true;
    const fetchStories = async () => {
      try {
        const response = await fetch(
          "https://hn.algolia.com/api/v1/search_by_date?query=artificial%20intelligence&tags=story"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch AI investment news.");
        }
        const data = (await response.json()) as HackerNewsResponse;
        if (active) {
          setStories(data.hits.slice(0, 8));
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unexpected error.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchStories();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {!showNews && (
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={() => setShowNews(true)}
            onError={() => setShowNews(true)}
          >
            <source
              src="/assests/background/investement/intro.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      )}
      {showNews && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assests/background/investement/news.png')",
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      {!showNews && (
        <button
          type="button"
          onClick={() => setShowNews(true)}
          className="btn-ghost absolute bottom-6 right-6 z-20 text-xs"
        >
          Skip intro
        </button>
      )}

      <div className="relative z-10 px-6 py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          {showNews && (
            <div className="h-[87vh] rounded-2xl p-4">
              <div className="h-full overflow-y-auto rounded-xl">
                {loading && (
                  <p className="text-sm text-[var(--text-secondary)]">Loading stories...</p>
                )}
                {error && <p className="text-sm text-rose-300">{error}</p>}
                {!loading && !error && stories.length === 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No stories yet. Check back in a minute.
                  </p>
                )}
                {!loading && !error && stories.length > 0 && (
                  <ul className="space-y-4">
                    {stories.map((story) => {
                      const link =
                        story.url ??
                        `https://news.ycombinator.com/item?id=${story.objectID}`;
                      return (
                        <li key={story.objectID}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-card glass-card-hover flex items-start justify-between gap-4 rounded-xl p-4"
                          >
                            <div>
                              <p className="text-base font-semibold text-[var(--text-primary)]">
                                {story.title}
                              </p>
                              <p className="mt-2 text-xs text-[var(--text-muted)]">
                                {story.author} &middot; {new Date(story.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-lg text-[var(--sagex-accent)]" aria-hidden="true">
                              &rarr;
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
