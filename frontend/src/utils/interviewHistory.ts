import type { ProgressHistoryItem } from "../types/progress";
import { modeLabel } from "./progressFormat.ts";

export function filterInterviews(history: ProgressHistoryItem[], query: string, difficulty: string, topic: string, status: string) {
  const search = query.trim().toLowerCase();
  return history.filter(item =>
    (difficulty === "All" || item.difficulty === difficulty) &&
    (topic === "All" || item.topics?.includes(topic)) &&
    (status === "All" || item.feedback_status === status) &&
    [item.session_id, item.problem_title, item.problem_slug, modeLabel(item.mode), item.feedback_summary, ...(item.topics ?? [])].filter(Boolean).join(" ").toLowerCase().includes(search)
  ).sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.session_id.localeCompare(b.session_id));
}
