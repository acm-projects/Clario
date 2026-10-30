import { request } from "./api";
import { parseAssessmentAnswers, parseSavedAssessment, parseRecommendations, type AssessmentAnswers } from "./assessmentContract";

export async function getMyAssessment(signal?: AbortSignal) {
  return parseSavedAssessment(await request<unknown>("/api/assessment/me", { signal }, true));
}

export async function submitAssessment(answers: AssessmentAnswers, signal?: AbortSignal) {
  return parseSavedAssessment(await request<unknown>("/api/assessment", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parseAssessmentAnswers(answers)), signal,
  }, true));
}

export async function getRecommendations(signal?: AbortSignal) {
  return parseRecommendations(await request<unknown>("/api/recommendations?limit=5", { signal }, true));
}
