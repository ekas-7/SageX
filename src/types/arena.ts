export type ArenaDifficulty = "beginner" | "builder" | "competitive";

export type ArenaTestCase = {
  input: string;
  expected: string;
  rubric: string;
};

export type ArenaProblem = {
  problemId: string;
  slug: string;
  title: string;
  difficulty: ArenaDifficulty;
  topic: string;
  scenario: string;
  task: string;
  starterPrompt?: string;
  testCases: ArenaTestCase[];
  rubric: string;
  maxScore: number;
  solvedCount: number;
  attemptCount: number;
};

export type ArenaCaseResult = {
  input: string;
  output: string;
  caseScore: number;
  feedback: string;
};

export type ArenaAttemptResult = {
  score: number;
  passed: boolean;
  results: ArenaCaseResult[];
  overallFeedback: string;
  attemptsUsedThisHour: number;
  attemptLimitPerHour: number;
  xpAwarded: number;
  leveledUp: boolean;
  levelAfter: number;
  rank: string;
  totalXp: number;
};

export type ArenaListEntry = {
  problemId: string;
  slug: string;
  title: string;
  difficulty: ArenaDifficulty;
  topic: string;
  solvedCount: number;
  attemptCount: number;
  solved: boolean;
};
