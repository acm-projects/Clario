import { request } from "../lib/api";

export interface VoiceSession {
  signed_url: string;
  voice_id?: string;
  variables: {
    problem_title: string;
    problem_description: string;
  };
}

export function getVoiceSession(problemSlug: string, repoChallengeId?: string, systemDesignSlug?: string): Promise<VoiceSession> {
  return request<VoiceSession>(
    systemDesignSlug ? `/voice/system-design-session?scenario_slug=${encodeURIComponent(systemDesignSlug)}` : repoChallengeId ? `/voice/repo-session?challenge_id=${encodeURIComponent(repoChallengeId)}` : `/voice/session?problem_slug=${encodeURIComponent(problemSlug)}`,
    {},
    true,
  );
}
