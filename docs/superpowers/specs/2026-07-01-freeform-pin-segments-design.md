# Freeform pinned reports become real segments — design

Status: approved, implementing now.

## Problem

The report wizard's "pin on map" location step only lets a user attach a report to one of the
~86 pre-seeded street points (`SEED_SEGMENTS`/`WELL_USED_SEGMENTS`), snapping within 40m and
rejecting anything farther. The user wants to pin a genuinely new location — not just one of the
existing points — and have it appear on the map, colored by AI-assigned danger severity, once the
AI has validated the report as real.

## Scope

In scope: `frontend/src/features/report/PinMap.jsx`, `frontend/src/features/report/steps/
LocationStep.jsx`, new `frontend/src/lib/overpass.js`, new `frontend/src/lib/segments.js`,
`frontend/src/App.jsx` (merge live segments), `backend/functions/index.js` (`submitReport` gains
a `newSegment` path), `docs/data-model.md`.

Not in scope, already done: `backend/firestore.rules` already has a `match /segments/{id} {
allow read: if true; allow write: if false; }` block (comment: "seeded out-of-band by the admin
script") — no rules change needed. `submitReport` writes via the Admin SDK, same as `reports`,
which bypasses these rules by design.

Out of scope (per the approved design): editing/deleting a user-created segment; an admin
moderation UI for segment names; retroactively merging two dynamic segments that turn out to be
the same real-world spot; `ZoneMap.jsx`, `RouteLayer.jsx`, `RouteCheck.jsx`, `routing.js` — all
four already consume "the segments array" generically (confirmed by reading `onRouteSegments`'s
`nearestDistanceToRoute` filter in `ZoneMap.jsx` and `flaggedReports`'s map over the `segments`
prop), so none of them need to change for a dynamically-created segment to render, route around,
or get assessed exactly like a static one.

## Design

### Frontend pin flow (`PinMap.jsx`, `LocationStep.jsx`)

1. Tap the map → existing `segmentSnap.js` check (haversine, 40m) against the merged
   static-plus-dynamic segment list (see "Live segments" below). Close enough → snap as today,
   `segmentId` set, done.
2. Nothing known within range → query the Overpass API for the nearest `highway=*` way within
   30m of the tap: `way(around:30,{lat},{lng})[highway];out geom;` against
   `https://overpass-api.de/api/interpreter` (same data source the original seed streets were
   built from, per `docs/data-model.md`'s ERD note). New helper `frontend/src/lib/overpass.js`
   exports `findNearestRoad(point)` → `{ name } | null` (`name` from the way's `name` tag, or
   `null` if the way is unnamed — see naming fallback below).
   - Road found → valid new-pin candidate: `{ geo: {lat,lng}, name: <way name or 'Reported
     location'>, segmentId: null }`. Wizard continues normally (details → review → submit).
   - No road found, or the Overpass call fails/times out (10s timeout) → **fail-closed**: inline
     hint "Couldn't verify this location — tap closer to a mapped street, or try again," pin not
     placed. (Confirmed: fail-closed over fail-open, consistent with `submitReport`'s existing
     fail-closed AI-review philosophy.)
   - While the call is in flight, the step shows a brief "Checking…" state.
3. `PinMap`'s MapLibre `<Map>` gets a `maxBounds` prop bounding the PUP Sta. Mesa zone, so a tap
   physically cannot land outside it — independent, client-side belt to the backend's
   bounding-box check (defense in depth, not a replacement for it).

### Live segments (`frontend/src/lib/segments.js`, `App.jsx`)

New `subscribeSegments(onChange)`, mirroring `reports.js`'s `subscribeReports` — a live
`onSnapshot` on the new `segments` collection. `App.jsx` adds this subscription alongside the
existing reports one and merges its results into the same array already built from
`SEED_SEGMENTS`/`WELL_USED_SEGMENTS`, before passing it down as the single `segments` prop
everything else already consumes. `PinMap.jsx` also receives this merged list (not just the
static one), both so a user sees others' already-created pins while placing their own, and so its
own 40m snap check considers dynamic segments too.

### Backend (`submitReport`, `backend/functions/index.js`)

`submitReport`'s payload gains `newSegment: { geo: {lat, lng}, name }`, mutually exclusive with
`segmentId` (exactly one of the two required). When `newSegment` is given:

1. **Zone bounding-box check** (new constant mirroring frontend `ZONE_CENTER`) — reject outside
   it, independent of the client's Overpass check (defense in depth against a client that skips
   it or is compromised).
2. **Proximity check against existing dynamic `segments` docs** — same haversine helper as
   `segmentSnap.js`, duplicated into `backend/functions/index.js` (same "separate Node package"
   reasoning already used for `CONDITION_TYPES`/`FRESHNESS_WINDOW_MS`/`MAX_ROUTE_SEGMENTS`). Within
   40m of an existing dynamic segment → treat as that `segmentId` instead (merges into it,
   avoiding a near-duplicate pin a few meters off). No re-check against the *static* list — the
   client's own snap step already covers that, and duplicating all 86 static points into the
   backend for a redundant check isn't worth the maintenance burden; worst case of skipping it is
   a rare, harmless extra dynamic segment near a static one.
3. Otherwise, proceed to the existing Gemini classify step exactly as today (`segmentName` context
   from `newSegment.name`, same `isSpam`/`severity`/duplicate-of-existing-*report* decision — no
   change to that logic; a brand-new segment has no existing reports, so `duplicateOfIndex` is
   always 0 for it).
4. **Create-on-accept only**: if the decision is spam → rejected, nothing written, exactly as
   today (no segment created either). If it's a duplicate of an existing report on an
   already-known segment (only possible via the proximity-merge in step 2) → merges as today
   (`corroborationCount`), no new segment created. Only on a clean accept does `submitReport`
   create the new `segments/{autoId}` doc (`name`, `geo`, `createdBy: uid`, `createdAt`) and the
   `report` doc **together in one Firestore batch write** — this is the visibility gate: nothing
   new ever appears on the map until the AI has validated it.

### Data model / rules

New `segments/{segmentId}` fields for dynamically-created docs: `name` (string, from Overpass or
the `'Reported location'` fallback), `geo` (`{lat, lng}`), `createdBy` (uid, string),
`createdAt` (server timestamp). Rules mirror `reports`': `allow read: if true; allow write: if
false;` — public read, write only via the Admin SDK inside `submitReport` (already the documented
intended shape in `docs/data-model.md`, just previously unused since segments were 100%
static). `docs/data-model.md` updated to describe the two segment origins (static seed module
vs. dynamic Firestore docs) side by side rather than as drift to reconcile "post-July-2."

## Code structure

- `frontend/src/lib/overpass.js` — new, `findNearestRoad(point)`.
- `frontend/src/lib/segments.js` — new, `subscribeSegments(onChange)`.
- `frontend/src/features/report/PinMap.jsx` — snap-or-Overpass-or-hint flow, `maxBounds`.
- `frontend/src/features/report/steps/LocationStep.jsx` — passes the merged segment list through;
  minor copy changes for the new-pin path.
- `frontend/src/App.jsx` — adds `subscribeSegments`, merges into the `segments` array.
- `backend/functions/index.js` — `submitReport` gains the `newSegment` branch (bounding-box check,
  dynamic-proximity merge, create-on-accept batch write); new haversine helper + zone-bounds
  constant duplicated from frontend, per existing project convention for this file.
- `docs/data-model.md` — segment entity section updated for the two origins.

## Error handling

- Overpass failure/timeout/no-road-found: fail-closed hint, no pin placed (confirmed).
- Backend `newSegment.geo` outside the zone bounding box, or malformed: `HttpsError
  ('invalid-argument', ...)`, same pattern as every other `submitReport` validation failure.
- AI rejects (`isSpam`): unchanged — `{ status: 'rejected', reason }`, nothing written, no segment
  created.
- Firestore batch write failure (segment + report together): the whole batch fails atomically —
  no orphaned segment-without-a-report can result.

## Testing approach

- Manual walk: pin far from any known street (Overpass finds a road) → details → review → submit
  → accepted path creates both a new segment and a report, both visible on the map with severity
  coloring. Repeat pinning on a spot with no nearby road (e.g. inside a building courtyard) →
  expect the fail-closed hint.
- Manual walk: pin within 40m of an already-created dynamic segment → expect it merges
  (`corroborationCount` increments) rather than creating a second nearby segment.
- Build check: `npm run build` in `frontend/`; `node --check backend/functions/index.js`.
- No test framework in this repo yet (consistent with the rest of the MVP) — same manual-walk
  approach as the prior two specs in this directory.
