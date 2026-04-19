export type PlayerStats = {
  dailyStreak: number;
  lastStreakDate?: string;
  challengesCompleted: number;
  totalChallenges: number;
  totalXp: number;
  level: number;
  currentLevelXp: number;
  xpToNext: number;
  dailyXpEarned: number;
  dailyXpResetAt?: string;
  milestonesClaimed: number[];
  arenaSolved?: string[];
  arenaAttempts?: number;
  lastActiveAt?: string;
};

export type PlayerProfile = {
  playerId: string;
  name: string;
  avatar?: string;
  skill?: string;
  interests?: string[];
  stats: PlayerStats;
  createdAt?: string;
  updatedAt?: string;
};

export type LeaderboardEntry = {
  playerId: string;
  name: string;
  avatar?: string;
  skill?: string;
  rank: number;
  totalXp: number;
  level: number;
  rankTier: string;
  dailyStreak: number;
  challengesCompleted: number;
};
