import { useEffect, useState } from "react";
import { request } from "../../lib/api";
import type { ProgressHistoryItem } from "../../types/progress";
import ScoreTrendChart from "./ScoreTrendChart";

export default function ReportScoreHistory() {
  const [history, setHistory] = useState<ProgressHistoryItem[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    request<ProgressHistoryItem[]>("/api/progress/history", { signal: controller.signal }, true)
      .then(rows => { if (!controller.signal.aborted) setHistory(rows); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [retry]);
  if (history) return <ScoreTrendChart history={history} />;
  return <section className="rounded-3xl border border-[var(--border,#e4e2db)] bg-[var(--card,#fffdf8)] p-6 sm:p-8"><h2 className="text-xl font-semibold">Your trend</h2>{error ? <><p className="mt-3 text-sm text-[var(--muted,#687087)]">Your score history could not be loaded.</p><button type="button" onClick={() => { setError(false); setRetry(value => value + 1); }} className="mt-4 text-sm text-[#3054ed] underline">Try again</button></> : <p className="mt-3 text-sm text-[var(--muted,#687087)]" role="status">Loading your overall scores…</p>}</section>;
}
