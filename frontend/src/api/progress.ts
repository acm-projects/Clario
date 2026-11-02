import { request } from "../lib/api";
import type { ProgressHistoryItem, ProgressSummary } from "../types/progress";

export async function getProgress(signal?: AbortSignal) {
  const [history, summary] = await Promise.all([
    request<ProgressHistoryItem[]>("/api/progress/history", { signal }, true),
    request<ProgressSummary>("/api/progress/summary", { signal }, true),
  ]);
  return { history, summary };
}
