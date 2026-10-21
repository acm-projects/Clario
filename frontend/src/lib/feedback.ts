
export const scoreColumns = [
  { label: "Technical", key: "technical_score", color: "#4c83a3" },
  { label: "Reasoning", key: "reasoning_score", color: "#9b8ca9" },
  { label: "Communication", key: "communication_score", color: "#78aaa2" },
  { label: "Overall", key: "overall_score", color: "#d3a34f" },
] as const;
export type ScoreKey = typeof scoreColumns[number]["key"];
export type FeedbackInterview = {
  id: string; topic: string; difficulty: string | null; date: string;
  summary: string | null; status: "Available" | "Pending";
  scores: Record<ScoreKey, number | null>;
};
export function validScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}
export function isCompletedSession(row: Record<string, unknown>) {
  return typeof row.ended_at === "string" && Number.isFinite(Date.parse(row.ended_at)) &&
    (row.status == null || ["completed", "finished"].includes(String(row.status).toLowerCase()));
}
// Keep the report page usable without login while the report API is pending.
export async function loadFeedbackHistory(): Promise<FeedbackInterview[]> {
  return [];
}
