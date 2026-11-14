# CLA-70 completion audit

Audit date: 2026-11-02 (America/Chicago). No page rebuilds or redesigns. Newer blank-Recalibrate behavior is preserved.

Core Assessment -> Recommended -> Interview flow is verified. The actual recommended-mode storage defect is fixed. Company-specific ranking remains a data/implementation dependency; it is not claimed complete. Linear was not connected, so no ticket comment or status update was posted.

## Completed and tested

- [x] Question definitions and every conditional path come from assessmentQuestions.ts/practiceProfile.ts; required answers validate before submission.
- [x] Python/Java/custom language ratings are independent, required, saved, and normalized without sending unsupported runner languages.
- [x] Required interview date accepts today/future and rejects missing, malformed, and past dates.
- [x] Assessment save loading, failed-save preservation/retry, Recommended loading/error/empty states are covered by browser regressions.
- [x] Recalibrate resets all choices, text fields, ratings, topics, company preferences, date, progress, and conditional answers to Question 1. Delayed API responses cannot repopulate it.
- [x] Leaving/canceling recalibration preserves saved assessment JSON. Successful submission replaces the same assessment row.
- [x] New user Dashboard redirects to Assessment; completing it opens Interview Selection; Recommended opens /recommended.
- [x] GET /api/recommendations defaults to 25, accepts 20-25, deduplicates, excludes completed slugs/legacy IDs, and explains shortfalls.
- [x] Saved experience, struggle/confident topics, safe difficulty broadening, related topics, and Chicago calendar-day proximity (0-21 inclusive) are tested. Ratings are persisted; backend ranking does not independently score comfort ratings.
- [x] Public source expansion and saved-catalog fallback are tested; real captured catalog has 112 unique usable problems. No artificial production problems were inserted.
- [x] Every selectable assessment topic has at least two matching problems in the available combined public/saved pool (coverage below). This is global catalog coverage, not a guarantee of two matches at every difficulty after completion exclusions.
- [x] Cards show title/difficulty/topics/reason; exact slug and supported language reach Interview Room.
- [x] New recommended launches now send and persist mode="recommended"; this is verified in actual API insert rows and separately in an isolated live Supabase session. URL mode alone was not counted as passing.
- [x] Ducky and Recommended share the ranked snapshot; featured Start opens the exact problem with Java and persisted recommended mode. Recalibration, completed-history changes, day change, and short TTL drive snapshot invalidation.
- [x] Browser runtime/API logs were reviewed. The only browser console error was the expected new-user GET /api/assessment/me 404; there were zero runtime exceptions or unexpected API errors. Backend logs contained the matching expected 404 and successful route responses, without tracebacks.

## Three distinct profile results

These are actual POST /api/assessment and GET /api/recommendations results against isolated in-memory storage containing the captured real public catalog, not writes to real user assessments. Two known completed slugs (two-sum, add-two-numbers) were excluded. The 112-entry captured combined catalog is the test input; this is not a claim that all 112 entries exist in Supabase. Tied backend scores can reorder on subsequent requests.

| Profile | Confidence / interview | Returned / unique | Difficulty | Direct topic matches | Companies applied | Completed excluded |
|---|---|---|---|---|---|---|
| A: Beginner | 2/10; 30 days | 25 / 25 | Easy: 24, Medium: 1 | 18 / 25 | No: metadata unavailable | Yes |
| B: Intermediate | 6/10; 14 days | 25 / 25 | Medium: 20, Hard: 5 | 19 / 25 | No: metadata unavailable | Yes |
| C: Advanced | 9/10 including C++; 7 days | 25 / 25 | Medium: 14, Hard: 11 | 20 / 25 | No: metadata unavailable | Yes |

Topic counts can overlap within a problem. Profile A: Array 11, String 9. B: Hash Table 13, Binary Search 6. C: Dynamic Programming 18, Tree 4. Exact inputs, slugs, reasons, and distributions are in cla70-profile-results.json.

## Topic coverage in the captured available pool

| Selectable topic | Matching unique problems |
|---|---|
| Array | 56 |
| String | 32 |
| Dynamic Programming | 21 |
| Math | 17 |
| Two Pointers | 19 |
| Backtracking | 16 |
| Hash Table | 17 |
| Linked List | 11 |
| Matrix | 11 |
| Recursion | 8 |
| Sorting | 12 |
| Binary Search | 9 |
| Stack | 7 |
| Tree | 6 |
| Binary Tree | 6 |

## Bugs discovered and fixed

- [x] **Persisted mode mismatch:** baseline browser journey observed practice in the actual API-created session despite mode=recommended in the URL. The frontend adapter/types and backend validation now preserve recommended. No mode backfill or schema change was performed.
- [x] **Stale verification contract:** mode assertions were updated and a current full-flow audit was added. The older small fixture remains an explicit 11-problem shortfall test with a 25 target/20 minimum; its source expansion is disabled so it cannot accidentally mix real external problems into an isolated fixture.
- [x] **Unqualified companies TODO:** replaced with the audited absence of company metadata and the CLA-68 dependency. This is documentation of a limitation, not a claim of company scoring implementation.

## Missing, data-dependent, and unverified work

- [ ] **Company-personalized ranking:** companies save correctly, but no company fields/mapping tables exist in current Supabase metadata and the supported public list has no company tags. All three profiles report company_preferences_applied=false. Genuine company/problem associations and a matching/ranking integration are still needed if this conditional CLA-70 facet is required. Do not fabricate mappings; any schema change needs separate approval.
- [ ] **Live browser-auth/profile synchronization:** full browser flow used the local dev profile adapter and isolated API storage. Unit tests cover profile updates, but real sign-in/RLS and the joint assessment-save plus browser-profile-update path were not end-to-end tested. These are separate writes, so atomic multi-table submission is not claimed.
- [ ] **Piston execution:** four repository-execution tests were skipped because local Piston execution was not enabled. Paid voice and code execution were intentionally not part of this CLA-70 navigation/data audit.
- [ ] **Linear posting/status:** paste cla70-failures-checklist.md manually; no connected Linear tools were available.

## Validation results

- Backend full suite: **148 passed, 4 skipped**, zero final errors/failures. Initial sandbox run: 141 passed with 7 temporary-directory permission errors; rerun outside sandbox resolved all 7. No unrelated product changes were made for that environment failure.
- Frontend unit suite: **52 passed**.
- Browser: **10 full-flow audit checks passed**, plus **13 assessment/Recommended regression scenarios** and **7 custom-language/Recalibrate checks**.
- Build: **passed** (existing chunk-size/dynamic-import advisories remain). Lint: **passed**. git diff --check: **passed**.
- Baseline full-flow evidence deliberately records one failure (stored practice mode). Final full-flow evidence records zero failed checks.
- Live Supabase probe: a new disposable test account/session successfully stored recommended mode. Both were removed; no existing user data or schema was changed.
- Profile API verification: A/B/C each returned 25 unique problems with meaningful reasons and completed exclusions; no company effect claimed.

## Files changed in this audit

Production: backend/routers/sessions.py; frontend/src/lib/api.ts; frontend/src/lib/interviewModes.ts (approved shared-file patch); backend/routers/assessment.py (company-dependency comment only).

Tests: backend/tests/test_recommended_sessions.py; backend/tests/cla70_server.py; backend/tests/part5_server.py; frontend/tests/cla70-flow.browser.cjs; frontend/tests/interviewModes.test.mjs; frontend/tests/assessment-contract.test.mjs; frontend/tests/assessment-flow.browser.cjs; frontend/tests/part5-e2e.browser.cjs.

Audit scripts: backend/scripts/cla70_audit.py; backend/scripts/cla70_mode_probe.py; backend/scripts/cla70_verify_profiles.py.

Documentation/evidence: docs/interview-modes.md; this report; cla70-failures-checklist.md; cla70-session-mode-proposal.patch; cla70-initial-audit.json; cla70-baseline-flow.json; cla70-final-flow.json; cla70-profile-results.json; cla70-supabase-mode-check.json.

No commits, pushes, stash operations, Git reset/clean operations, or schema changes were performed. Prior unrelated working-tree changes and untracked assets were preserved.
