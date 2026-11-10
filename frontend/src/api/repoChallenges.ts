import { request } from "../lib/api";
import type { InterviewEvidence } from "../lib/interviewVoice";

export type RepoLanguage = "python" | "cpp";
export interface RepositoryFile { path: string; content: string; language: string; readOnly: boolean }
export interface RepoChallengeSummary {
  id: string; title: string; difficulty: string; language: string; category: string;
  languages: RepoLanguage[]; estimatedMinutes: number; description: string; objective: string; expectedBehavior: string;
  constraints: string[]; entrypoint: string;
}
export interface RepoChallenge extends RepoChallengeSummary { files: RepositoryFile[] }
export interface RepoTestResult { name: string; passed: boolean; status?: "passed" | "failed" | "error"; message?: string | null }
export interface RepoEvaluation {
  starter_unchanged?: boolean; not_run?: number; success: boolean; passed: number; failed: number; total: number; tests: RepoTestResult[]; error: string | null;
  submission?: { saved: boolean; submission_id: string | null; message: string };
}
const base = "/api/repo-challenges";
export function listRepoChallenges(signal?: AbortSignal) { return request<RepoChallengeSummary[]>(base, { signal }); }
export function getRepoChallenge(id: string, signal?: AbortSignal, language?: RepoLanguage) { return request<RepoChallenge>(`${base}/${encodeURIComponent(id)}${language ? `?language=${language}` : ""}`, { signal }); }
export function runRepoChallenge(id: string, files: Record<string, string>, language?: RepoLanguage) {
  return request<RepoEvaluation>(`${base}/${encodeURIComponent(id)}/run`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files, language }),
  }, true);
}
export function finishRepoChallenge(id: string, files: Record<string, string>, evidence: InterviewEvidence, language?: RepoLanguage) {
  return request<{ saved: boolean; submission_id: string; message: string }>(`${base}/${encodeURIComponent(id)}/finish`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files, language, ...evidence }),
  }, true);
}
