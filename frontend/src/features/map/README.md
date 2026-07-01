# Feature: Zone safety map (F-001, P0)

Renders the PUP Sta. Mesa zone and overlays crowdsourced segment flags. The base layer the other
features sit on top of.

## Files
- `ZoneMap.jsx` — map render + live flag overlays.
- `SegmentFlag.jsx` — one flag marker; tap shows condition type + timestamp.

## Solves
"Danger knowledge is scattered and invisible" (idea §1, §4).

## Acceptance (docs/11-qa-test-plan.md)
- TC-001: map renders the zone via Google Maps and shows the seeded flags.
- TC-002: tapping a flag shows its condition type and timestamp (BR-004).

## Rules in play
- BR-001: condition flags only, no crime/neighborhood labels.
- BR-003: single zone only.

## Open `[unverified]`
- Segment geometry shape: point vs polyline (docs/09-data-model.md).
- The 8 seed pins are demo content, not evidence (idea §7).
