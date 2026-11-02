from typing import Literal
from datetime import datetime
from uuid import NAMESPACE_URL, uuid5
from pydantic import BaseModel, Field
from communication import CommunicationCapture


class TranscriptTurn(BaseModel):
    source: Literal["user", "ai", "candidate", "assistant", "human", "interviewee"]
    message: str = Field(max_length=4000)
    received_at: datetime | None = None
    elapsed_seconds: float | None = Field(default=None, ge=0, allow_inf_nan=False)


class InterviewEvidence(BaseModel):
    transcript: list[TranscriptTurn] = Field(default_factory=list, max_length=400)
    communication: CommunicationCapture | None = None
    duration_seconds: float | None = Field(default=None, ge=0, allow_inf_nan=False)


def persist_evidence(database, session_id: str, evidence: InterviewEvidence):
    if evidence.transcript:
        rows = [{"id": str(uuid5(NAMESPACE_URL, f"clario:transcript:{session_id}:{index}")), "session_id": session_id,
                 "speaker": turn.source, "text": turn.message, "sequence_number": index} for index, turn in enumerate(evidence.transcript)]
        database.table("transcript_events").upsert(rows, on_conflict="id").execute()
        timed = [{"id": str(uuid5(NAMESPACE_URL, f"clario:transcript-time:{session_id}:{index}")), "session_id": session_id,
                  "event_type": "transcript_timing", "metadata": {"sequence_number": index, "received_at": turn.received_at.isoformat(), "elapsed_seconds": turn.elapsed_seconds}}
                 for index, turn in enumerate(evidence.transcript) if turn.received_at is not None]
        if timed:
            database.table("session_events").upsert(timed, on_conflict="id").execute()
    if evidence.duration_seconds is not None:
        database.table("session_events").upsert({"id": str(uuid5(NAMESPACE_URL, f"clario:duration:{session_id}")),
            "session_id": session_id, "event_type": "session_duration", "metadata": {"duration_seconds": evidence.duration_seconds, "source": "browser_monotonic_clock"}}, on_conflict="id").execute()
    if evidence.communication and evidence.communication.monitored_seconds:
        capture = evidence.communication
        database.table("session_events").upsert({"id": str(uuid5(NAMESPACE_URL, f"clario:communication:{session_id}:{capture.capture_id}")),
            "session_id": session_id, "event_type": "communication_summary", "metadata": capture.model_dump(mode="json")}, on_conflict="id").execute()
