# Four interview modes

The frontend has Recommended, Custom, Surprise me, and Company selection flows. UI mode identifiers are recommended, custom, surprise_me, and company.

Coding-session starts use createModeSession in frontend/src/lib/api.ts. The request adapter maps Recommended and Custom to the existing practice API mode and Surprise me to full_mock. Requests contain only problem_slug, mode, and language (python3/java), as accepted by the existing backend. Selection mode remains in the room URL so practice guidance and mock behavior are preserved. No database schema changes are required.

Company scenarios remain preview-only. Scenario session creation, storage, restoration, and code execution need an explicit backend contract; the adapter rejects company starts with a specific explanation instead of submitting a scenario slug as a coding problem.

Custom opens the problem library. Question buttons choose custom mode and use the shared session starter before navigating. Recommended previews the profile's starting difficulty. Surprise me calls GET /api/problems/random; that static route is registered before /{slug}. Company fetches public scenario summaries and details, filtering for the existing Bumble, Spotify, DoorDash, and Stripe scenarios. Internal details and test cases are never sent through the public scenario endpoints. Room URLs carry a mode and session ID; direct problem URLs also open the sandbox without session persistence, as on Vrinda.

Supabase contains two existing scenarios each for Bumble, Spotify, DoorDash, and Stripe. The selector uses those companies and the live public scenario API. No company scenarios were inserted or changed.
