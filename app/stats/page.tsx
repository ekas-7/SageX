"use client";

import { useEffect, useMemo, useState } from "react";
import {
  readStoredPlayer,
  signInPlayer,
  signInPlayerStrict,
} from "@/src/lib/playerClient";

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
      level: number;
      currentLevelXp: number;
      xpToNext: number;
      lastActiveAt?: string;
    };
  };
  leaderboard: Array<{
    name: string;
    avatar?: string;
    skill?: string;
    rank: number;
    totalXp: number;
    level: number;
    rankTier: string;
    dailyStreak: number;
    challengesCompleted: number;
  }>;
};

type XpEvent = {
  source: string;
  finalAmount: number;
  multiplier: number;
  levelAfter: number;
  createdAt?: string;
  difficulty?: string;
};

type XpSummaryResponse = {
  ok: boolean;
  summary: {
    name: string;
    totalXp: number;
    level: number;
    currentLevelXp: number;
    xpToNext: number;
    progressPct: number;
    rank: string;
    dailyStreak: number;
    streakMultiplier: number;
    dailyXpEarned: number;
    recentEvents: XpEvent[];
  };
};

type PlayerProfile = {
  playerId: string;
  name: string;
  avatar?: string;
  skill?: string;
  interests?: string[];
};

const SOURCE_LABELS: Record<string, string> = {
  "quest.complete": "Quest cleared",
  "quest.perfect": "Perfect quest",
  "ethics.scenario": "Ethics scenario",
  "ethics.scenario.partial": "Ethics (partial)",
  "vibe.submit": "Vibe submission",
  "vibe.vote.received": "Vibe upvote",
  "daily.login": "Daily login",
  "streak.milestone": "Streak milestone",
  "onboarding.complete": "Onboarding bonus",
  "field.track.step": "Field track step",
  "sidequest.complete": "Side quest",
  "manual.grant": "Admin grant",
};

function formatWhen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function StatsPage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [xp, setXp] = useState<XpSummaryResponse["summary"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredPlayer();
    if (!stored) {
      setLoading(false);
      return;
    }
    // Ensure the backend has a record + the client has a playerId.
    void signInPlayer(stored).then((next) => {
      setProfile({
        playerId: next.playerId,
        name: next.name,
        avatar: next.avatar,
        skill: next.skill,
        interests: next.interests,
      });
    });
  }, []);

  useEffect(() => {
    if (!profile?.playerId) return;
    const controller = new AbortController();

    const fetchStats = async (playerId: string) => {
      const params = new URLSearchParams({ playerId });
      return Promise.all([
        fetch(`/api/stats?${params.toString()}`, {
          signal: controller.signal,
        }),
        fetch(`/api/xp/summary?playerId=${encodeURIComponent(playerId)}`, {
          signal: controller.signal,
        }),
      ]);
    };

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        let [statsRes, xpRes] = await fetchStats(profile.playerId);

        // If the backend doesn't know this playerId yet (legacy record
        // or previous sign-in silently failed), force a strict sign-in
        // that persists the record, then retry once.
        if (statsRes.status === 500 || statsRes.status === 404) {
          const body = (await statsRes
            .clone()
            .json()
            .catch(() => ({}))) as { error?: string };
          if ((body.error ?? "").toLowerCase().includes("not found")) {
            const stored = readStoredPlayer();
            if (stored) {
              const healed = await signInPlayerStrict(stored);
              if (healed.playerId !== profile.playerId) {
                setProfile({
                  playerId: healed.playerId,
                  name: healed.name,
                  avatar: healed.avatar,
                  skill: healed.skill,
                  interests: healed.interests,
                });
                return; // effect will re-run with the new id
              }
              [statsRes, xpRes] = await fetchStats(healed.playerId);
            }
          }
        }

        if (!statsRes.ok) {
          const payload = (await statsRes.json()) as { error?: string };
          throw new Error(payload.error ?? "Unable to load stats");
        }
        const statsPayload = (await statsRes.json()) as StatsResponse;
        setStats(statsPayload);

        if (xpRes.ok) {
          const xpPayload = (await xpRes.json()) as XpSummaryResponse;
          if (xpPayload.ok) setXp(xpPayload.summary);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load stats");
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [profile]);

  const cards = useMemo(() => {
    if (!stats) return [];
    const level = xp?.level ?? stats.player.stats.level ?? 1;
    const rank = xp?.rank ?? "Cadet";
    return [
      {
        label: "Level",
        value: `Lv ${level}`,
        helper: `Rank: ${rank}`,
      },
      {
        label: "Daily streak",
        value: `${stats.player.stats.dailyStreak} days`,
        helper: xp
          ? `Multiplier x${xp.streakMultiplier.toFixed(2)}`
          : "Consecutive days in the arena",
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
  }, [stats, xp]);

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
            Track your level, XP, daily streaks, and ranking across the SageX universe.
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

            {xp && (
              <section className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="section-label">Core Progression</p>
                    <h2 className="mt-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                      Lv {xp.level} &middot; {xp.rank}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-semibold text-[var(--sagex-accent)]">
                      {xp.currentLevelXp} / {xp.currentLevelXp + xp.xpToNext} XP
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {xp.xpToNext} XP to next level
                    </p>
                  </div>
                </div>
                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--sagex-accent)] to-emerald-400 transition-all duration-700"
                    style={{ width: `${xp.progressPct}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>Today&apos;s XP: <span className="text-[var(--text-primary)]">{xp.dailyXpEarned}</span></span>
                  <span>&middot;</span>
                  <span>Streak multiplier: <span className="text-[var(--text-primary)]">x{xp.streakMultiplier.toFixed(2)}</span></span>
                </div>
              </section>
            )}

            {xp && xp.recentEvents.length > 0 && (
              <section className="glass-card rounded-2xl p-6">
                <p className="section-label">Recent XP</p>
                <div className="mt-4 grid gap-2">
                  {xp.recentEvents.map((event, idx) => (
                    <div
                      key={`${event.createdAt ?? idx}-${event.source}`}
                      className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {SOURCE_LABELS[event.source] ?? event.source}
                          {event.difficulty && (
                            <span className="ml-2 text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                              {event.difficulty}
                            </span>
                          )}
                        </p>
                        <p className="text-[0.7rem] text-[var(--text-muted)]">
                          {formatWhen(event.createdAt)} &middot; Lv {event.levelAfter}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-sm font-semibold text-[var(--sagex-accent)]">
                          +{event.finalAmount} XP
                        </p>
                        {event.multiplier > 1 && (
                          <p className="text-[0.65rem] text-[var(--text-muted)]">
                            x{event.multiplier.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                        Lv {entry.level} {entry.rankTier} &middot; {entry.dailyStreak} day streak
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
