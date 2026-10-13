import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavbarDashboard from "../components/NavbarDashboard";
import { loadFeedbackHistory, scoreColumns, type FeedbackInterview } from "../lib/feedback";

import { sampleFeedback } from "../data/sampleData";

const surface = "rounded-2xl border border-[#191d20]/5 bg-[#fffdf8] p-5 shadow-[0_12px_32px_-18px_rgba(75,63,34,0.25)] sm:p-7";
const dateLabel = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });

export default function Feedback() {
  const [showSampleData, setShowSampleData] = useState(true);
  const [loaded, setLoaded] = useState<FeedbackInterview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [expandedInterview, setExpandedInterview] = useState<string | null>(null);

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

  const history = showSampleData ? sampleFeedback : loaded ?? [];
  const interviews = history.filter((interview) =>
    (difficulty === "All" || interview.difficulty?.toLowerCase() === difficulty.toLowerCase()) &&
    (category === "All" || scoreColumns.some((column) => column.label === category && interview.scores[column.key] !== null)) &&
    (status === "All" || interview.status === status) &&
    [interview.id, interview.topic, interview.summary].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  );
  const points = history.filter((interview) => scoreColumns.some((column) => interview.scores[column.key] !== null)).slice().reverse();
  function resetFilters() { setQuery(""); setDifficulty("All"); setCategory("All"); setStatus("All"); }

  return (
    <main className="app-sidebar-layout min-h-svh bg-[#f6efd9] px-4 pb-10 pt-2 font-sans text-[#29251d] sm:px-6 lg:px-[5%] [&_button]:cursor-pointer [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4">
      <NavbarDashboard />
      <div className="mx-auto max-w-[1120px]">
        <div className="pb-7 pt-8 sm:pt-10">
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Feedback Report</h1>
          <p className="mt-2 text-sm leading-6 text-[#55595c]">See where you're strong, where to focus, and how far you've come.</p>
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#e7f0fc] px-4 py-3 text-xs text-[#2565b4]"><p>{showSampleData ? "Sample feedback: try scores, search, filters, and pending reports." : "Showing your interview feedback."}</p><button type="button" aria-pressed={showSampleData} onClick={() => setShowSampleData((value) => !value)} className="min-h-9 font-semibold underline underline-offset-4">{showSampleData ? "Show my data" : "Show sample data"}</button></div>
        {error && !showSampleData ? <section className={surface}><p role="alert">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-lg bg-[#3b8fe8] px-5 py-3 text-sm">Retry</button></section> :
          !loaded && !showSampleData ? <p role="status" className={surface}>Loading your feedback...</p> :
          !history.length ? <section className={`${surface} py-16 text-center`}>
            <h2 className="text-xl font-semibold">No feedback yet</h2>
            <p className="mt-3 text-sm leading-7 text-[#55595c]">Your completed interviews and feedback will appear here.</p>
            <Link to="/problems" className="mt-6 inline-flex rounded-lg bg-[#3b8fe8] px-5 py-3 text-sm font-semibold">Browse problems</Link>
          </section> : <>
            <section aria-labelledby="performance-heading" className={surface}>
              <h2 id="performance-heading" className="text-lg font-semibold">Performance Over Time</h2>
              {points.length ? <><p className="mt-2 text-xs text-[#777a7c]">{dateLabel(points[0].date)}{points.length > 1 ? ` - ${dateLabel(points[points.length - 1].date)}` : ""}</p><PerformanceChart interviews={points} /></> : <p className="mt-5 text-sm text-[#55595c]">Your performance chart will appear when scored feedback is available.</p>}
            </section>
            <section aria-labelledby="history-heading" className={`${surface} mt-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 id="history-heading" className="text-xl font-semibold">Previous Interviews</h2>
                <div className="flex flex-wrap gap-2">
                  <label><span className="sr-only">Search interviews</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search interviews..." className="min-h-10 rounded-lg border border-[#191d20]/15 bg-white px-3 text-xs" /></label>
                  <button type="button" aria-expanded={showFilters} aria-controls="feedback-filters" onClick={() => setShowFilters((value) => !value)} className="rounded-lg border border-[#191d20]/15 px-4 text-xs">Filter</button>
                </div>
              </div>
              <div id="feedback-filters" hidden={!showFilters} className="mt-5 rounded-xl bg-[#f7f3e8] p-4">
                <div className="flex flex-wrap items-end gap-4">
                  {[{ label: "Difficulty", value: difficulty, update: setDifficulty, options: ["All", "Easy", "Medium", "Hard"] }, { label: "Scored category", value: category, update: setCategory, options: ["All", ...scoreColumns.map((column) => column.label)] }, { label: "Feedback status", value: status, update: setStatus, options: ["All", "Available", "Pending"] }].map((filter) => <label key={filter.label} className="flex min-w-36 flex-1 flex-col gap-2 text-xs">{filter.label}<select value={filter.value} onChange={(event) => filter.update(event.target.value)} className="min-h-10 rounded-lg border border-[#191d20]/15 bg-white px-3">{filter.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}
                  <button type="button" onClick={resetFilters} className="min-h-10 text-xs text-[#2565b4] underline">Clear filters</button>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <caption className="sr-only">Feedback from your completed interviews</caption>
                  <thead className="text-[10px] uppercase tracking-wide text-[#89836d]"><tr>{["Problem", "Difficulty", "Feedback summary", ...scoreColumns.map((column) => column.label), "Date", "Status", "Assessment"].map((heading) => <th key={heading} scope="col" className="border-b border-[#191d20]/10 px-2 pb-3 font-medium">{heading}</th>)}</tr></thead>
                  <tbody>{interviews.map((interview) => <Fragment key={interview.id}><tr className="border-b border-[#191d20]/8">
                    <th scope="row" className="px-2 py-4 text-left font-medium">{interview.topic}</th>
                    <td className="px-2 py-4 capitalize">{interview.difficulty || "Unavailable"}</td>
                    <td className="max-w-64 px-2 py-4 leading-5">{interview.summary || (interview.status === "Pending" ? "Feedback pending" : "No written summary available")}</td>
                    {scoreColumns.map((column) => <td key={column.key} className="px-2 py-4">{interview.scores[column.key] === null ? <span aria-label="Score unavailable">--</span> : `${interview.scores[column.key]}%`}</td>)}
                    <td className="whitespace-nowrap px-2 py-4"><time dateTime={interview.date}>{dateLabel(interview.date)}</time></td>
                    <td className="px-2 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] ${interview.status === "Available" ? "bg-[#deeedf] text-[#477052]" : "bg-[#f5dfbb] text-[#8a6115]"}`}>{interview.status}</span></td>
                    <td className="px-2 py-4"><button type="button" aria-expanded={expandedInterview === interview.id} aria-controls={`assessment-review-${interview.id}`} aria-label={`${expandedInterview === interview.id ? "Collapse" : "Expand"} assessment review for ${interview.topic}, ${dateLabel(interview.date)}`} onClick={() => setExpandedInterview((current) => current === interview.id ? null : interview.id)} className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-[#e7f0fc] px-3 py-2 font-medium text-[#2565b4] transition hover:bg-[#d5e6fc] motion-reduce:transition-none">{expandedInterview === interview.id ? "Hide review" : "View review"}<span aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${expandedInterview === interview.id ? "rotate-180" : ""}`}>&#8964;</span></button></td>
                  </tr><tr hidden={expandedInterview !== interview.id} id={`assessment-review-${interview.id}`}><td colSpan={10} className="p-3">
                    <section aria-label={`Assessment review for ${interview.topic}`} className="rounded-xl border border-[#3b8fe8]/15 bg-[#f2f7fd] p-5">
                      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold">Assessment review · {interview.topic}</h3><span className="text-[11px] text-[#55595c]">{dateLabel(interview.date)} · {interview.id}</span></div>
                      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{scoreColumns.map((column) => <div key={column.key} className="rounded-lg border border-[#191d20]/5 bg-white p-4"><dt className="text-xs text-[#55595c]">{column.label}</dt><dd className="mt-2 text-2xl font-semibold tracking-tight text-[#2565b4]">{interview.scores[column.key] === null ? <span className="text-sm font-normal text-[#777a7c]">{interview.status === "Pending" ? "Pending" : "Unavailable"}</span> : <>{interview.scores[column.key]}<span className="ml-1 text-xs font-normal text-[#55595c]">/ 100</span></>}</dd></div>)}</dl>
                    </section>
                  </td></tr></Fragment>)}{!interviews.length && <tr><td colSpan={10} className="py-10 text-center">No matching interviews. <button type="button" onClick={resetFilters} className="text-[#2565b4] underline">Clear filters</button></td></tr>}</tbody>
                </table>
              </div>
              <p role="status" className="mt-4 text-[10px] text-[#89836d]">{interviews.length} of {history.length} completed interviews</p>
            </section>
          </>}
      </div>
    </main>
  );
}

function PerformanceChart({ interviews }: { interviews: FeedbackInterview[] }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const series = scoreColumns.filter((column) => interviews.some((interview) => interview.scores[column.key] !== null));
  const start = Date.parse(interviews[0].date);
  const end = Date.parse(interviews[interviews.length - 1].date);
  const x = (date: string) => end === start ? 486 : 52 + (Date.parse(date) - start) / (end - start) * 868;
  const y = (score: number) => 176 - score / 100 * 150;
  return <figure className="m-0 mt-5">
    <svg viewBox="0 0 950 215" role="img" aria-labelledby="trend-title trend-description" className="w-full">
      <title id="trend-title">Your interview performance over time</title>
      <desc id="trend-description">Recorded scores for completed interviews, from zero to one hundred percent. Missing scores leave gaps. A single interview appears as a point.</desc>
      {[0, 25, 50, 75, 100].map((score) => <g key={score}><line x1="52" x2="920" y1={y(score)} y2={y(score)} stroke="#dedbd2" strokeDasharray="3 4" /><text x="40" y={y(score) + 4} textAnchor="end" fill="#777a7c" fontSize="12">{score}%</text></g>)}
      {series.filter((column) => !hidden.includes(column.label)).map((column) => <g key={column.key}>{interviews.map((interview, index) => {
        const score = interview.scores[column.key];
        const previous = interviews[index - 1];
        const previousScore = previous?.scores[column.key];
        if (score === null) return null;
        return <g key={interview.id}>{previous && previousScore != null && <line x1={x(previous.date)} y1={y(previousScore)} x2={x(interview.date)} y2={y(score)} stroke={column.color} strokeWidth="3" />}<circle cx={x(interview.date)} cy={y(score)} r="4" fill={column.color}><title>{dateLabel(interview.date)}: {column.label} {score}%</title></circle></g>;
      })}</g>)}
      <text x={x(interviews[0].date)} y="205" textAnchor={end === start ? "middle" : "start"} fill="#55595c" fontSize="11">{dateLabel(interviews[0].date)}</text>
      {end !== start && <text x="920" y="205" textAnchor="end" fill="#55595c" fontSize="11">{dateLabel(interviews[interviews.length - 1].date)}</text>}
    </svg>
    <figcaption className="mt-2 flex flex-wrap justify-center gap-5">{series.map((column) => <button key={column.key} type="button" aria-pressed={!hidden.includes(column.label)} onClick={() => setHidden((current) => current.includes(column.label) ? current.filter((value) => value !== column.label) : [...current, column.label])} className={`min-h-9 rounded px-1 text-xs ${hidden.includes(column.label) ? "opacity-40" : ""}`} style={{ color: column.color }}>{column.label}</button>)}</figcaption>
  </figure>;
}
