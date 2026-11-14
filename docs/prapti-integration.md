# Prapti system design and company integration

Source: `origin/Prapti` at `306acb3b61a4d0449cf9a75de538fe82ac56927e` (fetched November 5, 2026).

The feature code was selectively integrated into the existing Sahasra working tree. Existing UI, repository debugging, voice evidence, and feedback changes were retained. This is not a full branch merge.

- System design uses Prapti's `system_design_questions` table and company question API inside the existing system design UI. The existing voice endpoint receives all dedicated-agent variables and private evaluation context. `ELEVENLABS_SYSTEM_DESIGN_AGENT_ID` is optional and falls back to the shared agent.
- Company coding uses Prapti's company discovery, cached/generated scenarios, session validation, public problem adapter, and candidate-safe Judge0 execution. Existing `practice` / `full_mock` storage modes are preserved for other rounds.
- The company picker retains existing previews and styling, adds remote companies, and offers generation. Failed generation only falls back to the selected company's handwritten scenarios.
- Company tests currently support Python only. Java remains available for solution submission and review, with a clear message when test execution is requested.
- Existing transcript/evidence saving and idempotent session completion remain intact. Company scenarios are also resolved in saved feedback and history.

## Setup

Install `backend/requirements.txt` (adds `slowapi==0.1.9`). Existing Supabase tables and Gemini/ElevenLabs credentials are used. Optional settings are documented in `backend/.env.example`: `ELEVENLABS_SYSTEM_DESIGN_AGENT_ID`, `JUDGE0_URL`, and `GEMINI_SCENARIO_MODEL`.

## Verification

- Frontend production build.
- Seven interview-mode contract tests.
- 45 backend tests covering the integration, system design, voice context, feedback, and evidence.
- Browser integration test: `node frontend/tests/prapti-integration.browser.cjs` from the frontend directory using `node tests/prapti-integration.browser.cjs` (development server at port 5180).
- Read-only database check found three system design questions per company (Bumble, Spotify, DoorDash, Stripe) and nine company coding scenarios. No database records were created during verification.
