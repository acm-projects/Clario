import type { Recommendations, RecommendedProblem } from "./assessmentContract.ts";

/** How many recommended problems the app shows. */
export const RECOMMENDED_LIMIT = 3;

/** Always shown first in recommendations (hardcoded for the demo). */
export const FEATURED_FIRST: RecommendedProblem = {
  slug: "contains-duplicate",
  title: "Contains Duplicate",
  difficulty: "Easy",
  topics: ["Array", "Hash Table", "Sorting"],
  reason: "A great warm-up for hash-based lookups. Explain why a set beats comparing every pair, then talk through the time and space trade-off.",
};

/** Pins the featured problem first and keeps the list to RECOMMENDED_LIMIT items. */
export function curateRecommendations(recommendations: Recommendations): Recommendations {
  if (!recommendations.has_assessment) return recommendations;
  const rest = recommendations.problems.filter(problem => problem.slug !== FEATURED_FIRST.slug);
  return {
    ...recommendations,
    problems: [FEATURED_FIRST, ...rest].slice(0, RECOMMENDED_LIMIT),
    target_count: RECOMMENDED_LIMIT,
    shortfall_message: null,
  };
}
