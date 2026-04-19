"use client";

import { useEffect, useMemo, useState } from "react";

type StatsResponse = {
  player: {
    name: string;
    avatar?: string;
    skill?: string;
    rank: number;
    stats: {
      dailyStreak: number;
      challengesCompleted: number;
      totalChallenges: number;
      totalXp: number;
      lastActiveAt?: string;
    };
  };
  leaderboard: Array<{
    name: string;
    avatar?: string;
    skill?: string;
    rank: number;
    totalXp: number;
    dailyStreak: number;
    challengesCompleted: number;
  }>;
};

type PlayerProfile = {
  name: string;
  avatar?: string;
  skill?: string;
  interests?: string[];
};

export default function StatsPage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sagex.player");
    if (stored) {
      setProfile(JSON.parse(stored) as PlayerProfile);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile?.name) return;
    const controller = new AbortController();

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          name: profile.name,
          avatar: profile.avatar ?? "",
          skill: profile.skill ?? "",
          interests: profile.interests?.join(",") ?? "",
        });
        const response = await fetch(`/api/stats?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Unable to load stats");
        }
        const payload = (await response.json()) as StatsResponse;
        setStats(payload);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load stats");
      } finally {
        setLoading(false);
      }
    };

    void loadStats();

    return () => controller.abort();
  }, [profile]);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Daily streak",
        value: `${stats.player.stats.dailyStreak} days`,
        helper: "Consecutive days in the arena",
      },
      {
        label: "Challenges",
        value: `${stats.player.stats.challengesCompleted}`,
        helper: "Completed missions",
      },
      {
        label: "Ranking",
        value: `#${stats.player.rank}`,
        helper: "Global leaderboard position",
      },
      {
        label: "Total XP",
        value: `${stats.player.stats.totalXp}`,
        helper: "Experience earned",
      },
    ];
  }, [stats]);

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-12">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/assests/background/stats/stats.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-2">
          <p className="page-label">SageX Insights</p>
          <h1 className="page-title text-3xl">Your Stats</h1>
          <p className="page-description text-sm">
            Track daily streaks, completed challenges, and your ranking across the SageX universe.
          </p>
        </header>

        {!profile && !loading && (
          <div className="glass-card rounded-2xl p-6 text-sm text-[var(--text-secondary)]">
            Set up your profile on the onboarding screen to start tracking stats.
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`stat-skeleton-${index}`}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
                  <div className="mt-4 h-8 w-32 animate-pulse rounded-full bg-white/15" />
                  <div className="mt-3 h-3 w-40 animate-pulse rounded-full bg-white/10" />
                </div>
              ))}
            </section>
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
                  <div className="mt-3 h-5 w-48 animate-pulse rounded-full bg-white/15" />
                </div>
                <div className="h-6 w-28 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="mt-6 grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`leaderboard-skeleton-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3"
                  >
                    <div>
                      <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
                      <div className="mt-2 h-3 w-40 animate-pulse rounded-full bg-white/10" />
                    </div>
                    <div className="text-right">
                      <div className="h-3 w-20 animate-pulse rounded-full bg-white/10" />
                      <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {stats && !loading && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="glass-card glass-card-hover rounded-2xl p-5"
                >
                  <p className="section-label">{card.label}</p>
                  <p className="mt-3 font-display text-2xl font-semibold text-[var(--text-primary)]">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{card.helper}</p>
                </div>
              ))}
            </section>

            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label">Leaderboard</p>
                  <h2 className="mt-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                    Top SageX Explorers
                  </h2>
                </div>
                <span className="tag-accent">You are #{stats.player.rank}</span>
              </div>
              <div className="mt-6 grid gap-3">
                {stats.leaderboard.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 transition hover:border-[var(--border-hover)]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        #{entry.rank} {entry.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {entry.skill ?? "Explorer"} &middot; {entry.dailyStreak} day streak
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-semibold text-[var(--sagex-accent)]">
                        {entry.totalXp} XP
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {entry.challengesCompleted} challenges
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <a href="/map" className="back-link">Back to map</a>
      </div>
    </div>
  );
}
