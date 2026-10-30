import type { ProgressSummary } from "../../types/progress";
import { formatScore, scoreColor } from "../../utils/progressFormat";

export default function StatCards({ summary: s }: { summary: ProgressSummary }) {
  return <div className="grid gap-4 md:grid-cols-3">
    <section className="progress-card"><p className="progress-eyebrow">Interviews completed</p><p className="progress-stat">{s.total_sessions}</p><p className="progress-muted">Every interview is another step forward.</p></section>
    <section className="progress-card"><p className="progress-eyebrow">Average score</p><p className={`progress-stat ${s.average_overall === null ? "" : scoreColor(s.average_overall)}`}>{formatScore(s.average_overall)}</p><p className="progress-muted">Problem Solving {formatScore(s.average_by_category.problem_solving)} · Technical {formatScore(s.average_by_category.technical)} · Communication {formatScore(s.average_by_category.communication)}</p></section>
    <section className="progress-card"><p className="progress-eyebrow">Latest score</p><p className={`progress-stat ${s.latest_overall === null ? "" : scoreColor(s.latest_overall)}`}>{formatScore(s.latest_overall)}</p>{s.change_vs_first !== null && <p className={`text-sm ${s.change_vs_first > 0 ? "text-green-700" : s.change_vs_first < 0 ? "text-red-600" : "progress-muted"}`}>{s.change_vs_first > 0 ? "▲" : s.change_vs_first < 0 ? "▼" : "↔"} {formatScore(Math.abs(s.change_vs_first))} since your first interview</p>}</section>
  </div>;
}
