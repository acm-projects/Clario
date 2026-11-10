# Repository debugging MVP

## Current interview controls

The duck connects automatically when the workspace opens; microphone permission is still required by the browser. Edits automatically share the latest language, active file, and all editable file contents with the live interviewer after a short pause (at most two seconds during continuous typing). Reconnects restore the newest edits. Submit sends the current code snapshot to the live interviewer for a neutral follow-up, without running tests or ending the session. Run Tests alone executes test cases. End Call saves final code, transcript, and measured silence, then opens the automatically generated interview feedback report. Retry connection clears stale handles and restores previous interview context.

## Current catalog and workspace

There are 20 distinct repo debugging problems. Every problem is available in Python and C++ with matching intentional failures, read-only tests, and trusted repair fixtures. The original JavaScript webhook endpoint remains compatible; the UI offers Python and C++.

The language selector loads the corresponding repository, test runner, voice context, and report contract. Drafts are separate by user, challenge, and language; the URL retains the language on reload. Both workspaces have persistent Light/Dark controls, matching Monaco editor themes, static top-left labels, subtle panel borders, and draggable/keyboard-accessible question dividers. Narrow screens stack the question and editor.

C++ ports use C++17 value types documented in each README. The reservations port uses a supplied transactional in-memory database simulator; the Python version retains SQLite. The C++ revenue helper supports UTC and America/Los_Angeles; Python retains its IANA timezone interface.

Start Piston, then run from the project root:

```powershell
.venv/Scripts/python.exe backend/scripts/configure_cpp_runtime.py
```

This installs GCC if needed and enables pthread linking in the persistent local Piston compiler wrapper. `PISTON_CPP_VERSION` defaults to `*`. C++ headers are inlined into a single translation unit because Piston compiles every uploaded file as C++ source; candidate includes never cause API-host file reads.

Regenerate the paired variants with `python backend/scripts/build_repo_language_variants.py`. The generator also builds the 13 additional Python challenges. Repair fixtures remain server-side under `backend/tests/fixtures`.

Verify with `python -m pytest backend/tests/test_repo_languages.py backend/tests/test_repo_challenges.py`; set `PISTON_REPO_TESTS=1` to additionally compile/run all 20 C++ starters and repairs in local Piston. Browser regression coverage is in `frontend/tests/sandbox-workspaces.browser.cjs`.

## October 27 challenge catalog (historical)

The catalog now includes the replacement **The Cart That Charges the Wrong Amount**,
plus **The Pagination Bug**, **The Oversold Event**, **The Broken TTL + LRU Cache**,
**The Lossy Job Worker**, and **The Wrong Revenue Report**. The existing Login
Authentication challenge is retained. These are synthetic practice scenarios,
not actual company interview questions.

Challenges live in backend folders, not Supabase. Each manifest lists editable
sources, read-only instructions/tests, the runtime, and evaluator checks. The cart
retains `shopping-cart-01`; changed starters invalidate older browser drafts.

The cart contract specifies percentage coupons (sorted by code) before fixed-dollar
coupons, coupon deduplication, half-up monetary rounding, per-order tax, and free
shipping at a post-discount subtotal of at least $50. Reservation tests use SQLite
transactions and parallel clients. The webhook exercise runs in JavaScript/Node;
all other exercises run in Python. Piston must have both runtimes installed.
`PISTON_JAVASCRIPT_VERSION` defaults to `*`, like the Python runtime setting.

`backend/tests/fixtures/repo_solutions.json` contains trusted repaired fixtures for
regression verification. They are not exposed by challenge endpoints. The builder
`python -m scripts.build_debugging_challenges` regenerates these six exercises and
the test fixtures; running it overwrites their checked-in files.

Verification executes only trusted starter/repaired fixtures locally. Submitted
candidate code still runs exclusively in Piston. Run the tests from backend:

```powershell
..\.venv\Scripts\python.exe -m pytest tests/test_debugging_catalog.py tests/test_repo_challenges.py -q
```

Open **Interview → Repo Debugging**, or `/interview/repo`. Select a challenge to
open `/interview/repo/:slug`. Legacy `/repo-debugging` links still work.

## Architecture and data flow

Existing code uses `@monaco-editor/react` in `components/interview/CodePanel.tsx`,
`lib/api.ts` for authenticated requests, FastAPI routers, and
`piston/service.py` for execution. Existing coding sessions use
`interview_sessions`, `code_snapshots`, and `session_events` through
`routers/sessions.py`. They represent a single LeetCode problem and source file.
Repository report persistence uses those existing tables with a `repo-debugging:<challenge_id>` slug marker and public challenge context. The deployed table schema was inspected and temporary-session persistence was verified; no new columns or table migration are required.

The new path is:

1. `backend/challenges/*/challenge.json` defines metadata, allowed files, and
   private test names. Starter and test sources live in actual separate files.
2. `GET /api/repo-challenges` lists public metadata;
   `GET /api/repo-challenges/{id}` supplies starter files and editability.
   Host paths, grading source, private tests, and solutions are not returned.
3. React builds the explorer from returned paths. Monaco uses a separate URI
   per user, challenge, and file. Change events identify the current **model URI**,
   avoiding stale tab callbacks. Starter content remains separate from edits.
4. Run Tests and End Call send exactly the editable file map through the existing authenticated
   API client. The backend rejects additional, missing, read-only, or oversized
   files and restores read-only content from disk.
5. The existing Piston service accepts a multi-file payload. Its first file is
   Clario's trusted runner, followed by private tests and repository sources.
   Only Piston executes candidate code; FastAPI never imports or executes it.
6. The runner executes standard-library `unittest` checks for Python or async assertion checks for JavaScript. The backend validates
   result names, count, and boolean statuses and returns pass/fail rows. Raw
   output and private-test tracebacks are withheld.
7. End Call validates the file map and saves the interview through `save_submission`, without executing code. It returns the saved session ID for `/report/{session_id}`. Storage failures keep the workspace open. Submit is a separate voice-review cue; the compatibility `/submit` endpoint only validates files and never runs or saves an interview.

The repository workspace reuses the sandbox top bar and video-call panel, with
a retractable file explorer and a repository-aware voice session. The selection
page uses a two-column mode grid with a repeating blue, white, white, yellow palette.

No replacement of authentication or existing interview routes is required. Shared Monaco themes were extracted from the existing editor. The
repository mode has its own routes so existing mode-to-session mappings stay intact.

## Storage and migration

Edits are saved automatically in **this browser**, scoped to the user and challenge.
Starter metadata is checked before restoring a draft. Tab closing does not delete
file contents. Reset requires confirmation. Download draft exports the repository
and its current evaluation as JSON; it is a backup, not a cloud save or ZIP export.

Account-level interview evidence is saved to the existing interview, code snapshot, transcript, and session-event tables. Completion is recorded only after evidence writes succeed. Feedback uses the existing `feedback_reports` table and appears in history and Progress. The older `docs/repo-debugging.sql` migration is retained for reference but is not required by this flow.

## Start locally (PowerShell, from repository root)

```powershell
docker compose -f backend/piston/compose.yaml up -d
Invoke-RestMethod -Method Post -Uri http://localhost:2000/api/v2/packages -ContentType 'application/json' -Body '{"language":"python","version":"*"}'
backend/.venv/Scripts/python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
cd frontend
npm.cmd run dev
```

Reuse existing Supabase backend/frontend environment configuration. No new
environment variables or production dependencies are required. Python 3.12.0
was installed in local Piston while implementing and verifying this feature.
No Java repository runtime is required for these challenges.

## Limits and security boundary

- Only trusted manifest IDs and flat file names are executable. Unexpected
  files, path traversal, extra request fields, and changes to read-only files
  are rejected. Per-file source is limited to 50,000 UTF-8 bytes and aggregate
  editable source to 150,000 bytes, with at most 20 files per request.
- Repository execution requests 3-second wall/CPU time and 128 MiB run memory;
  compile limits are 10 seconds and 256 MiB. HTTP execution timeout is 15 seconds.
- Compose explicitly disables job networking, caps each output stream at 16 KiB,
  limits Python to 16 processes, 64 open files, and 1 MiB file writes, and permits
  at most four simultaneous Piston jobs. Default process limits for existing
  Java execution remain 64. These settings were checked in the running container;
  timeout behavior and multi-file execution were exercised against real Piston.
- Piston remains bound to `127.0.0.1:2000`. Only the Piston data volume is mounted;
  the workspace, Docker socket, Supabase secrets, and backend environment are not
  passed to execution jobs. Never expose this local privileged container as a
  public service. Deployment requires a dedicated sandbox host and API abuse limits.
- Resource settings follow the installed Piston config and the upstream
  [configuration](https://github.com/engineer-man/piston/blob/master/api/src/config.js)
  and [isolation implementation](https://github.com/engineer-man/piston/blob/master/api/src/job.js).
- Private tests are absent from browser responses, but candidate code shares its
  sandbox/process with the unittest harness. This is a practice evaluator, not
  a tamper-proof adversarial assessment: determined code can inspect or interfere
  with a Python process. A high-stakes judge needs an external grading boundary.

## Verification

Verified during implementation: **38 backend tests passed**, including real
Piston integration; frontend build and changed-file lint passed; the full browser
smoke workflow passed on desktop and at 390px mobile width. The unrelated broad
suite failures are listed below rather than counted as passing.

```powershell
$env:PISTON_REPO_TESTS = '1'
backend/.venv/Scripts/python -m pytest backend/tests/test_repo_challenges.py backend/tests/test_service.py backend/tests/test_harness.py backend/tests/test_testcases.py -q
cd frontend
npm.cmd run build
npx.cmd eslint src/pages/RepoDebugging.tsx src/components/interview/RepositoryExplorer.tsx src/api/repoChallenges.ts src/lib/editorThemes.ts src/components/interview/CodePanel.tsx src/App.tsx src/pages/InterviewSelection.tsx
```

The repository tests exercise loading, hidden-file boundaries, authentication,
invalid IDs/paths, read-only protection, UTF-8 size limits, Piston payloads,
failure handling, and truthful storage status. With the integration flag they
also execute both broken and repaired repositories, syntax errors, an infinite
loop, and the submit endpoint against real Piston. Database writes are mocked
in tests; no account save is claimed without applying/verifying the migration.

An optional browser smoke test uses Playwright with installed Microsoft Edge.
It expects the existing local development auth bypass and running frontend/backend.
It mocks the development profile and submission persistence only; run/submit
evaluation uses real Piston. It checks selection, explorer contents, independent
edits, tab closure/reopen, read-only files, failing/passing results, draft restore,
reset confirmation, theme switching, and mobile overflow. Screenshots go to TEMP.

Temporary tooling can be installed without changing the app's dependencies:

```powershell
npm.cmd install --prefix "$env:TEMP/clario-repo-browser" playwright --no-audit --no-fund
$env:PLAYWRIGHT_MODULE = "$env:TEMP/clario-repo-browser/node_modules/playwright"
node tests/repo-debugging.browser.cjs
```

Manual end-to-end check: choose Shopping Cart, inspect `main.py`, `cart.py`, and
`discounts.py`; run the starter (2/7 passing), repair the percent-unit mismatch,
repair the item slice and inclusive discount boundary as well, then run again
(7/7). Submit and inspect both the evaluation and the independent
storage message. For Login, starter code passes 2/8; fix input normalization,
exact password matching, and active-user checks across both public functions.

The broad existing suites also exposed six older failures in
`backend/tests/test_sandbox.py` (stale patch targets/expectations) and a frontend
`dashboard.test.mjs` loader failure due to extensionless Node imports. The six
sandbox failures were reproduced with the original single-file executor restored
in memory. These unrelated suites were not rewritten for this feature.

## Add a third challenge

Create `backend/challenges/<folder>/challenge.json`, `starter/`, and `tests/`.
Copy the manifest shape from either initial challenge, assign a unique kebab-case
ID, list editable and read-only starter files, and provide the entrypoint,
testFile, testNames, description, objective, expectedBehavior, and constraints.
`testNames` must match the unique unittest method names, sorted result ordering is
handled by the runner. Keep tests independent and behavioral, with no dependencies.
Executable files must remain flat and must not use the reserved `_clario_` names.
For this MVP the manifest language must be `python`.

The catalog discovers folders automatically on requests. React requires no changes.
The explorer already represents expandable nested paths, but the execution loader
deliberately rejects nested files until package execution is supported and tested.

## Files delivered

New backend files:

- `backend/services/__init__.py`
- `backend/services/repo_challenge_service.py`
- `backend/routers/repo_challenges.py`
- `backend/challenges/runner.py`
- `backend/challenges/shopping-cart/challenge.json`
- `backend/challenges/shopping-cart/starter/main.py`
- `backend/challenges/shopping-cart/starter/cart.py`
- `backend/challenges/shopping-cart/starter/discounts.py`
- `backend/challenges/shopping-cart/starter/README.md`
- `backend/challenges/shopping-cart/tests/test_cart.py`
- `backend/challenges/login-debug/challenge.json`
- `backend/challenges/login-debug/starter/main.py`
- `backend/challenges/login-debug/starter/auth.py`
- `backend/challenges/login-debug/starter/users.py`
- `backend/challenges/login-debug/starter/README.md`
- `backend/challenges/login-debug/tests/test_auth.py`
- `backend/tests/test_repo_challenges.py`

New frontend/documentation files:

- `frontend/src/api/repoChallenges.ts`
- `frontend/src/components/interview/RepositoryExplorer.tsx`
- `frontend/src/lib/editorThemes.ts`
- `frontend/src/pages/RepoDebugging.tsx`
- `frontend/tests/repo-debugging.browser.cjs`
- `docs/repo-debugging.sql`
- `docs/repo-debugging.md`

Existing files modified for this feature:

- `backend/main.py` (router registration only)
- `backend/piston/service.py` (shared multi-file execution extension)
- `backend/piston/compose.yaml` (explicit sandbox limits)
- `frontend/src/App.tsx` (repository routes)
- `frontend/src/pages/InterviewSelection.tsx` (new mode link)
- `frontend/src/components/interview/CodePanel.tsx` (reuse extracted themes)

No new production dependencies. Java repository execution,
terminal commands, arbitrary imports, diffs, and cloud session drafts are deferred.

## Sandbox UI and voice follow-up

The repository page now reuses `TopBar` and `VideoCallPanel`, preserving camera
preview, interviewer tile, start/end controls, and existing ElevenLabs behavior.
`GET /voice/repo-session?challenge_id=...` builds voice context from public starter
files and the challenge brief; it never looks up a LeetCode slug or reads private
tests. The voice agent is told to ask about hypotheses and verification without
revealing the fix. It does not receive live edits or test results; candidates
explain these aloud. The existing agent must reference its problem variables.

Live audio requires `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`. At the time of
the follow-up check, both were absent from the loaded backend settings, and the
real voice endpoint returned 503. Voice-context routing was tested using a mocked
provider, so no live audio success is claimed.

The updated repository suite passed 30 tests, including real Piston checks and
the repository voice-context test. The browser smoke script ignores only Monaco's
known model-switch diagnostic cancellation (`Canceled`, with a Monaco setModel
stack); application errors still fail it.

Additional files changed in this follow-up:

- `frontend/src/components/interview/InterviewModeGrid.tsx` (new)
- `frontend/src/components/interview/TopBar.tsx` (optional list/run labels)
- `frontend/src/components/interview/VideoCallPanel.tsx` (optional repository context)
- `frontend/src/api/voice.ts` (repository voice routing)
- `backend/voice/router.py` (repository voice-session endpoint)

The repository page, mode-selection page, tests, and this guide were also updated.

Run Tests executes the current repository files through Piston. Python first
validates editable-file syntax and executes the entrypoint, then runs the unit
suite. C++ compiles the combined repository/test runner and runs its unit suite.
A passing test means one checked behavior works, including in an intentionally
broken starter; it does not mean the entire repository is correct. Tests that
never ran after a compile/import error or timeout are counted separately from
failed tests. Python assertion messages and candidate-code stack locations, plus
C++ assertion/exception messages and candidate-file compiler locations, are
shown as diagnostics. Private unit-test source/traceback frames are omitted.

Both coding sandboxes send run-start and result/error updates to the live
interviewer with the exact source files from that run, a run ID, and language.
Updates are contextual evidence rather than automatic speaking turns. The last
10 updates replay after a voice reconnect; up to 40 compact run events are saved
with interview evidence for feedback. A service outage is an unavailable run,
not a failing candidate test. The feedback evaluator treats these as reported
executor observations and does not claim it independently executed the code.

Submit is final for the active interview: it sends the final snapshot, starts
follow-up questioning with one cue, and disables further submissions, edits,
resets, language changes, and test runs. It does not execute tests or finish the
call. A failed delivery leaves submission available for retry. Successful
submission state is retained in session storage for a page reload; End interview
still saves evidence and opens the feedback report. This UI lock is not a
server-enforced submission counter. Voice context replay covers reconnections,
not a full page reload.
