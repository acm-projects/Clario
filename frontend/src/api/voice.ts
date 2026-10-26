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
