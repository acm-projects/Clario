import type { Language, Problem, TestsResponse } from "../types";
import { request } from "./client";

const BACKEND_LANGUAGE: Record<Language, "python" | "java"> = {
  python3: "python",
  java: "java",
};

export function getProblem(
  slug: string,
  signal?: AbortSignal,
): Promise<Problem> {
  return request<Problem>(
    `/api/problems/${encodeURIComponent(slug)}`,
    { signal },
  );
}

export function runTests(
  input: { slug: string; language: Language; code: string },
  signal?: AbortSignal,
): Promise<TestsResponse> {
  return request<TestsResponse>("/run/tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      language: BACKEND_LANGUAGE[input.language],
    }),
    signal,
  });
}
