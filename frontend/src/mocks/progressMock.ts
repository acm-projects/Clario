import type { ProgressHistoryItem, ProgressSummary, ProgressTopics } from "../types/progress";

export const historyMock: ProgressHistoryItem[] = [
  { session_id: "mock-1", date: "2026-10-09T18:00:00Z", problem_slug: "two-sum", problem_title: "Two Sum", difficulty: "Easy", mode: "surprise", overall_score: 54.5, problem_solving_score: 55, technical_score: 60, communication_score: 45 },
  { session_id: "mock-2", date: "2026-10-11T18:00:00Z", problem_slug: "valid-palindrome", problem_title: "Valid Palindrome", difficulty: "Easy", mode: "recommended", overall_score: 62.2, problem_solving_score: 62, technical_score: 70, communication_score: 50 },
  { session_id: "mock-3", date: "2026-10-13T18:00:00Z", problem_slug: "valid-anagram", problem_title: "Valid Anagram", difficulty: "Easy", mode: "recommended", overall_score: 53.7, problem_solving_score: 50, technical_score: 58, communication_score: 52 },
  { session_id: "mock-4", date: "2026-10-16T18:00:00Z", problem_slug: "climbing-stairs", problem_title: "Climbing Stairs", difficulty: "Easy", mode: "custom", overall_score: 53.3, problem_solving_score: 48, technical_score: 55, communication_score: 58 },
  { session_id: "mock-5", date: "2026-10-18T18:00:00Z", problem_slug: "3sum", problem_title: "3Sum", difficulty: "Medium", mode: "recommended", overall_score: 72.4, problem_solving_score: 72, technical_score: 78, communication_score: 64 },
  { session_id: "mock-6", date: "2026-10-21T18:00:00Z", problem_slug: "group-anagrams", problem_title: "Group Anagrams", difficulty: "Medium", mode: "surprise", overall_score: 62.4, problem_solving_score: 58, technical_score: 64, communication_score: 66 },
  { session_id: "mock-7", date: "2026-10-24T18:00:00Z", problem_slug: "maximum-depth-of-binary-tree", problem_title: "Maximum Depth of Binary Tree", difficulty: "Easy", mode: "custom", overall_score: 82.4, problem_solving_score: 82, technical_score: 88, communication_score: 74 },
  { session_id: "mock-8", date: "2026-10-27T18:00:00Z", problem_slug: "house-robber", problem_title: "House Robber", difficulty: "Medium", mode: "recommended", overall_score: 64.8, problem_solving_score: 60, technical_score: 62, communication_score: 76 },
  { session_id: "mock-9", date: "2026-10-29T18:00:00Z", problem_slug: null, problem_title: null, difficulty: null, mode: "company", overall_score: 82.1, problem_solving_score: 80, technical_score: 84, communication_score: 82 },
];

export const summaryMock: ProgressSummary = {
  total_sessions: 9,
  average_overall: 65.3,
  average_by_category: { problem_solving: 63.0, technical: 68.8, communication: 63.0 },
  latest_overall: 82.1,
  change_vs_first: 27.6,
  umpire_miss_rate: { understand: 0.0, match: 0.11, plan: 0.56, implement: 0.0, review: 0.44, evaluate: 0.33 },
};

export const topicsMock: ProgressTopics = {
  topics: [
    { topic: "Math", attempts: 1, average_overall: 53.3 },
    { topic: "Memoization", attempts: 1, average_overall: 53.3 },
    { topic: "Hash Table", attempts: 3, average_overall: 56.9 },
    { topic: "Dynamic Programming", attempts: 2, average_overall: 59.1 },
    { topic: "String", attempts: 3, average_overall: 59.4 },
    { topic: "Sorting", attempts: 3, average_overall: 62.8 },
    { topic: "Array", attempts: 4, average_overall: 63.5 },
    { topic: "Two Pointers", attempts: 2, average_overall: 67.3 },
    { topic: "Tree", attempts: 1, average_overall: 82.4 },
    { topic: "Binary Tree", attempts: 1, average_overall: 82.4 },
  ],
  weak_topics: ["Hash Table", "Dynamic Programming", "String"],
};

// Use this to test the empty state
export const emptySummaryMock: ProgressSummary = {
  total_sessions: 0,
  average_overall: null,
  average_by_category: { problem_solving: null, technical: null, communication: null },
  latest_overall: null,
  change_vs_first: null,
  umpire_miss_rate: { understand: null, match: null, plan: null, implement: null, review: null, evaluate: null },
};
