# Interview flow and recorded timing

Problem-library rooms connect to the voice interviewer automatically after loading the problem and saving the session. The agent's configured first message introduces the interview; the client does not override first_message because the agent configuration may forbid it. Every mode supplies problem_title, problem_description, repo_name, bug_summary, and root_cause for the shared agent. Repository root causes are selected by challenge and language from private interviewer notes; they are also included in problem_description so the existing prompt receives them. Other interview types explicitly state that no diagnosed root cause is supplied. Root causes are interviewer reference, never greeting text or public challenge fields. Greeting variables use the challenge title and public summary (or public problem/design prompt), never private evaluation criteria or source files. Submit saves a code snapshot and supplies it as context to the active conversation; it does not run tests, send a synthetic user utterance, or finish the interview. Run Tests and End interview remain separate actions.

The coding and repository editors automatically send the active voice interviewer a background code snapshot after a 500 ms pause, with a two-second maximum delay during continuous typing. Snapshots include language, filenames, and all editable repository files; unchanged content is deduplicated. An empty editor is shared as an empty file. These updates supply unfinished code as reference context, without triggering a user turn, test execution, review, or database autosave. Submit remains the explicit review action.

Transient voice failures attempt automatic recovery with the transcript, last submitted code, and latest editor snapshot, including edits made while offline. A new connection immediately receives the newest snapshot. Queued sends stop when the call ends or the room unmounts. Quota, configuration, and microphone failures stay visible without a retry overlay. Recovery cannot bypass provider quotas or browser microphone permissions.

End interview saves code, transcript, and measured room duration before completing the session and opening /report/:sessionId. Gemini generates that session's feedback. Progress is the only history page; the old /report index redirects there.

## Timestamp sources

- Transcript received_at is new Date().toISOString() when the ElevenLabs onMessage callback reaches the browser. This is the browser clock, not the provider's audio timestamp.
- Transcript elapsed_seconds uses performance.now() relative to voice connection setup. It records message receipt time, not the start/end of spoken words. The origin is retained across automatic reconnects.
- duration_seconds uses performance.now() from room mount to End interview. It includes connection setup, thinking time, and interruptions. A retry of saving a finished session keeps the original duration.
- Times are saved separately in session_events metadata as transcript_timing and session_duration, using deterministic IDs so save retries do not duplicate events. The ordinary transcript_events rows remain the source of message order and text.
- Legacy coding sessions can use server started_at/ended_at for duration. Legacy repository and design sessions were created on completion, so they display no duration unless an actual room measurement exists. Legacy transcript times are never backfilled from upload time.

The previous silence tracker used a microphone volume threshold. It could estimate low-volume intervals but could not verify speech pauses. Active interviews no longer capture or display those silence estimates. Saved legacy metrics remain in storage but are omitted from the report UI.


Sandbox appearance is stored separately from the app-wide Settings preference. Coding-room theme controls affect coding sandboxes only; Settings controls the rest of the app. A sandbox with no explicit preference inherits Settings until the user chooses a sandbox theme.

Hosted voice timing: run `backend/.venv/Scripts/python.exe backend/scripts/configure_interview_timing.py` when configuring the voice agent. This sets silence prompting to 30 seconds and patient turn-taking. Client timer cues also wait at least 30 seconds after the interviewer finishes speaking. Local development profile routes ignore Supabase auth events so returning from another application cannot replace the interview with a profile-loading screen.

All interview room routes now show a scrollable pre-interview acknowledgement. The room does not mount, request media, or start the voice connection until the user scrolls to the end and selects Start interview. The notice describes transcript/work persistence, local camera preview, microphone processing, permissions, controls, and AI review limitations. Returning focus does not reset acknowledgement; entering another interview route shows it again.
