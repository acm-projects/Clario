
export const scoreColumns = [
  { label: "Coding", key: "technical_score", color: "#4c83a3" },
  { label: "Reasoning", key: "reasoning_score", color: "#9b8ca9" },
  { label: "Communication", key: "communication_score", color: "#78aaa2" },
  { label: "Overall", key: "overall_score", color: "#d3a34f" },
] as const;
export type ScoreKey = typeof scoreColumns[number]["key"];
export type CommunicationMetrics = {
  monitored_seconds: number; silent_seconds: number; silence_percent: number;
  longest_pause_seconds: number; filler_count: number | null;
  words_per_speaking_minute: number | null; limitations: string[];
  silence_intervals: { start_seconds: number; end_seconds: number; duration_seconds: number }[];
};
function communicationMetrics(value: unknown): CommunicationMetrics | null {
  const row = record(value);
  const keys = ["monitored_seconds", "silent_seconds", "silence_percent", "longest_pause_seconds"] as const;
  if (!keys.every(key => typeof row[key] === "number" && Number.isFinite(row[key]) && row[key] >= 0)) return null;
  const optional = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
  return { monitored_seconds: row.monitored_seconds as number, silent_seconds: row.silent_seconds as number,
    silence_percent: row.silence_percent as number, longest_pause_seconds: row.longest_pause_seconds as number,
    filler_count: optional(row.filler_count), words_per_speaking_minute: optional(row.words_per_speaking_minute), limitations: strings(row.limitations),
    silence_intervals: (Array.isArray(row.silence_intervals) ? row.silence_intervals : []).flatMap(value => {
      const interval = record(value);
      const start = optional(interval.start_seconds), end = optional(interval.end_seconds), duration = optional(interval.duration_seconds);
      return start !== null && end !== null && duration !== null && end >= start ? [{ start_seconds: start, end_seconds: end, duration_seconds: duration }] : [];
    }) };
}
export type FeedbackInterview = {
  id: string; topic: string; difficulty: string | null; date: string;
  summary: string | null; status: "Available" | "Pending";
  scores: Record<ScoreKey, number | null>;
  communicationMetrics: CommunicationMetrics | null;
  coachQuote: string | null; coachNote: string | null;
  strengths: string[]; weaknesses: string[]; recommendations: string[]; limitations: string[];
  techniqueGaps: { technique: string; evidence: string; practice: string }[];
};
export function validScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}
export function isCompletedSession(row: Record<string, unknown>) {
  return typeof row.ended_at === "string" && Number.isFinite(Date.parse(row.ended_at)) &&
    (row.status == null || ["completed", "finished"].includes(String(row.status).toLowerCase()));
}
function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value : null; }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
export function parseFeedbackHistory(payload: unknown): FeedbackInterview[] {
  if (!Array.isArray(payload)) throw new Error("Invalid feedback history.");
  return payload.map(item => {
    const row = record(item), session = record(row.session), feedback = record(row.feedback), problem = record(row.problem), report = record(feedback.report);
    if (typeof session.id !== "string" || !isCompletedSession(session)) throw new Error("Invalid completed interview.");
    return {
      id: session.id,
      topic: text(problem.title) ?? text(session.problem_slug)?.split("-").join(" ") ?? "Practice interview",
      difficulty: text(problem.difficulty), date: session.ended_at as string,
      summary: text(report.summary), status: typeof feedback.id === "string" ? "Available" : "Pending",
      scores: Object.fromEntries(scoreColumns.map(column => [column.key, validScore(feedback[column.key])])) as Record<ScoreKey, number | null>,
      communicationMetrics: communicationMetrics(report.communication_metrics),
      coachQuote: text(report.coach_quote), coachNote: text(report.coach_note),
      strengths: strings(feedback.strengths), weaknesses: strings(feedback.weaknesses), recommendations: strings(feedback.recommendations), limitations: strings(report.evidence_limitations),
      techniqueGaps: (Array.isArray(report.technique_gaps) ? report.technique_gaps : []).flatMap(value => { const gap = record(value); return typeof gap.technique === "string" && typeof gap.evidence === "string" && typeof gap.practice === "string" ? [{ technique: gap.technique, evidence: gap.evidence, practice: gap.practice }] : []; }),
    };
  });
}
export async function loadFeedbackHistory(): Promise<FeedbackInterview[]> {
  const { getFeedbackHistory } = await import("./api");
  return parseFeedbackHistory(await getFeedbackHistory());
}
