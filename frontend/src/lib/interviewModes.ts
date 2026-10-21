import type { Language } from "../types";

// Selection modes map to the existing coding-session API at the request boundary.
export const interviewModes = ["recommended", "custom", "surprise_me", "company"] as const;
export type InterviewMode = typeof interviewModes[number];
export const modeLabels: Record<InterviewMode, string> = {
  recommended: "Recommended", custom: "Custom", surprise_me: "Surprise me", company: "Company",
};
export function parseInterviewMode(value: unknown): InterviewMode | null {
  return interviewModes.includes(value as InterviewMode) ? value as InterviewMode : null;
}
export type InterviewLaunch = { language: Language } & (
  { mode: "recommended" | "custom" | "surprise_me"; problemSlug: string } |
  { mode: "company"; scenarioSlug: string }
);
export function interviewRoomUrl(slug: string, sessionId: string, mode: InterviewMode) {
  return "/interview/" + encodeURIComponent(slug) + "?" + new URLSearchParams({ session: sessionId, mode });
}
export function sessionRequestFor(selection: InterviewLaunch): {
  problem_slug: string;
  mode: "practice" | "full_mock";
  language: Language;
} {
  if (!["python3", "java"].includes(selection.language)) {
    throw new Error("Choose Python or Java before starting.");
  }
  if (selection.mode === "company") {
    throw new Error("Company scenarios are available to preview, but company interview sessions are not supported yet. Choose Recommended, Custom, or Surprise me to start a coding interview.");
  }
  if (!selection.problemSlug?.trim()) {
    throw new Error("Choose a question before starting.");
  }
  return {
    problem_slug: selection.problemSlug,
    mode: selection.mode === "surprise_me" ? "full_mock" : "practice",
    language: selection.language,
  };
}
