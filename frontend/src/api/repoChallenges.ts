import { ApiError, request } from "../lib/api";

export interface RepositoryFile { path: string; content: string; language: string; readOnly: boolean }
export interface RepoChallengeSummary {
  id: string; title: string; difficulty: string; language: string; category: string;
  estimatedMinutes: number; description: string; objective: string; expectedBehavior: string;
  constraints: string[]; entrypoint: string;
}
export interface RepoChallenge extends RepoChallengeSummary { files: RepositoryFile[] }
export interface RepoTestResult { name: string; passed: boolean; message?: string | null }
export interface RepoEvaluation {
  success: boolean; passed: number; failed: number; total: number; tests: RepoTestResult[]; error: string | null; stderr?: string; timed_out?: boolean;
  submission?: { saved: boolean; submission_id: string | null; message: string };
}
const base = "/api/repo-challenges";
export function listRepoChallenges(signal?: AbortSignal) { return request<RepoChallengeSummary[]>(base, { signal }); }
export function getRepoChallenge(id: string, signal?: AbortSignal) { return request<RepoChallenge>(`${base}/${encodeURIComponent(id)}`, { signal }); }
export async function runRepoChallenge(id: string, files: Record<string, string>, submit: boolean) {
  try { return await request<RepoEvaluation>(`${base}/${encodeURIComponent(id)}/${submit ? "submit" : "run"}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files }),
  }, true); } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error("Could not reach the test server. Check your connection and try again.", { cause: error });
  }
}
