# Progress page

`/progress` is protected by the existing profile gate and uses the shared authenticated API helper. The sidebar Progress link opens it; `/report` redirects to Progress.

The page includes three tinted summary cards, a line chart with all four score categories visible initially, and Previous Sessions with duration, percentage and out-of-100 score, mode, difficulty, and a See Report link. Scores use percentages and null metrics remain unavailable. There is no topic breakdown, completion pie, UMPIRE habits card, or separate feedback history. UMPIRE coaching appears only in a session report. Dates use America/Chicago. The layout uses the shared page heading and sidebar and stacks on phones.

## Live data

Live API calls are the default (`USE_MOCK` is false unless explicitly enabled in development):

- `GET /api/progress/history` → `ProgressHistoryItem[]`
- `GET /api/progress/summary` → `ProgressSummary`
- Available for other consumers, not requested by this page: `GET /api/progress/topics` → `ProgressTopics`

Types are in `frontend/src/types/progress.ts`, matching the supplied CLA-81 contract. Requests include the signed-in user's authorization through the existing shared helper. Backend handlers must scope data to that user.

These endpoints are implemented in `backend/routers/progress.py` using the existing interview, feedback, problem, and event tables. Queries scope sessions to the authenticated user and paginate results. Missing category scores remain null. UMPIRE miss rates use only explicitly observed completed/skipped steps, keeping unobserved steps unknown. Latest score and improvement use available scored reports. Topic averages use saved problem tags; weak topics need at least two attempts and an average below 60. No seed data or new tables are required. A live read against the configured development database succeeded.

## Development preview

With Vite running and a completed profile:

- `/progress?preview=mock` renders the ticket's nine sample sessions and exact summary/topic values.
- `/progress?preview=empty` renders the empty state.
- `VITE_PROGRESS_USE_MOCK=true` enables the mock across development visits; restart Vite after changing it.

Previews are development-only and visibly marked as sample data. Production always calls the API.

## Validation

Run `npm run build` in `frontend`. For browser checks, run the local Vite server with the existing development auth bypass enabled, install Playwright temporarily (`npm install --no-save --package-lock=false playwright`), and run `node tests/progress.browser.cjs`. Set `PLAYWRIGHT_MODULE` to an existing Playwright installation if needed. The script uses headless Microsoft Edge and intercepts profile/progress responses without writing account data.

Browser coverage: loading, percentage scores, four trend lines, detailed session links, 390px layout without horizontal overflow, empty and single-session states, error/retry, explicit mock preview, and the legacy report-index redirect. Screenshots are saved in the OS temporary directory. Backend tests cover user scoping, missing scores, and measured session duration. See [interview-flow.md](interview-flow.md) for timing sources and limitations.
