import { useState } from "react";
import { Link } from "react-router-dom";
import type { ProgressHistoryItem } from "../../types/progress";
import { formatScore, formatShortDate, modeLabel } from "../../utils/progressFormat";
import { filterInterviews } from "../../utils/interviewHistory";

function durationLabel(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "Duration not recorded";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)} min ${total % 60} sec`;
}

function InterviewIcon({ item }: { item: ProgressHistoryItem }) {
  const name = `${item.problem_slug ?? ""} ${item.problem_title ?? ""} ${(item.topics ?? []).join(" ")}`.toLowerCase();
  const kind = item.mode === "repo_debugging" ? "debug" : item.mode === "system_design" ? "design" : item.mode === "company" ? "company" : /sum|math|integer|number/.test(name) ? "math" : /tree|graph/.test(name) ? "tree" : /string|anagram|palindrome/.test(name) ? "text" : "code";
  const paths = {
    debug: "M8 8h8v8a4 4 0 0 1-8 0V8Zm2 0V6a2 2 0 0 1 4 0v2M4 10h4m8 0h4M4 15h4m8 0h4M6 21l3-3m6 0 3 3M12 9v10",
    design: "M9 3h6v6H9zM2 16h6v6H2zm14 0h6v6h-6zM12 9v4m-7 3v-3h14v3",
    company: "M4 21V7h10v14M14 11h6v10M2 21h20M7 10h4m-4 4h4m-4 4h4m6-4h1m-1 4h1",
    math: "M5 3h14v18H5zM8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 3h2m4 0h2",
    tree: "M10 2h4v4h-4zM2 17h5v5H2zm15 0h5v5h-5zM12 6v6m-8 5v-5h16v5",
    text: "M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5",
    code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16",
  };
  return <span className={`history-icon history-icon-${kind}`} aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg></span>;
}

export default function RecentInterviews({ history }: { history: ProgressHistoryItem[] }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [topic, setTopic] = useState("All");
  const [status, setStatus] = useState("All");
  const topics = [...new Set(history.flatMap(item => item.topics ?? []))].sort();
  const rows = filterInterviews(history, query, difficulty, topic, status);
  const reset = () => { setQuery(""); setDifficulty("All"); setTopic("All"); setStatus("All"); };
  return <section className="progress-card progress-history" aria-labelledby="interview-history-heading">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="interview-history-heading">Previous Interviews</h2><p className="progress-muted mt-1">Your saved interviews and feedback, newest first.</p></div>
      <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 sm:w-64"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><span className="sr-only">Search interviews</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search interviews..." className="w-full min-w-0 bg-transparent py-2 text-sm outline-none" /></label>
    </div>
    <div className="my-5 flex flex-wrap items-center gap-3">
      <div role="group" aria-label="Interview difficulty" className="flex flex-wrap gap-1 rounded-xl bg-[var(--surface)] p-1">{["All", "Easy", "Medium", "Hard"].map(value => <button type="button" key={value} aria-pressed={difficulty === value} onClick={() => setDifficulty(value)} className="rounded-lg px-3 py-2 text-xs font-medium aria-pressed:bg-[var(--brand-blue)] aria-pressed:text-white">{value}</button>)}</div>
      <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">Topic<select aria-label="Interview topic" value={topic} onChange={event => setTopic(event.target.value)} className="min-h-10 max-w-48 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[var(--text)]"><option value="All">All topics</option>{topics.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">Status<select aria-label="Feedback status" value={status} onChange={event => setStatus(event.target.value)} className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[var(--text)]"><option value="All">All statuses</option><option value="reviewed">Reviewed</option><option value="pending">Awaiting feedback</option></select></label>
      <p className="ml-auto text-xs text-[var(--text-muted)]" role="status">Showing {rows.length} of {history.length} interviews</p>
    </div>
    <div className="max-w-full overflow-x-auto rounded-xl focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)]" role="region" aria-label="Previous interviews table" tabIndex={0}>
      <table className="w-full min-w-[760px]"><caption className="sr-only">Saved interview names, difficulty, mode, date and overall score</caption>
        <thead><tr>{["Interview", "Difficulty", "Mode", "Date", "Score"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{rows.map(item => <tr key={item.session_id}>
          <td className="min-w-56"><div className="history-interview"><InterviewIcon item={item} /><div><Link to={`/report/${encodeURIComponent(item.session_id)}`} className="history-interview-title">{item.problem_title?.trim() || "Practice interview"}</Link><p className="history-mode"><span className="history-mode-label">Mode: {modeLabel(item.mode) || "Not recorded"}</span><span className="history-duration">{durationLabel(item.duration_seconds)}</span></p></div></div></td>
          <td>{item.difficulty ? <span className={`difficulty-badge difficulty-${item.difficulty.toLowerCase()}`}>{item.difficulty}</span> : <span className="text-xs text-[var(--text-muted)]">Not recorded</span>}</td>

          <td><span className="history-mode-badge">{modeLabel(item.mode) || "Not recorded"}</span></td>
          <td className="whitespace-nowrap"><time dateTime={item.date} title={new Date(item.date).toLocaleString("en-US", { timeZone: "America/Chicago" })}>{formatShortDate(item.date)}</time><span className="history-time">{new Date(item.date).toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit", timeZone: "America/Chicago"})}</span></td>
          <td><Link to={`/report/${encodeURIComponent(item.session_id)}`} className="history-score" aria-label={`View report: ${item.overall_score === null ? "awaiting score" : `${formatScore(item.overall_score)} out of 100`}`}><strong>{item.overall_score === null ? "\u2014" : formatScore(item.overall_score)}</strong><span>{item.overall_score === null ? "Awaiting score" : "/ 100"}</span><small>View report &#8599;</small></Link></td>
        </tr>)}</tbody>
      </table>
    </div>
    {!rows.length && <div className="py-12 text-center"><p className="text-sm text-[var(--text-muted)]">No interviews match these filters.</p><button type="button" onClick={reset} className="mt-4 text-sm text-[var(--brand-blue)] underline">Clear filters</button></div>}
  </section>;
}
