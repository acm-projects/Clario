"""Communication observations from microphone volume and a browser transcript."""
import re
from collections import Counter
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

from metrics import FILLERS, filler_key

def transcript_fillers(transcript: str) -> dict:
    """Literal observations from candidate speech only, never fabricated audio metrics."""
    words = Counter(match.group().lower() for match in FILLERS.finditer(transcript))
    return {"available": bool(transcript.strip()),
            "items": [{"word": word, "count": count} for word, count in sorted(words.items(), key=lambda row: (-row[1], row[0]))],
            "total": sum(words.values()) if transcript.strip() else None,
            "limitation": "Transcript matches only. Transcription may omit fillers; phrases such as 'kind of' can also have ordinary meanings."}

class SilenceInterval(BaseModel):
    """A silent stretch, as a wall-clock start (live interview) and/or offsets into the capture."""
    started_at: datetime | None = None
    start_seconds: float | None = Field(default=None, ge=0, le=86400, allow_inf_nan=False)
    end_seconds: float | None = Field(default=None, ge=0, le=86400, allow_inf_nan=False)
    duration_seconds: float = Field(ge=0, le=86400, allow_inf_nan=False)

    @model_validator(mode="after")
    def check_interval(self):
        if self.started_at is None and (self.start_seconds is None or self.end_seconds is None):
            raise ValueError("Silence interval needs started_at or start_seconds/end_seconds")
        if self.started_at is not None and self.started_at.tzinfo is None:
            raise ValueError("Silence timestamps require a timezone")
        if self.start_seconds is not None and self.end_seconds is not None and (
                self.end_seconds < self.start_seconds
                or abs(self.duration_seconds - (self.end_seconds - self.start_seconds)) > 0.1):
            raise ValueError("Invalid silence interval")
        return self

class CommunicationCapture(BaseModel):
    capture_id: UUID
    monitored_seconds: float = Field(ge=0, le=86400, allow_inf_nan=False)
    silent_seconds: float = Field(ge=0, le=86400, allow_inf_nan=False)
    longest_pause_seconds: float = Field(ge=0, le=86400, allow_inf_nan=False)
    transcript: str = Field(default="", max_length=50000)
    transcription_available: bool = False
    silence_intervals: list[SilenceInterval] = Field(default_factory=list, max_length=2000)

    @model_validator(mode="after")
    def check_durations(self):
        if self.silent_seconds > self.monitored_seconds or self.longest_pause_seconds > self.silent_seconds:
            raise ValueError("Silence durations exceed monitored time")
        if self.silence_intervals:
            if sum(interval.duration_seconds for interval in self.silence_intervals) > self.silent_seconds + 0.1:
                raise ValueError("Silence intervals exceed observed silence")
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
        word = filler_key(match)
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
        "silence_intervals": [{"capture_id": str(c.capture_id), **interval.model_dump()} for c in captures for interval in c.silence_intervals],
        "limitations": [
            "Silence is estimated from microphone volume; background noise can affect it.",
            "Only enabled, visible-tab monitoring time is measured; muted time is excluded.",
            "Live interview monitoring excludes interviewer speech. Pauses of at least one second are listed relative to the call start; older captures may have totals only. Silence can be productive coding time.",
            "Filler words are literal transcript matches, not contextual judgments. Transcription may omit fillers or words.",
        ],
    }
