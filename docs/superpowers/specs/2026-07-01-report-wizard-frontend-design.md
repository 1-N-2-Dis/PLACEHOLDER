# Report wizard (step-by-step F-002/F-006/F-007 frontend) — design

Status: approved, implementing now.

> **Superseded (2026-07-01, later same day):** the 4-step wizard described below was collapsed
> back into a single-page form, and the photo requirement was dropped (photo is optional again).
> `ReportForm.jsx` now renders location, details (condition + note), and an optional photo all at
> once, with one Submit button and no step navigation or `ReviewStep.jsx` (removed). The
> pin-to-segment snapping (`segmentSnap.js`/`PinMap.jsx`) and the AI location-context change are
> unaffected — only the step structure and the photo requirement changed. See
> `docs/prd.md` F-002 and BR-008 for the current, canonical statement of this behavior.

## Problem

`ReportForm.jsx` is a single-page form: pick segment, pick condition, optional note, optional
photo, submit. The user wants a guided, step-by-step flow instead, with photo and note now
required, a map-pin alternative to the segment dropdown (constrained to known street segments,
not buildings), and the AI moderation step (`submitReport`) given enough location context to
weigh into its real/fake judgment, not just the note text.

## Scope

In scope (frontend): `frontend/src/features/report/ReportForm.jsx` (becomes the wizard
container), new step components under `frontend/src/features/report/steps/`, a new
`frontend/src/features/report/PinMap.jsx`, a new `frontend/src/lib/segmentSnap.js`,
`frontend/src/lib/reportIntake.js` (pass `segmentName` through).

In scope (backend, minimal): `backend/functions/index.js` `submitReport` — accept optional
`segmentName`, weave it into `buildClassifyPrompt` as location context for the existing `isSpam`
judgment. No new fields, no new Firestore reads, no schema change.

Out of scope: `RouteCheck.jsx`, `RouteSafetyPanel.jsx`, `ZoneMap.jsx` (untouched — the wizard uses
its own small map, not the live one), `summarizeSegment`/F-004, `firestore.rules`/`storage.rules`,
severity vocabulary (`severity-types.js` unchanged — "easy/medium/hard" is the existing
green/yellow/red, just described informally).

## Design

### Step flow (`ReportForm.jsx` as wizard container)

Local state: `step` (`'photo' | 'location' | 'details' | 'review'`), plus the form fields
(`photoFile`, `segmentId`, `conditionType`, `note`) and submit state (`busy`, `result`) — the
result/outcome rendering (`created`/`duplicate`/`rejected`/`error`) is unchanged from today, just
relocated to the review step.

1. **Photo** — file input (`accept="image/jpeg,image/png"`, `capture="environment"` hint for
   mobile), thumbnail preview via `URL.createObjectURL`. Required to advance.
2. **Location** — toggle between "Choose from list" (today's `<select>`, unchanged) and "Pin on
   map" (`PinMap.jsx`). Both resolve to the same `segmentId` state. Required to advance.
3. **Details** — condition-type buttons (unchanged closed enum, BR-001) + note textarea, now
   required (not optional). Both required to advance.
4. **Review & submit** — read-only summary of steps 1-3 (thumbnail, segment name, condition,
   note), Submit button calls the existing `submitReportForReview` (unchanged signature plus one
   new field, see below), blocking spinner, then one of the four outcome states.

Back/Next only move between adjacent steps; no step is skippable. No URL/route per step (single
`/report` route, per approved Approach A) — mid-wizard state is lost on refresh, which is
acceptable for a linear one-shot submission.

### Pin-to-segment snapping (`segmentSnap.js`)

Segments are point geometry (`{ lat, lng }`), not polylines (confirmed in `seed-segments.js`) —
there is no independent "road line" dataset to test against. "Only pin on roads, not
places/houses" is therefore implemented as: **snap a map tap to the nearest known segment point,
reject if the nearest one is farther than `MAX_SNAP_METERS = 40`.** This reuses the exact same
segment list the dropdown already offers — a pin never produces a new, unlisted location; it's
an alternate way to pick an existing `segmentId`. No data-model change results from this (a report
still only ever carries a `segmentId`).

`segmentSnap.js` exports:
- `haversineMeters(a, b)` — standard great-circle distance.
- `findNearestSegment(segments, tapPoint)` — returns `{ segment, distanceMeters }` for the closest
  segment, or `null` if `segments` is empty.
- `MAX_SNAP_METERS = 40`.

`PinMap.jsx`: a minimal MapLibre map (reuses `ZONE_CENTER`/`ZONE_ZOOM`/`MAP_STYLE` from
`lib/maps.js`, no routing/destination logic, no live report subscription — just segment dots for
visual reference and a click handler). On click, runs `findNearestSegment`; within range → sets a
pin marker and calls `onSnap(segment)`; out of range → shows an inline hint ("Tap closer to a
mapped street") and does not select anything.

### AI location context (`submitReport`, `buildClassifyPrompt`)

`reportIntake.js`'s `submitReportForReview` gains one new optional param, `segmentName` (the
already-known display name from the frontend's segment list — no backend Firestore lookup
needed), passed through in the callable payload alongside the existing fields.

`buildClassifyPrompt` gains the segment name as context and one added instruction: judge `isSpam`
using both the note text *and* whether the reported condition is a plausible claim for a named
street segment (e.g. wildly inconsistent or nonsensical location/condition pairing), not just
note-text plausibility as today. No new response field — this extends the existing `isSpam`
boolean's reasoning, per the "same field, richer context" decision, not a new authenticity score.

## Code structure

- `frontend/src/features/report/ReportForm.jsx` — wizard container (step state, field state,
  submit call, outcome rendering). Keeps its existing external props (`segments`, `selectedId`,
  `onSelect`) so `ReportPage.jsx` needs no changes.
- `frontend/src/features/report/steps/PhotoStep.jsx`
- `frontend/src/features/report/steps/LocationStep.jsx` (renders the list-vs-pin toggle + `PinMap`)
- `frontend/src/features/report/steps/DetailsStep.jsx`
- `frontend/src/features/report/steps/ReviewStep.jsx`
- `frontend/src/features/report/PinMap.jsx` — new standalone mini-map.
- `frontend/src/lib/segmentSnap.js` — new, pure geometry helper (independently testable).
- `frontend/src/lib/reportIntake.js` — add `segmentName` passthrough.
- `backend/functions/index.js` — `buildClassifyPrompt` signature gains `segmentName`; `submitReport`
  reads `data.segmentName` (optional string, best-effort — falls back to no location context if
  absent, never a hard failure).

## Error handling

- Photo/location/details steps: Next is disabled (not a validation error message) until the
  step's required field(s) are filled — matches the existing disabled-button pattern in the
  current form.
- Pin out of snap range: inline hint, no error state, user just taps again.
- Submit failure/rejection: unchanged from today (`created`/`duplicate`/`rejected`/`error` cards),
  now rendered on the review step instead of inline in a single-page form.
- `segmentName` absent or blank on the backend: prompt omits the location-context line entirely;
  classify still runs on note/condition alone (today's behavior) — never blocks submission.

## Docs updated

- `docs/prd.md` — F-002 note amended to describe the 4-step wizard; BR-008 amended to say
  photo is now required *in this flow* (F-007's own acceptance criterion is unaffected — it still
  only requires EXIF-stripping when a photo exists).
- `agents/context/claude_context.md` — session conclusion entry appended after implementation.

## Testing approach

- `segmentSnap.js`: manual/console check against a couple of known seed coordinates (near-hit and
  clear-miss) — no test runner is set up in this repo yet, consistent with the rest of the MVP.
- Build check: `npm run build` in `frontend/` must still succeed.
- Backend: `node --check backend/functions/index.js` (matches the existing verification pattern
  for this file).
- Manual walk: photo → list-pick a segment → details → review → submit (created path); repeat
  choosing "pin on map" instead of the list for the location step.
