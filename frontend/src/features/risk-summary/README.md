# Feature: Structured risk summary (F-004, P1 stretch)

Turns overlapping free-text report notes into one deduplicated, structured summary so a commuter can
trust the signal at a glance. The innovation hook — and cut-safe.

## Files
- `RiskSummary.jsx` — requests the summary and renders it.

## Solves
"Crowd noise isn't trustworthy signal" (idea §5 alternatives gap).

## Acceptance (docs/11-qa-test-plan.md)
- TC-006: overlapping reports merge into one summary; every claim traces to an input note — no
  invented facts (BR-006). If cut, verify the raw-flag-list fallback instead.

## Rules in play
- BR-006: summary derived only from submitted reports; adds nothing.

## Architecture
- Gemini runs server-side in `functions/` (key safety, Threat T2). Client never holds the Gemini key.
- Degrades gracefully: if F-004 is cut for time, UJ-003 falls back to the raw flag list.

## Open `[unverified]`
- Gemini region/quota; constrained-prompt wording lives with the Cloud Function.
