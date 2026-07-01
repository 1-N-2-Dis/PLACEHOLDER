# Cloud Function: Gemini summary proxy (F-004, P1 stretch)

Server-side proxy for the structured risk summary. It exists so the Gemini key stays off the client.

## Files
- `index.js` — reads a segment's report notes, calls Gemini with a constrained prompt, returns the summary.
- `package.json` — function deps + runtime (stub).

## Why this is a separate deploy unit
The Gemini key must never ship in the client bundle (Threat T2, docs/12-security-compliance.md). The
authenticated client calls this function; the function holds the key.

## Rules in play
- BR-006: the prompt dedupes and structures only the submitted reports — it adds no facts.
- Never log raw `note` contents (potential PII, Threat T6).

## Cut-safe
F-004 is P1. If dropped for time, this function ships nothing and UJ-003 degrades to the raw flag list.

## Open `[unverified]`
- Deploy region (asia-* near PH), Gemini quota/latency, exact prompt wording.
