# Progress page

`/progress` is protected by the existing profile gate and uses the shared authenticated API helper. The sidebar Progress link opens it; `/report` still opens feedback history.

The page includes three summary cards, a score trend with four independently selectable series (at least one remains visible), sorted topic averages with weak-topic highlights, all six UMPIRE habits, and the five latest report links. Null metrics display as unavailable, including unobserved UMPIRE steps. Dates use America/Chicago. Desktop columns stack on phones.

## Data contract and backend handoff

Live API calls are the default (`USE_MOCK` is false unless explicitly enabled in development):

- `GET /api/progress/history` → `ProgressHistoryItem[]`
- `GET /api/progress/summary` → `ProgressSummary`
- `GET /api/progress/topics` → `ProgressTopics`

Types are in `frontend/src/types/progress.ts`, matching the supplied CLA-81 contract. Requests include the signed-in user's authorization through the existing shared helper. Backend handlers must scope data to that user.

At implementation time, neither fetched `origin/Prapti` nor `origin/main` contained progress routes or `seed_progress.py`. Live seeded-data parity and seed cleanup therefore remain unverified. No seed data was inserted or removed, and no other developer's work was merged. The page displays an error if these endpoints are unavailable; it never silently replaces real data with mock scores.

## Development preview

With Vite running and a completed profile:

- `/progress?preview=mock` renders the ticket's nine sample sessions and exact summary/topic values.
- `/progress?preview=empty` renders the empty state.
- `VITE_PROGRESS_USE_MOCK=true` enables the mock across development visits; restart Vite after changing it.

Previews are development-only and visibly marked as sample data. Production always calls the API.

## Validation

Run `npm run build` in `frontend`. For browser checks, run the local Vite server with the existing development auth bypass enabled, install Playwright temporarily (`npm install --no-save --package-lock=false playwright`), and run `node tests/progress.browser.cjs`. Set `PLAYWRIGHT_MODULE` to an existing Playwright installation if needed. The script uses headless Microsoft Edge and intercepts profile/progress responses without writing account data.

Browser coverage: loading, API response rendering, category toggles including the last-visible guard, tooltip title/date/scores, three weak-topic bars, Plan at 56%, five newest report links, 390px layout without horizontal overflow, empty state, one-session/null observations, error/retry, and explicit mock preview. Screenshots are saved in the OS temporary directory. Real CLA-81 endpoint and seed-script checks must run once that backend is available.
