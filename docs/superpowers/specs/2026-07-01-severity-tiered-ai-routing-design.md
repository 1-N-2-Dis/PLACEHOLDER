# Severity-tiered routing, AI report moderation, photo evidence — design

> ⚠️ **Superseded (2026-07-06) by [ADR-0003](../../adr/ADR-0003-client-side-wasm-routing.md):**
> the routing half of this doc (the OpenRouteService 1-3-route cascade, avoid-polygon mechanism,
> highway-waytype refinement) has been replaced by a client-side Rust/WASM A* engine over a
> preprocessed pedestrian graph — see [System Design](../../06-system-design.md). This doc is kept
> as-is for historical reference (it is not rewritten); the AI report moderation / photo evidence
> half (F-006/F-007) is unaffected and still current.

Status: implemented (frontend + Cloud Function), pending live-Gemini verification and the
`firestore.rules` deny-client-create flip (see Testing approach).

## Problem

The MVP's routing (`frontend/src/lib/routing.js`) treated every flagged segment identically —
hard-avoid, one recommended route, no distinction between "worth noting" and "dangerous." Reports
(`ReportForm.jsx`) had no severity, no moderation, and no photo evidence, and the pre-trip check
(`RouteCheck.jsx`) was a manual checklist disconnected from the actual recommended route.

This work adds an AI-assigned severity (green/yellow/red) to every report, ties that severity to
routing avoidance strength, offers 2-3 ranked route alternatives instead of one, adds photo
evidence, and surfaces an auto-evaluated "is my route okay tonight?" panel right after routes are
recommended.

## Scope

In scope: `frontend/src/lib/routing.js`, `frontend/src/features/map/*` (RouteLayer, ZoneMap,
SegmentFlag, new RouteSafetyPanel), `frontend/src/features/report/ReportForm.jsx`,
`frontend/src/lib/{reports,reportIntake,photo,storage,firebase,freshness}.js`,
`backend/functions/index.js` (new `submitReport`), `backend/firestore.rules`, new
`backend/storage.rules`, `firebase.json`.

Out of scope: `RouteCheck.jsx` (kept as-is, additive coexistence — see Code structure);
`summarizeSegment`/F-004 (unchanged, reused as the pattern to extend, not modified).

## Algorithm

### Severity-tiered multi-route cascade (`routing.js`)

Reports carry `severity: 'green'|'yellow'|'red'` (AI-assigned, see below). Green never enters
avoidance (informational only). Yellow gets a 60m soft-avoid radius (`YELLOW_AVOID_RADIUS_M`,
was `FLAG_AVOID_RADIUS_M`). Red gets a 90m hard-avoid radius (`RED_AVOID_RADIUS_M`, new — larger
than yellow's, since it's a genuine "must avoid").

`fetchSafeRoutes(a, b, flaggedReports)` (replaces `fetchSafeRoute`) tries, in order, reusing the
existing `circleRing`/`segmentBufferRing`/`toMultiPolygon`/`highwaySpanRings`/`hasHighwayLeg`
helpers unchanged:

1. **Safest** — avoid red+yellow rings; if a highway leg is found, *try* refining away from it too
   (same two-step shape as the original single-route cascade), but only **adopt** the refinement
   if it doesn't cost disproportionate extra distance (`HIGHWAY_DETOUR_TOLERANCE = 1.3`, i.e. up
   to ~30% longer). A highway leg alone carries no reported danger — unlike a red/yellow severity
   zone, it's a weak enough signal that it shouldn't force a much longer detour. If the detour
   exceeds tolerance (or still hits another highway), the direct/closer route is kept instead,
   tagged `caution-highway` so it's still surfaced with a note, not silently discarded. **Fixed
   2026-07-01 (later same day)** — the original version of this tier always preferred the
   highway-avoiding refinement unconditionally, which discarded the closest route whenever it
   used any highway-class leg, even with zero actual danger reports nearby. Throws only if the
   initial fetch itself is infeasible (both ring sets empty — genuine failure); otherwise falls
   through to the next tier.
2. **Red-only** — avoid red rings only (yellow may be crossed). Skipped entirely when there's no
   red to differentially avoid (keeps the common case cheap).
3. **Unrestricted** — no avoidance. Skipped when there's nothing to differentiate from the safest
   tier (both ring sets empty).

Each tier's coordinates are deduped against prior tiers (exact match on 5-decimal-rounded
coordinates — ORS returns byte-identical geometry for identical constraints, so this is exact,
not fuzzy). Result: 1-3 ranked route candidates, safest first. `RouteLayer.jsx` renders each as
its own green line, opacity stepped by rank (`0.9 / 0.45 / 0.25`) — all green, per product
decision, not a caution color; a route only appears if it's a real ranked candidate.

Call budget: up to 4 ORS calls (was 2), traded for 2-3 ranked alternatives.

**Open risk (not resolved here):** ORS's `alternative_routes` option combined with
`avoid_polygons` has unverified compatibility. The tier-reuse cascade above is the primary
approach specifically because it reuses already-proven request shapes instead of that param.

### AI classify/dedupe/reject (`backend/functions/index.js` — `submitReport`)

New `onCall`, extending the existing `summarizeSegment` pattern (same `db`, secret, region,
"never log raw note contents" practice). Blocking call — the client shows a spinner until it
resolves (confirmed UX decision, not optimistic).

1. Structural validation (closed `conditionType` enum, `segmentId`, `note` length,
   `photoPath` ownership prefix) — this is now the sole enforcement point for what
   `firestore.rules` used to validate on a direct client write (see Architecture below).
2. Fetch up to 10 recent reports on the same segment, filtered to a 6h `DUPLICATE_WINDOW_MS`
   (tighter than the 24h "tonight" freshness window — a duplicate is a near-concurrent
   corroboration, not just a fresh report).
3. Gemini (`gemini-1.5-flash`, structured JSON output via `responseSchema`) classifies
   `{ severity, duplicateOfIndex, isSpam }` from only the new submission's condition+note and the
   fetched reports' condition+note+time — explicitly instructed never to output or infer a
   crime-category/neighborhood/place classification (the BR-001-extending compliance mechanism
   for this new field — see BR-007).
4. **Fail-closed**: any Gemini error or malformed response rejects the report outright — unlike
   `summarizeSegment`'s cut-safe-to-fallback pattern, a missing moderation decision must never
   become an unmoderated write.
5. Act: `isSpam` → reject, nothing written. Duplicate → `corroborationCount` incremented +
   `lastActivityAt` refreshed on the existing report (merge as corroboration, confirmed decision
   — never silently discarded). Otherwise → new report doc with `severity`, `corroborationCount: 1`.

### Architecture: report creation moves server-side

Firestore Rules can't verify "this write went through AI review" — they can only inspect the
write itself. `backend/firestore.rules` now denies all client `create`/`update`/`delete` on
`reports`; every report is written by `submitReport` via the Admin SDK, which bypasses Rules by
design. `uid` comes from `request.auth.uid` inside the callable, never client-supplied. This
means the Cloud Function's code — not Rules — is now the enforcement point for BR-001's closed
enum / field shape on create.

## Code structure

- `frontend/src/lib/routing.js` — cascade + `nearestDistanceToRoute` (reused by
  `RouteSafetyPanel.jsx`, same flat-earth trig as `circleRing`).
- `frontend/src/lib/reportIntake.js` (new) — `submitReportForReview`: EXIF-strips + uploads a
  photo if given, then calls the `submitReport` callable. Replaces `reports.js`'s removed
  `addReport`.
- `frontend/src/lib/photo.js` (new) — canvas re-encode strips EXIF, no library needed.
- `frontend/src/lib/storage.js` (new) — `uploadReportPhoto`/`resolvePhotoUrl`.
- `frontend/src/features/map/RouteSafetyPanel.jsx` (new) — mounted inside `ZoneMap.jsx`
  (not lifted to `HomePage.jsx`), reusing the same `flaggedReports`-shaped data already computed
  there for avoidance — zero new Firestore reads. `RouteCheck.jsx` is untouched and remains the
  fallback for users without a specific destination — additive, not a replacement.
- `frontend/src/features/map/SegmentFlag.jsx` — marker redesigned from binary
  `seg-dot--flagged`/`seg-dot--okay` to three-tier `seg-dot--green`/`--yellow`/`--red` (driven by
  `report.severity`, defaulting missing severity to `red` for reports predating this change);
  adds a camera-icon corner badge (lucide `Camera`) when a `photoPath` exists, and resolves+shows
  the photo in the popup.

## Error handling

- ORS failures: unchanged from the original cascade — a tier that throws either falls through to
  a looser tier or (if nothing else was possible) surfaces via `onError`.
- `submitReport` failures: fail-closed (see above) — `HttpsError('internal', ...)`, never an
  unmoderated write.
- Photo upload failures surface as a thrown error from `submitReportForReview`, caught by
  `ReportForm.jsx`'s existing try/catch → `{ status: 'error', msg }`.

## Docs updated

`docs/03-prd.md` (F-005..F-008, BR-007/BR-008, amended BR-005/F-002 language),
`docs/09-data-model.md` (new fields, Storage objects section, Rules sketch), `docs/06-system-design.md`
(Gemini/CF critical-path, Storage surface, extended routing section, new ADRs),
`docs/12-security-compliance.md` (Threat T7, data classification, checklist), `docs/11-qa-test-plan.md`
(new TCs, traceability rows).

## Testing approach

No unit-test harness in this project (matches the original highway-aware routing design doc's
convention) — manual e2e against the local emulators + live ORS/Gemini/Storage:

- **Structural verification already done (this pass):** `npm run build` passes with all
  changes; `backend/functions/index.js` syntax-checked (`node --check`) and dynamically
  imports cleanly with both exports (`submitReport`, `summarizeSegment`) present;
  `@google/generative-ai`'s `SchemaType` export confirmed against the installed package version.
- **Not verified in this pass (needs the developer's own GEMINI_API_KEY + live network):** an
  actual `submitReport` round-trip against live Gemini for all three outcomes (create/duplicate/
  reject), and the blocking-spinner latency. **Do not deploy the new `firestore.rules`
  (denying client create) until this is done** — until then, a stale build pointing at the new
  rules with a broken `submitReport` would leave F-002 entirely non-functional with no fallback.
  See `docs/11-qa-test-plan.md` for the exact manual test cases.
- Live ORS multi-route behavior (2-3 genuinely distinct alternatives, the red-unavoidable edge
  case) and live Storage upload/EXIF-strip verification are likewise deferred to the developer's
  own environment per the QA plan.
