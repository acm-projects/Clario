import type { ProblemSummary } from "./problems.ts";

// Read the saved level at launch; progression thresholds will be added when defined.
export function selectMockProblem(problems: ProblemSummary[], difficulty: string | null, random: () => number = Math.random): ProblemSummary | null {
  if (!difficulty) return null;
  const candidates = problems.filter((problem) => problem.difficulty.toLowerCase() === difficulty.toLowerCase());
  if (!candidates.length) return null;
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("Invalid random selection.");
  return candidates[Math.floor(value * candidates.length)];
}