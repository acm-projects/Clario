from typing import Literal
from uuid import NAMESPACE_URL, uuid5
from pydantic import BaseModel, Field
from communication import CommunicationCapture


class TranscriptTurn(BaseModel):
    source: Literal["user", "ai", "candidate", "assistant", "human", "interviewee"]
    message: str = Field(max_length=4000)


class InterviewEvidence(BaseModel):
    transcript: list[TranscriptTurn] = Field(default_factory=list, max_length=400)
    communication: CommunicationCapture | None = None


def persist_evidence(database, session_id: str, evidence: InterviewEvidence):
    if evidence.transcript:
        rows = [{"id": str(uuid5(NAMESPACE_URL, f"clario:transcript:{session_id}:{index}")), "session_id": session_id,
                 "speaker": turn.source, "text": turn.message, "sequence_number": index} for index, turn in enumerate(evidence.transcript)]
        database.table("transcript_events").upsert(rows, on_conflict="id").execute()
    if evidence.communication and evidence.communication.monitored_seconds:
        capture = evidence.communication
        database.table("session_events").upsert({"id": str(uuid5(NAMESPACE_URL, f"clario:communication:{session_id}:{capture.capture_id}")),
            "session_id": session_id, "event_type": "communication_summary", "metadata": capture.model_dump(mode="json")}, on_conflict="id").execute()
