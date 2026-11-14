export type SessionFeedbackState = {
  feedback?: { id?: string } | null;
  processing?: { status: string; error?: string | null } | null;
  [key: string]: unknown;
};

/**
 * Client-side ceiling. Covers the backend's 60s wait for the post-call webhook plus
 * one Gemini call (bounded at ~120s server-side, including one retry).
 */
export const REPORT_DEADLINE_MS = 240_000;
/** How often to re-ask the backend to resume a job that is not actively running. */
const NUDGE_INTERVAL_MS = 15_000;
const POLL_INTERVAL_MS = 2_000;

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const stop = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", stop); resolve(); }, ms);
    signal.addEventListener("abort", stop, { once: true });
  });
}

function phaseFor(status: string | undefined) {
  if (status === "waiting_for_transcript") return "Waiting for the interviewer’s final transcript...";
  if (status === "stalled") return "Resuming your report after an interruption...";
  return "Gemini is reviewing your interview and preparing your report...";
}

/**
 * Follow the durable post-call job. While a worker is actively running Gemini
 * ("processing"), only poll. For every other unfinished status, periodically POST so
 * the backend can resume a stuck job or fall back to the live transcript; the backend
 * decides, and its per-session lock prevents duplicate Gemini requests.
 */
export async function loadSessionReport(options: {
  read: () => Promise<SessionFeedbackState>;
  generate: () => Promise<unknown>;
  signal: AbortSignal;
  retry: boolean;
  onPhase: (phase: string) => void;
  pause?: (ms: number, signal: AbortSignal) => Promise<void>;
  now?: () => number;
}): Promise<SessionFeedbackState> {
  const now = options.now ?? Date.now;
  const deadline = now() + REPORT_DEADLINE_MS;
  let retriedFailure = false;
  let lastNudge = -Infinity;
  while (!options.signal.aborted && now() < deadline) {
    const row = await options.read();
    const status = row.processing?.status;
    // A saved report is final unless a worker is replacing it right now.
    if (row.feedback?.id && status !== "processing" && status !== "pending") return row;
    if (status === "failed") {
      if (!options.retry || retriedFailure) {
        throw new Error(row.processing?.error || "Report generation failed. Your interview is saved; please try again.");
      }
      retriedFailure = true;
      lastNudge = -Infinity;
    }
    if (status !== "processing" && now() - lastNudge >= NUDGE_INTERVAL_MS) {
      lastNudge = now();
      options.onPhase(phaseFor(status));
      const feedback = await options.generate();
      if (feedback && typeof feedback === "object" && "id" in feedback) {
        return { ...row, feedback: feedback as { id: string } };
      }
    }
    options.onPhase(phaseFor(status));
    await (options.pause ?? delay)(POLL_INTERVAL_MS, options.signal);
  }
  if (options.signal.aborted) throw options.signal.reason;
  throw new Error("Your report is taking longer than expected. Your interview is saved; please try again shortly.");
}
