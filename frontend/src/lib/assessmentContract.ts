export interface AssessmentAnswers {
  experience: "beginner" | "intermediate" | "advanced";
  confident_topics: string[];
  struggle_topics: string[];
  companies: string[];
  language: "python3" | "java";
  timeline: "this_month" | "one_to_three_months" | "later";
}

export interface SavedAssessment {
  user_id: string;
  answers: AssessmentAnswers;
  updated_at: string;
}

export interface RecommendedProblem {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  reason: string;
}

export interface Recommendations {
  has_assessment: boolean;
  problems: RecommendedProblem[];
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The server returned an invalid assessment response.");
  return value as Record<string, unknown>;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== "string")) throw new Error("The server returned an invalid topic list.");
  return value;
}

export function parseAssessmentAnswers(value: unknown): AssessmentAnswers {
  const item = record(value);
  if (!["beginner", "intermediate", "advanced"].includes(String(item.experience)) ||
      !["python3", "java"].includes(String(item.language)) ||
      !["this_month", "one_to_three_months", "later"].includes(String(item.timeline))) {
    throw new Error("Please complete experience, language, and timeline before saving your assessment.");
  }
  return {
    experience: item.experience as AssessmentAnswers["experience"],
    language: item.language as AssessmentAnswers["language"],
    timeline: item.timeline as AssessmentAnswers["timeline"],
    confident_topics: strings(item.confident_topics),
    struggle_topics: strings(item.struggle_topics),
    companies: strings(item.companies),
  };
}

export function parseSavedAssessment(value: unknown): SavedAssessment {
  const row = record(value);
  if (typeof row.user_id !== "string" || typeof row.updated_at !== "string") throw new Error("The server returned an invalid saved assessment.");
  return { user_id: row.user_id, updated_at: row.updated_at, answers: parseAssessmentAnswers(row.answers) };
}

export function parseRecommendations(value: unknown): Recommendations {
  const row = record(value);
  if (typeof row.has_assessment !== "boolean" || !Array.isArray(row.problems)) throw new Error("The server returned invalid recommendations.");
  return { has_assessment: row.has_assessment, problems: row.problems.map(value => {
    const problem = record(value);
    if (typeof problem.slug !== "string" || !problem.slug.trim() || typeof problem.title !== "string" || !problem.title.trim() ||
        typeof problem.reason !== "string" || !["Easy", "Medium", "Hard"].includes(String(problem.difficulty))) {
      throw new Error("The server returned an invalid recommended problem.");
    }
    return { slug: problem.slug, title: problem.title, difficulty: problem.difficulty as RecommendedProblem["difficulty"], topics: strings(problem.topics), reason: problem.reason };
  }) };
}

// Only an explicit 404 means the user has not taken the assessment.
export function isMissingAssessment(error: unknown): boolean {
  return error instanceof Error && "status" in error && error.status === 404;
}
