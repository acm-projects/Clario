"""Communication observations from microphone volume and a browser transcript."""
import re
from uuid import UUID
from pydantic import BaseModel, Field, model_validator

FILLERS = re.compile(r"\b(?:um+|uh+|erm+|hmm+|you know|i mean|sort of|kind of)\b", re.I)

class CommunicationCapture(BaseModel):
    capture_id: UUID
    monitored_seconds: float = Field(ge=0, le=86400, allow_inf_nan=False)
    silent_seconds: float = Field(ge=0, le=86400, allow_inf_nan=False)
    longest_pause_seconds: float = Field(ge=0, le=86400, allow_inf_nan=False)
    transcript: str = Field(default="", max_length=50000)
    transcription_available: bool = False

    @model_validator(mode="after")
    def check_durations(self):
        if self.silent_seconds > self.monitored_seconds or self.longest_pause_seconds > self.silent_seconds:
            raise ValueError("Silence durations exceed monitored time")
        return self


def summarize_captures(events):
    # Snapshots are cumulative; keep only the newest per capture.
    latest = {}
    for event in events:
        if event.get("event_type") != "communication_summary":
            continue
        try:
            capture = CommunicationCapture.model_validate(event.get("metadata") or {})
        except ValueError:
            continue
        latest[str(capture.capture_id)] = capture
    if not latest:
        return None
    captures = list(latest.values())
    transcript = "\n".join(c.transcript for c in captures if c.transcription_available)[:50000]
    monitored = sum(c.monitored_seconds for c in captures)
    silent = sum(c.silent_seconds for c in captures)
    words = len(re.findall(r"\b[\w']+\b", transcript))
    fillers = {}
    for match in FILLERS.finditer(transcript):
        word = match.group().lower()
        fillers[word] = fillers.get(word, 0) + 1
    speech_seconds = monitored - silent
    return {
        "monitored_seconds": round(monitored, 1),
        "silent_seconds": round(silent, 1),
        "silence_percent": round(100 * silent / monitored, 1) if monitored else 0,
        "longest_pause_seconds": round(max(c.longest_pause_seconds for c in captures), 1),
        "word_count": words,
        "filler_count": sum(fillers.values()) if transcript else None,
        "fillers": fillers,
        "words_per_speaking_minute": round(words * 60 / speech_seconds) if transcript and speech_seconds > 1 else None,
        "candidate_transcript": transcript,
        "limitations": [
            "Silence is estimated from microphone volume; background noise can affect it.",
            "Only enabled, visible-tab monitoring time is measured; muted time is excluded.",
            "Filler words are literal transcript matches, not contextual judgments. Transcription may omit fillers or words.",
        ],
    }
