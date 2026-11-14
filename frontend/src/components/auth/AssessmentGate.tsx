import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { getMyAssessment } from "../../lib/assessmentApi";
import { isMissingAssessment } from "../../lib/assessmentContract";
import type { ProfileContext } from "../../lib/profile";

export default function AssessmentGate() {
  const context = useOutletContext<ProfileContext>();
  const location = useLocation();
  const [retry, setRetry] = useState(0);
  const key = `${context.user.id}:${location.key}:${retry}`;
  const [result, setResult] = useState<{ key: string; missing: boolean; error: string | null } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getMyAssessment(controller.signal).then(() => {
      if (!controller.signal.aborted) setResult({ key, missing: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, missing: isMissingAssessment(error), error: isMissingAssessment(error) ? null : error instanceof Error ? error.message : "Could not check your assessment." });
    });
    return () => controller.abort();
  }, [key]);
  if (result?.key !== key) return <main className="grid min-h-svh place-items-center bg-[var(--page-background)]" role="status">Checking your assessment...</main>;
  if (result.error) return <main className="grid min-h-svh place-items-center bg-[var(--page-background)] px-6"><div><p role="alert">{result.error}</p><button className="mt-4 rounded-lg bg-[#3054ed] px-5 py-3 text-white" onClick={() => setRetry(value => value + 1)}>Try again</button></div></main>;
  if (result.missing) return <Navigate to="/assessment" replace />;
  return <Outlet context={context} />;
}
