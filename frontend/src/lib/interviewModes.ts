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
  mode: "recommended" | "custom" | "surprise" | "company";
  language: Language;
} {
  if (!["python3", "java"].includes(selection.language)) {
    throw new Error("Choose Python or Java before starting.");
  }

  if (selection.mode === "company") {
    if (!selection.scenarioSlug?.trim()) {
      throw new Error("Choose a company scenario before starting.");
    }

    return {
      problem_slug: selection.scenarioSlug,
      mode: "company",
      language: selection.language,
    };
  }

  if (!selection.problemSlug?.trim()) {
    throw new Error("Choose a question before starting.");
  }

  return {
    problem_slug: selection.problemSlug,
    mode:
      selection.mode === "surprise_me"
        ? "surprise"
        : selection.mode,
    language: selection.language,
  };
}
