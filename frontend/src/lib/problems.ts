import { API_BASE_URL } from "./apiConfig.ts";
export interface ProblemSummary {
  slug: string;
  leetcode_id: number | null;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  description_html: string;
}

export function parseProblems(payload: unknown): ProblemSummary[] {
  const rows = Array.isArray(payload) ? payload :
    typeof payload === "object" && payload !== null && "problems" in payload ? payload.problems : null;
  if (!Array.isArray(rows)) throw new Error("The problems API returned an invalid list.");
  const problems = rows.flatMap((row: unknown): ProblemSummary[] => {
    if (typeof row !== "object" || row === null) return [];
    const item = row as Record<string, unknown>;
    const difficulty = typeof item.difficulty === "string" ? item.difficulty.trim().toLowerCase() : "";
    if (typeof item.slug !== "string" || !item.slug.trim() || typeof item.title !== "string" ||
        !item.title.trim() || !["easy", "medium", "hard"].includes(difficulty)) {
      // Cached/upstream records may be incomplete. Keep usable problems rather
      // than failing the entire library or assigning an invented difficulty.
      return [];
    }
    return [{
      slug: item.slug.trim(), title: item.title.trim(),
      leetcode_id: typeof item.leetcode_id === "number" ? item.leetcode_id : null,
      difficulty: (difficulty[0].toUpperCase() + difficulty.slice(1)) as ProblemSummary["difficulty"],
      topics: Array.isArray(item.topics) ? item.topics.filter((topic): topic is string => typeof topic === "string") : [],
      description_html: typeof item.description_html === "string" ? item.description_html : "",
    }];
  });
  if (rows.length > 0 && problems.length === 0) throw new Error("The problems API returned no valid problems.");
  return problems;
}

export async function loadProblems(signal?: AbortSignal, request: typeof fetch = fetch): Promise<ProblemSummary[]> {
  const response = await request(`${API_BASE_URL}/api/problems`, { signal });
  if (!response.ok) throw new Error(`Problems request failed: ${response.status}`);
  return parseProblems(await response.json());
}
