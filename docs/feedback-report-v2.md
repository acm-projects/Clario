# Feedback report version 2

Newly generated interview reports include an AI summary/verdict; Coding, Reasoning,
Communication and Overall scores with expandable explanations; six UMPIRE assessments;
selected filler moments; up to three habit drills; a short don't-worry list;
and up to three strengths grounded in session evidence.

`technical_score` remains the database field for Coding. Overall remains the rounded
mean of available category scores. No evidence means unscored, not zero.

## Evidence and generation

`backend/report_evidence.py` constructs timestamped transcript references, user-only
literal filler matches, clusters of filler turns separated by at most 30 seconds,
with no silence-duration measurements. The rate is
matches per interview minute, not per minute of speech. Timestamps locate transcript
turns, not individual filler words. Recognition can omit fillers. The transcript
portion supplied to the report is capped at 400 turns/50,000 characters.

The shared feedback service also reads up to ten recent saved code execution records.
If the execution-details migration/storage is unavailable it continues with static
code review and explicitly tells Gemini execution evidence is unavailable. Saved
runs describe their exact submitted code, not necessarily the final editor snapshot.

Gemini provides coaching against a structured Pydantic schema. The backend requires
all four score explanations, six unique ordered UMPIRE steps, bounded lists, valid
transcript/moment IDs, and unique moments. Measured counts, timestamps and durations
are attached by the server, never supplied by the model. Moment selection is sorted
chronologically. Silence is not assessed or inferred from transcript gaps.

Version 2 uses the existing `feedback_reports.report` JSON field and session_events;
no additional database migration is needed for the report format. Previously saved
reports keep their original display and are not automatically regenerated or billed.

## Using it

Restart FastAPI and the frontend after updating. Complete a fresh interview to create
a new report. No extra microphone monitoring control is required. Filler observations
use the saved transcript. Silence durations are excluded from generation and display,
including previously saved silence moments. Existing legacy microphone tools are not
mounted in the interview room.

The existing post-call migration/webhook configuration is still required for voice
reports. The separately prepared `20261102_code_execution_details.sql` migration is
required for full saved execution evidence; this change does not apply it remotely.

## Verification

Focused backend tests cover metrics, communication ownership/validation, report
schema and provider handling, evidence links, clustering, retries and post-call order.
Focused frontend tests cover old reports, null metrics, report polling and completion.
Production TypeScript/Vite build and targeted ESLint checks are also run.
A real voice call through ElevenLabs, live Gemini generation,
and visual browser verification remain separate acceptance checks; automated provider
checks use mocked responses and do not consume model quota.
