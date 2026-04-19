export type TimeSeriesPoint = {
  date: string; // YYYY-MM-DD
  xp: number;
  events: number;
};

export type SourceBreakdown = {
  source: string;
  label: string;
  count: number;
  xp: number;
};

export type LevelDistributionBucket = {
  band: string; // e.g. "1-4", "5-9"
  count: number;
};

export type TopPlayer = {
  name: string;
  avatar?: string;
  level: number;
  rank: string;
  totalXp: number;
  dailyStreak: number;
  challengesCompleted: number;
};

export type AnalyticsTotals = {
  players: number;
  activePlayers7d: number;
  activePlayersToday: number;
  xpEvents: number;
  totalXpAwarded: number;
  totalXpAwarded24h: number;
  avgLevel: number;
  maxLevel: number;
  vibeSubmissions: number;
  vibeVotes: number;
  quests: number;
};

export type AnalyticsPayload = {
  generatedAt: string;
  totals: AnalyticsTotals;
  xpOverTime: TimeSeriesPoint[];
  topSources: SourceBreakdown[];
  levelDistribution: LevelDistributionBucket[];
  topPlayers: TopPlayer[];
};
