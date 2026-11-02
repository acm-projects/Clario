import { Link } from "react-router-dom";
import type { ProgressHistoryItem } from "../../types/progress";
import { chronological, formatScore, formatShortDate, sessionTitle, modeLabel } from "../../utils/progressFormat";
const duration = (seconds: number | null | undefined) => seconds == null ? "Not recorded" : `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
export default function RecentInterviews({ history }: { history: ProgressHistoryItem[] }) {
  return <section className="progress-card"><h2 className="border-b border-[#d9dedc] pb-5">Previous Sessions</h2>
    <ol className="divide-y divide-[#e7e5df]">{chronological(history).reverse().map(item => <li key={item.session_id} className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-semibold">{sessionTitle(item)}</h3><p className="progress-muted mt-1">{formatShortDate(item.date)}</p></div><Link to={`/report/${encodeURIComponent(item.session_id)}`} className="rounded-xl border border-[#3054ed] px-4 py-2 text-sm font-medium text-[#3054ed] hover:bg-[#e9edff]">See Report</Link></div>
      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{[["Duration", duration(item.duration_seconds)], ["Score", item.overall_score === null ? "Awaiting report" : `${formatScore(item.overall_score)}% (${formatScore(item.overall_score)} / 100)`], ["Mode", modeLabel(item.mode)], ["Difficulty", item.difficulty ?? "Not specified"]].map(([label, value]) => <div key={label}><dt className="progress-eyebrow">{label}</dt><dd className="mt-2 text-sm font-medium">{value}</dd></div>)}</dl>
    </li>)}</ol>
  </section>;
}
