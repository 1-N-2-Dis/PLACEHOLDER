# Highway-Aware, Safety-Scored Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the point-to-point route line on the zone map (currently broken — every request
errors) and make it route across highway-class roads ("yellow roads") only when no street-level
alternative exists, always preferring and labeling the route that avoids both flagged segments and
highways.

**Architecture:** Extract the routing logic from `RouteLayer.jsx` into a new `frontend/src/lib/routing.js`
module exporting `fetchSafeRoute(a, b, flaggedGeos) -> Promise<{ coords, status }>`. It calls
OpenRouteService (ORS) foot-walking directions with `extra_info: ['waytype']`, tries a route that
avoids flagged-segment zones (Tier A), inspects whether that route used a highway-class leg, and if
so retries avoiding both the flagged zones and that leg via `avoid_polygons` (Tier B — the only
ORS lever available, since `avoid_features` doesn't support road class for this profile). Falls
back gracefully at each tier when no alternative is feasible.

**Tech Stack:** React 18, Vite 6, MapLibre GL via `react-map-gl`, OpenRouteService HTTP API
(`foot-walking` profile), plain ES modules (no test framework in this project — verification is
`npm run build` + manual browser testing per `LOCAL_DEV.md`, matching existing project convention).

## Global Constraints

- ORS `avoid_features` does not support road-class avoidance for the `foot-walking` profile —
  confirmed live (`{"error":{"code":2003,"message":"avoid_features - highways is not valid with
  profile - foot-walking"}}`). Never send `avoid_features` for this profile again.
- Max 2 ORS calls per route request (same ceiling as the current code) — do not add a third tier.
- ORS `waytype` values `1` (State Road) and `2` (Road) count as "highway" for this feature; `3`
  (Street), `4` (Path), `6` (Cycleway), `7` (Footway), `8` (Pedestrian) do not.
- No SOS/rescue/dispatch copy anywhere (BR-002) — route status copy stays informational.
- This work does not touch `RouteCheck.jsx` (F-003 pre-trip checklist) — that's a separate feature
  using a different data path (ticked segment list, not point-to-point ORS routing).
- No automated test framework exists in `frontend/` (no vitest/jest, no `*.test.*` files, only
  `dev`/`build`/`preview` npm scripts). Don't introduce one as part of this change — verify with
  `npm run build` (catches syntax/type errors across the bundle) and manual browser testing, matching
  how every other feature in this repo was verified (see `agents/context/claude_context.md`).
- Spec: `docs/superpowers/specs/2026-07-01-highway-aware-routing-design.md`.

---

### Task 1: Extract and fix the routing engine (`lib/routing.js`)

**Files:**
- Create: `frontend/src/lib/routing.js`
- Modify: `frontend/src/features/map/RouteLayer.jsx` (full file, currently 125 lines)

**Interfaces:**
- Produces: `fetchSafeRoute(a: [lat, lng], b: [lat, lng], flaggedGeos: Array<{lat, lng}>) -> Promise<{ coords: Array<[lng, lat]>, status: 'safe' | 'caution-flagged' | 'caution-highway' | 'caution-both' }>`, exported from `frontend/src/lib/routing.js`. Throws on a genuine, non-recoverable ORS failure (network error, or a no-avoidance request itself failing).
- Consumes: `import.meta.env.VITE_ORS_API_KEY` (already set in `frontend/.env.local` for local dev).

- [ ] **Step 1: Create `frontend/src/lib/routing.js`**

```js
// Safety-aware route between Point A and Point B (frontend/src/lib/routing.js).
// Strategy: prefer a route that avoids both flagged segments and highway-class legs ("yellow
// roads" in the map style). Falls back to using a highway and/or passing a flagged segment only
// when ORS finds no street-level alternative.
//
// ORS's foot-walking profile has no avoid-by-road-class option (avoid_features only supports
// fords/steps for this profile — 'highways' is invalid and errors, confirmed live). avoid_polygons
// is the only lever, so highway legs are discovered via extra_info:['waytype'] on a first-pass
// route and then avoided the same way flagged segments already are: as buffered polygons.

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// ORS waytype values (extras.waytype): 1 = State Road, 2 = Road — both are "highway" class for
// this feature. 3 = Street, 4 = Path, 6 = Cycleway, 7 = Footway, 8 = Pedestrian are not.
const HIGHWAY_WAYTYPES = new Set([1, 2]);

const FLAG_AVOID_RADIUS_M = 60;
const HIGHWAY_AVOID_RADIUS_M = 20;

// Build a polygon ring approximating a circle around (lat, lng) with the given radius in metres.
function circleRing(lat, lng, radiusMeters, sides = 16) {
  const latOff = radiusMeters / 111320;
  const lngOff = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
  const ring = Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * 2 * Math.PI;
    return [lng + lngOff * Math.cos(angle), lat + latOff * Math.sin(angle)];
  });
  ring.push(ring[0]); // close the ring
  return ring;
}

// Buffer a single line segment (two [lng, lat] points) into a rectangular polygon ring, offset
// perpendicular to the segment direction by radiusMeters on each side.
function segmentBufferRing(p1, p2, radiusMeters) {
  const [lng1, lat1] = p1;
  const [lng2, lat2] = p2;
  const midLat = (lat1 + lat2) / 2;
  const latOff = radiusMeters / 111320;
  const lngOff = radiusMeters / (111320 * Math.cos(midLat * Math.PI / 180));

  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const len = Math.hypot(dx, dy) || 1;
  const perpX = (-dy / len) * lngOff;
  const perpY = (dx / len) * latOff;

  const ring = [
    [lng1 + perpX, lat1 + perpY],
    [lng2 + perpX, lat2 + perpY],
    [lng2 - perpX, lat2 - perpY],
    [lng1 - perpX, lat1 - perpY],
  ];
  ring.push(ring[0]);
  return ring;
}

function flaggedSegmentRings(flaggedGeos) {
  return flaggedGeos.map(({ lat, lng }) => circleRing(lat, lng, FLAG_AVOID_RADIUS_M));
}

// Find contiguous coordinate-index spans in `waytypeValues` ([startIdx, endIdx, value], ...)
// whose value is a highway waytype, and return buffer-polygon rings built from `coords` (the
// route's [lng, lat] coordinate array).
function highwaySpanRings(coords, waytypeValues) {
  const rings = [];
  for (const [start, end, value] of waytypeValues) {
    if (!HIGHWAY_WAYTYPES.has(value)) continue;
    for (let i = start; i < end && i + 1 < coords.length; i++) {
      rings.push(segmentBufferRing(coords[i], coords[i + 1], HIGHWAY_AVOID_RADIUS_M));
    }
  }
  return rings;
}

function toMultiPolygon(rings) {
  if (!rings.length) return null;
  return { type: 'MultiPolygon', coordinates: rings.map((ring) => [ring]) };
}

function hasHighwayLeg(waytypeValues) {
  return waytypeValues.some(([, , value]) => HIGHWAY_WAYTYPES.has(value));
}

async function doFetch(a, b, avoidPolygons) {
  if (!ORS_API_KEY) {
    throw new Error('VITE_ORS_API_KEY missing — add it to .env.local and restart the dev server');
  }

  const options = {};
  if (avoidPolygons) options.avoid_polygons = avoidPolygons;

  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      Authorization: ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [[a[1], a[0]], [b[1], b[0]]],
      preference: 'recommended',
      extra_info: ['waytype'],
      options,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`ORS ${res.status}:`, text);
    let msg;
    try { msg = JSON.parse(text).error?.message; } catch { msg = null; }
    throw new Error(msg || `ORS error ${res.status}`);
  }

  const feature = JSON.parse(text).features[0];
  const waytypeValues = feature.properties?.extras?.waytype?.values ?? [];
  return { coords: feature.geometry.coordinates, waytypeValues };
}

// Tries to route avoiding flagged zones (Tier A), then — if that route uses a highway-class leg —
// retries avoiding both the flagged zones and that leg (Tier B). Falls back to an unrestricted
// fetch only when Tier A itself is infeasible (e.g. the destination sits inside a flagged zone).
export async function fetchSafeRoute(a, b, flaggedGeos) {
  const flagRings = flaggedSegmentRings(flaggedGeos);
  const flagPolygons = toMultiPolygon(flagRings);

  let tierA;
  let flagsAvoided;
  try {
    tierA = await doFetch(a, b, flagPolygons);
    flagsAvoided = true;
  } catch (err) {
    if (!flagPolygons) throw err; // nothing to fall back from — a genuine routing failure
    console.warn('Could not avoid flagged zones, falling back to unrestricted routing:', err.message);
    tierA = await doFetch(a, b, null);
    flagsAvoided = false;
  }

  if (!hasHighwayLeg(tierA.waytypeValues)) {
    return { coords: tierA.coords, status: flagsAvoided ? 'safe' : 'caution-flagged' };
  }

  if (!flagsAvoided) {
    return { coords: tierA.coords, status: 'caution-both' };
  }

  const highwayRings = highwaySpanRings(tierA.coords, tierA.waytypeValues);
  const combinedPolygons = toMultiPolygon([...flagRings, ...highwayRings]);
  try {
    const tierB = await doFetch(a, b, combinedPolygons);
    // Avoiding the detected leg can route onto a *different* highway-class road elsewhere
    // (observed live: rerouting around one "Road" span picked up a separate "State Road" leg).
    // avoid_polygons is a hard constraint, so flags are still guaranteed avoided here — only
    // highway status needs rechecking.
    const status = hasHighwayLeg(tierB.waytypeValues) ? 'caution-highway' : 'safe';
    return { coords: tierB.coords, status };
  } catch (err) {
    console.warn('No street-level alternative to the highway leg, keeping the flag-avoiding route:', err.message);
    return { coords: tierA.coords, status: 'caution-highway' };
  }
}
```

> **Implementation note (2026-07-01):** live-tested against ORS with a real Sta. Mesa coordinate
> pair. The above `status` recheck on Tier B was added after testing showed Tier B can "succeed"
> while landing on a *different* highway-class road than the one it was told to avoid — without
> the recheck, that case was wrongly labeled `safe`.

- [ ] **Step 2: Run a syntax check on the new file**

Run: `node --check frontend/src/lib/routing.js`
Expected: no output, exit code 0 (the file is a plain ES module under `frontend/`'s `"type": "module"` `package.json`, so this validates syntax the same way `backend/functions/index.js` is checked per `agents/context/claude_context.md`).

- [ ] **Step 3: Replace `frontend/src/features/map/RouteLayer.jsx` with the thin wrapper**

Replace the entire file content with:

```jsx
// Safety-aware route between Point A and Point B.
// Tries to avoid both flagged segments and highway-class legs (the "yellow roads"); falls back to
// using one or both when ORS finds no street-level alternative. See src/lib/routing.js for the
// avoidance cascade.
import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { fetchSafeRoute } from '../../lib/routing.js';

export default function RouteLayer({ locationA, locationB, flaggedSegments = [], onError, onRouteStatus }) {
  const [route, setRoute] = useState(null); // { coords, status }

  useEffect(() => {
    if (!locationA || !locationB) { setRoute(null); onRouteStatus?.(null); return; }

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchSafeRoute(locationA, locationB, flaggedSegments)
        .then((r) => {
          if (!cancelled) {
            setRoute(r);
            onError?.(null);
            onRouteStatus?.(r.status);
          }
        })
        .catch((err) => {
          console.error('Route fetch failed:', err.message);
          if (!cancelled) { onError?.(err.message); onRouteStatus?.(null); }
        });
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [locationA, locationB, flaggedSegments]);

  if (!route) return null;

  return (
    <Source type="geojson" data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: route.coords } }}>
      <Layer
        type="line"
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{
          // Green = safe (no flagged segments, no highway legs). Orange = any caution-* state.
          'line-color': route.status === 'safe' ? '#2e7d32' : '#e65100',
          'line-width': 4,
          'line-opacity': 0.8,
        }}
      />
    </Source>
  );
}
```

- [ ] **Step 4: Build the frontend**

Run (from `frontend/`): `npm run build`
Expected: build succeeds (no import errors from the new `lib/routing.js` path or removed exports).

- [ ] **Step 5: Manually verify the bug is fixed and Tier B triggers**

From `frontend/`, run `npm run dev` and open `http://localhost:5173` (no emulators needed for this
check — flagged-segment data only changes which polygons get sent, not whether ORS itself accepts
the request). With the map loaded:
1. Click "+ Set destination" and click a point on the map roughly 300–500m from the default Point A
   marker (`ZONE_CENTER`, 14.5985, 121.0102) — e.g. near 14.6010, 121.0150 (verified via direct ORS
   testing during design to include a highway-class ("Road") leg on the default no-avoidance path,
   so it reliably exercises the Tier B branch).
2. Confirm a route line renders (previously: every request errored with the `avoid_features`
   message — confirm that error no longer appears in the browser console).
3. Confirm the badge shows either "Safe route" (Tier B found a street-level alternative) or the
   caution badge (Tier B had no alternative) — either is a valid pass; what fails this step is a
   thrown error or no line rendering at all.

- [ ] **Step 6: Commit**

Ask the user before running `git commit` (this user reviews and commits manually — do not commit
without an explicit go-ahead in this turn).

```bash
git add frontend/src/lib/routing.js frontend/src/features/map/RouteLayer.jsx
git commit -m "fix: replace invalid avoid_features with a highway-aware avoid_polygons cascade"
```

---

### Task 2: Split the route badge into specific caution reasons

**Files:**
- Modify: `frontend/src/features/map/ZoneMap.jsx:24` (state comment) and `:108-116` (badge JSX)

**Interfaces:**
- Consumes: `route.status` values from Task 1's `fetchSafeRoute` — `'safe' | 'caution-flagged' | 'caution-highway' | 'caution-both' | null`.

- [ ] **Step 1: Update the `routeStatus` state comment**

In `frontend/src/features/map/ZoneMap.jsx`, change:

```js
  const [routeStatus, setRouteStatus] = useState(null); // 'safe' | 'caution' | null
```

to:

```js
  const [routeStatus, setRouteStatus] = useState(null); // 'safe' | 'caution-flagged' | 'caution-highway' | 'caution-both' | null
```

- [ ] **Step 2: Replace the single caution badge with three reason-specific badges**

Change:

```jsx
        {routeStatus === 'safe' && (
          <span className="map-ctrl-safe">Safe route</span>
        )}
        {routeStatus === 'caution' && (
          <span className="map-ctrl-caution">Caution: passes flagged area</span>
        )}
```

to:

```jsx
        {routeStatus === 'safe' && (
          <span className="map-ctrl-safe">Safe route</span>
        )}
        {routeStatus === 'caution-flagged' && (
          <span className="map-ctrl-caution">Caution: passes a flagged area</span>
        )}
        {routeStatus === 'caution-highway' && (
          <span className="map-ctrl-caution">Caution: uses a major road</span>
        )}
        {routeStatus === 'caution-both' && (
          <span className="map-ctrl-caution">Caution: passes a flagged area and uses a major road</span>
        )}
```

(Reuses the existing `.map-ctrl-caution` CSS class for all three — only the copy differs, so no
`styles.css` change is needed.)

- [ ] **Step 3: Build the frontend**

Run (from `frontend/`): `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manually verify all four badge states**

Needs the emulators running per `LOCAL_DEV.md` Tier 1 (`firebase emulators:start --project
demo-saferroute --only "auth,firestore"` in one terminal, `npm run dev` in `frontend/` in another),
since flagging a segment requires an authenticated write.

1. **`caution-flagged`:** In the side panel, report "Poor lighting" (or any condition) on "Teresa
   St (PUP side)" (`seg_teresa_st`, 14.5996, 121.0108). Set Point A near the default `ZONE_CENTER`
   (14.5985, 121.0102) and Point B just north of Teresa St, e.g. 14.6005, 121.0110, so the direct
   walking path passes close to the flagged point. Confirm the badge reads "Caution: passes a
   flagged area" (or "Safe route" if ORS found a clean detour — in that case pick a B slightly
   closer to the segment and retry until the flagged zone is actually crossed).
2. **`caution-highway`:** Clear the destination, then set Point B near 14.6010, 121.0150 (the pair
   confirmed during design to include a "Road"-class leg). With no segment flagged nearby, confirm
   the badge reads "Caution: uses a major road" — or "Safe route" if Tier B found an alternative;
   if it's "Safe route" on every attempt, try a B further along Magsaysay Blvd (`seg_magsaysay_jeeps`,
   14.5968, 121.0085) instead, which idea.md identifies as a primary jeepney corridor.
3. **`caution-both`:** Combine both — flag a segment that also sits on a highway-leg route (e.g.
   report a condition on `seg_magsaysay_jeeps` then route through it) and confirm the badge reads
   "Caution: passes a flagged area and uses a major road."
4. **`safe`:** Set Point B somewhere a few hundred metres away with no flagged segments and (per
   step above) no highway leg in the baseline route — confirm "Safe route."

Record which states were actually observed; it's fine if ORS's real street network makes one state
hard to force in this specific zone — note that in the task wrap-up rather than fabricating a pass.

- [ ] **Step 5: Commit**

Ask the user before running `git commit`.

```bash
git add frontend/src/features/map/ZoneMap.jsx
git commit -m "feat: split route caution badge into flagged/highway/both reasons"
```

---

### Task 3: Update docs to match the implemented behavior

**Files:**
- Modify: `docs/system-design.md`
- Modify: `docs/qa-test-plan.md`

**Interfaces:**
- None (documentation only).

- [ ] **Step 1: Fix the Mermaid context diagram in `docs/system-design.md`**

Change:

```
        Auth["Firebase Auth<br/>(anonymous or Google sign-in)"]
        FS["Cloud Firestore<br/>segments + reports"]
        CF["Cloud Function (optional)<br/>Gemini proxy — F-004"]
        Maps["Google Maps JS API"]
        Gem["Gemini API"]
```

to:

```
        Auth["Firebase Auth<br/>(anonymous or Google sign-in)"]
        FS["Cloud Firestore<br/>segments + reports"]
        CF["Cloud Function (optional)<br/>Gemini proxy — F-004"]
        Maps["Map tiles + routing<br/>(MapLibre GL + OpenFreeMap + ORS)"]
        Gem["Gemini API"]
```

And change:

```
    subgraph Client["Web App — React + Vite (Firebase Hosting)"]
        UI["Map UI + Report UI + Route-check UI"]
        SDK["Firebase JS SDK + Maps JS SDK"]
    end
```

to:

```
    subgraph Client["Web App — React + Vite (Firebase Hosting)"]
        UI["Map UI + Report UI + Route-check UI"]
        SDK["Firebase JS SDK + MapLibre GL JS"]
    end
```

- [ ] **Step 2: Resolve the `[unverified]` Maps SDK note**

Change:

```
`[unverified]` — exact Maps SDK surface (Maps JS vs. Routes API) for F-003 route lookup; see
"Key technology choices."
```

to:

```
**Resolved (2026-07-01):** the build uses MapLibre GL JS + OpenFreeMap vector tiles (free, no API
key) for rendering, and OpenRouteService (ORS) foot-walking directions for point-to-point routing
— not Google Maps Platform as originally planned here. See "Key technology choices" below and
`docs/superpowers/specs/2026-07-01-highway-aware-routing-design.md` for the routing behavior.
```

- [ ] **Step 3: Update the Components table row**

Change:

```
| **Google Maps JS API** | Map tiles, segment overlays (F-001), route/segment lookup (F-003) | Map render + geometry | API key (HTTP-referrer restricted) |
```

to:

```
| **MapLibre GL + OpenFreeMap** | Map tiles, segment overlays (F-001) | Map render + geometry | None — OpenFreeMap is keyless |
| **OpenRouteService (ORS)** | Point-to-point routing, safety-scored to avoid flagged segments and highway-class legs where possible | Route geometry | API key (ships in client bundle; not yet referrer-restricted — open item, see Security must-dos in `AGENTS.md`) |
```

- [ ] **Step 4: Update the Key technology choices row**

Change:

```
| **Google Maps JavaScript API** | Mandated-tech fit; mature map + overlays for F-001/F-003 | Billing/key required; route-vs-segment matching is non-trivial | OpenStreetMap/Leaflet (no Google-tech credit; would fail the requirement) |
```

to:

```
| **MapLibre GL + OpenFreeMap** | Free, keyless vector tiles; matches F-001's map-render need without Google Maps billing/key setup | Loses the "Google-tech" hackathon credit for the map surface itself (Firebase + Gemini still satisfy it) | Google Maps JavaScript API (rejected post-build in favor of a keyless tile source) |
| **OpenRouteService foot-walking** | Free-tier directions API with the `avoid_polygons` lever needed for safety-scored routing (no road-class avoid option exists for this profile, so polygon-based avoidance is the only mechanism — see the 2026-07-01 routing spec) | Foot-walking's `avoid_features` does not support road-class avoidance, forcing a 2-tier fetch cascade instead of a single request; ORS key currently ships unrestricted in the client bundle | Google Routes API (would restore the Google-tech credit but reopens the original key/billing setup cost) |
```

- [ ] **Step 5: Add the routing behavior to the Data flow section**

After the existing `**UJ-001 — Pre-trip route check (F-003/F-001):**` block (ending with the exact
line `4. User decides: proceed / re-route / pay. (No SOS or dispatch anywhere — BR-002.)`) and
before `**UJ-002 — One-tap segment report (F-002):**`, insert:

```
**Map point-to-point routing (beyond original F-003 scope, added 2026-07-01):**
1. User sets Point A (defaults to zone center) and clicks a destination Point B on the map.
2. App fetches a route from ORS, preferring one that avoids both flagged-segment zones and
   highway-class legs ("yellow roads"); when no street-level alternative exists for one or both,
   it falls back and labels the result accordingly.
3. Route line renders green ("safe") or orange, with a badge naming the reason for caution:
   passes a flagged area, uses a major road, or both. Capped at 2 ORS calls per request — see
   `docs/superpowers/specs/2026-07-01-highway-aware-routing-design.md` for the full cascade.
```

- [ ] **Step 6: Update the Integration points bullet**

Change:

```
- **Google Maps JS API** — loaded in-browser via `<script>`; key restricted by HTTP referrer + enabled-API allowlist. Failure mode: key/billing not set → blank map; mitigate with a clear error state and seeded static fallback.
```

to:

```
- **MapLibre GL + OpenFreeMap** — vector tiles loaded over HTTPS, no API key. Failure mode: tile host unreachable → blank map; mitigate with a clear error state.
- **OpenRouteService (ORS)** — HTTP directions API called client-side with `VITE_ORS_API_KEY`. Failure mode: missing/invalid key or quota exceeded → route line doesn't render, error surfaced in the map controls. The key is **not yet referrer-restricted** (open item — ORS support for this should be confirmed before a public deploy).
```

- [ ] **Step 7: Update the Authentication & authorization section item 3**

Change:

```
3. **Google Maps JS API key** — exposed in client bundle by design; **must be restricted by HTTP referrer + API allowlist** in Cloud Console, else the key is abusable/billable by anyone. This is the only viable authz for a browser key.
```

to:

```
3. **OpenRouteService (ORS) API key** — exposed in the client bundle (same pattern as a browser
   Maps key would have been). **Not yet restricted** — confirm whether ORS supports an equivalent
   to HTTP-referrer restriction before a public deploy; until then, treat it as an open security
   item, not a resolved gate. MapLibre's OpenFreeMap tiles require no key at all.
```

- [ ] **Step 8: Add the new test cases to `docs/qa-test-plan.md`**

After `### TC-016 — Offline behavior` and its existing 4 lines, and before `## Acceptance
criteria`, insert:

```
### TC-017 — Point-to-point route avoids both flags and highways when possible
- **Covers:** Map routing (beyond F-001/F-003 scope — see docs/06 update, 2026-07-01)
- **Preconditions:** No flagged segments near the chosen Point A/B pair; a street-level path exists.
- **Steps:** Set Point A and Point B; wait for the route line to render.
- **Expected:** Badge reads "Safe route"; line is green.

### TC-018 — Route flags caution when it must cross a flagged segment
- **Covers:** Map routing
- **Preconditions:** A segment near the direct A→B path has an active report (within the freshness window).
- **Steps:** Set Point A and Point B straddling the flagged segment; wait for the route to render.
- **Expected:** Badge reads "Caution: passes a flagged area"; line is orange.

### TC-019 — Route flags caution when it must use a major road
- **Covers:** Map routing
- **Preconditions:** No flagged segments near the chosen pair; the only walkable path includes a
  highway-class ("Road"/"State Road") leg per ORS.
- **Steps:** Set Point A and Point B; wait for the route to render.
- **Expected:** Badge reads "Caution: uses a major road"; line is orange.

### TC-020 — Route flags caution for both reasons when neither can be avoided
- **Covers:** Map routing
- **Preconditions:** A flagged segment sits on the only available path, and that path also
  includes a highway-class leg.
- **Steps:** Set Point A and Point B accordingly; wait for the route to render.
- **Expected:** Badge reads "Caution: passes a flagged area and uses a major road"; line is orange.
```

- [ ] **Step 9: Update the traceability matrix note line**

Change:

```
Negative/edge TCs: TC-009 (stale flags), TC-010 (freshness boundary), TC-011 (empty zone), TC-016 (offline).
```

to:

```
Negative/edge TCs: TC-009 (stale flags), TC-010 (freshness boundary), TC-011 (empty zone), TC-016 (offline).
Map routing TCs: TC-017 (safe), TC-018 (caution — flagged), TC-019 (caution — highway), TC-020 (caution — both).
```

- [ ] **Step 10: Commit**

Ask the user before running `git commit`.

```bash
git add docs/system-design.md docs/qa-test-plan.md
git commit -m "docs: reflect the real MapLibre/ORS routing stack and new safety-scored behavior"
```