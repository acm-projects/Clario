import type { ProgressSummary } from "../../types/progress";
import { formatScore, scoreColor } from "../../utils/progressFormat";

const percent = (score: number | null) => score === null ? "Not scored" : `${formatScore(score)}%`;

export default function StatCards({ summary: s }: { summary: ProgressSummary }) {
  return <div className="grid gap-4 md:grid-cols-3">
    <section className="progress-card progress-stat-card"><p className="progress-eyebrow">Interviews completed</p><p className="progress-stat">{s.total_sessions}</p><p className="progress-muted">Every interview is another step forward.</p></section>
    <section className="progress-card progress-stat-card"><p className="progress-eyebrow">Average score</p><p className={`progress-stat ${s.average_overall === null ? "" : scoreColor(s.average_overall)}`}>{formatScore(s.average_overall)}{s.average_overall !== null && "%"}</p><p className="progress-muted">Problem Solving {percent(s.average_by_category.problem_solving)} · Technical {percent(s.average_by_category.technical)} · Communication {percent(s.average_by_category.communication)}</p></section>
    <section className="progress-card progress-stat-card"><p className="progress-eyebrow">Latest score</p><p className={`progress-stat ${s.latest_overall === null ? "" : scoreColor(s.latest_overall)}`}>{formatScore(s.latest_overall)}{s.latest_overall !== null && "%"}</p>{s.change_vs_first !== null && <p className={`text-sm ${s.change_vs_first > 0 ? "text-green-700" : s.change_vs_first < 0 ? "text-red-600" : "progress-muted"}`}>{s.change_vs_first > 0 ? "▲" : s.change_vs_first < 0 ? "▼" : "↔"} {formatScore(Math.abs(s.change_vs_first))} percentage points since your first interview</p>}</section>
  </div>;
}
