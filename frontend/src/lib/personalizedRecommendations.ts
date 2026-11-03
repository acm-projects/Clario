import { request } from "./api";
import { getMyAssessment, getRecommendations } from "./assessmentApi";
import { isMissingAssessment, type Recommendations, type SavedAssessment } from "./assessmentContract";
import { chicagoDate } from "./interviewCalendar";

type PersonalizedRecommendations = { assessment: SavedAssessment | null; recommendations: Recommendations };
let snapshot: { key: string; expires: number; value: PersonalizedRecommendations } | null = null;

// Reuse one ranked list across the banner and Recommended page. Always check
// assessment/history revisions first; cached lists live for at most one minute.
export async function getPersonalizedRecommendations(signal?: AbortSignal): Promise<PersonalizedRecommendations> {
  let assessment: SavedAssessment;
  try { assessment = await getMyAssessment(signal); }
  catch (error) {
    if (isMissingAssessment(error)) return { assessment: null, recommendations: { has_assessment: false, problems: [] } };
    throw error;
  }
  const sessions = await request<{ id: string; status: string; problem_slug?: string; problem_id?: string }[]>("/api/sessions", { signal, cache: "no-store" }, true);
  if (!Array.isArray(sessions)) throw new Error("Could not check completed interviews. Please try again.");
  const completed = sessions.filter(session => session.status === "completed")
    .map(session => [session.id, session.problem_slug ?? "", session.problem_id ?? ""].join(":")).sort();
  const key = JSON.stringify([assessment.user_id, assessment.updated_at, assessment.answers, chicagoDate(), completed]);
  signal?.throwIfAborted();
  if (snapshot?.key === key && snapshot.expires > Date.now()) return snapshot.value;
  const recommendations = await getRecommendations(signal);
  signal?.throwIfAborted();
  const value = { assessment: recommendations.has_assessment ? assessment : null, recommendations };
  snapshot = { key, expires: Date.now() + 60_000, value };
  return value;
}
