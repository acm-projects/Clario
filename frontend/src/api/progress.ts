import { request } from "../lib/api";
import type { ProgressHistoryItem, ProgressSummary, ProgressTopics } from "../types/progress";

export async function getProgress(signal?: AbortSignal) {
  const [history, summary, topics] = await Promise.all([
    request<ProgressHistoryItem[]>("/api/progress/history", { signal }, true),
    request<ProgressSummary>("/api/progress/summary", { signal }, true),
    request<ProgressTopics>("/api/progress/topics", { signal }, true),
  ]);
  return { history, summary, topics };
}
