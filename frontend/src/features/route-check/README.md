# Feature: Pre-trip route check (F-003, P0)

Before a commuter leaves, she checks her route and sees which segments are flagged tonight, so she
can re-route or pay for a ride before she is exposed.

## Files
- `RouteCheck.jsx` — route → per-segment status (okay vs flagged tonight).

## Solves
"No way to know before setting out" (idea §1).

## Acceptance (docs/11-qa-test-plan.md)
- TC-005: each segment shows a status; flagged-tonight is visually distinct from okay.
- TC-009 / TC-010: stale flags fall outside the window; freshness boundary respected.

## Rules in play
- BR-004: status derives from the newest report's type + timestamp.
- BR-002: no rescue/dispatch — informational only.

## Depends on
- `src/lib/freshness.js` ("tonight" window) and the `(segmentId ASC, createdAt DESC)` composite index.

## Open `[unverified]`
- Freshness-window length — decide at Day-2 build step 6 and document it.
- Route is computed client-side and never persisted (privacy minimization).
