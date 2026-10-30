export type Difficulty = "Easy" | "Medium" | "Hard";

export type UmpireStep = "understand" | "match" | "plan" | "implement" | "review" | "evaluate";

export type ProgressHistoryItem = {
  session_id: string;
  date: string;
  problem_slug: string | null;
  problem_title: string | null;
  difficulty: Difficulty | null;
  mode: string;
  overall_score: number | null;
  problem_solving_score: number | null;
  technical_score: number | null;
  communication_score: number | null;
};

export type ProgressSummary = {
  total_sessions: number;
  average_overall: number | null;
  average_by_category: {
    problem_solving: number | null;
    technical: number | null;
    communication: number | null;
  };
  latest_overall: number | null;
  change_vs_first: number | null;
  umpire_miss_rate: Record<UmpireStep, number | null>;
};

export type TopicStat = {
  topic: string;
  attempts: number;
  average_overall: number;
};

export type ProgressTopics = {
  topics: TopicStat[];
  weak_topics: string[];
};
