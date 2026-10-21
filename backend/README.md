# Local backend and frontend

Install Python 3.10 or newer. From the repository root:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Configure backend/.env.local using .env.example. Existing shell variables take precedence, followed by .env.local, then .env. The Supabase URL and service role key must refer to the same project as the frontend. Keep the service role key in the backend only. Leave DEV_BYPASS_AUTH=false for normal login; local bypass requires DEV_USER_ID and DEV_USER_EMAIL.

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Configure frontend/.env.local using frontend/.env.example. Leave VITE_API_BASE_URL empty locally so /api and /run use the Vite proxy. For a deployed backend, set VITE_API_BASE_URL and configure FastAPI CORS for the frontend origin.

Problem browsing, interview creation, code snapshots on Run and completion, and dashboard history use FastAPI. Supabase handles frontend sign-in and profiles; its access token authenticates session requests. The database needs the existing profiles, interview_sessions, code_snapshots, session_events, and problems tables. Sessions are created on Start; their URL allows the room to restore the latest saved code. End Interview or Submit saves code and completes the session.

The integrated Vrinda sandbox exposes POST /run, POST /run/tests, and POST /voice/turn. Run also saves a snapshot for owned sessions. Piston must be configured and running for code execution; see piston/README.md. Python example tests use the real problem loader and return Unsupported for unsupported signatures or example formats. Java supports standalone /run programs; Java LeetCode test harnesses are not implemented. Voice requires ELEVENLABS_API_KEY and GEMINI_API_KEY; missing voice configuration returns 503 without preventing backend startup.

Recommended, Custom, and Surprise me start coding sessions through the existing practice/full_mock API. Company scenario sessions remain pending; see docs/interview-modes.md.

## Gemini feedback

Set GEMINI_API_KEY in backend/.env.local. Optionally override GEMINI_MODEL (default gemini-3.8-flash). Restart FastAPI after changing environment files. GET /api/feedback lists only the current user's completed interviews and saved reports. POST /api/feedback/{session_id} reviews owned completed sessions, calls Gemini once, and stores the validated result in the existing feedback_reports table. Cached reports are returned without another generation. The Feedback Report page offers Generate feedback for pending sessions and displays saved scores, advice, and evidence limits. No new table or migration is required.

Code is statically reviewed rather than executed. With no candidate transcript, reasoning and communication scores remain null. Generation requires saved code or candidate transcript evidence. Coding sessions start through the existing API; company scenario sessions remain pending.

Gemini request format follows https://ai.google.dev/gemini-api/docs/generate-content/structured-output and models are configurable per https://ai.google.dev/gemini-api/docs/models.


## Automatic problem backups

Each successful full problem lookup now upserts its description, topics, difficulty, starter code, and example test cases into Supabase `problems`, using `slug` to update existing entries without duplicates. List-only browsing does not save incomplete summaries or fetch every problem. Missing optional starter code or examples preserve the saved values. Failed database writes are logged and do not block the live response. Live failures continue to read saved problems. The existing seed script remains available for an initial backup set.


## Speech coach

In an interview room, choose Start speech coach and allow microphone access.
The mic control now starts/pauses real monitoring. Visible-tab microphone time,
approximate quiet time and longest pause are measured with Web Audio; English
transcription uses the browser SpeechRecognition API when available. Browser
speech services may process audio remotely. Clario saves text and metrics, not
raw audio. Filler matches and speaking pace remain unavailable without a
transcript. Background tabs pause coaching; resume explicitly when returning.
Practice modes show a coaching prompt after 15 seconds of quiet and a filler
reminder after three literal filler matches. Mock modes suppress live prompts.

Cumulative snapshots are saved every 30 seconds and before completing a session
through the owned-session POST /api/sessions/{session_id}/communication endpoint.
They use session_events event_type communication_summary and existing JSON
metadata; no new table is needed. Latest snapshots per capture are aggregated
without double counting, included in Gemini evidence, and saved in the report
JSON. Previously generated reports are cached and are not regenerated.
Microphone volume is an estimate, not reliable voice activity detection. Browser
recognition support and accuracy vary; it may omit fillers. Verify permission,
mute/resume, a 15-second pause, and final report observations with a real mic.

## Vrinda sandbox integration

Sandbox components were selectively merged from origin/Vrinda at f415abb. Existing routing, authentication, selection pages, session persistence, speech coach, and feedback remain in place. Component styles use Tailwind v4 in TSX files; index.css remains the only source stylesheet. All required Python dependencies, including voice and multipart dependencies, are in backend/requirements.txt; a duplicate root requirements file is not needed.

Recommended, Custom, and Surprise me launch through the existing session API; company scenario sessions remain pending as documented in docs/interview-modes.md. Existing owned-session room URLs and direct /interview/{problem-slug} sandbox URLs are supported. Direct sandbox runs do not save interview history. Test execution evaluates available public examples, not hidden judge tests.
