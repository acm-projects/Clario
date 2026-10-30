import { sessionRequestFor, type InterviewLaunch } from "./interviewModes";
import type { Language, Problem, TestsResponse } from "../types";
import { supabase } from "./supabase";
import { API_BASE_URL } from "./apiConfig";


/** The editor calls it "python3"; the backend executes "python". */
const BACKEND_LANGUAGE: Record<Language, "python" | "java"> = {
  python3: "python",
  java: "java",
};

/** Thrown when the backend responds with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (authenticated && !(import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true")) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new ApiError("Please sign in to continue.", 401);
    headers.set("Authorization", "Bearer " + session.access_token);
  }
  const response = await fetch(API_BASE_URL + path, { ...init, headers });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body?.detail === "string") {
        message = body.detail;
      }
    } catch {
      // Non-JSON error body (e.g. a proxy/HTML error page); keep the default.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

/** GET /api/problems/{slug} */
export function getProblem(slug: string, signal?: AbortSignal): Promise<Problem> {
  return request<Problem>(`/api/problems/${encodeURIComponent(slug)}`, { signal });
}

export type RunTestsInput = {
  slug: string;
  language: Language;
  code: string;
};

/** POST /run/tests — runs `code` against the problem's test cases. */
export function runTests(
  { slug, language, code }: RunTestsInput,
  signal?: AbortSignal,
): Promise<TestsResponse> {
  return request<TestsResponse>("/run/tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      language: BACKEND_LANGUAGE[language],
      code,
    }),
    signal,
  });
}

export interface InterviewSession {
  id: string;
  mode?: string;
  problem_slug: string;
  language: Language;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export function createSession(problem_slug: string, mode: "practice" | "full_mock", language: Language) {
  return request<InterviewSession>("/api/sessions", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem_slug, mode, language }),
  }, true);
}

export function listSessions() {
  return request<(InterviewSession & Record<string, unknown>)[]>("/api/sessions", {}, true);
}

export function getSession(id: string, signal?: AbortSignal) {
  return request<InterviewSession & { problem: Problem | null; latest_code: string | null }>(
    "/api/sessions/" + encodeURIComponent(id), { signal }, true);
}

export function saveSnapshot(id: string, code: string) {
  return request<{ created_at: string }>("/api/sessions/" + encodeURIComponent(id) + "/snapshots", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
  }, true);
}

export function endSession(id: string) {
  return request<InterviewSession>("/api/sessions/" + encodeURIComponent(id) + "/end", { method: "PATCH" }, true);
}

// Adapt selection modes to the existing practice/full_mock session contract.
export async function createModeSession(selection: InterviewLaunch): Promise<InterviewSession> {
  const body = sessionRequestFor(selection);
  return createSession(body.problem_slug, body.mode, body.language);
}

export function getRandomProblem(signal?: AbortSignal): Promise<Problem> {
  return request<Problem>("/api/problems/random", { signal });
}
export interface ScenarioSummary {
  slug: string; company: string; title: string; difficulty: "Easy" | "Medium" | "Hard";
}
export interface Scenario extends ScenarioSummary {
  prompt: string; starter_code: Partial<Record<Language, string>>;
}
export function listScenarios(signal?: AbortSignal): Promise<ScenarioSummary[]> {
  return request<ScenarioSummary[]>("/api/scenarios", { signal });
}
export function getScenario(slug: string, signal?: AbortSignal): Promise<Scenario> {
  return request<Scenario>("/api/scenarios/" + encodeURIComponent(slug), { signal });
}

export function getFeedbackHistory(signal?: AbortSignal): Promise<unknown[]> {
  return request<unknown[]>("/api/feedback", { signal }, true);
}
export function generateSessionFeedback(sessionId: string): Promise<unknown> {
  return request<unknown>("/api/feedback/" + encodeURIComponent(sessionId), { method: "POST" }, true);
}

export type FeedbackPreview = {
  synthetic: boolean;
  saved: boolean;
  evidence: { code: string; candidate_transcript: string };
  report: {
    summary: string;
    technical_score: number | null;
    reasoning_score: number | null;
    communication_score: number | null;
    overall_score: number | null;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    evidence_limitations: string[];
    technique_gaps?: { technique: string; evidence: string; practice: string }[];
    model: string;
  };
};
export function previewGeminiFeedback(): Promise<FeedbackPreview> {
  return request<FeedbackPreview>("/api/feedback/preview/two-sum", { method: "POST" }, true);
}

export function getSessionFeedback(sessionId: string): Promise<unknown> {
  return request<unknown>("/api/feedback/" + encodeURIComponent(sessionId), {}, true);
}
