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
    <div className="relative min-h-screen overflow-hidden  text-slate-100">
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
          <div className="absolute inset-0 " />
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
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <div className="relative z-10 px-6 py-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {showNews && (
        <>
        <header className="flex flex-col gap-2">
         
        </header>

        <div className="rounded-3xl border border-white/10 bg-black/70 p-6">
          <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            {loading && (
              <p className="text-sm text-slate-300">Loading stories…</p>
            )}
            {error && <p className="text-sm text-rose-300">{error}</p>}
            {!loading && !error && (
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
                        className="block rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-sagex-teal/40 hover:bg-slate-950/80"
                      >
                        <p className="text-base font-semibold text-white">
                          {story.title}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {story.author} · {new Date(story.created_at).toLocaleDateString()}
                        </p>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <a href="/map" className="text-sm text-sagex-teal">
          Back to map
        </a>
        </>
        )}
        </div>
      </div>
    </div>
  );
}
