export type PlayerStats = {
  dailyStreak: number;
  lastStreakDate?: string;
  challengesCompleted: number;
  totalChallenges: number;
  totalXp: number;
  lastActiveAt?: string;
};

export type PlayerProfile = {
  name: string;
  avatar?: string;
  skill?: string;
  interests?: string[];
  stats: PlayerStats;
  createdAt?: string;
  updatedAt?: string;
};

export type LeaderboardEntry = {
  name: string;
  avatar?: string;
  skill?: string;
  rank: number;
  totalXp: number;
  dailyStreak: number;
  challengesCompleted: number;
};
