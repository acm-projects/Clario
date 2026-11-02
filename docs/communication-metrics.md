# Final-transcript communication metrics

## What runs

POST /api/webhooks/elevenlabs verifies ElevenLabs-Signature with the installed
ElevenLabs SDK's construct_event(rawBody, sig_header, secret). Invalid/missing/stale
signatures return 401. The HMAC secret is ELEVENLABS_WEBHOOK_SECRET in backend/.env;
it is different from the get_current_code tool secret.

The route acknowledges a supported event with 200 only after storing a durable
post_call_jobs receipt. Processing continues after the HTTP response in this order:

1. Reconcile the final transcript into transcript_events and store provider analysis
   in one deterministic session_events row (event_type=post_call_analysis).
2. Calculate user-turn metrics with backend/metrics.py and upsert communication_metrics
   on session_id. A calculation or write failure supplies unavailable metrics to feedback.
3. Generate feedback using the same trusted service as POST /api/sessions/{id}/feedback.
   The legacy POST /api/feedback/{id} route is also supported. The server calls the
   shared function directly instead of making a loopback HTTP request with a forged JWT.

Retries claim the receipt atomically. Completed jobs do not run again. Transcript
reconciliation is a database transaction that locks the session, reuses existing live
turn IDs where possible, preserves repeated utterances as distinct turns, updates
corrected final text, and removes stale duplicate/interim rows. The authoritative final
payload remains in the receipt. Late live messages are ignored after final receipt.
The two RPCs in the migration are executable only by service_role.

If voice ends before the browser finishes its final-code save, transcript and metrics
are saved but feedback waits in waiting_for_end. The browser's End path saves final
code and completes the session before queuing processing again. The webhook never
prematurely marks a session completed and prevents its final snapshot.

The receipt excludes conversation-initiation variables and request headers, including
secret dynamic variables. RLS blocks browser access to post_call_jobs.

## Metric definitions and database names

| Task name | Database column | Calculation |
|---|---|---|
| filler_word_count | filler_word_count | Whole-word/phrase matches: um, uh, erm, you know, kind of, sort of; user turns only; case insensitive |
| questions_asked | questions_asked | One per user turn ending with ? or starting with what/how/can/should/is/does/are/do/would/will |
| avg_response_time | average_response_time_seconds | null with the currently observed payload |
| speaking_rate | words_per_minute | null with the currently observed payload |

Like and so are excluded. A turn matching both question rules counts once. Missing
transcript data means unavailable counts; a known empty transcript has zero counts.
Speech-to-text can omit fillers, so counts can undercount. No model guesses these values.

## Timing inspection (November 2, 2026)

No captured post-call webhook existed when implementation began. The latest linked
real conversation was inspected through ElevenLabs' conversation-details API. This is
real conversation evidence, not a captured webhook. It had 18 turns and exposed:

- time_in_call_secs (the inspected user-turn example was 4).
- conversation_turn_metrics.metrics containing service latency/turn-processing values,
  including convai_asr_trailing_service_latency, convai_llm_service_ttfb,
  convai_tts_service_ttfb, and convai_turn_silence_before_initiation.
- No reliable per-turn speech end time or user speech duration.

A start offset, call duration, ASR/model latency, or silence-before-initiation estimate
is not a measured agent-end/user-start interval or user speaking duration. Both timing
metrics therefore remain null. This deliberately does not reuse browser microphone
volume estimates from communication.py. Inspect an actual signed webhook after setup
and update this note; do not label a conversation API response or synthetic replay as
an actual webhook delivery.

## Setup

1. Apply backend/migrations/20261102_post_call_pipeline.sql in Supabase SQL Editor.
   It adds the protected jobs table and transcript RPCs; existing metrics already have
   a unique session_id. This migration was applied by the user during this task.
2. The API key used by backend/.env needs webhooks_write (in addition to agent read/write).
3. From backend, run:

   venv/bin/python scripts/configure_post_call.py --public-url https://YOUR-NGROK-HOST

   It configures the selected agent's override, leaving workspace defaults and other
   agents unchanged, enables retries, requests JSON transcription including turns,
   and saves the provider-generated webhook ID/secret only in backend/.env.
4. Restart FastAPI so the signing secret is loaded. Keep FastAPI and ngrok running.
5. Complete a fresh voice interview, then inspect post_call_jobs and communication_metrics.

## Recovery

Failed jobs remain in post_call_jobs with a status and sanitized error summary. The
handler's background work is not a durable worker by itself: a process restart can
interrupt it, but its receipt survives. Retry with:

   cd backend
   venv/bin/python -m scripts.reprocess_post_calls --limit 20

The script recovers processing jobs abandoned for more than 10 minutes and retries
pending/failed/waiting/metrics-failed jobs. Run it periodically with a scheduler in a
hosted environment. Metrics failure still triggers feedback; reprocessing after recovery
refreshes the report with final metrics. Gemini failure does not discard saved metrics.
A report generated from live evidence before the webhook is refreshed with final evidence.

## Validation so far

Unit/API tests cover exact fillers/questions, user-only filtering, null timing, HMAC
verification, step ordering, duplicate deliveries, metrics failure followed by feedback,
provider failure/retry, late turns, repeated phrases, and waiting for final-code completion.

A synthetic signed replay was also tested against real Supabase storage, with feedback
mocked to avoid provider charges. Session 8740a5af-4193-4927-b59e-15ab8b2dcad2 produced:

- filler_word_count=3, questions_asked=2, both timing metrics null.
- One metrics row after two deliveries.
- Four final transcript turns after reconciling a duplicate live row.
- A late browser turn ignored after final receipt.

This verifies storage and reconciliation, not a provider-delivered webhook or actual
Gemini generation. The genuine end-to-end check remains: a real call ends, ElevenLabs
posts the signed event through ngrok, metrics appear, and feedback generation is attempted.
