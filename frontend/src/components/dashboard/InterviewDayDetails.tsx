import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeedbackHistory } from "../../lib/api";
import { parseFeedbackHistory } from "../../lib/feedback";
import type { CalendarInterview } from "../../lib/calendarRewards";

export default function InterviewDayDetails({ day, interviews }: {day: string; interviews: CalendarInterview[]}) {
  const [retry, setRetry] = useState(0);
  const signature = JSON.stringify([day, interviews.map(item => item.id).sort(), retry]);
  const [loaded, setLoaded] = useState<{key: string; available?: Set<string>; error?: string} | null>(null);
  useEffect(() => {
    if (!interviews.length) return;
    const controller = new AbortController();
    getFeedbackHistory(controller.signal).then(parseFeedbackHistory).then(history => {
      if (!controller.signal.aborted) setLoaded({key: signature, available: new Set(history.filter(item => item.status === "Available").map(item => item.id))});
    }).catch(() => {
      if (!controller.signal.aborted) setLoaded({key: signature, error: "Could not check feedback reports. Your completed interviews are still listed below."});
    });
    return () => controller.abort();
  }, [signature, interviews]);
  const dateLabel = new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric", timeZone: "UTC"});
  const loading = interviews.length > 0 && loaded?.key !== signature;
  const result = loaded?.key === signature ? loaded : null;
  return <section id="calendar-day-details" aria-label={`Interviews completed on ${dateLabel}`} aria-busy={loading} className="calendar-day-details mt-4 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
    <h4 className="text-sm font-semibold" aria-live="polite">{dateLabel} &middot; {interviews.length} completed {interviews.length === 1 ? "interview" : "interviews"}</h4>
    {!interviews.length ? <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">No completed interviews on this day.</p> : <>
      {loading && <p role="status" className="mt-2 text-xs text-[var(--text-muted)]">Checking feedback reports...</p>}
      {result?.error && <div role="alert" className="mt-2 text-xs leading-5 text-[var(--text-muted)]"><p>{result.error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-1 min-h-9 font-medium text-[#3054ed] underline">Retry reports</button></div>}
      <ul className="mt-2 max-h-64 list-none space-y-3 overflow-y-auto p-0">{interviews.map(interview => <li key={interview.id} className="min-w-0 border-t border-[var(--border)] pt-2 text-xs"><p className="break-words font-medium">{interview.title}</p><time dateTime={interview.endedAt} className="mt-1 block text-[var(--text-muted)]">{new Date(interview.endedAt).toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit", timeZone: "America/Chicago", timeZoneName: "short"})}</time>{result?.available?.has(interview.id) ? <Link to={`/report/${encodeURIComponent(interview.id)}`} className="mt-1 inline-flex min-h-9 items-center gap-1 font-medium text-[#3054ed] underline underline-offset-2" aria-label={`View feedback for ${interview.title}`}>View feedback <span aria-hidden="true">&#8599;</span></Link> : result?.available ? <p className="mt-1 text-[var(--text-muted)]">Feedback pending</p> : null}</li>)}</ul>
    </>}
  </section>;
}
