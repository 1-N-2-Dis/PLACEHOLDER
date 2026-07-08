# Safe-Zone Cloud Layer + Confirmation-Based Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing red/yellow map "cloud" heatmap layers size themselves by real report
corroboration (how many other people confirmed a report by having their duplicate submission
linked to it), and add a third, green "Safe Zones" cloud layer built from
`backend/data/safe/safe-heatmap.json`.

**Architecture:** `frontend/src/lib/heatmap.js`'s `buildIncidentMarkers` currently counts `+1` per
report document landing on a segment, ignoring the backend's real `corroborationCount` field
(incremented server-side by `submitReport` when Gemini links a duplicate submission to an existing
report). Change it to sum `corroborationCount` instead. Separately, add a new
`SafeHeatmap.jsx` component — structurally parallel to `ReportHeatmap.jsx`'s red/yellow
`<Source>`/`<Layer>` pairs, but static (no report/segment join) and green-toned — fed by a new
`frontend/src/data/safe-heatmap.json` (verbatim copy of the backend file), and wire it into
`ZoneMap.jsx`'s existing layer-toggle toolbar as a third button.

**Tech Stack:** React 18, Vite 6, MapLibre GL via `react-map-gl` (native `heatmap` layer type),
plain ES modules. No automated test framework in this project (no vitest/jest, no `*.test.*`
files) — verification is `node --check` for plain `.js` files, `npm run build` for `.jsx` changes,
and manual browser testing, matching every other feature in this repo (see
`docs/superpowers/plans/2026-07-01-highway-aware-routing.md`).

## Global Constraints

- No emoji anywhere in the UI (icons or copy) — use `lucide-react` components only (AGENTS.md code
  style).
- No SOS/rescue/dispatch copy anywhere (BR-002) — the new button's title stays purely descriptive
  ("Toggle Safe Zones").
- Single zone scope (BR-003) — no new geographic data outside the existing PUP Sta. Mesa zone
  (the safe-heatmap data is already scoped to it).
- Do not touch `submitReport`, Firestore schema/rules, or the report submission flow — this is a
  read-side/rendering change only.
- `backend/data/safe-spaces/safe-heatmap.json` is a byte-identical duplicate of
  `backend/data/safe/safe-heatmap.json` — leave it untouched; use only the `backend/data/safe/`
  copy as the source for the frontend copy.
- No test framework exists in `frontend/` — don't introduce one. Verify with `node --check` (plain
  `.js`), `npm run build` (`.jsx`), and manual `npm run dev` browser checks.
- **Ask the user before running any `git commit`** — do not commit without an explicit go-ahead in
  that turn, even mid-task.
- Spec: `docs/superpowers/specs/2026-07-08-safe-zone-heatmap-and-confirmation-sizing-design.md`.

---

### Task 1: Size red/yellow clouds by real corroboration count

**Files:**
- Modify: `frontend/src/lib/heatmap.js:15-42` (`buildIncidentMarkers`)

**Interfaces:**
- Produces: `buildIncidentMarkers(reports, segments, now?) -> Array<{ segmentId, lng, lat, severity, count }>` — same signature as today; only `count`'s aggregation logic changes. `count` is still capped at the existing exported `HEAT_COUNT_CAP` (5).
- Consumes: report objects with an optional `corroborationCount` (number, defaults to `1` when absent — legacy docs written before the field existed).

- [ ] **Step 1: Write a throwaway verification script and confirm it fails against today's code**

Create `frontend/_verify_heatmap.mjs`:

```js
import { buildIncidentMarkers, HEAT_COUNT_CAP } from './src/lib/heatmap.js';

const segments = [{ segmentId: 'seg_a', geo: { lat: 14.6, lng: 121.0 } }];
const now = Date.now();

// Two distinct report docs on the same segment (not merged as duplicates — e.g. two separate
// incidents close together), corroborationCount 3 and 2 respectively. Confirmed count should be
// their sum, 5 — not 2, which is what "+1 per doc regardless of corroborationCount" would give.
const reports = [
  { segmentId: 'seg_a', severity: 'red', corroborationCount: 3, createdAt: now },
  { segmentId: 'seg_a', severity: 'yellow', corroborationCount: 2, createdAt: now },
];
const markers = buildIncidentMarkers(reports, segments, now);
console.assert(markers.length === 1, `expected 1 marker, got ${markers.length}`);
console.assert(markers[0].count === 5, `expected count 5, got ${markers[0].count}`);
console.assert(markers[0].severity === 'red', 'red should win over yellow');

// A single heavily-corroborated report is still capped at HEAT_COUNT_CAP.
const capReports = [{ segmentId: 'seg_a', severity: 'red', corroborationCount: 99, createdAt: now }];
const capMarkers = buildIncidentMarkers(capReports, segments, now);
console.assert(capMarkers[0].count === HEAT_COUNT_CAP, `expected cap ${HEAT_COUNT_CAP}, got ${capMarkers[0].count}`);

// A legacy report with no corroborationCount field still contributes 1.
const legacyReports = [{ segmentId: 'seg_a', severity: 'yellow', createdAt: now }];
const legacyMarkers = buildIncidentMarkers(legacyReports, segments, now);
console.assert(legacyMarkers[0].count === 1, `expected legacy default 1, got ${legacyMarkers[0].count}`);

console.log('OK: all heatmap.js aggregation assertions passed');
```

Run (from `frontend/`): `node _verify_heatmap.mjs`

Expected: two `Assertion failed` lines on stderr (the `count === 5` and `count === HEAT_COUNT_CAP`
checks), because today's code gives `count === 2` and `count === 1` respectively for those cases.
The final `console.log` still runs (assertion failures don't stop execution) — that's fine, the
point is seeing the specific assertions fail.

- [ ] **Step 2: Fix the aggregation in `frontend/src/lib/heatmap.js`**

Replace the `for (const report of reports)` loop body (currently):

```js
    const existing = bySegment.get(report.segmentId);
    if (existing) {
      existing.count = Math.min(existing.count + 1, HEAT_COUNT_CAP);
      if (report.severity === 'red') existing.severity = 'red';
    } else {
      bySegment.set(report.segmentId, {
        segmentId: report.segmentId,
        lng: segment.geo.lng,
        lat: segment.geo.lat,
        severity: report.severity,
        count: 1,
      });
    }
```

with:

```js
    const contribution = report.corroborationCount ?? 1;
    const existing = bySegment.get(report.segmentId);
    if (existing) {
      existing.count = Math.min(existing.count + contribution, HEAT_COUNT_CAP);
      if (report.severity === 'red') existing.severity = 'red';
    } else {
      bySegment.set(report.segmentId, {
        segmentId: report.segmentId,
        lng: segment.geo.lng,
        lat: segment.geo.lat,
        severity: report.severity,
        count: Math.min(contribution, HEAT_COUNT_CAP),
      });
    }
```

- [ ] **Step 3: Run the verification script again and confirm it passes**

Run (from `frontend/`): `node _verify_heatmap.mjs`
Expected: no `Assertion failed` output, just `OK: all heatmap.js aggregation assertions passed`.

- [ ] **Step 4: Delete the throwaway script**

Delete `frontend/_verify_heatmap.mjs` — it was a scratch check, not part of the codebase.

- [ ] **Step 5: Run a syntax check on the modified file**

Run: `node --check frontend/src/lib/heatmap.js`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

Ask the user before running `git commit`.

```bash
git add frontend/src/lib/heatmap.js
git commit -m "fix: size red/yellow heat clouds by real corroboration count, not per-doc count"
```

---

### Task 2: Add the green "Safe Zones" cloud layer

**Files:**
- Create: `frontend/src/data/safe-heatmap.json` (verbatim copy of `backend/data/safe/safe-heatmap.json`)
- Create: `frontend/src/features/map/SafeHeatmap.jsx`
- Modify: `frontend/src/features/map/ZoneMap.jsx:11` (icon import), `:21` (component import),
  `:95-97` (toggle state), `:254` (render), `:427-443` (toolbar button)
- Modify: `frontend/src/styles.css:429-430` (new `active-green` rule)

**Interfaces:**
- Produces: `SafeHeatmap({ show: boolean }) -> JSX.Element | null`, default export from
  `frontend/src/features/map/SafeHeatmap.jsx`. Renders nothing when `show` is falsy.
- Consumes: each entry of the imported `safe-heatmap.json` array has shape
  `{ lat: number, lng: number, weight: number, safety_type: string, landmark_name: string }`.

- [ ] **Step 1: Copy the backend data file into the frontend**

Run (from the repo root):

```bash
cp backend/data/safe/safe-heatmap.json frontend/src/data/safe-heatmap.json
```

- [ ] **Step 2: Create `frontend/src/features/map/SafeHeatmap.jsx`**

```jsx
// Safe-zone density layer — an ambient "cloud" of positive safety signals (well-lit streets,
// 24/7 stores, high foot traffic, police/security presence) from
// backend/data/safe/safe-heatmap.json (mirrored verbatim into ../../data/safe-heatmap.json, same
// convention as heatmap-baseline.json). Visual only, no click interaction: unlike ReportHeatmap's
// red/yellow layers, these are static landmark points, not live reports, so there's nothing to
// join against segments or select on click.
import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import SAFE_HEATMAP_POINTS from '../../data/safe-heatmap.json';

export default function SafeHeatmap({ show }) {
  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: SAFE_HEATMAP_POINTS.map((p) => ({
      type: 'Feature',
      properties: { weight: p.weight },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }), []);

  if (!show) return null;

  return (
    <Source id="heatmap-green-source" type="geojson" data={geojson}>
      <Layer
        id="heatmap-green-layer"
        type="heatmap"
        paint={{
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            11, 0.5,
            15, 1.0
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.15, 'rgba(180,230,190,0.05)',
            0.35, 'rgba(120,200,140,0.15)',
            0.6, 'rgba(70,170,95,0.3)',
            0.85, 'rgba(40,135,65,0.48)',
            1, 'rgba(20,95,40,0.72)'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            11, 17,
            15, 52
          ],
          'heatmap-opacity': 0.85
        }}
      />
    </Source>
  );
}
```

- [ ] **Step 3: Add the `ShieldCheck` icon import in `ZoneMap.jsx`**

Change (line 11):

```js
import { CheckCircle2, AlertTriangle, AlertOctagon, MapPin, X, Layers } from 'lucide-react';
```

to:

```js
import { CheckCircle2, AlertTriangle, AlertOctagon, MapPin, X, Layers, ShieldCheck } from 'lucide-react';
```

- [ ] **Step 4: Import `SafeHeatmap` in `ZoneMap.jsx`**

Change (line 21):

```js
import ReportHeatmap from './ReportHeatmap.jsx';
```

to:

```js
import ReportHeatmap from './ReportHeatmap.jsx';
import SafeHeatmap from './SafeHeatmap.jsx';
```

- [ ] **Step 5: Add the toggle state in `ZoneMap.jsx`**

Change (lines 95-97):

```js
  const [showHeatmapRed, setShowHeatmapRed] = useState(false);
  const [showHeatmapYellow, setShowHeatmapYellow] = useState(false);
  const [localLikes, setLocalLikes] = useState({});
```

to:

```js
  const [showHeatmapRed, setShowHeatmapRed] = useState(false);
  const [showHeatmapYellow, setShowHeatmapYellow] = useState(false);
  const [showHeatmapGreen, setShowHeatmapGreen] = useState(false);
  const [localLikes, setLocalLikes] = useState({});
```

- [ ] **Step 6: Render `SafeHeatmap` alongside `ReportHeatmap` in `ZoneMap.jsx`**

Change (line 254):

```jsx
        <ReportHeatmap reports={reports} segments={segments} showRed={showHeatmapRed} showYellow={showHeatmapYellow} localLikes={localLikes} />
```

to:

```jsx
        <ReportHeatmap reports={reports} segments={segments} showRed={showHeatmapRed} showYellow={showHeatmapYellow} localLikes={localLikes} />
        <SafeHeatmap show={showHeatmapGreen} />
```

- [ ] **Step 7: Add the third toolbar button in `ZoneMap.jsx`**

Change (lines 427-443):

```jsx
        {showControls && (
          <div className="map-toolbar-group fade-up" style={{ transformOrigin: 'top right' }}>
            <button
              className={`map-toolbar-btn ${showHeatmapRed ? 'active-red' : ''}`}
              title="Toggle Red Zones"
              onClick={() => setShowHeatmapRed((v) => !v)}
            >
              <AlertOctagon size={18} />
            </button>
            <button
              className={`map-toolbar-btn ${showHeatmapYellow ? 'active-yellow' : ''}`}
              title="Toggle Yellow Zones"
              onClick={() => setShowHeatmapYellow((v) => !v)}
            >
              <AlertTriangle size={18} />
            </button>
          </div>
        )}
```

to:

```jsx
        {showControls && (
          <div className="map-toolbar-group fade-up" style={{ transformOrigin: 'top right' }}>
            <button
              className={`map-toolbar-btn ${showHeatmapRed ? 'active-red' : ''}`}
              title="Toggle Red Zones"
              onClick={() => setShowHeatmapRed((v) => !v)}
            >
              <AlertOctagon size={18} />
            </button>
            <button
              className={`map-toolbar-btn ${showHeatmapYellow ? 'active-yellow' : ''}`}
              title="Toggle Yellow Zones"
              onClick={() => setShowHeatmapYellow((v) => !v)}
            >
              <AlertTriangle size={18} />
            </button>
            <button
              className={`map-toolbar-btn ${showHeatmapGreen ? 'active-green' : ''}`}
              title="Toggle Safe Zones"
              onClick={() => setShowHeatmapGreen((v) => !v)}
            >
              <ShieldCheck size={18} />
            </button>
          </div>
        )}
```

- [ ] **Step 8: Add the `active-green` toolbar style in `frontend/src/styles.css`**

Change (lines 429-430):

```css
.map-toolbar-btn.active-red { color: var(--flag); background: var(--sev-red-bg); }
.map-toolbar-btn.active-yellow { color: #f57f17; background: var(--sev-yellow-bg); }
```

to:

```css
.map-toolbar-btn.active-red { color: var(--flag); background: var(--sev-red-bg); }
.map-toolbar-btn.active-yellow { color: #f57f17; background: var(--sev-yellow-bg); }
.map-toolbar-btn.active-green { color: var(--okay); background: var(--sev-green-bg); }
```

- [ ] **Step 9: Build the frontend**

Run (from `frontend/`): `npm run build`
Expected: build succeeds (confirms the new JSON import resolves and JSX is valid).

- [ ] **Step 10: Manually verify the new layer**

No Firebase emulator needed — this data is fully static/bundled, no Firestore dependency. From
`frontend/`, run `npm run dev` and open the app:

1. Click the "Map Options" (`Layers` icon) button to open the toolbar group.
2. Click the new third button (`ShieldCheck` icon, tooltip "Toggle Safe Zones") — confirm it turns
   green (`active-green`) and soft green cloud clusters appear on the map, denser in
   landmark-heavy areas (e.g. around Cubao/Gateway, lat ~14.62–14.63, lng ~121.05) and fading in
   sparser areas.
3. Toggle it off — clouds disappear, button returns to its inactive state.
4. Toggle Red/Yellow/Green on together — confirm all three render without visual glitches or
   console errors.
5. Switch the app's theme (light/dark, via the existing theme toggle) with Safe Zones on — confirm
   the green cloud still reads clearly against both map backgrounds.

- [ ] **Step 11: Commit**

Ask the user before running `git commit`.

```bash
git add frontend/src/data/safe-heatmap.json frontend/src/features/map/SafeHeatmap.jsx frontend/src/features/map/ZoneMap.jsx frontend/src/styles.css
git commit -m "feat: add a green safe-zones cloud layer from safe-heatmap.json"
```

---

### Task 3: Update docs to match the implemented behavior

**Files:**
- Modify: `docs/09-data-model.md`

**Interfaces:**
- None (documentation only).

- [ ] **Step 1: Note the new frontend data mirror in `docs/09-data-model.md`**

Find the existing note about `heatmap-baseline.json` being mirrored into
`frontend/src/data/heatmap-baseline.js` (search the file for `heatmap-baseline.json` if the exact
line has drifted) and add a parallel note directly after it:

```
`backend/data/safe/safe-heatmap.json` (~500 static landmark points — `lat`, `lng`, `weight`
0.4–1.0, `safety_type`, `landmark_name` — 24/7 stores, well-lit streets, high foot traffic, police
presence) is mirrored verbatim into `frontend/src/data/safe-heatmap.json` and rendered as a
green "Safe Zones" MapLibre heatmap layer (`frontend/src/features/map/SafeHeatmap.jsx`), toggled
independently of the red/yellow report layers. It has no relationship to the `reports` collection
and carries no `corroborationCount` — it's static reference data, not a crowd-sourced signal.
`backend/data/safe-spaces/safe-heatmap.json` is a byte-identical duplicate, unused by the frontend.
```

- [ ] **Step 2: Run the docs consistency check**

Per `AGENTS.md`'s "Docs consistency check": confirm this note doesn't restate a fact owned by
another doc (it doesn't — it's describing new frontend data-mirroring, the same pattern already
documented for `heatmap-baseline.json`) and that no existing invariant broke (no `F-###` touched,
no network surface changed, map/routing stack unchanged).

- [ ] **Step 3: Commit**

Ask the user before running `git commit`.

```bash
git add docs/09-data-model.md
git commit -m "docs: note the safe-heatmap.json frontend mirror and its green map layer"
```

## Self-Review Notes

- **Spec coverage:** confirmation-based sizing (spec §1) → Task 1. Safe-zone data mirror + new
  component + toolbar wiring + CSS (spec §2–5) → Task 2. Doc note for the new data mirror → Task 3.
  Out-of-scope items from the spec (duplicate `safe-spaces` file, click popups, report/schema
  changes) are explicitly not touched by any task.
- **Placeholder scan:** no TBD/TODO; every step has literal code or an exact command.
- **Type consistency:** `SafeHeatmap({ show })` prop name matches its usage in Task 2 Step 6
  (`<SafeHeatmap show={showHeatmapGreen} />`); `buildIncidentMarkers`'s signature and `HEAT_COUNT_CAP`
  export are unchanged from what `ReportHeatmap.jsx` already imports, so no caller-side changes
  are needed there.
