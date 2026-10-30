# Progress page

`/progress` is protected by the existing profile gate and uses the shared authenticated API helper. The sidebar Progress link opens it; `/report` still opens feedback history.

The page includes three summary cards, a score trend with four independently selectable series (at least one remains visible), a completion pie chart, sorted topic averages, UMPIRE habits, and five previous-question report links. The pie counts unique problem slugs from completed interviews once, grouped by difficulty; it does not claim that a submitted solution passed tests. Null metrics display as unavailable. Dates use America/Chicago. Desktop columns stack on phones.

## Live data

Live API calls are the default (`USE_MOCK` is false unless explicitly enabled in development):

- `GET /api/progress/history` → `ProgressHistoryItem[]`
- `GET /api/progress/summary` → `ProgressSummary`
- `GET /api/progress/topics` → `ProgressTopics`

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

Browser coverage: loading, API rendering, line toggles including the last-visible guard, tooltip title/date/scores, completion pie, weak-topic bars, Plan at 56%, previous-question links, 390px layout without horizontal overflow, empty state, one-session/null observations, error/retry, and explicit mock preview. Screenshots are saved in the OS temporary directory. Backend tests cover user scoping, missing scores, and observed-step aggregation.
