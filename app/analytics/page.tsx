"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsPayload } from "@/src/types/analytics";

type AnalyticsResponse = (AnalyticsPayload & { ok: true; days: number }) | {
  ok: false;
  error: string;
};

const RANGE_OPTIONS = [7, 14, 30, 60] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const PIE_COLORS = [
  "#34f0be",
  "#6ee7ff",
  "#c084fc",
  "#f472b6",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#f87171",
];

const numberFmt = new Intl.NumberFormat("en-US");

function fmt(n: number): string {
  return numberFmt.format(n);
}

function StatBadge({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-card glass-card-hover flex flex-col gap-2 rounded-2xl p-5">
      <p className="section-label">{label}</p>
      <p
        className={`font-display text-2xl font-semibold ${
          accent ? "text-[var(--sagex-accent)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
      {helper && (
        <p className="text-xs text-[var(--text-muted)]">{helper}</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">{title}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeOption>(14);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/analytics?days=${range}`, {
          signal: controller.signal,
        });
        const payload = (await res.json()) as AnalyticsResponse;
        if (!res.ok || !payload.ok) {
          throw new Error(
            (payload as { error?: string }).error ?? "Unable to load analytics"
          );
        }
        setData(payload);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load analytics");
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [range]);

  const sourceChartData = useMemo(() => {
    if (!data) return [];
    return data.topSources.slice(0, 6).map((s) => ({
      name: s.label,
      value: s.xp,
      count: s.count,
    }));
  }, [data]);

  const xpChartData = useMemo(() => {
    if (!data) return [];
    return data.xpOverTime.map((p) => ({
      date: p.date.slice(5), // MM-DD
      xp: p.xp,
      events: p.events,
    }));
  }, [data]);

  return (
    <div className="relative min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="page-label">SageX Analytics</p>
            <h1 className="page-title text-3xl md:text-4xl">Platform Dashboard</h1>
            <p className="mt-2 page-description text-sm">
              Live counts, XP flow, and player progression across the universe.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setRange(opt)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  range === opt
                    ? "border-[var(--border-accent)] bg-[var(--sagex-accent-muted)] text-[var(--sagex-accent)]"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {opt}d
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="glass-card h-28 rounded-2xl p-5"
              >
                <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
                <div className="mt-4 h-7 w-28 animate-pulse rounded-full bg-white/15" />
                <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {data && (
          <>
            {/* ─── count badges ─────────────────────────────── */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatBadge
                label="Total Players"
                value={fmt(data.totals.players)}
                helper={`${fmt(data.totals.activePlayers7d)} active in last 7d`}
                accent
              />
              <StatBadge
                label="Active Today"
                value={fmt(data.totals.activePlayersToday)}
                helper="Unique players in the last 24h"
              />
              <StatBadge
                label="Total XP Awarded"
                value={fmt(data.totals.totalXpAwarded)}
                helper={`+${fmt(data.totals.totalXpAwarded24h)} in last 24h`}
                accent
              />
              <StatBadge
                label="XP Events"
                value={fmt(data.totals.xpEvents)}
                helper="All-time award records"
              />
              <StatBadge
                label="Avg Level"
                value={data.totals.avgLevel.toFixed(1)}
                helper={`Max level: Lv ${data.totals.maxLevel}`}
              />
              <StatBadge
                label="Vibe Submissions"
                value={fmt(data.totals.vibeSubmissions)}
                helper={`${fmt(data.totals.vibeVotes)} total votes`}
              />
              <StatBadge
                label="Quests Generated"
                value={fmt(data.totals.quests)}
                helper="Cached quest payloads"
              />
              <StatBadge
                label="Generated"
                value={new Date(data.generatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                helper={new Date(data.generatedAt).toLocaleDateString()}
              />
            </section>

            {/* ─── XP over time (area chart) ────────────────── */}
            <ChartCard
              title="XP Awarded Over Time"
              subtitle={`Daily XP and event volume · last ${range} days`}
            >
              <ResponsiveContainer width="100%" height={280} minWidth={0}>
                <AreaChart
                  data={xpChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34f0be" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#34f0be" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(12, 20, 30, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    cursor={{ stroke: "#34f0be", strokeOpacity: 0.3 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    name="XP awarded"
                    stroke="#34f0be"
                    strokeWidth={2}
                    fill="url(#xpGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ─── two-col: sources + level distribution ────── */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="XP Sources"
                subtitle="How players are earning XP"
              >
                <ResponsiveContainer width="100%" height={280} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                    >
                      {sourceChartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(12, 20, 30, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [
                        `${fmt(Number(value ?? 0))} XP`,
                        String(name ?? ""),
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Level Distribution"
                subtitle="Players grouped by level band"
              >
                <ResponsiveContainer width="100%" height={280} minWidth={0}>
                  <BarChart
                    data={data.levelDistribution}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="band"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickLine={false}
                      width={40}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(12, 20, 30, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      cursor={{ fill: "rgba(52, 240, 190, 0.1)" }}
                    />
                    <Bar
                      dataKey="count"
                      name="Players"
                      fill="#34f0be"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ─── top players table ────────────────────────── */}
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label">Top Players</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Leaderboard by total XP
                  </p>
                </div>
                <span className="tag-accent">{data.topPlayers.length} shown</span>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-1)] text-left text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3 text-right">Total XP</th>
                      <th className="px-4 py-3 text-right">Streak</th>
                      <th className="px-4 py-3 text-right">Challenges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPlayers.map((p, i) => (
                      <tr
                        key={p.name}
                        className="border-t border-[var(--border-subtle)] bg-[var(--surface-0)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-1)]"
                      >
                        <td className="px-4 py-3 font-display font-semibold text-[var(--text-primary)]">
                          #{i + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                          {p.name}
                        </td>
                        <td className="px-4 py-3">Lv {p.level}</td>
                        <td className="px-4 py-3">{p.rank}</td>
                        <td className="px-4 py-3 text-right font-display font-semibold text-[var(--sagex-accent)]">
                          {fmt(p.totalXp)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.dailyStreak}d
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.challengesCompleted}
                        </td>
                      </tr>
                    ))}
                    {data.topPlayers.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-sm text-[var(--text-muted)]"
                        >
                          No players yet. Be the first to start a quest!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ─── sources detail table ─────────────────────── */}
            <section className="glass-card rounded-2xl p-5">
              <p className="section-label">XP Source Breakdown</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Full list of every XP source with event count and total awarded.
              </p>
              <div className="mt-4 grid gap-2">
                {data.topSources.map((s) => {
                  const pct =
                    data.totals.totalXpAwarded > 0
                      ? (s.xp / data.totals.totalXpAwarded) * 100
                      : 0;
                  return (
                    <div
                      key={s.source}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {s.label}
                          </p>
                          <p className="text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                            {s.source}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-sm font-semibold text-[var(--sagex-accent)]">
                            {fmt(s.xp)} XP
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {fmt(s.count)} events
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {data.topSources.length === 0 && (
                  <p className="text-center text-sm text-[var(--text-muted)]">
                    No XP has been awarded yet.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        <a href="/map" className="back-link">Back to map</a>
      </div>
    </div>
  );
}
