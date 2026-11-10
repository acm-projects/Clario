import type { ProgressSummary } from "../../types/progress";
import { formatScore } from "../../utils/progressFormat";
import { Link } from "react-router-dom";

const percent = (score: number | null) => score === null ? "Not scored" : `${formatScore(score)}%`;

export default function StatCards({ summary: s }: { summary: ProgressSummary }) {
  return <div className="grid gap-4 md:grid-cols-3">
    <section className="progress-card progress-stat-card"><p className="progress-eyebrow">Interviews completed</p><p className="progress-stat">{s.total_sessions}</p><p className="progress-muted">Every interview is another step forward.</p></section>
    <section className="progress-card progress-stat-card"><p className="progress-eyebrow">Your average percentage</p><p className="progress-stat">{percent(s.average_overall)}</p><dl className="progress-category-rows">{[["Technical", s.average_by_category.technical], ["Reasoning", s.average_by_category.problem_solving], ["Communication", s.average_by_category.communication]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{percent(value as number | null)}</dd></div>)}</dl></section>
    <section className="progress-card progress-stat-card relative pb-14!" aria-label="Your overall score"><p className="progress-eyebrow">Your overall score</p><p className="progress-stat">{percent(s.latest_overall)}</p><p className="progress-muted">From your most recent interview.</p>{s.change_vs_first !== null && <p className="progress-stat-change mt-2 text-sm">{s.change_vs_first > 0 ? "▲" : s.change_vs_first < 0 ? "▼" : "↔"} {formatScore(Math.abs(s.change_vs_first))} percentage points since your first interview</p>}{s.latest_session_id && <Link to={`/report/${encodeURIComponent(s.latest_session_id)}`} aria-label="View your most recent interview report" className="absolute bottom-4 right-4 grid size-9 place-items-center rounded-full border border-white/40 text-xl text-white hover:bg-white/15">&#8599;</Link>}</section>
  </div>;
}
