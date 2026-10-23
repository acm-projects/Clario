import PageHeading from "../components/ui/PageHeading";
import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { loadFeedbackHistory, scoreColumns, type FeedbackInterview } from "../lib/feedback";


const surface = "rounded-2xl border border-[#182137]/5 bg-white p-5 shadow-[0_12px_32px_-18px_rgba(75,63,34,0.25)] sm:p-6";
const dateLabel = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });

export default function Feedback() {
  const [loaded, setLoaded] = useState<FeedbackInterview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoaded(null);
      setError(null);
      try {
        const interviews = await loadFeedbackHistory();
        if (active) setLoaded(interviews);
      } catch {
        if (active) setError("We couldn't load your feedback. Please try again.");
      }
    }
    void load();
    return () => { active = false; };
  }, [retry]);

  const history = loaded ?? [];
  const selected = history.find(interview => interview.status === "Available");
  const interviews = history.filter((interview) =>
    (difficulty === "All" || interview.difficulty?.toLowerCase() === difficulty.toLowerCase()) &&
    (category === "All" || scoreColumns.some((column) => column.label === category && interview.scores[column.key] !== null)) &&
    (status === "All" || interview.status === status) &&
    [interview.id, interview.topic, interview.summary].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  );
  const points = history.filter((interview) => scoreColumns.some((column) => interview.scores[column.key] !== null)).slice().reverse();
  function resetFilters() { setQuery(""); setDifficulty("All"); setCategory("All"); setStatus("All"); }

  return (
    <main className={"app-sidebar-layout [&.app-sidebar-layout:has(.sidebar-collapsed)]:[--sidebar-width:var(--sidebar-compact)] min-h-svh bg-[#fbf4df] px-4 pb-12 pt-2 font-sans text-[#29251d] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_button]:cursor-pointer [&_:is(a,button,input,select):focus-visible]:outline-2 [&_:is(a,button,input,select):focus-visible]:outline-offset-4 [&_:is(a,button,input,select):focus-visible]:outline-[#3054ed]"}>
      <NavbarDashboard />
      <div className="mx-auto max-w-[1120px]">
        <div className="pt-9 max-[700px]:pt-7"><PageHeading eyebrow="YOUR PROGRESS, IN FOCUS" title="Feedback report" subtitle="See where you're strong, where to focus, and how far you've come." /></div>
        {import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true" && <section className={surface + " mb-6"}><h2 className="text-xl font-semibold">Test Gemini feedback</h2><p className="mt-3 text-sm text-[#687087]">Preview feedback for an unfinished Two Sum solution and a sample transcript expressing uncertainty.</p><Link to="/report/preview" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#3054ed] px-5 py-3 text-sm font-semibold text-white">Open test report</Link></section>}
        {error && <section className={`${surface} mb-6`}><p role="alert">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 min-h-10 rounded-lg bg-[#3054ed] px-5 py-3 text-sm text-white">Retry</button></section>}
            <section aria-labelledby="performance-heading" className={surface}>
              <h2 id="performance-heading" className="text-lg font-semibold">Performance Over Time <span className="text-sm font-normal text-[#777a7c]">(Past Few Months)</span></h2>
              {points.length > 0 && <p className="mt-2 text-xs text-[#777a7c]">{dateLabel(points[0].date)}{points.length > 1 ? ` - ${dateLabel(points[points.length - 1].date)}` : ""}</p>}
              <PerformanceChart interviews={points} loading={loaded === null && !error} />
            </section>
            <div className={"feedback-history-layout [&.feedback-history-layout]:[display:grid] [&.feedback-history-layout]:[grid-template-columns:minmax(0,1fr)_290px] [&.feedback-history-layout]:[gap:20px] [&.feedback-history-layout]:[align-items:start] [&.feedback-history-layout]:[margin-top:24px] [&.feedback-history-layout_>_section]:[min-width:0] [@media_(max-width:1100px)]:[&.feedback-history-layout]:[grid-template-columns:minmax(0,1fr)]"}><section aria-labelledby="history-heading" className={surface}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 id="history-heading" className="text-xl font-semibold">Previous Interviews</h2>
                <div className="flex flex-wrap gap-2">
                  <label><span className="sr-only">Search interviews</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search interviews..." className="min-h-10 rounded-lg border border-[#182137]/15 bg-white px-3 text-xs" /></label>
                  <button type="button" aria-expanded={showFilters} aria-controls="feedback-filters" onClick={() => setShowFilters((value) => !value)} className="rounded-lg border border-[#182137]/15 px-4 text-xs">Filter</button>
                </div>
              </div>
              <div id="feedback-filters" hidden={!showFilters} className="mt-5 rounded-xl bg-[#f7f3e8] p-4">
                <div className="flex flex-wrap items-end gap-4">
                  {[{ label: "Difficulty", value: difficulty, update: setDifficulty, options: ["All", "Easy", "Medium", "Hard"] }, { label: "Scored category", value: category, update: setCategory, options: ["All", ...scoreColumns.map((column) => column.label)] }, { label: "Feedback status", value: status, update: setStatus, options: ["All", "Available", "Pending"] }].map((filter) => <label key={filter.label} className="flex min-w-36 flex-1 flex-col gap-2 text-xs">{filter.label}<select value={filter.value} onChange={(event) => filter.update(event.target.value)} className="min-h-10 rounded-lg border border-[#182137]/15 bg-white px-3">{filter.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}
                  <button type="button" onClick={resetFilters} className="min-h-10 text-xs text-[#2946c5] underline">Clear filters</button>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <caption className="sr-only">Feedback from your completed interviews</caption>
                  <thead className="text-[10px] uppercase tracking-wide text-[#89836d]"><tr>{["ID", "Topic", "Difficulty", "Feedback summary", "Category", "Date", "Status"].map((heading) => <th key={heading} scope="col" className="border-b border-[#182137]/10 px-2 pb-3 font-medium">{heading}</th>)}</tr></thead>
                  <tbody>{interviews.map((interview) => <tr key={interview.id} className="border-b border-[#182137]/8">
                    <td className="whitespace-nowrap px-2 py-4 text-[#777a7c]">{interview.id}</td>
                    <th scope="row" className="px-2 py-4 font-medium"><Link to={"/report/" + encodeURIComponent(interview.id)} className="text-[#3054ed] underline underline-offset-4">{interview.topic}</Link></th>
                    <td className="px-2 py-4 capitalize">{interview.difficulty || "Unavailable"}</td>
                    <td className="max-w-64 px-2 py-4 leading-5">{interview.summary || (interview.status === "Pending" ? "Feedback pending" : "No written summary available")}</td>
                    <td className="px-2 py-4"><div className="flex flex-wrap gap-1">{scoreColumns.filter((column) => interview.scores[column.key] !== null).map((column) => <span key={column.key} className="rounded-full bg-[#e9edff] px-2 py-1 text-[10px] text-[#2946c5]">{column.label}</span>)}</div></td>
                    <td className="whitespace-nowrap px-2 py-4"><time dateTime={interview.date}>{dateLabel(interview.date)}</time></td>
                    <td className="px-2 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] ${interview.status === "Available" ? "bg-[#deeedf] text-[#477052]" : "bg-[#f5dfbb] text-[#8a6115]"}`}>{interview.status}</span><Link to={"/report/" + encodeURIComponent(interview.id)} className="mt-3 block min-h-9 text-left text-[11px] text-[#3054ed] underline">{interview.status === "Pending" ? "Generate report" : "View report"}</Link></td>
                  </tr>)}{!interviews.length && <tr><td colSpan={7} className="py-12 text-center">{loaded === null && !error ? "Loading your interviews..." : history.length ? <>No matching interviews. <button type="button" onClick={resetFilters} className="text-[#2946c5] underline">Clear filters</button></> : <><p className="font-medium text-[#687087]">No previous interviews yet</p><p className="mt-2 text-xs text-[#777a7c]">Your completed interviews and feedback will appear here.</p></>}</td></tr>}</tbody>
                </table>
              </div>
              <p role="status" className="mt-4 text-[10px] text-[#89836d]">{interviews.length} of {history.length} completed interviews</p>
            </section>
            <aside className={"feedback-coach-note [&.feedback-coach-note]:[padding:28px] [&.feedback-coach-note]:[background:#ffdf4f] [&.feedback-coach-note]:[border-radius:24px] [&.feedback-coach-note]:[color:#182137] [&.feedback-coach-note_svg]:[width:26px] [&.feedback-coach-note_svg]:[height:26px] [&.feedback-coach-note_svg]:[margin:30px_0_16px] [&.feedback-coach-note_blockquote]:[font-size:24px] [&.feedback-coach-note_blockquote]:[line-height:1.15] [&.feedback-coach-note_blockquote]:[letter-spacing:-.04em] [&.feedback-coach-note_blockquote]:[font-weight:500] [&.feedback-coach-note_>_p:not(.reference-eyebrow)]:[font-size:12px] [&.feedback-coach-note_>_p:not(.reference-eyebrow)]:[line-height:1.8] [&.feedback-coach-note_>_p:not(.reference-eyebrow)]:[margin-top:18px] [@media_(max-width:1100px)]:[&.feedback-coach-note]:[max-width:100%]"} aria-labelledby="coach-note-heading"><p id="coach-note-heading" className={"reference-eyebrow [&.reference-eyebrow]:[font-family:monospace] [&.reference-eyebrow]:[font-size:10px] [&.reference-eyebrow]:[font-weight:600] [&.reference-eyebrow]:[letter-spacing:.13em]"}>COACH&#8217;S NOTE</p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 3h16v14H9l-5 4V3Z"/><path d="M8 7h8M8 11h6"/></svg><blockquote>{selected?.coachQuote ?? "Lead with the map, then take us on the journey."}</blockquote><p>{selected?.coachNote ?? "Before typing, use one sentence to name your approach and explain why it fits the problem."}</p><span className={"feedback-note-label [&.feedback-note-label]:[display:block] [&.feedback-note-label]:[margin-top:24px] [&.feedback-note-label]:[color:#716126] [&.feedback-note-label]:[font:9px/1.6_monospace]"}>{selected ? "From your interview feedback" : "A reminder for your next interview"}</span></aside>
            </div>
      </div>
    </main>
  );
}

function PerformanceChart({ interviews, loading }: { interviews: FeedbackInterview[]; loading: boolean }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const series = scoreColumns;
  const start = Date.parse(interviews[0]?.date ?? "");
  const end = Date.parse(interviews[interviews.length - 1]?.date ?? "");
  const x = (date: string) => end === start ? 486 : 52 + (Date.parse(date) - start) / (end - start) * 868;
  const y = (score: number) => 176 - score / 100 * 150;
  return <figure className="m-0 mt-5">
    <svg viewBox="0 0 950 215" role="img" aria-labelledby="trend-title trend-description" className="w-full">
      <title id="trend-title">Your interview performance over time</title>
      <desc id="trend-description">{interviews.length ? "Recorded scores for completed interviews, from zero to one hundred percent. Missing scores leave gaps." : "No interview scores yet. The chart shows only its scale, with no recorded data."}</desc>
      {[0, 25, 50, 75, 100].map((score) => <g key={score}><line x1="52" x2="920" y1={y(score)} y2={y(score)} stroke="#dedbd2" strokeDasharray="3 4" /><text x="40" y={y(score) + 4} textAnchor="end" fill="#777a7c" fontSize="12">{score}%</text></g>)}
      {series.filter((column) => !hidden.includes(column.label)).map((column) => <g key={column.key}>{interviews.map((interview, index) => {
        const score = interview.scores[column.key];
        const previous = interviews[index - 1];
        const previousScore = previous?.scores[column.key];
        if (score === null) return null;
        return <g key={interview.id}>{previous && previousScore != null && <line x1={x(previous.date)} y1={y(previousScore)} x2={x(interview.date)} y2={y(score)} stroke={column.color} strokeWidth="3" />}<circle cx={x(interview.date)} cy={y(score)} r="4" fill={column.color}><title>{dateLabel(interview.date)}: {column.label} {score}%</title></circle></g>;
      })}</g>)}
      {interviews.length > 0 && <text x={x(interviews[0].date)} y="205" textAnchor={end === start ? "middle" : "start"} fill="#687087" fontSize="11">{dateLabel(interviews[0].date)}</text>}
      {interviews.length > 1 && end !== start && <text x="920" y="205" textAnchor="end" fill="#687087" fontSize="11">{dateLabel(interviews[interviews.length - 1].date)}</text>}
      {!interviews.length && <text x="486" y="105" textAnchor="middle" fill="#777a7c" fontSize="14">{loading ? "Loading your progress..." : "No performance data yet"}</text>}
    </svg>
    <figcaption className="mt-2 flex flex-wrap justify-center gap-5">{series.map((column) => <button key={column.key} type="button" aria-pressed={!hidden.includes(column.label)} onClick={() => setHidden((current) => current.includes(column.label) ? current.filter((value) => value !== column.label) : [...current, column.label])} className={`min-h-9 rounded px-1 text-xs ${hidden.includes(column.label) ? "opacity-40" : ""}`} style={{ color: column.color }}>{column.label}</button>)}</figcaption>
  </figure>;
}
