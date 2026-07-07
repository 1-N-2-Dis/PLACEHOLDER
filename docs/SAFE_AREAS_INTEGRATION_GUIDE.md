# Safe Areas Integration Guide
## OSM Asset Data → Safe Zone Overlay in GuidHer

**Date:** 2026-07-07
**For:** Jim (Demo/Backend) + frontend implementor
**Stack:** Firebase/Firestore · Express · React + MapLibre GL · `safe-heatmap.json`
**Data source:** `data/Safety/safe-heatmap.json` (788 OSM nodes, Overpass API)

---

## What This Layer Does (and What It Doesn't)

The safe areas layer is the **positive signal** counterpart to the incident heatmap. Where
the red/yellow heatmap marks conditions to avoid, the safe areas overlay marks conditions
that make a route *safer* — 24/7 stores with foot traffic, transit platforms, well-lit
commercial clusters, and police/security outposts.

This is **not** a Firestore-backed live feed. The data comes from OpenStreetMap, fetched
once by `data/Safety/fetch_safe_areas.py` and baked in as a static JSON asset — the same
pattern `heatmap-baseline.js` uses for the crime baseline. No Firestore reads, no network
calls at render time, no rule changes needed.

---

## Existing Pipeline Context (What We're Plugging Into)

```
Firestore `reports` collection  (live crowdsourced reports)
        +
HEATMAP_BASELINE  (heatmap-baseline.js — baked-in crime data)
        ↓
ReportHeatmap.jsx  (WebGL heatmap layer — red + yellow)
        ↓
ZoneMap.jsx  (toggle state: showHeatmapRed, showHeatmapYellow)
```

The safe areas layer slots into ZoneMap.jsx **alongside** ReportHeatmap — its own toggle,
its own component, its own source — touching nothing in the existing flow.

```
data/Safety/safe-heatmap.json  (788 OSM nodes, weights 0.4–1.0)
        ↓
safe-areas-baseline.js  (baked-in client asset — same pattern as heatmap-baseline.js)
        ↓
SafeAreaHeatmap.jsx  (new WebGL heatmap layer — green/teal)
        ↓
ZoneMap.jsx  (new toggle: showSafeAreas)
```

---

## Data Shape Reference

The pipeline outputs a flat array. Each point has:

```js
{
  "lat": 14.598211,
  "lng": 121.005122,
  "weight": 0.8,             // 0.4 | 0.5 | 0.7 | 0.8 | 1.0
  "safety_type": "High Foot Traffic",  // "24/7 Store" | "High Foot Traffic" | "Well-Lit Zone" | "Security Presence"
  "landmark_name": "LRT-2 Pureza Platform"
}
```

Weight scale (maps directly to `heatmap-weight` in MapLibre paint):

| Weight | Meaning | Examples |
|--------|---------|---------|
| `1.0` | Maximum safety | 7-Eleven, 24/7 McDonald's, police outpost |
| `0.8` | High foot traffic | LRT-2 platforms, major bus stops |
| `0.7` | Retail foot traffic | Regular fast food, convenience stores |
| `0.5` | Moderate — explicit lighting | Nodes tagged `lit=yes` |
| `0.4` | Moderate — commercial cluster | Standard commercial node, daylight ops |

**Current breakdown across 788 points:**

| safety_type | Count | Weight |
|---|---:|---|
| High Foot Traffic | 597 | 0.7 – 0.8 |
| Well-Lit Zone | 125 | 0.4 – 0.5 |
| 24/7 Store | 56 | 1.0 |
| Security Presence | 10 | 1.0 |

---

## Step 1 — Copy JSON Asset into Frontend

Copy (or symlink) the generated JSON into the frontend data directory:

```powershell
copy "C:\Users\Admin\Desktop\thing\data\Safety\safe-heatmap.json" `
     "C:\Users\Admin\Desktop\thing\GuidHer\frontend\src\data\safe-areas-baseline.json"
```

> **Why not import from `data/Safety/` directly?** Vite resolves imports relative to the
> frontend package root. Placing it under `frontend/src/data/` keeps it with `heatmap-baseline.js`
> and lets Vite tree-shake it correctly. The `.json` suffix lets Vite import it as a plain JS
> value with no extra config.

---

## Step 2 — Create `safe-areas-baseline.js`

Create `GuidHer/frontend/src/data/safe-areas-baseline.js` — a thin wrapper that mirrors
the `HEATMAP_BASELINE` export pattern:

```js
// Baked-in safe area nodes from OpenStreetMap (OSM), fetched via Overpass API.
// Source: data/Safety/safe-heatmap.json — 788 POI nodes covering LRT-2 Recto to
// Araneta-Cubao corridor (re-run data/Safety/fetch_safe_areas.py to refresh).
// Shape: { lat, lng, weight (0.4–1.0), safety_type, landmark_name }
//
// weight scale:
//   1.0 = 24/7 establishment or security presence (hard safe anchor)
//   0.7–0.8 = high foot traffic (transit platforms, retail lanes)
//   0.4–0.5 = well-lit or standard commercial node
//
// Used by:
//   SafeAreaHeatmap.jsx  — green/teal WebGL heatmap overlay
//   routing.js           — optional safe-path boost (future)
import rawData from './safe-areas-baseline.json';

export const SAFE_AREAS_BASELINE = rawData;

// High-confidence anchors only (weight >= 0.8) — useful if the full 788-point
// set is too dense for a pitch demo or routing penalty calc.
export const SAFE_AREAS_HIGH_CONFIDENCE = rawData.filter((p) => p.weight >= 0.8);
```

---

## Step 3 — Create `SafeAreaHeatmap.jsx`

Create `GuidHer/frontend/src/features/map/SafeAreaHeatmap.jsx`:

```jsx
// Green/teal WebGL heatmap layer for safe area anchors (24/7 stores, transit platforms,
// well-lit zones, security nodes) derived from OpenStreetMap via Overpass API.
// Positive-signal counterpart to ReportHeatmap.jsx's red/yellow danger heatmap.
import { useMemo, Fragment } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { SAFE_AREAS_BASELINE } from '../../data/safe-areas-baseline.js';

export default function SafeAreaHeatmap({ show }) {
  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: SAFE_AREAS_BASELINE.map((p) => ({
      type: 'Feature',
      properties: {
        weight: p.weight,
        safety_type: p.safety_type,
        landmark_name: p.landmark_name,
      },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }), []);

  if (!show) return null;

  return (
    <Fragment>
      <Source id="safe-areas-source" type="geojson" data={geojson}>
        <Layer
          id="safe-areas-layer"
          type="heatmap"
          paint={{
            // weight drives kernel density — maps our 0.4–1.0 scale
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0.4, 0.2, 1.0, 1.0],
            'heatmap-intensity': [
              'interpolate', ['linear'], ['zoom'],
              11, 0.4,
              15, 0.9,
            ],
            // Green → teal ramp — clearly distinct from the red/yellow danger layer
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,    'rgba(0,0,0,0)',
              0.3,  'rgba(100,220,160,0.1)',
              0.6,  'rgba(40,180,100,0.25)',
              0.85, 'rgba(0,140,80,0.5)',
              1,    'rgba(0,100,60,0.75)',
            ],
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'],
              11, 12,
              15, 35,
            ],
            'heatmap-opacity': 0.75,
          }}
        />
      </Source>
    </Fragment>
  );
}
```

The color ramp deliberately avoids the red-orange palette used by ReportHeatmap so a user
looking at both layers simultaneously can read them separately at a glance.

---

## Step 4 — Wire into `ZoneMap.jsx`

Three surgical edits — nothing existing is removed.

### 4a. Import the component
```js
// Add to ZoneMap.jsx imports — after the existing ReportHeatmap import
import SafeAreaHeatmap from './SafeAreaHeatmap.jsx';
```

### 4b. Add toggle state (alongside the existing two heatmap states)
```js
// In ZoneMap's useState block — after showHeatmapYellow
const [showSafeAreas, setShowSafeAreas] = useState(false);
```

### 4c. Place the component inside `<Map>`
```jsx
{/* Place immediately after <ReportHeatmap ... /> */}
<SafeAreaHeatmap show={showSafeAreas} />
```

### 4d. Add a toggle button in the controls panel

Find the existing heatmap toggle buttons in ZoneMap's toolbar/controls block and add:

```jsx
<button
  onClick={() => setShowSafeAreas((v) => !v)}
  style={{
    background: showSafeAreas ? 'rgba(0,140,80,0.25)' : 'transparent',
    border: '1px solid rgba(0,140,80,0.5)',
    color: showSafeAreas ? '#00c864' : '#888',
    // match existing button sizing in the controls panel
  }}
>
  Safe Zones
</button>
```

---

## Step 5 — Verify It Appears on the Map

1. **Start the frontend** (if not already running): `npm run dev` from `GuidHer/frontend/`.
2. **Open the map** → GuidHer renders dark mode at ZONE_CENTER `{lat:14.5985, lng:121.0102}`.
3. **Click "Safe Zones" toggle** → a green/teal heatmap cloud should appear over:
   - LRT-2 station zones (Pureza, Legarda, V. Mapa, J. Ruiz, Gilmore, Betty Go, Cubao)
   - 7-Eleven / McDonald's / Jollibee clusters (bright peaks — weight 1.0)
   - Magsaysay Boulevard / España Blvd commercial stretches
4. **Toggle it off** → map returns to base/crime view. Toggling red or yellow heatmap
   independently still works — the three layers are fully independent MapLibre sources.

**The red/yellow crime heatmap and safe areas heatmap can be shown simultaneously.** A user
reading both layers can see: red = incident hotspot, green = safe anchor, amber overlap = a
complex area (e.g. near a 24/7 store in a high-incident corridor).

---

## No Firestore Changes Required

Unlike the crime heatmap seed flow, **this integration requires zero Firestore writes:**

| | Crime Heatmap | Safe Areas |
|---|---|---|
| Data source | Firestore `reports` + `HEATMAP_BASELINE` | `SAFE_AREAS_BASELINE` only |
| Firestore reads at runtime | Yes (`reports` collection) | **None** |
| Seed script needed | `seed-heatmap-baseline.mjs` | **None** |
| Freshness concern | Yes — 24h window, re-seed before demo | **None — static OSM snapshot** |
| Firestore rules change | No | **No** |

The safe areas data is not time-sensitive in the same way crime reports are. OSM POI data
for 24/7 stores and transit stations changes on the order of months, not hours.

---

## Integration Compatibility Check

Here is what was verified before writing this guide:

| Concern | Status |
|---|---|
| `ReportHeatmap.jsx` Source IDs | ✅ Use `heatmap-red-source` / `heatmap-yellow-source` — no collision with `safe-areas-source` |
| `heatmap-red-layer` / `heatmap-yellow-layer` Layer IDs | ✅ No collision with `safe-areas-layer` |
| `interactiveLayerIds` in ZoneMap | ⚠️ Currently only adds red/yellow IDs when toggles are on — add `safe-areas-layer` to the same array if you want click-to-inspect on safe area nodes (optional for demo) |
| Firestore rules | ✅ No new collection — no rule change |
| `buildIncidentMarkers()` in heatmap.js | ✅ Untouched — safe areas use a separate code path |
| `HEATMAP_BASELINE` merge logic | ✅ Untouched — safe areas have no segment ID or severity field to collide |
| Routing engine (WASM A*) | ✅ Untouched — see §Routing note below |
| `isFlaggedTonight()` freshness gate | ✅ Irrelevant — safe areas are static, never filtered by freshness |
| `hazards` memoization in ZoneMap | ✅ Untouched — safe areas are never hazards |
| Vite JSON import | ✅ Vite supports `import data from './file.json'` out of the box |

---

## Routing Integration Note (Post-Demo, Optional)

The current WASM routing engine avoids red segments (hard) and yellow segments (soft) using
the penalty graph in `frontend/rust/router/src/penalties.rs`. Safe area weights could feed
into this as **edge cost reductions** — a path through a 24/7-store cluster costs less than
one through an unlit back street, even if neither is flagged as a hazard.

This is **not needed for the July 9 demo** — the demo story is avoidance, not attraction.
But the data structure is already compatible for a post-hackathon pass:

```js
// future hook in routing.js — passes safe area weights alongside hazards
requestRoutes(a, b, flaggedReports, SAFE_AREAS_HIGH_CONFIDENCE);
```

The `SAFE_AREAS_HIGH_CONFIDENCE` export (weight >= 0.8 only, ~350 points) is already
exported from `safe-areas-baseline.js` for exactly this purpose.

---

## Pitch Framing for This Layer (Farhana)

If the safe areas overlay is shown in the demo:

> "The green layer is the other side of the picture — 788 open-source data points from
> OpenStreetMap showing where 24/7 establishments, transit platforms, and security nodes
> are concentrated along the LRT-2 corridor. The routing engine already uses the red
> layer to avoid danger. The green layer is the foundation for the next step: routing
> toward safety, not just away from risk."

Keep this brief — the danger heatmap is the primary demo story. The safe areas layer is a
supporting visual, not a standalone feature claim.

---

## Refreshing the OSM Data

The OSM snapshot can be refreshed at any time by re-running the pipeline:

```powershell
python "C:\Users\Admin\Desktop\thing\data\Safety\fetch_safe_areas.py"
# Then copy the updated file:
copy "C:\Users\Admin\Desktop\thing\data\Safety\safe-heatmap.json" `
     "C:\Users\Admin\Desktop\thing\GuidHer\frontend\src\data\safe-areas-baseline.json"
```

The script has three Overpass fallback endpoints (`overpass-api.de`, `kumi.systems`,
`mail.ru`), handles timeouts gracefully, and completes in under 60 seconds on a normal
connection.

---

## Troubleshooting

**No green layer appears:**
- Check that `show={showSafeAreas}` is wired — if the prop is `undefined`, the `if (!show) return null` guard will hide it
- Check browser console for MapLibre "duplicate source" errors — if `safe-areas-source` already exists from a previous hot-reload, refresh the page

**Green layer covers the whole map uniformly:**
- This means all weights are equal — check the JSON copy step; if `safe-areas-baseline.json` is empty or malformed, MapLibre renders a zero-weight uniform field
- Run `JSON.parse(require('fs').readFileSync('safe-areas-baseline.json'))` to verify it parses

**Green and red layer look the same color:**
- The green ramp uses `rgba(0,140,80,...)`. If theme CSS is inverting colors, check `useTheme()` — consider passing `theme` as a prop to `SafeAreaHeatmap` and swapping to a teal ramp in dark mode

**Layer renders but crashes on toggle:**
- The `useMemo` in `SafeAreaHeatmap` runs once (no deps) — confirm `show` is a boolean, not a state setter accidentally passed as the prop

---

*Integration guide written 2026-07-07.*
*Data pipeline: `data/Safety/fetch_safe_areas.py`*
*Asset: `data/Safety/safe-heatmap.json` → `GuidHer/frontend/src/data/safe-areas-baseline.json`*
*New files: `SafeAreaHeatmap.jsx`, `safe-areas-baseline.js`*
*Modified files: `ZoneMap.jsx` (3 additions only)*
