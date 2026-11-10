import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import PageHeading from "../components/ui/PageHeading";
import ReportSolution from "../components/progress/ReportSolution";
import { generateSessionFeedback, getSessionFeedback, previewGeminiFeedback, type FeedbackPreview } from "../lib/api";
import { parseFeedbackHistory, scoreColumns, type FeedbackInterview } from "../lib/feedback";
import "./interview-report-highlights.css";

type Report = FeedbackInterview;
const stages = [["understand", "U", "Understand"], ["match", "M", "Match"], ["plan", "P", "Plan"], ["implement", "I", "Implement"], ["review", "R", "Review"], ["evaluate", "E", "Evaluate"]] as const;

const surface = "rounded-3xl border border-[#e4e2db] bg-[#fffdf8] p-6 sm:p-8";
const practiceCues: Record<string, string> = {
  understand: "Restate the goal, then clarify one constraint before solving.",
  match: "Name your approach and explain why it fits this problem.",
  plan: "Outline your steps and the invariant you want to maintain.",
  implement: "Connect each important implementation choice to your plan.",
  review: "Trace one normal example and one edge case out loud.",
  evaluate: "State time and space complexity, then discuss a trade-off.",
};

const stageGuidance: Record<string, string> = {
  understand: "Before writing code, restate the expected input and output and ask about constraints. For example: can the input be empty, and how should duplicates behave? Use the answer to choose your edge cases.",
  match: "After clarifying the task, name the pattern or data structure you want to use. Explain which repeated work it avoids and why it fits the constraints before moving to your plan.",
  plan: "Just before coding, describe the steps in order and what stays true at each step. Connect each step to the expected output so the interviewer can follow your solution.",
  implement: "While coding, briefly connect the key condition, loop, or data structure to your plan. Explain why a choice is correct, especially where you handle boundaries or update state.",
  review: "After your first implementation, trace a normal input through the actual code. Then try an empty input, a boundary, or duplicates where relevant; explain the expected result and correct any mismatch.",
  evaluate: "Before wrapping up, state time and space complexity in terms of the input size. Identify which operation dominates and describe one trade-off or alternative when constraints change.",
};

export default function InterviewReport({ preview = false }: { preview?: boolean }) {
  const { sessionId } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [sample, setSample] = useState<FeedbackPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState("Loading your interview...");
  const [retry, setRetry] = useState(0);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (selectedStage) dialog.current?.showModal(); }, [selectedStage]);
  async function upgrade() {
    if (!sessionId || !report) return;
    setUpgrading(true); setUpgradeError(null);
    try {
      const feedback = await generateSessionFeedback(sessionId, true);
      const row = await getSessionFeedback(sessionId) as Record<string, unknown>;
      setReport(parseFeedbackHistory([{ ...row, feedback }])[0]);
    } catch (error) { setUpgradeError(error instanceof Error ? error.message : "Could not generate the detailed breakdown."); }
    finally { setUpgrading(false); }
  }
  useEffect(() => {
    let active = true;
    async function load() {
      await Promise.resolve();
      if (!active) return;
      setReport(null); setSample(null); setError(null);
      setPhase(preview ? "Asking Gemini to review the sample interview..." : "Loading your interview...");
      try {
        if (preview) {
          if (!(import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true")) throw new Error("The sample report is available only in local development.");
          const result = await previewGeminiFeedback();
          if (!active) return;
          setSample(result);
          setReport(parseFeedbackHistory([{ session: { id: "sample", status: "completed", ended_at: new Date().toISOString() }, problem: { title: "Two Sum sample" }, feedback: { id: "sample", ...result.report, report: result.report } }])[0]);
          return;
        }
        if (!sessionId) throw new Error("No interview was selected.");
        const row = await getSessionFeedback(sessionId);
        if (!active) return;
        let interview = parseFeedbackHistory([row])[0];
        if (interview.status === "Pending") {
          setPhase("Gemini is reviewing your interview and preparing your report...");
          const feedback = await generateSessionFeedback(sessionId);
          if (!active) return;
          interview = parseFeedbackHistory([{ ...(row as Record<string, unknown>), feedback }])[0];
        }
        if (!interview.isFallback && (!interview.detailed || !interview.fullSummary)) {
          setPhase("Gemini is reviewing the saved interview for your detailed breakdown...");
          const feedback = await generateSessionFeedback(sessionId, true);
          if (!active) return;
          interview = parseFeedbackHistory([{ ...(row as Record<string, unknown>), feedback }])[0];
        }
        if (active) setReport(interview);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "Could not load this report.");
      }
    }
    void load();
    return () => { active = false; };
  }, [sessionId, preview, retry]);

  return <main className={"app-sidebar-layout [&.app-sidebar-layout:has(.sidebar-collapsed)]:[--sidebar-width:var(--sidebar-compact)] min-h-svh bg-cream-gradient px-4 pb-12 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]"}>
    <NavbarDashboard />
    <div className="mx-auto max-w-[1184px] pt-9 max-[700px]:pt-7">
      <Link to="/progress" className="mb-6 inline-flex min-h-10 items-center text-sm text-[#3054ed] hover:underline">&#8592; Your progress and previous sessions</Link>
      <PageHeading eyebrow={preview ? "SAMPLE REPORT / NOT SAVED" : "YOUR INTERVIEW FEEDBACK"} title={report ? report.topic + " report" : "Interview report"} subtitle={preview ? "An unfinished solution and a sample transcript expressing uncertainty. This preview does not affect your interview history or scores." : report?.date ? new Date(report.date).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) : "Your feedback is saved with this interview so you can return to it anytime."} />
      {!report && !error && <section className={surface} role="status" aria-live="polite"><p className="text-lg font-medium">{phase}</p><p className="mt-3 text-sm text-[#687087]">This may take a moment.</p></section>}
      {error && <section className={surface} role="alert"><h2 className="text-xl font-semibold">Your report is not ready</h2><p className="mt-3 text-sm leading-7 text-[#687087]">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-5 min-h-11 rounded-xl bg-[#3054ed] px-5 py-3 text-sm font-semibold text-white">Try again</button><Link to="/progress" className="ml-5 text-sm text-[#3054ed] underline">Back to previous interviews</Link></section>}
      {report && <article className="interview-report space-y-6">
        {report.isFallback && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#687087]" role="status"><span>AI review pending. Displayed scores are temporary and excluded from progress.</span><button type="button" disabled={upgrading} onClick={() => void upgrade()} className="min-h-11 text-[#3054ed] underline">{upgrading ? "Reviewing..." : "Refresh review"}</button>{upgradeError && <p role="alert">{upgradeError}</p>}</div>}
        <section className="report-scores" aria-label="This interview's scores">{[[scoreColumns[0]], [scoreColumns[2]], [scoreColumns[1], scoreColumns[3]]].map((columns, index) => <div className="report-score report-chart-card" key={index}>{columns.map(({ label, key }) => { const score = report.scores[key]; return <div className={`report-chart report-chart-${key === "communication_score" || key === "overall_score" ? "yellow" : "blue"}`} key={key}><h2>{label}</h2><div className="report-pie" role="img" aria-label={`${label}: ${score === null ? "not assessed" : `${score}%`}`} style={{ background: score === null ? "#ffffff33" : `conic-gradient(var(--chart-color) ${score}%, var(--chart-track) 0)` }}><span>{score === null ? "?" : `${score}%`}</span></div><small>{score === null ? "Not assessed" : report.isFallback ? "AI review pending" : "From this interview"}</small></div>; })}</div>)}</section>
        <section className={`${surface} report-ai-summary`} aria-labelledby="ai-summary-heading"><h2 id="ai-summary-heading"><span className="report-sparkle" aria-hidden="true">&#10022;</span> AI Summary</h2>{!report.fullSummary && !preview && <button type="button" disabled={upgrading} className="mt-3 text-sm underline" onClick={() => void upgrade()}>{upgrading ? "Reviewing interview..." : "Generate full summary and coding feedback"}</button>}{upgradeError && <p role="alert">{upgradeError}</p>}<p className="report-summary-preview">{report.summary ?? report.fullSummary?.split("\n\n")[0] ?? "A detailed summary was not saved. Start with the fixes below, then use the UMPIRE details to practice explaining your approach."}</p><div className="report-summary-next"><h3>Focus for your next solution</h3><p>{report.actions.fix[0] ?? report.recommendations[0] ?? "Explain your plan before coding, trace one example and one edge case, and finish with time and space complexity."}</p></div>{report.fullSummary && report.fullSummary !== report.summary && <button type="button" className="report-detail-arrow report-read-more" aria-label="Read full explanation of your interview" onClick={() => setSelectedStage("summary")}>Read full explanation <span aria-hidden="true">&#8599;</span></button>}</section>

        <section className={`${surface} report-fillers`}><h2>Your main filler words</h2>{report.fillerWords.available ? report.fillerWords.items.length ? <ul>{report.fillerWords.items.map(item => <li key={item.word}><span>&ldquo;{item.word}&rdquo;</span><small>{item.count} {item.count === 1 ? "match" : "matches"}</small></li>)}</ul> : <p>No filler matches found in your saved transcript.</p> : <p>Filler words were not recorded in this report.</p>}<p className="report-filler-note">From your saved transcript.</p></section>
        <section className="report-umpire-section" aria-labelledby="umpire-heading"><div className="report-section-title"><div><h2 id="umpire-heading"><span className="report-umpire-icon" aria-hidden="true">&#10023;</span> Your UMPIRE breakdown</h2></div>{!report.detailed && !preview && <button type="button" disabled={upgrading} onClick={() => void upgrade()}>{upgrading ? "Preparing breakdown..." : "Generate detailed breakdown"}</button>}</div>{upgradeError && <p role="alert">{upgradeError}</p>}
          <div className="report-umpire">{stages.map(([key, letter, label]) => { const rating = report.umpire[key]; const tone = report.isFallback || rating.stars === null ? "unassessed" : rating.stars >= 4 ? "strong" : rating.stars <= 2 ? "focus" : "developing"; return <section className={`report-stage report-stage-${tone}`} key={key}><span className={`report-stage-status report-stage-status-${tone}`}>{tone === "strong" ? "Strength" : tone === "focus" ? "Focus area" : tone === "developing" ? "Building consistency" : "Review pending"}</span><div className="report-stage-title"><span className="report-letter">{letter}</span><h3>{label}</h3></div><div className="report-stars" aria-label={rating.stars === null ? "Not assessed" : `${rating.stars} out of 5 stars`}><span aria-hidden="true">{Array.from({length:5}, (_, i) => <span className={rating.stars !== null && i < rating.stars ? "filled" : ""} key={i}>&#9733;</span>)}</span><small>{rating.stars === null ? "Not assessed" : `${rating.stars}/5`}</small></div><p className="report-stage-takeaway">{rating.summary}</p><button type="button" className="report-detail-arrow" aria-label={`View ${label} details`} onClick={() => setSelectedStage(key)}>Explain it <span aria-hidden="true">&#8599;</span></button></section>; })}</div>
        </section>

        <ReportSolution report={report} />
        <dialog ref={dialog} className="report-dialog" aria-labelledby="stage-dialog-title" onClose={() => setSelectedStage(null)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
          {selectedStage && selectedStage !== "summary" && <><div className="report-section-title"><h2 id="stage-dialog-title">{stages.find(([key]) => key === selectedStage)?.[2]}</h2><button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close details">&#10005;</button></div><p>{report.umpire[selectedStage].details}</p><h3>Practice cue</h3><p>{practiceCues[selectedStage]}</p><h3>Where to add this</h3><p>{stageGuidance[selectedStage]}</p>{report.umpire[selectedStage].evidence_quotes.length > 0 && <><h3>From your interview</h3>{report.umpire[selectedStage].evidence_quotes.map((quote, index) => <blockquote key={index}>{quote}</blockquote>)}</>}</>}
          {selectedStage === "summary" && <><div className="report-section-title"><h2 id="stage-dialog-title">AI Summary</h2><button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close summary">&#10005;</button></div><p>{report.fullSummary ?? report.summary ?? "No summary was saved."}</p>{!report.fullSummary && <>{[{ title: "What you did well", items: report.strengths }, { title: "Where to improve", items: report.weaknesses }, { title: "Next steps", items: report.recommendations }].map(group => <section key={group.title}><h3>{group.title}</h3>{group.items.map((item, i) => <p key={i}>{item}</p>)}</section>)}{report.coachNote && <p>{report.coachNote}</p>}</>}</>}
        </dialog>
        {sample && <details className={surface}><summary className="cursor-pointer font-semibold">View sample evidence</summary><pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-cream-gradient p-4 text-sm">{sample.evidence.code}</pre><p className="mt-4 text-xs text-[#687087]">Model: {sample.report.model}</p></details>}
      </article>}
    </div>
  </main>;
}
