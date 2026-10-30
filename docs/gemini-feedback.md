# Gemini feedback

The API key belongs in backend/.env.local as GEMINI_API_KEY. GEMINI_MODEL is optional and defaults to gemini-3.8-flash. Restart FastAPI after saving environment changes. Never use a VITE_ prefix for the Gemini key.

Run the backend from the repository root with backend/.venv/Scripts/python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000. Run npm run dev in frontend.

The report page loads GET /api/feedback with the signed-in Supabase token (or the existing local development bypass). Only the user's completed sessions are returned. Pending rows expose Generate feedback, which sends POST /api/feedback/{session_id}. A saved report is returned without calling Gemini again. New reports use saved problem context, the latest code snapshot, candidate transcript, and session events, and are written to the existing feedback_reports table with a deterministic primary key. No schema migration is required.

Scores range from 0 to 100 or null. No code or no problem context means no technical score. No candidate transcript means no reasoning or communication scores. Overall is the mean of the observable category scores. Code is reviewed without execution; the UI displays evidence limitations. Model-generated text is rendered as plain text. API errors expose no credentials or upstream response bodies.

Verification: 13 isolated Python tests cover authorization, caching, evidence handling, schema validation, provider payloads, quota failures, and saving. Four frontend tests cover report parsing, pending state, absent scores, and invalid sessions. A live read of the current development user's history succeeded without generating or modifying reports.

Recommended, Custom, and Surprise me launch through the existing session API. Company scenario sessions remain pending. Feedback uses completed saved sessions.

References: https://ai.google.dev/gemini-api/docs/generate-content/structured-output and https://ai.google.dev/gemini-api/docs/models.


## Individual interview reports and local preview

Finishing a saved interview opens `/report/{session_id}`. This page loads the owned completed session from `GET /api/feedback/{session_id}`, generates feedback with the existing POST endpoint if no report is saved, and displays scores, coaching, and evidence limitations. Existing reports are reused without calling Gemini. The Feedback Report overview at `/report` links every previous interview to its own report page. Failed generation stays on that page with a retry action.

The interviewer connects automatically when an interview workspace opens. Submit sends the current code snapshot and a neutral review cue to the live duck; it never runs tests or completes the interview. Run Tests executes test cases. End Call saves final code, available transcript turns, and microphone observations, marks the session completed, and opens its report for automatic generation. Direct coding interviews create a session at End Call if needed. Repository End Call validates and saves files without executing them through `POST /api/repo-challenges/{id}/finish`. System Design End Call saves voice evidence through its finish endpoint and leaves Coding unscored. Repository and design sessions use public challenge/scenario context without hidden fixes or evaluation criteria. No new database tables are required.

Reports display Coding, Reasoning, Communication, and Overall scores, what is working and worth keeping, what is not working, what to fix next, and evidence-backed coding technique gaps with practice suggestions. Missing evidence stays unscored. Voice volume is sampled only while the interviewer is listening and the tab is visible. Pauses of at least one second have call-relative start/end times; silence is approximate and can be productive coding time. The automatic review cue is excluded from the candidate transcript.

On unexpected voice errors, stale connection handles are cleared so Retry connection opens a fresh call. Reconnection supplies prior transcript/code context. Development hot refresh resets the startup guard so it cannot leave a closed call stuck on Retry connection. The configured ElevenLabs agent's call duration limit was raised from ten minutes to one hour; it remains the same agent and voice.

Validation includes backend tests and `frontend/tests/submit-report.browser.cjs` for automatic startup, Submit-only voice review, Run Tests, End Call, timestamped silence, report generation, saved-report reuse, recommendation fallback, and reconnection. Earlier live persistence/generation verification succeeded using a temporary interview which was removed. Two subsequent synthetic checks of the expanded feedback schema timed out at the provider; the report page exposes the existing retry action for such failures.

Final verification: 102 backend tests passed and four opt-in live Piston tests were skipped. Stale sandbox mocks were corrected to patch the actual provider boundaries; test-run results now reject incomplete or malformed runner payloads. Targeted frontend tests, the browser interview/progress flows, TypeScript, and the production build passed.

In local development with DEV_BYPASS_AUTH=true, Open test report opens `/report/preview`. The authenticated, loopback-only `POST /api/feedback/preview/two-sum` sends a fixed synthetic unfinished solution and uncertainty transcript to the real Gemini integration. It never writes sessions or feedback reports and does not affect progress charts. No performance score is hardcoded; the report evaluates the evidence. Silence alone is not evidence of hesitation.
