# Assessment and personalized recommendations

The frontend uses the existing authenticated `request` helper and Vite API proxy. Local temporary identity comes from the existing development profile endpoint and backend configuration; no new user IDs or authentication mechanism are introduced.

Assessment question text lives in `frontend/src/lib/assessmentQuestions.ts`, with the existing branching rules and validation reused from `practiceProfile.ts`. Explicit experience and timeline choices supply the backend's required values. Confident topics, struggling topics, companies, and interview date remain optional. Java maps to `java`; Python maps to `python3`.

On completion, the page upserts `/api/assessment`, then preserves the existing profile update (or local development profile preview), and navigates to `/interview`. A failure in either save keeps the answers on screen and permits a retry. The backend upsert makes repeated saves safe. Profile data and assessment data remain in their existing tables; no schema changes are required.

Dashboard and Interview Selection use `AssessmentGate` to check `/api/assessment/me` before rendering. Only 404 redirects to `/assessment`. Other failures show a retry action. Assessment itself is outside this guard; the legacy profile completion flag cannot cause a redirect loop on these routes.

`/recommended` loads `/api/recommendations?limit=5` and reads the saved assessment language before enabling interview starts. It handles loading, errors, retry, empty results, and missing assessments. New and legacy Recommended selection links lead to this page. Session starts retain the existing supported `practice` storage mode and `mode=recommended` URL, as approved. Normal Custom, Surprise me, and Company behavior is retained.

## Checks

From `frontend`:

```powershell
npm run build
npm run lint
node --test tests/assessment-contract.test.mjs
```

Browser tests use Playwright and the existing configured local development identity. Start Vite on port 5173, then run:

```powershell
$env:PLAYWRIGHT_MODULE = '<path to an installed playwright module>'
node tests/assessment-flow.browser.cjs
```

All browser account/API writes are intercepted with fixtures. Browser tests do not create or change real assessments or sessions. They cover validation, request payloads, loading locks, retry, navigation, 404 versus other failures, saved language and session mode, and responsive layouts.

From the repository root:

```powershell
backend/.venv/Scripts/python -m pytest backend/tests/test_assessment_recommendations.py -q -p no:cacheprovider
```
