"""Pure, conservative communication metrics from the final ElevenLabs transcript.

The observed ElevenLabs transcript exposes time_in_call_secs, but no authoritative
speech end/duration fields. Start offsets and service latency are not speaking time.
"""
import re
from collections.abc import Mapping, Sequence

FILLERS = re.compile(r'\b(?:um|uh|erm|you\s+know|kind\s+of|sort\s+of)\b', re.IGNORECASE)
QUESTION_START = re.compile(r'^(?:what|how|can|should|is|does|are|do|would|will)\b', re.IGNORECASE)


def user_messages(transcript: Sequence[Mapping] | None) -> list[str]:
    if transcript is None:
        return []
    messages = []
    for turn in transcript:
        if not isinstance(turn, Mapping):
            continue
        if (turn.get('role') or turn.get('speaker')) != 'user':
            continue
        text = turn.get('message', turn.get('text'))
        if isinstance(text, str) and text.strip():
            messages.append(text.strip())
    return messages


def count_filler_words(messages: Sequence[str]) -> int:
    return sum(len(FILLERS.findall(message)) for message in messages)


def count_questions(messages: Sequence[str]) -> int:
    # One count per turn, even if it contains multiple questions or matches both rules.
    return sum(bool(message.rstrip(' \t\r\n\"\'”’').endswith('?') or QUESTION_START.match(message.lstrip()))
               for message in messages)


def calculate_communication_metrics(transcript: Sequence[Mapping] | None) -> dict:
    messages = user_messages(transcript)
    return {
        'filler_word_count': count_filler_words(messages) if transcript is not None else None,
        'questions_asked': count_questions(messages) if transcript is not None else None,
        'average_response_time_seconds': None,
        'words_per_minute': None,
    }
