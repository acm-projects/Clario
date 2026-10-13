import type { Language, Problem, TestsResponse } from "../types";

// Empty during local development so requests go through the Vite proxy
// (see vite.config.ts). Set VITE_API_URL to the deployed FastAPI origin in prod.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

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

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

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
