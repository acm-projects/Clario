export interface AssessmentAnswers {
  experience: "beginner" | "intermediate" | "advanced";
  confident_topics: string[];
  struggle_topics: string[];
  companies: string[];
  language: "python3" | "java";
  timeline?: "this_month" | "one_to_three_months" | "later" | null;
  preferred_language?: string | null;
  other_language_used?: string | null;
  language_comfort?: number | Record<string, number> | null;
  interview_date?: string | null;
  has_leetcode_experience?: boolean | null;
  has_coding_experience?: boolean | null;
  languages_used?: "Python" | "Java" | "both" | "neither" | "other" | null;
  weekly_interview_goal?: number | null;
  interview_confidence?: number | null;
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
  target_count?: number;
  minimum_count?: number;
  eligible_count?: number;
  shortfall_message?: string | null;
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
      (item.timeline != null && !["this_month", "one_to_three_months", "later"].includes(String(item.timeline)))) {
    throw new Error("The assessment contains an invalid experience, language, or legacy timeline value.");
  }
  const comfort = item.language_comfort;
  const ratings = comfort == null ? [] : typeof comfort === "number" ? [comfort] : Object.values(record(comfort));
  if (ratings.some(value => !Number.isInteger(value) || Number(value) < 1 || Number(value) > 10)) throw new Error("Invalid language comfort rating.");
  if (item.interview_date != null) {
    if (typeof item.interview_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.interview_date)) throw new Error("Invalid interview date.");
    const parsed = new Date(`${item.interview_date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== item.interview_date) throw new Error("Invalid interview date.");
  }
  for (const key of ["preferred_language", "other_language_used"]) {
    if (item[key] != null && typeof item[key] !== "string") throw new Error("Invalid custom language answer.");
  }
  return {
    preferred_language: item.preferred_language as string | null | undefined,
    other_language_used: item.other_language_used as string | null | undefined,
    language_comfort: item.language_comfort as AssessmentAnswers["language_comfort"],
    interview_date: item.interview_date as string | null | undefined,
    has_leetcode_experience: item.has_leetcode_experience as boolean | null | undefined,
    has_coding_experience: item.has_coding_experience as boolean | null | undefined,
    languages_used: item.languages_used as AssessmentAnswers["languages_used"],
    weekly_interview_goal: item.weekly_interview_goal as number | null | undefined,
    interview_confidence: item.interview_confidence as number | null | undefined,
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
  const metadata: Pick<Recommendations, "target_count" | "minimum_count" | "eligible_count" | "shortfall_message"> = {};
  for (const key of ["target_count", "minimum_count", "eligible_count"] as const) {
    if (row[key] !== undefined) {
      if (!Number.isInteger(row[key]) || Number(row[key]) < 0) throw new Error("The server returned invalid recommendation counts.");
      metadata[key] = Number(row[key]);
    }
  }
  if (row.shortfall_message !== undefined) {
    if (row.shortfall_message !== null && typeof row.shortfall_message !== "string") throw new Error("The server returned an invalid recommendation message.");
    metadata.shortfall_message = row.shortfall_message as string | null;
  }
  return { ...metadata, has_assessment: row.has_assessment, problems: row.problems.map(value => {
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
