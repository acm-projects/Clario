# Progress page

`/progress` is protected by the existing profile gate and uses the shared authenticated API helper. The sidebar Progress link opens it; `/report` redirects to Progress.

The page includes three tinted summary cards, an animated teal line graph of overall scores, and Previous Sessions with duration, percentage and out-of-100 score, mode, difficulty, and a See Report link. Scores use percentages and null metrics remain unavailable. There is no topic breakdown, completion pie, UMPIRE habits card, or separate feedback history. UMPIRE coaching appears only in a session report. Dates use America/Chicago. The layout uses the shared page heading and sidebar and stacks on phones.

## Live data

Live API calls are the default (`USE_MOCK` is false unless explicitly enabled in development):

- `GET /api/progress/history` → `ProgressHistoryItem[]`
- `GET /api/progress/summary` → `ProgressSummary`
- Available for other consumers, not requested by this page: `GET /api/progress/topics` → `ProgressTopics`

Types are in `frontend/src/types/progress.ts`, matching the supplied CLA-81 contract. Requests include the signed-in user's authorization through the existing shared helper. Backend handlers must scope data to that user.

These endpoints are implemented in `backend/routers/progress.py` using the existing interview, feedback, problem, and event tables. Queries scope sessions to the authenticated user and paginate results. Missing category scores remain null. UMPIRE miss rates use only explicitly observed completed/skipped steps, keeping unobserved steps unknown. Latest score and improvement use available scored reports. Topic averages use saved problem tags; weak topics need at least two attempts and an average below 60. No seed data or new tables are required. A live read against the configured development database succeeded.

## Real data and interview history

The page always requests the signed-in user's saved data. Development mock flags and preview query parameters no longer replace progress records. GET /api/progress returns history and summary from one owned-session read, keeping cards, the overall-score graph, and the table consistent. Existing /history and /summary endpoints remain available.

The three summary cards use the same landing-blue and landing-yellow tokens as the landing page, in blue/yellow/blue order. Previous Interviews uses a searchable table with difficulty pills, recorded topics, saved feedback summaries, interview mode, real session IDs, dates/duration, overall scores, report status, and report links. Filters combine search, difficulty, topic and status.

History metadata comes from stored problem records or the actual repository/design catalog. Feedback summaries and Reviewed status come from saved feedback reports. Missing metadata and scores are explicitly unrecorded; no sample names, stars, summaries, topics or scores are generated. Latest score refers to the actual latest interview, even when unscored; improvement appears only when the first and latest interviews both have recorded scores.

## Validation

Run `npm run build` in `frontend`. For browser checks, run the local Vite server with the existing development auth bypass enabled, install Playwright temporarily (`npm install --no-save --package-lock=false playwright`), and run `node tests/progress.browser.cjs`. Set `PLAYWRIGHT_MODULE` to an existing Playwright installation if needed. The script uses headless Microsoft Edge and intercepts profile/progress responses without writing account data.

Browser coverage: loading, percentage scores, one overall-score line with visible points and a fixed 0-100 scale, detailed session links, 390px layout without horizontal overflow, empty and single-session states, error/retry, no mock preview override, and the legacy report-index redirect. Screenshots are saved in the OS temporary directory. Backend tests cover user scoping, missing scores, and measured session duration. See [interview-flow.md](interview-flow.md) for timing sources and limitations.

The same overall-score graph appears in each saved feedback report, loaded independently from `/api/progress/history`. Missing/invalid scores are omitted rather than plotted as zero. Dates use America/Chicago; single-score histories show one dot. Solid grid lines, angled date labels, and teal points follow the supplied reference. The line respects reduced motion. A screen-reader table lists exact scores. React Bits Pro was skipped at the user's request; this uses the existing Recharts dependency.


The middle summary card is labeled "Your average percentage"; the right card is "Your overall score" and uses the actual most recent interview, including a report arrow linked by latest_session_id. Unscored latest interviews remain unscored. The graph is labeled "Your trend", uses landing royal blue, and exposes Overall, Technical, Reasoning and Communication in its hover breakdown and accessible table. The Previous Interviews table omits feedback-summary prose.

Dashboard skill radar values now use the same saved Technical, Reasoning and Communication averages as the progress API, preserving null scores and zeroes. Its loading/error state is independent of session-history loading. Repository history receives canonical title, difficulty and topic tags from the paired challenge catalog, so older sessions can display available metadata without fabricated timing or scores.

Individual reports use the three saved session scores (Technical, Reasoning,
Communication) in blue/yellow/blue cards, with overall shown separately. The six
UMPIRE assessments have independent 0�5 star ratings, one-sentence summaries and
an evidence dialog. Missing evidence is unassessed, not zero. The feedback
provider must return exact code/candidate-transcript excerpts; unverifiable
quotes are removed and their ratings cleared. This checks excerpt provenance,
not whether the model's interpretation is correct.

New reports include exactly five short Fix actions and up to five observed
strengths under Don't fix. Filler terms/counts are literal server-side matches
from saved candidate speech; transcription may omit fillers and some phrases
have ordinary meanings. No audio-based total is claimed. Old reports keep their
saved scores and recommendations; Generate detailed breakdown explicitly
regenerates their report from saved evidence (`refresh_details=true`). Generation
failure leaves the old saved report intact. Transcript and assessment limits are
collapsed below the main feedback.
