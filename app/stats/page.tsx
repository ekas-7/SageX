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
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SageX Insights</p>
          <h1 className="text-3xl font-semibold">Your Stats</h1>
          <p className="text-sm text-slate-400">
            Track daily streaks, completed challenges, and your ranking across the SageX universe.
          </p>
        </header>

        {!profile && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
            Set up your profile on the onboarding screen to start tracking stats.
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
            Loading your stats...
          </div>
        )}

        {stats && !loading && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                  <p className="mt-2 text-xs text-slate-400">{card.helper}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Leaderboard</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Top SageX Explorers</h2>
                </div>
                <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                  You are #{stats.player.rank}
                </span>
              </div>
              <div className="mt-6 grid gap-3">
                {stats.leaderboard.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        #{entry.rank} {entry.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.skill ?? "Explorer"} · {entry.dailyStreak} day streak
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-sagex-teal">{entry.totalXp} XP</p>
                      <p className="text-xs text-slate-400">
                        {entry.challengesCompleted} challenges
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <a href="/map" className="text-sm text-sagex-teal">
          Back to map
        </a>
      </div>
    </div>
  );
}
