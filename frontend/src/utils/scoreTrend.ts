import type { ProgressHistoryItem } from "../types/progress";

/** Only recorded overall scores belong on the progress graph. */
export function overallScorePoints(history: ProgressHistoryItem[]) {
  return history.filter(item => Number.isFinite(Date.parse(item.date)) &&
    typeof item.overall_score === "number" && Number.isFinite(item.overall_score) &&
    item.overall_score >= 0 && item.overall_score <= 100)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || a.session_id.localeCompare(b.session_id))
    .map(item => ({ id: item.session_id, date: item.date,
      label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }),
      title: item.problem_title?.trim() || "Interview", value: item.overall_score as number, technical: item.technical_score, reasoning: item.problem_solving_score, communication: item.communication_score }));
}
