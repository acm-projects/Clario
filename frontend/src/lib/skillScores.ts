import type { ProgressSummary } from "../types/progress";

export interface SkillScore { label: string; score: number | null }
const valid = (value: number | null) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;

export function skillScoresFromSummary(summary: ProgressSummary): SkillScore[] {
  return [
    { label: "Technical", score: valid(summary.average_by_category.technical) },
    { label: "Communication", score: valid(summary.average_by_category.communication) },
    { label: "Reasoning", score: valid(summary.average_by_category.problem_solving) },
  ];
}
