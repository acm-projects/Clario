Repo debugging hand-off implementation

The repository editor keeps one URI/model per user, challenge, and file. Model
flush notifications are ignored so controlled value updates cannot copy text
between files. README is navigation; challenge metadata owns the incident brief.

Shopping-cart Run Tests executes three editable visible unittest checks from
`test_checkout.py`. Submit adds eight backend checks, including the public API
signature. The runner and private test module are reserved names. Existing
manifest allow-list and UTF-8 payload caps remain enforced. Python execution is
bounded to five seconds. PISTON_URL must explicitly contain the execution endpoint
(e.g. your local Piston /api/v2/execute endpoint); it has no implicit host.

Results include counts, expandable failures, an Errors view, and explicit execution
errors/timeouts. Private traceback source is suppressed. The result panel supports
pointer and keyboard resizing. Run expands it. The call column is 280px and can be
hidden without ending the session. The brief is a collapsible drawer, shown on
first challenge visit. Tabs scroll and controls retain their own width.

The countdown remains at the full duration until Start interview. Submit confirms
before execution; reset retains its existing confirmation. Captions use ElevenLabs
user transcript events. Camera-off is neutral. Drafts retain the existing per-user,
per-challenge key, debounce at 500ms, and flush on pagehide/unmount.

Validation

- Frontend production build passed; changed-file ESLint passed.
- Repository/service checks: 34 passed, 4 live-Piston checks skipped.
- Full backend suite: 79 passed, 4 skipped, 7 failed in test_sandbox.py. Those older
  tests attempt external problem/Piston calls in this restricted environment.
- Full frontend lint has an existing set-state-in-effect violation in InterviewReport.tsx.
- Live Piston execution unavailable: Docker daemon is stopped and PISTON_URL unset.
- Mocked browser checks passed: all five file contents, edits across tab switches,
  draft restoration, remembered brief, submission confirmation, and editor width
  above 50% at 1440x900 and 1280x720. Monaco CDN requests were fulfilled from the
  installed package for the restricted-network test. These checks do not validate
  real execution or live voice transcription.

Assumptions and deviations

- Kept /api/repo-challenges/{id}/run and /submit; did not add /api/run.
- Existing files were valid Python; incident text was in README. The reported
  mismatch was not reproduced before implementation; model flush handling was hardened.
- Runtime uses ElevenLabs, not Hume. Stretch diff/results feedback integration is
  deferred pending the owner coordination explicitly required by the hand-off.
- Login challenge retains its existing private-test behavior; this pass targets cart.
- Hidden failure details remain generic to avoid returning private test source.
- Visible test method names form the expected result contract. Renaming/removing
  tests produces an explicit runner error rather than a false passing result.
- Inherited main commits d542233c and d8076246 are ahead of origin/test. The latter
  supplies the repo-debugging implementation this change extends. A PR against test
  includes that prerequisite scope; it should be reviewed/merged in that order.
- Original staged .gitignore/log cleanup is excluded from implementation commits.
- Shared workspace tasks are grouped where edits touch the same component.
