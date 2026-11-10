import { request } from "../lib/api";
import type { ProgressHistoryItem, ProgressSummary } from "../types/progress";

export async function getProgress(signal?: AbortSignal) {
  return request<{ history: ProgressHistoryItem[]; summary: ProgressSummary }>("/api/progress", { signal }, true);
}
