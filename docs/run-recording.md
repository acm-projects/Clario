# Run logging and interview completion

## Apply the database migration first

The live schema was inspected on November 2, 2026. code_executions has session_id,
snapshot_id, stdin, stdout, stderr, exit_code, execution_time_ms, status, and timestamps,
but lacks the five requested evidence fields. Run
backend/migrations/20261102_code_execution_details.sql in Supabase's SQL editor.
The migration adds nullable code, language, test_results, passed_count, and total_count
columns plus a session/date index. It does not delete rows or change RLS policies.
It has been prepared locally, not applied to the connected database.

Session-linked Runs return 503 until logging is available. They do not execute and
silently skip persistence. Existing standalone requests without session_id still work.

## One canonical test runner

POST /run/tests now has exactly one registered handler: piston/router.py. Previously,
standard_runner.py registered the same method/path later, so requests reached Piston
while OpenAPI could describe the shadowed standard runner. standard_runner.py remains
on disk, but its duplicate router is no longer mounted in main.py.

The frontend sends the authenticated session_id on every room Run. The backend checks
session ownership, in-progress status, slug, and language before running code. It
reserves a code_executions row with the exact code/language and status Running, then
updates that row with stdout, stderr, the actual process exit code, per-case results,
pass/total counts, verdict, and elapsed request time in milliseconds.

A wrong answer can have exit_code=0: passing the process is different from passing tests.
If execution never starts or the provider fails, exit_code and counts stay null rather
than inventing a process result. The reserved row records Execution Error and the error
message. A failure to persist final results is returned as 503; the earlier Running row
remains as evidence of the attempted Run. No frontend insert is needed.

## Snapshot and completion order

The room saves a snapshot immediately before Run. End Interview in the header,
the call-panel End button, and timer expiry use the same guarded handler. It:

1. Stops autosave immediately and prevents another End action from starting.
2. Stops voice if it is running and waits for queued transcript saves.
3. Waits for any active Run to finish, including execution logging.
4. Saves the latest editor contents as the final snapshot.
5. PATCHes /api/sessions/{id}/end.
6. Navigates to /report/{id}.

A room opened directly creates a session when needed, even if voice never starts.
Concurrent Run/End/start actions share one pending session-creation request.
A completed-session response during final saving or completion still navigates to the
report. Other failures keep the user in the room with an error and allow manual retry;
the timer does not repeatedly retry an unsuccessful end.

The timer currently uses a 30-minute duration from interview_sessions.started_at,
centralized in frontend/src/lib/interviewLifecycle.ts. Reloading a saved session uses
its original deadline. This replaces the previous static 24:17 display. Duration is
a product default and can be adjusted in that constant.

## Checks

Automated backend tests cover three Runs including a failure, runtime stderr and exit
codes, provider errors, missing logging storage, result-write failure, ownership,
completed sessions, mismatched problems/languages, standalone compatibility, and the
single registered route. Frontend tests cover completion order, waiting for Run before
reading final code, completed-session handling, final-save failure, and deadline math.

After applying the migration, perform the real acceptance checks:

- Make three Runs in a fresh session, including a wrong answer. Confirm three
  code_executions rows with the right session_id and their full evidence.
- Edit code and immediately End. Check the last snapshot contains that edit and
  the session is completed before the report opens.
- End during an active Run. The Run should finish logging before completion.
- End without starting voice; it should still save and navigate to the report.
- Double-click End; only one finalization path should run.
- Verify the countdown reaches zero and uses the same path, stopping voice if active.

The report page and post-call feedback pipeline remain separate tasks.
