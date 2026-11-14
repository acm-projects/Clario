CLA-70 audit findings (2026-11-02) ? recorded before production fixes

- [ ] **FAIL: Recommended session mode is not persisted.** `sessionRequestFor()` maps recommended to practice, `createSession()` only types practice/full_mock, and the backend rejects recommended in SessionCreate/ALLOWED_MODES. A URL containing mode=recommended does not satisfy persisted mode=recommended.
- [ ] **DATA DEPENDENCY: Company personalization is inactive.** Companies are saved in assessment JSON, but ranking ignores them. Read-only Supabase metadata shows no company columns on problems and no company mapping tables. The supported public list provides no company tags. Do not claim company preferences are applied; CLA-68/company metadata is required before meaningful live company-based ranking can be verified. Resolve the unqualified companies TODO with an explicit explanation of this dependency.
- [ ] **VERIFICATION GAP: The old full-flow browser fixture is stale.** `part5-e2e.browser.cjs` still expects 10?15 problems and practice storage mode. It cannot be the completion evidence for the current 20?25 and persisted recommended requirements. Add a current isolated full-flow audit with explicit session-row verification, new-user redirect, blank recalibration, and console/backend-log evidence.
- [ ] **VERIFICATION GAP: Live Supabase mode constraints are not proven.** OpenAPI reports the mode column as text, which does not reveal CHECK constraints. Verify an isolated test session before claiming actual Supabase persistence supports recommended; do not change schema without approval.

Additional unverified path to distinguish from a reproduced failure:
- Normal authenticated Assessment submission currently writes assessment JSON, then separately updates profiles from the browser. A later profile-write failure could display an error after assessment JSON was already saved. Existing dev-bypass/isolated tests do not exercise a real browser-authenticated profile update. Record this boundary explicitly in the final report and test the behavior before claiming atomic multi-table submission.

Confirmed baseline evidence (not failures):
- Recalibrate starts blank and does not read saved answers into the form; preserve this newer behavior.
- Initial real public catalog audit: 112 unique usable problems; every selectable assessment topic has at least two matches.
- Synthetic profiles A/B/C each returned 25 unique problems with completed slugs excluded. Company preference application was false for all three; distributions and exact problem lists are in docs/cla70-initial-audit.json.
- No real user data has been changed by this audit.

Linear was not connected. This is the exact checklist prepared for manual posting; no comment has been posted.

Baseline verification completed before the code fix: docs/cla70-baseline-flow.json records storedMode=practice while the URL mode is recommended. The complete isolated new-user/recalibration journey otherwise completed without runtime or unexpected API errors.

The schema concern was subsequently cleared using a newly created, disposable Supabase test user and session: mode=recommended persisted successfully. Only those test records were removed; no schema change was necessary. See docs/cla70-supabase-mode-check.json.
