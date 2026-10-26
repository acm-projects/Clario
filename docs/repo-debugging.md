# Repository debugging MVP

Open **Interview → Repo Debugging**, or `/repo-debugging`. Choose a challenge,
inspect the brief and repository, edit files, run tests, and submit for a fresh
evaluation. This is an isolated Python exercise workspace, not a terminal or
general-purpose cloud IDE.

## Architecture and data flow

Existing code uses `@monaco-editor/react` in `components/interview/CodePanel.tsx`,
`lib/api.ts` for authenticated requests, FastAPI routers, and
`piston/service.py` for execution. Existing coding sessions use
`interview_sessions`, `code_snapshots`, and `session_events` through
`routers/sessions.py`. They represent a single LeetCode problem and source file.
The checked-in repository has no complete definition of those tables, their
foreign keys, or mode constraints. This implementation does not guess new columns
or insert repository IDs into the existing problem-session flow.

The new path is:

1. `backend/challenges/*/challenge.json` defines metadata, allowed files, and
   private test names. Starter and test sources live in actual separate files.
2. `GET /api/repo-challenges` lists public metadata;
   `GET /api/repo-challenges/{id}` supplies starter files and editability.
   Host paths, grading source, private tests, and solutions are not returned.
3. React builds the explorer from returned paths. Monaco uses a separate URI
   per user, challenge, and file. Change events identify the current **model URI**,
   avoiding stale tab callbacks. Starter content remains separate from edits.
4. Run/submit send exactly the editable file map through the existing authenticated
   API client. The backend rejects additional, missing, read-only, or oversized
   files and restores read-only content from disk.
5. The existing Piston service accepts a multi-file payload. Its first file is
   Clario's trusted runner, followed by private tests and repository sources.
   Only Piston executes candidate code; FastAPI never imports or executes it.
6. The runner executes standard-library `unittest` checks. The backend validates
   result names, count, and boolean statuses and returns pass/fail rows. Raw
   output and private-test tracebacks are withheld.
7. Submit reruns the checks and attempts account persistence through
   `save_submission`. Responses distinguish evaluation from successful storage.
   An execution failure does not report a completed or saved submission.

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

For account-level final submission storage, run `docs/repo-debugging.sql` in your
Supabase SQL editor. This additive migration creates `repo_debug_submissions` with
the user, challenge, mode, edited files, evaluation, status, and submission time.
RLS permits users to read their own submissions; only the backend service role
writes evaluated submissions. Existing tables and records are unchanged.

The migration is **provided, not applied automatically**. Without it, evaluation
still works and submission returns `saved: false` with an explicit warning. A
save is successful only if Supabase returns a row ID. Cloud draft sessions,
start/end timing, report integration, and history UI are outside this MVP.

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
then run again (7/7). Submit and inspect both the evaluation and the independent
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
