# Interview flow and recorded timing

Problem-library rooms connect to the voice interviewer automatically after loading the problem and saving the session. The agent's configured first message introduces the interview; the client does not override first_message because the agent configuration may forbid it. Every mode supplies problem_title, problem_description, repo_name, and bug_summary for the shared agent. Greeting variables use the challenge title and public summary (or public problem/design prompt), never private evaluation criteria or source files. Submit saves a code snapshot and supplies it as context to the active conversation; it does not run tests, send a synthetic user utterance, or finish the interview. Run Tests and End interview remain separate actions.

Transient voice failures attempt automatic recovery with the transcript and last submitted code. Quota, configuration, and microphone failures stay visible without a retry overlay. Recovery cannot bypass provider quotas or browser microphone permissions.

End interview saves code, transcript, and measured room duration before completing the session and opening /report/:sessionId. Gemini generates that session's feedback. Progress is the only history page; the old /report index redirects there.

## Timestamp sources

- Transcript received_at is new Date().toISOString() when the ElevenLabs onMessage callback reaches the browser. This is the browser clock, not the provider's audio timestamp.
- Transcript elapsed_seconds uses performance.now() relative to voice connection setup. It records message receipt time, not the start/end of spoken words. The origin is retained across automatic reconnects.
- duration_seconds uses performance.now() from room mount to End interview. It includes connection setup, thinking time, and interruptions. A retry of saving a finished session keeps the original duration.
- Times are saved separately in session_events metadata as transcript_timing and session_duration, using deterministic IDs so save retries do not duplicate events. The ordinary transcript_events rows remain the source of message order and text.
- Legacy coding sessions can use server started_at/ended_at for duration. Legacy repository and design sessions were created on completion, so they display no duration unless an actual room measurement exists. Legacy transcript times are never backfilled from upload time.

The previous silence tracker used a microphone volume threshold. It could estimate low-volume intervals but could not verify speech pauses. Active interviews no longer capture or display those silence estimates. Saved legacy metrics remain in storage but are omitted from the report UI.
