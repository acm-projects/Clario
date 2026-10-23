import { request } from "../lib/api";

export interface VoiceSession {
  signed_url: string;
  variables: {
    problem_title: string;
    problem_description: string;
  };
}

export function getVoiceSession(problemSlug: string): Promise<VoiceSession> {
  return request<VoiceSession>(
    `/voice/session?problem_slug=${encodeURIComponent(problemSlug)}`,
    {},
    true,
  );
}
