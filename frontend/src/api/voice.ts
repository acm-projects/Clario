import { request } from "../lib/api";

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

export function saveTranscript(sessionId: string, turn: {
  speaker: "user" | "agent"; text: string; received_at: string; sequence_number: number;
}) {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/transcript`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(turn),
  }, true);
}
