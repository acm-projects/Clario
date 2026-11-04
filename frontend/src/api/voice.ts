import { request } from "../lib/api";

export interface VoiceSession {
  signed_url: string;
  variables: {
    problem_title: string;
    problem_description: string;
  };
}

export function getVoiceSession(problemSlug: string, repoChallengeId?: string): Promise<VoiceSession> {
  return request<VoiceSession>(
    repoChallengeId ? `/voice/repo-session?challenge_id=${encodeURIComponent(repoChallengeId)}` : `/voice/session?problem_slug=${encodeURIComponent(problemSlug)}`,
    {},
    true,
  );
}

export interface SystemDesignVoiceSession {
  signed_url: string;
  variables: {
    company: string;
    prompt: string;
    functional_requirements: string;
    non_functional_requirements: string;
    scale: string;
    out_of_scope: string;
    deep_dive_topics: string;
    curveballs: string;
    strong_signals: string;
    red_flags: string;
  };
}

export function getSystemDesignVoiceSession(
  slug: string
): Promise<SystemDesignVoiceSession> {
  return request<SystemDesignVoiceSession>(
    `/api/voice/system-design-session?slug=${encodeURIComponent(slug)}`,
    {},
    true
  );
}
