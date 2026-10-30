import type { ProgressHistoryItem, UmpireStep } from "../types/progress";

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
}
const MODE_LABELS: Record<string, string> = {
  recommended: "Recommended", practice: "Practice", custom: "Custom", surprise: "Surprise Me",
  surprise_me: "Surprise Me", full_mock: "Surprise Me", company: "Company Interview",
  repo_debugging: "Repository Debugging", system_design: "System Design",
};
export function modeLabel(mode: string): string { return MODE_LABELS[mode] ?? mode; }
export function sessionTitle(item: { problem_title: string | null; mode: string }): string {
  return item.problem_title?.trim() || modeLabel(item.mode);
}
export function scoreColor(score: number): string {
  return score >= 75 ? "text-green-700" : score >= 60 ? "text-yellow-700" : "text-red-600";
}
export function formatScore(score: number | null): string { return score === null ? "—" : score.toFixed(1).replace(/\.0$/, ""); }
export function chronological(history: ProgressHistoryItem[]): ProgressHistoryItem[] {
  return [...history].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
export const UMPIRE_STEPS: { key: UmpireStep; label: string; tip: string }[] = [
  { key: "understand", label: "Understand", tip: "Restate the problem and clarify the expected behavior before starting." },
  { key: "match", label: "Match", tip: "Connect the problem to patterns you know, and explain why they fit." },
  { key: "plan", label: "Plan", tip: "Say your plan out loud before you code." },
  { key: "implement", label: "Implement", tip: "Turn your plan into small, readable changes." },
  { key: "review", label: "Review", tip: "Walk through your changes and check for edge cases." },
  { key: "evaluate", label: "Evaluate", tip: "Test your solution and explain its time and space costs." },
];
