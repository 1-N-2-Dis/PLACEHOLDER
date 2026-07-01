> ⚠️ PROVENANCE: Generated from idea.md while DRAFT / not freeze-eligible (no first-party or paid/committed evidence yet). Demand is UNVALIDATED. Provisional MVP scaffolding only — re-validate and regenerate after first-party interviews (post-July 2). No evidence fabricated.

# Data Model / Schema

> **Purpose:** the data. Entities, relationships, constraints, and privacy classification for the
> MVP. Models **Cloud Firestore** (NoSQL document store) per system-design §"Segment / report data
> shape" and §"Authentication & authorization."
> Traces back to: system design (`docs/06-system-design.md`), PRD (`docs/03-prd.md`), `idea.md`.
> Traces forward to: API spec, Firestore Security Rules.
> **Build context:** 2-day SparkFest hackathon MVP. Single zone (BR-003). F-004 (Gemini) is P1 stretch.

## Entities & relationships (ERD)

Two top-level Firestore collections. A `report` references a `segment` by `segmentId` (logical
foreign key — Firestore does not enforce referential integrity; the app/rules do).

> **Added (2026-07-01, later same day):** `frontend/src/data/seed-segments.js` also exports
> `WELL_USED_SEGMENTS` — 35 additional named streets around PUP, requested so they render green
> (default/no-report) on the map and are selectable for a risk summary before any report exists
> on them. Geocoded against live OpenStreetMap data, `[unverified]` placement per this doc's
> existing convention. These are a separate set from idea §7's 8 "confirm or kill" hypothesis
> pins below — informational baseline streets, not danger hypotheses. Note: in the actual
> implementation, `segments` are **not** a Firestore collection at all — despite this doc's
> framing below, they are a static frontend module (`SEED_SEGMENTS` + `WELL_USED_SEGMENTS`,
> concatenated in `App.jsx`), never read from or written to Firestore. That drift predates this
> change and is called out here rather than silently perpetuated.
>
> **Revised (2026-07-01, later same day):** the initial single-point-per-street placement had
> real errors — several streets (esp. the numbered "Road N" grid and "Pureza station approaches")
> were geocoded to the wrong physical location, some colliding with a same-named but unrelated
> street elsewhere in Manila. Re-sourced from actual OSM street geometry via the Overpass API
> (not single-point search): fetched each named street's way(s), discarded fragments belonging to
> an unrelated same-named street elsewhere by picking the cluster nearest a known-good reference
> point, stitched the remaining fragments into one polyline, and sampled points at even
> arc-length intervals. Ten streets now carry multiple points each (2-8, per how long/well-used
> the street is) instead of one: Pureza, Anonas, Teresa (well-used variant), Hipodromo, C.
> Arellano, Gregorio Araneta (new), M. Araullo, Jose Abad Santos, J.H. Panganiban, Valencia.
> **Known follow-up, not yet done:** the segment picker in `ReportForm.jsx` / `RouteCheck.jsx`
> lists each of these by plain street name, so e.g. "Anonas Street" appears 8 times identically —
> fine for map glancing, ambiguous for picking a specific point from a dropdown. Flagged, not
> fixed, since it wasn't asked for.
>
> **Revised again (2026-07-01, later same day):** `seg_pureza_south_exit` and
> `seg_magsaysay_jeeps` removed from `SEED_SEGMENTS` on request. Six more streets expanded to
> multiple points using the same Overpass/stitch/even-sample method: Pureza (2→6), V. Francisco
> (1→2), Albina (1→2), Altura Extension (1→3), Road 5 (1→4), Road 1 (1→2). `WELL_USED_SEGMENTS`
> is now 81 entries.
>
> **Revised a third time (2026-07-01, later same day):** the cautionary `seg_teresa_st` ("Teresa
> St (PUP side)") pin removed from `SEED_SEGMENTS` on request — `SEED_SEGMENTS` is now 5 pins.
> The "picker ambiguity" follow-up flagged two revisions up is now fixed: every multi-point
> street's `name` is suffixed with its point number (e.g. "Anonas Street 1".."Anonas Street 8");
> Road 1 and Road 5 (whose base name already ends in a number) use "Road 1 (1)" / "Road 5 (1)"
> instead of a bare trailing digit, to avoid reading as "Road 1 1". All 86 segment names are now
> unique.

```
segments (collection)
  └─ {segmentId} (document)        # one per seeded zone segment (idea §7: 8 provisional pins [unverified])
         ▲
         │  segmentId (logical FK, string-equal)
         │
reports (collection)
  └─ {reportId} (document)         # many reports per segment (1 segment : N reports)
         conditionType ∈ closed enum (BR-001)
         uid  → Firebase Auth user (BR-005)
         createdAt timestamp (BR-004)
         note? → free text, feeds F-004 ONLY (BR-006)
```

Relationship: **`segments` 1 — N `reports`**, joined on `reports.segmentId == segments.{segmentId}`.
No `users` collection in MVP — identity lives in Firebase Auth; `uid` is stored on the report only.

## Schema / field definitions

### segment (`segments/{segmentId}`)

Seeded reference data (idea §7 provisional pins — `[unverified]` demo content, not evidence). Read by
F-001 (render flags) and F-003 (route → segment matching).

| Field | Type | Null? | Default | Description |
|-------|------|-------|---------|-------------|
| `segmentId` | string (doc ID) | No | — | Stable segment key; also the document ID. Used as join key by `reports.segmentId`. |
| `name` | string | No | — | Human-readable segment label (e.g., "Teresa Street stretch"). For map/pin display. |
| `geo` | GeoPoint **or** array of GeoPoint | No | — | Point (pin) or polyline (path) geometry for Maps overlay (F-001) + route matching (F-003). Shape `[unverified]` — system design lists "point or polyline"; pick one at build time. |

> No crime/neighborhood-classification field exists on `segment` (BR-001).

### report (`reports/{reportId}`)

Written by `submitReport` (F-006, `backend/functions/index.js`) — **not** a direct client write;
see Firestore Security Rules below. Read by F-001/F-003/F-005/F-008 (current flags + routing) and
F-004 (notes → Gemini).

| Field | Type | Null? | Default | Description |
|-------|------|-------|---------|-------------|
| `reportId` | string (doc ID) | No | auto-ID | Firestore auto-generated document ID. |
| `segmentId` | string | No | — | **Required** (BR-004). Logical FK to `segments/{segmentId}`. |
| `conditionType` | string (**closed enum**) | No | — | **Required.** One of `{poor_lighting, no_crowd, recent_incident}` ONLY (BR-001). Validated in `submitReport`'s code (Rules no longer validate `create` shape — see below). |
| `severity` | string (**closed enum**) | No | — | **Required (F-006).** One of `{green, yellow, red}`, AI-assigned by `submitReport` — never user-selectable. Per-report triage signal, not a place/neighborhood classification (BR-007). |
| `corroborationCount` | number | No | `1` | **Required (F-006).** Incremented by `submitReport` each time the AI merges a new submission as a duplicate/corroboration of this report. |
| `createdAt` | timestamp | No | server time | **Required** (BR-004). Server timestamp; the report's true original submit time. |
| `lastActivityAt` | timestamp | No | server time | **Required (F-006).** Set at create and refreshed on every corroboration; drives "tonight"/freshness (`frontend/src/lib/freshness.js`) instead of `createdAt` alone. |
| `uid` | string | No | — | **Required** (BR-005). Firebase Auth UID of the authenticated reporter, taken from `request.auth.uid` inside `submitReport` (never client-supplied). |
| `note` | string | **Yes (optional)** | — | Optional free text. Feeds F-004's Gemini summary (BR-006) and `submitReport`'s classify prompt (BR-007). Not a condition/crime label; not rendered as a classification. |
| `photoPath` | string | **Yes (optional)** | — | **Optional (F-007).** Firebase Storage object path (`reports/{uid}/...`); resolved to a display URL at render time, not stored as a URL. EXIF-stripped client-side before upload (BR-008). |

> **No** `crimeType`, `neighborhoodRating`, `dangerLabel`, or any crime/neighborhood-classification field
> anywhere (BR-001). The enum is the only condition vocabulary. `severity` is a distinct,
> per-report triage field, not a variant of this prohibition (BR-007).

### Storage objects (`reports/{uid}/{timestamp}-{filename}`, F-007)

Not a Firestore collection — Firebase Storage objects, referenced by a report's optional
`photoPath`. Public read (consistent with reports being public safety info); write requires
`request.auth.uid == uid` in the path, `<5MB`, `image/(jpeg|png)` content-type — see
`backend/storage.rules`. No Firestore document mirrors these; `photoPath` is the only link.

### Example documents (JSON)

`segments/seg_teresa_st` (point geometry shown):
```json
{
  "segmentId": "seg_teresa_st",
  "name": "Teresa Street stretch",
  "geo": { "latitude": 14.5985, "longitude": 121.0102 }
}
```
> Coordinates are placeholder demo content — `[unverified]` (idea §7 pins not field-confirmed).

`reports/auto_9f3k...` (with optional note + photo, feeding F-004 and classified by F-006):
```json
{
  "segmentId": "seg_teresa_st",
  "conditionType": "poor_lighting",
  "severity": "yellow",
  "corroborationCount": 1,
  "createdAt": "2025-06-30T19:42:11Z",
  "lastActivityAt": "2025-06-30T19:42:11Z",
  "uid": "Xy7aB...firebaseAuthUid",
  "note": "Two streetlights out near the corner since last week.",
  "photoPath": "reports/Xy7aB.../1751312531000-photo.jpg"
}
```

`reports/auto_2pq8...` (minimal — no note/photo; both optional):
```json
{
  "segmentId": "seg_teresa_st",
  "conditionType": "no_crowd",
  "severity": "green",
  "corroborationCount": 1,
  "createdAt": "2025-06-30T20:05:00Z",
  "lastActivityAt": "2025-06-30T20:05:00Z",
  "uid": "Xy7aB...firebaseAuthUid"
}
```

## Constraints & indexes

**Document-level constraints (enforced in `submitReport`'s code — see Security Rules below for
why this moved out of Rules):**
- `conditionType` ∈ `{poor_lighting, no_crowd, recent_incident}` — closed enum, reject anything else (BR-001).
- `severity` ∈ `{green, yellow, red}` — closed enum, AI-assigned only, never client-supplied (BR-007).
- Write requires `request.auth != null`; `uid` is taken from `request.auth.uid`, never accepted from the caller.
- `reports` must contain `segmentId` (string) and `createdAt`/`lastActivityAt` (timestamp) (BR-004).
- No crime-label / neighborhood-classification key permitted on any document (BR-001).
- `note` is optional and free-text; feeds the F-006 classify prompt (BR-007) and F-004's summary (BR-006), never a classification.
- `photoPath`, if present, must be a Storage path under the caller's own `reports/{uid}/` prefix (checked against `request.auth.uid`, not the client-claimed `uid`).

**Indexes / query patterns** (per feature):

| Feature | Query | Index needed |
|---------|-------|--------------|
| **F-001** render flags | `segments`: read all (single zone, small set, BR-003). `reports`: read current flags per segment. | Single-field auto-index on `reports.segmentId`. No composite needed for the all-segments read. |
| **F-006** write report (via `submitReport`) | Recent reports for dedup context: `where('segmentId','==',X).orderBy('createdAt','desc').limit(10)`, then `reports.add({...})` or `.update({corroborationCount, lastActivityAt})`. | Reuses `(segmentId, createdAt DESC)` composite. |
| **F-003/F-008** per-segment freshness / "tonight" | Newest report per segment: `where('segmentId','==',X).orderBy('createdAt','desc').limit(1)`, freshness now compares `lastActivityAt \|\| createdAt`. | **Composite index** `(segmentId ASC, createdAt DESC)` — required by Firestore for equality + orderBy on different fields. |
| **F-004** notes → Gemini | Reports for a segment with notes: `where('segmentId','==',X)` (filter `note` present client/function-side) or `where('segmentId','==',X).orderBy('createdAt','desc')`. | Reuses `(segmentId, createdAt DESC)` composite; or single-field `segmentId` if unordered. |

> Firestore auto-creates single-field indexes; the `(segmentId ASC, createdAt DESC)` **composite must be
> declared** in `firestore.indexes.json`. This is the one index F-003 and F-004 depend on.

## Firestore Security Rules — data-validation view

> What the rules must enforce at the document level. Cross-references system-design §"Authentication &
> authorization" (item 1: Firestore). Reads open (public safety info, no PII beyond `uid`); writes gated.

**Changed (F-006):** `reports` writes no longer happen from the client at all. Firestore Rules
cannot verify "this write went through AI review" — they can only inspect the write itself — so
Rules now simply deny client `create`/`update`/`delete` on `reports` outright, and all the
validation that used to live in Rules (closed enum, required fields, closed field allowlist, UID
ownership) has moved into `submitReport`'s code (`backend/functions/index.js`), which writes via
the Admin SDK — a path that bypasses Rules by design. The `false` lines below document intent;
they are not what stops a malicious write (the Function's own logic, and the fact that only the
Function holds the credential for an Admin SDK write, are what actually enforce this).

```
match /reports/{id} {
  allow read: if true;
  allow create, update, delete: if false;   // server-only, via submitReport's Admin SDK write
}
match /segments/{id} {
  allow read: if true;
  allow write: if false;            // seeded out-of-band
}
```
> Auth **method** (anonymous vs. Google sign-in) is `[unverified]` per system design; either yields a
> `request.auth.uid` that `submitReport` relies on.

**Do not deploy this rule change until `submitReport` is fully verified against the emulator** —
see `docs/superpowers/specs/2026-07-01-severity-tiered-ai-routing-design.md` §Testing approach.
Until then, keep the previous direct-write rules (closed enum + field allowlist + UID ownership,
as before) so F-002 has a working fallback.

## Freshness / "tonight" window — `[unverified]`

The freshness window length (how long a report counts as "tonight" before it goes stale) is **undecided** —
not specified in idea or PRD (carried open question; system design §"Segment / report data shape" and PRD
§"Open questions"). **Decision required at build (Day-2 step 6).**

How the data model supports computing it once the value is chosen:
- Every `report` carries `createdAt` (timestamp, BR-004) and, as of F-006, `lastActivityAt`
  (set at create, refreshed on every AI-detected duplicate corroboration), so freshness is purely
  a query/compute concern, not a schema change.
- F-003/F-008 compute a segment's "tonight" status as: **newest report per segment within the
  window**, comparing `lastActivityAt || createdAt` (falls back to `createdAt` for reports
  predating F-006) to `now - WINDOW`. Inside window → "flagged tonight"; older/none → "okay."
  Corroborating an old report refreshes its freshness rather than requiring a brand-new report.
- Changing the window value is a **client/function constant only** — no migration. The
  `(segmentId, createdAt DESC)` composite index already supports the query for any window value.

## Retention & privacy classification

| Field | Classification | Retention / deletion | Notes |
|-------|----------------|----------------------|-------|
| `segment.*` | Public | Seed data; persists for demo | No PII; demo content `[unverified]`. |
| `report.conditionType` | Public | MVP: no deletion policy `[unverified]` | Observable condition only (BR-001). |
| `report.createdAt` / `segmentId` | Public | MVP: none defined `[unverified]` | Operational metadata. |
| `report.uid` | Internal (pseudonymous identifier) | MVP: none defined `[unverified]` | Firebase Auth UID; links report to an account for abuse control (BR-005). Not displayed in UI. |
| `report.note` | User-generated free text (potential incidental PII) | MVP: none defined `[unverified]` | Free text may contain incidental personal detail; feeds F-004 and the F-006 classify prompt (BR-006/BR-007). Retention/redaction policy **`[unverified]`** — must be set post-July 2. |
| `report.severity` / `corroborationCount` / `lastActivityAt` | Public | MVP: none defined `[unverified]` | AI-assigned triage signal + operational metadata (BR-007); not a place/crime classification. |
| `report.photoPath` | User-generated image (potential PII — bystander faces; EXIF stripped) | MVP: none defined `[unverified]` | See Threat T7, `docs/12-security-compliance.md`. EXIF GPS/camera metadata stripped client-side (BR-008); bystander-face privacy in the photo content itself is **not** mitigated — known gap. |

> No general retention/deletion policy is defined for the hackathon (`[unverified]`); flagged for post-July-2.

## Migration notes

N/A — **because** this is a greenfield 2-day hackathon MVP with a single environment (system design
§"Deployment topology"); there is no prior schema to migrate from and no backfill. The one declared
artifact to ship is the `(segmentId ASC, createdAt DESC)` composite index in `firestore.indexes.json`.
The freshness-window value is a code constant, not a schema migration. Post-MVP schema evolution is
deferred and `[unverified]`.
