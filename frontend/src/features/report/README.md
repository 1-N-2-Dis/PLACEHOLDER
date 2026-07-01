# Feature: One-tap segment report (F-002, P0)

An authenticated user flags a segment with one observable condition in a single tap. This is how
lived danger gets written down for others.

## Files
- `ReportForm.jsx` — segment select + closed-enum condition tap → Firestore write.

## Solves
"Lived danger is never written down" (idea §4).

## Acceptance (docs/11-qa-test-plan.md)
- TC-003: authed one-tap report persists and appears on the map live.
- TC-004: the form has no free-form crime-label field — closed enum only.

## Rules in play
- BR-001: condition enum only, no crime labels (enforced in UI and Firestore rules).
- BR-005: write requires an authenticated user.
- BR-006: optional `note` feeds the F-004 summary only.

## Data written (docs/09-data-model.md)
`reports/{auto}` = `{ segmentId, conditionType, createdAt, uid, note? }`.

## Open `[unverified]`
- Auth method: anonymous vs Google sign-in (abuse control trade-off, Threat T3).
- No rate-limiting in MVP (Threat T3) — known gap.
