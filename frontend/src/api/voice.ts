import { ApiError, request } from "../lib/api";

/** Session-linked live interview: ownership-checked, with the interviewer prompt override. */
export interface LiveVoiceSession {
  signed_url: string;
  instructions: string;
  variables: Record<string, string>;
}

export function getLiveVoiceSession(sessionId: string): Promise<LiveVoiceSession> {
  return request<LiveVoiceSession>(`/voice/session?session_id=${encodeURIComponent(sessionId)}`, {}, true);
}

export function linkConversation(sessionId: string, conversationId: string) {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/conversation`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId }),
  }, true);
}

export async function saveTranscript(sessionId: string, turn: {
  speaker: "user" | "agent"; text: string; received_at: string; sequence_number: number;
}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request(`/api/sessions/${encodeURIComponent(sessionId)}/transcript`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(turn),
      }, true);
    } catch (error) {
      const retryable = !(error instanceof ApiError) || error.status >= 500 || error.status === 429;
      if (!retryable || attempt >= 2) throw error;
      // The backend's deterministic turn ID makes a retry safe after an ambiguous timeout.
      await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 400 : 1000));
    }
  }
}

/** Practice, repository-debugging and system-design voice sessions. */
export interface VoiceSession {
  signed_url: string;
  voice_id?: string;
  variables: {
    problem_title: string;
    problem_description: string;
    repo_name: string;
    bug_summary: string;
    root_cause: string;
  };
}

export function getVoiceSession(problemSlug: string, repoChallengeId?: string, systemDesignSlug?: string, repoLanguage?: string): Promise<VoiceSession> {
  return request<VoiceSession>(
    systemDesignSlug ? `/voice/system-design-session?scenario_slug=${encodeURIComponent(systemDesignSlug)}` : repoChallengeId ? `/voice/repo-session?challenge_id=${encodeURIComponent(repoChallengeId)}${repoLanguage ? `&language=${encodeURIComponent(repoLanguage)}` : ""}` : `/voice/session?problem_slug=${encodeURIComponent(problemSlug)}`,
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
