import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import PageHeading from "../components/ui/PageHeading";
import { generateSessionFeedback, getSessionFeedback, previewGeminiFeedback, type FeedbackPreview } from "../lib/api";
import { parseFeedbackHistory, scoreColumns, type FeedbackInterview } from "../lib/feedback";

type Report = Pick<FeedbackInterview, "topic" | "date" | "summary" | "scores" | "strengths" | "weaknesses" | "recommendations" | "limitations" | "coachQuote" | "coachNote" | "communicationMetrics">;
const surface = "rounded-3xl border border-[#e4e2db] bg-[#fffdf8] p-6 sm:p-8";

export default function InterviewReport({ preview = false }: { preview?: boolean }) {
  const { sessionId } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [sample, setSample] = useState<FeedbackPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState("Loading your interview...");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setReport(null); setSample(null); setError(null);
    setPhase(preview ? "Asking Gemini to review the sample interview..." : "Loading your interview...");
    async function load() {
      try {
        if (preview) {
          if (!(import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true")) throw new Error("The sample report is available only in local development.");
          const result = await previewGeminiFeedback();
          if (!active) return;
          setSample(result);
          setReport({ topic: "Two Sum sample", date: "", summary: result.report.summary,
            scores: { technical_score: result.report.technical_score, reasoning_score: result.report.reasoning_score, communication_score: result.report.communication_score, overall_score: result.report.overall_score },
            strengths: result.report.strengths, weaknesses: result.report.weaknesses, recommendations: result.report.recommendations, limitations: result.report.evidence_limitations,
            coachQuote: null, coachNote: null, communicationMetrics: null });
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
        if (active) setReport(interview);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "Could not load this report.");
      }
    }
    void load();
    return () => { active = false; };
  }, [sessionId, preview, retry]);

  return <main className={"app-sidebar-layout [&.app-sidebar-layout:has(.sidebar-collapsed)]:[--sidebar-width:var(--sidebar-compact)] min-h-svh bg-[var(--page-background)] px-4 pb-12 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]"}>
    <NavbarDashboard />
    <div className="mx-auto max-w-[1184px] pt-9 max-[700px]:pt-7">
      <Link to="/report" className="mb-6 inline-flex min-h-10 items-center text-sm text-[#3054ed] hover:underline">&#8592; All feedback reports</Link>
      <PageHeading eyebrow={preview ? "SAMPLE REPORT / NOT SAVED" : "YOUR INTERVIEW FEEDBACK"} title={report ? report.topic + " report" : "Interview report"} subtitle={preview ? "An unfinished solution and a sample transcript expressing uncertainty. This preview does not affect your interview history or scores." : report?.date ? new Date(report.date).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) : "Your feedback is saved with this interview so you can return to it anytime."} />
      {!report && !error && <section className={surface} role="status" aria-live="polite"><p className="text-lg font-medium">{phase}</p><p className="mt-3 text-sm text-[#687087]">This may take a moment.</p></section>}
      {error && <section className={surface} role="alert"><h2 className="text-xl font-semibold">Your report is not ready</h2><p className="mt-3 text-sm leading-7 text-[#687087]">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-5 min-h-11 rounded-xl bg-[#3054ed] px-5 py-3 text-sm font-semibold text-white">Try again</button><Link to="/report" className="ml-5 text-sm text-[#3054ed] underline">Back to previous interviews</Link></section>}
      {report && <article className="space-y-6">
        <section className={surface}><h2 className="text-xl font-semibold">Your interview at a glance</h2><p className="mt-4 text-sm leading-7 text-[#687087]">{report.summary}</p><dl className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">{scoreColumns.map(column => <div key={column.key} className="rounded-2xl bg-cream-gradient p-5"><dt className="text-xs text-[#687087]">{column.label}</dt><dd className="mt-2 text-2xl font-semibold">{report.scores[column.key] === null ? "Not scored" : report.scores[column.key] + "/100"}</dd></div>)}</dl></section>
        {report.communicationMetrics && <section className={surface}>
          <h2 className="text-xl font-semibold">Speech observations</h2>
          <p className="mt-2 text-sm text-[#687087]">Estimates from {Math.round(report.communicationMetrics.monitored_seconds)} seconds of enabled microphone monitoring.</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{[
            ["Silence (estimated)", Math.round(report.communicationMetrics.silent_seconds) + "s (" + report.communicationMetrics.silence_percent + "%)"],
            ["Longest pause", Math.round(report.communicationMetrics.longest_pause_seconds) + "s"],
            ["Filler matches", report.communicationMetrics.filler_count ?? "Unavailable"],
            ["Speaking pace (estimated)", report.communicationMetrics.words_per_speaking_minute === null ? "Unavailable" : report.communicationMetrics.words_per_speaking_minute + " wpm"],
          ].map(([label, value]) => <div key={label}><dt className="text-xs text-[#687087]">{label}</dt><dd className="mt-2 text-lg font-semibold">{value}</dd></div>)}</dl>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-xs leading-6 text-[#687087]">{report.communicationMetrics.limitations.map(item => <li key={item}>{item}</li>)}</ul>
        </section>}
        <section className={surface}><div className={"feedback-insights [&.feedback-insights]:[display:grid] [&.feedback-insights]:[grid-template-columns:repeat(3,minmax(0,1fr))] [&.feedback-insights]:[gap:24px] [&.feedback-insights]:[margin-top:26px] [&.feedback-insights_h3]:[font-size:14px] [&.feedback-insights_h3]:[font-weight:600] [&.feedback-insights_h3]:[margin-bottom:12px] [&.feedback-insights_:is(li,p)]:[font-size:14px] [&.feedback-insights_:is(li,p)]:[line-height:1.9] [&.feedback-insights_:is(li,p)]:[color:#687087] [&.feedback-insights_ul]:[padding-left:16px] [&.feedback-insights_ul]:[list-style:disc] [&.feedback-insights_li_+_li]:[margin-top:8px] [@media_(max-width:760px)]:[&.feedback-insights]:[grid-template-columns:1fr] !mt-0"}>{[{title: "What worked", items: report.strengths}, {title: "Where to focus", items: report.weaknesses}, {title: "Try next", items: report.recommendations}].map(group => <div key={group.title}><h2 className="mb-4 text-lg font-semibold">{group.title}</h2>{group.items.length ? <ul>{group.items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No observations recorded.</p>}</div>)}</div></section>
        {report.limitations.length > 0 && <section className={surface}><h2 className="text-lg font-semibold">What this report could assess</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#687087]">{report.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
        {sample && <details className={surface}><summary className="cursor-pointer font-semibold">View sample evidence</summary><pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-cream-gradient p-4 text-sm">{sample.evidence.code}</pre><p className="mt-4 text-sm leading-7">{sample.evidence.candidate_transcript}</p><p className="mt-4 text-xs text-[#687087]">Model: {sample.report.model}</p></details>}
      </article>}
    </div>
  </main>;
}
