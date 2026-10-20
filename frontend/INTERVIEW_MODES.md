# Interview mode handoff

All four modes use the existing `/interview/:problemId?mode=...` sandbox.
Mode IDs: `company-specific`, `custom`, `surprise-me`, `recommended`.
`problemId` must be a problem slug supported by GET `/api/problems/{slug}` and the code execution API.
Scenario slugs from `/api/scenarios` are a separate API contract and cannot be used as problem slugs.

An external selection frontend can open the mode selection with:
`/interview?mode=company-specific&problem=two-sum`
Or start the selected problem directly:
`/interview/two-sum?mode=company-specific`

For separate choices on all four cards, pass slug query parameters:
`/interview?company-specific=two-sum&custom=valid-anagram&surprise-me=3sum&recommended=binary-search`

Within this React app, navigate to `/interview` with state:
```
{ mode: "custom", selectedProblem: { slug: "two-sum", title: "Two Sum", difficulty: "Easy" } }
```
Or pass `modeProblems`, an object keyed by mode ID containing the same problem shape.
URL parameters survive reloads; React navigation state is intended for the in-app library flow.

The selection screen supplies recommended problems by profile starting difficulty and a surprise
choice when no explicit choice is supplied. These automatic choices exclude other selected slugs.
Company and custom problem choices come from the selection frontend; no company tags are inferred.
