import { request } from "../lib/api";
import type { InterviewEvidence } from "../lib/interviewVoice";

export interface RepositoryFile { path: string; content: string; language: string; readOnly: boolean }
export interface RepoChallengeSummary {
  id: string; title: string; difficulty: string; language: string; category: string;
  estimatedMinutes: number; description: string; objective: string; expectedBehavior: string;
  constraints: string[]; entrypoint: string;
}
export interface RepoChallenge extends RepoChallengeSummary { files: RepositoryFile[] }
export interface RepoTestResult { name: string; passed: boolean; message?: string | null }
export interface RepoEvaluation {
  success: boolean; passed: number; failed: number; total: number; tests: RepoTestResult[]; error: string | null;
  submission?: { saved: boolean; submission_id: string | null; message: string };
}
const base = "/api/repo-challenges";
export function listRepoChallenges(signal?: AbortSignal) { return request<RepoChallengeSummary[]>(base, { signal }); }
export function getRepoChallenge(id: string, signal?: AbortSignal) { return request<RepoChallenge>(`${base}/${encodeURIComponent(id)}`, { signal }); }
export function runRepoChallenge(id: string, files: Record<string, string>) {
  return request<RepoEvaluation>(`${base}/${encodeURIComponent(id)}/run`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files }),
  }, true);
}
export function finishRepoChallenge(id: string, files: Record<string, string>, evidence: InterviewEvidence) {
  return request<{ saved: boolean; submission_id: string; message: string }>(`${base}/${encodeURIComponent(id)}/finish`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files, ...evidence }),
  }, true);
}
