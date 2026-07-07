# Safe-zone cloud layer + confirmation-based sizing — design

Status: approved, implementing now.

## Problem

Two related asks:

1. The dangerous (red) and caution (yellow) map toggle buttons already render soft, MapLibre
   native-`heatmap` "cloud" layers (`ReportHeatmap.jsx`) — but cloud size is driven by a naive
   local count (one `+1` per report doc landing on a segment, `lib/heatmap.js`'s
   `buildIncidentMarkers`), not by how many other people actually corroborated the report. The
   backend already tracks real corroboration: `submitReport` links a duplicate submission to the
   existing report doc and increments its `corroborationCount` instead of creating a new doc
   (`backend/server/index.js:396-407`, `docs/09-data-model.md` report entity). That field is
   currently ignored by the heatmap aggregation.
2. `backend/data/safe/safe-heatmap.json` (~500 landmark points — 24/7 stores, well-lit zones,
   high-foot-traffic spots, police presence — each with `lat`, `lng`, `weight` 0.4–1.0,
   `safety_type`, `landmark_name`) is not wired into the frontend anywhere. The map has no positive
   "safe zone" layer to complement the two hazard layers.

## Scope

In scope: `frontend/src/lib/heatmap.js` (aggregation fix), new `frontend/src/data/safe-heatmap.json`
(canonical frontend copy of the backend file), new `frontend/src/features/map/SafeHeatmap.jsx`,
`frontend/src/features/map/ZoneMap.jsx` (third toolbar toggle), `frontend/src/styles.css`
(`active-green` toolbar state).

Out of scope: `backend/data/safe-spaces/safe-heatmap.json` is a byte-identical duplicate of
`backend/data/safe/safe-heatmap.json` — left untouched, not consolidated, since deduping it wasn't
asked for and isn't needed for this feature. No click/popup interaction on the new green layer
(confirmed: visual-only, matching the existing red/yellow layers' effort level). No changes to
`submitReport`, Firestore schema, or report submission flow.

## Design

### 1. Confirmation-based sizing (`frontend/src/lib/heatmap.js`)

`buildIncidentMarkers` currently does, per qualifying report:

```js
existing.count = Math.min(existing.count + 1, HEAT_COUNT_CAP);
```

Change to sum each report's real `corroborationCount` (defaulting to 1 for legacy docs written
before the field existed) instead of a flat `+1`, still capped at `HEAT_COUNT_CAP`:

```js
const contribution = report.corroborationCount ?? 1;
// on first sight of a segment: count = Math.min(contribution, HEAT_COUNT_CAP)
// on subsequent distinct report docs for the same segment: count = Math.min(existing.count + contribution, HEAT_COUNT_CAP)
```

This brings live Firestore reports in line with how `ReportHeatmap.jsx`'s `BASELINE_MARKERS` already
treat baseline hotspots (`Math.min(h.corroborationCount || 1, HEAT_COUNT_CAP)`, line 18) — one
consistent notion of "confirmation count" across both data sources. No change needed in
`ReportHeatmap.jsx` itself; it already just reads `.count` off the marker. The existing client-only
`localLikes` +3 bonus (a user's own like, not a server-confirmed corroboration) is left as-is on top
of this.

### 2. Safe-zone data (`frontend/src/data/safe-heatmap.json`)

Verbatim copy of `backend/data/safe/safe-heatmap.json`, mirroring the existing
`heatmap-baseline.json` → `frontend/src/data/heatmap-baseline.js` mirroring convention, except kept
as a plain `.json` file (not hand-authored `.js`) since it's ~500 machine-generated entries, not a
small curated list. Imported directly — Vite supports JSON module imports natively, no build config
needed.

### 3. `SafeHeatmap.jsx` (new)

Structurally parallel to `ReportHeatmap.jsx`'s red/yellow `<Source>`/`<Layer>` pair: one
`geojson` `Source` built from the imported safe-heatmap points, one `heatmap`-type `Layer`.
Differences from the hazard layers:

- No report/segment join — points already carry their own `lat`/`lng`.
- `heatmap-weight` reads directly off each point's `weight` field (already normalized 0.4–1.0), not
  a corroboration count.
- Color ramp is green-toned, built from the theme's existing "safe" palette
  (`--okay #2e7d32` / `--sev-green-bg`), same `heatmap-density` stop shape as the red/yellow ramps
  for visual consistency (transparent → soft green → saturated green).
- Same zoom-interpolated `heatmap-radius`/`heatmap-intensity` curves as the hazard layers (zoom 11
  → 15), so all three layers "feel" like the same weather-radar system at any zoom level.
- Takes a single `show` boolean prop (no `localLikes`/`reports`/`segments` — nothing to join).

### 4. `ZoneMap.jsx` toolbar

Add `showHeatmapGreen` state (default `false`, same as red/yellow) and a third button in the
existing "Layer Toggles Group", after the yellow button:

```jsx
<button
  className={`map-toolbar-btn ${showHeatmapGreen ? 'active-green' : ''}`}
  title="Toggle Safe Zones"
  onClick={() => setShowHeatmapGreen((v) => !v)}
>
  <ShieldCheck size={18} />
</button>
```

`<SafeHeatmap show={showHeatmapGreen} />` renders alongside the existing `<ReportHeatmap ... />`.
Not added to `interactiveLayerIds` or `handleMapClick`'s feature filter — purely visual, consistent
with the "no popup" decision.

### 5. `styles.css`

New `.map-toolbar-btn.active-green { color: var(--okay); background: var(--sev-green-bg); }`,
directly parallel to the existing `active-red`/`active-yellow` rules.

## Code structure

- `frontend/src/lib/heatmap.js` — `buildIncidentMarkers` aggregation fix only; `HEAT_COUNT_CAP`
  export unchanged.
- `frontend/src/data/safe-heatmap.json` — new, verbatim copy of the backend file.
- `frontend/src/features/map/SafeHeatmap.jsx` — new component.
- `frontend/src/features/map/ZoneMap.jsx` — new state, new toolbar button, renders `SafeHeatmap`.
- `frontend/src/styles.css` — new `active-green` rule.

## Error handling

Nothing new to fail: no network calls, no new user input, no schema changes. A report doc missing
`corroborationCount` (legacy shape) falls back to `1`, same default the field already documents.

## Testing approach

No test framework in this repo (consistent with prior specs in this directory) — manual walk:

- Toggle Safe Zones on an otherwise-empty map view → green cloud clusters appear where the
  landmark data is dense (e.g. Cubao / Gateway area), fade where sparse.
- Toggle Red/Yellow with a corroborated baseline hotspot (e.g. `seg_pureza_approaches`,
  `corroborationCount: 5`) visible → cloud should read noticeably larger/hotter than a
  `corroborationCount: 1` hotspot (e.g. `seg_hipodromo_st_2`) at the same zoom, confirming the
  sizing fix is visibly in effect.
- All three toggles independently on/off, at multiple zoom levels, both light and dark theme.
- Build check: `npm run build` in `frontend/`.
