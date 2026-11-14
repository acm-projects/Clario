import { ApiError, request } from "../lib/api";

export interface VoiceSession {
  signed_url: string;
  instructions: string;
  variables: Record<string, string>;
}

export function getVoiceSession(sessionId: string): Promise<VoiceSession> {
  return request<VoiceSession>(`/voice/session?session_id=${encodeURIComponent(sessionId)}`, {}, true);
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
