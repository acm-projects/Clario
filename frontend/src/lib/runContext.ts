import type { TestsResponse } from "../types";

function short(value: string, limit: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > limit ? text.slice(0, limit - 1) + "…" : text;
}

/** Bound the update and deliberately exclude stdout, which can be arbitrarily large. */
export function summarizeRun(result: TestsResponse): string {
  let summary = `Run results: ${result.passed} of ${result.total} tests passed. ${result.status}.`;
  const failed = result.cases.find((test) => !test.passed);
  if (failed) {
    summary += ` Test ${failed.case} failed: expected ${short(failed.expected, 100)}, got ${short(failed.output ?? "no output", 100)}.`;
  }
  if (result.error) summary += ` Error: ${short(result.error, 220)}`;
  return short(summary, 600);
}

export function summarizeRunError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Execution request failed";
  return `Run request failed; no test verdict is available. ${short(message, 250)}`;
}
