// Safety-aware, severity-tiered routes between Point A and Point B (frontend/src/lib/routing.js).
// Strategy: reports carry an AI-assigned severity (green | yellow | red — see backend/server
// submitReport). Red segments are hard-avoided, yellow segments are soft-avoided (crossed only
// when there's truly no street-level alternative), green segments are informational only and
// never enter avoidance. Returns exactly 2 route candidates whenever a second path exists at
// all — "Recommended" (safest found) and "Alternative" — or a single route only when the
// recommended path is the sole way through (F-005).
//
// Routing runs entirely client-side: a Rust/WASM A* engine (frontend/rust/router), hosted in a
// Web Worker (frontend/src/workers/routeWorker.js) so pathfinding never blocks the main thread or
// map panning, over a preprocessed pedestrian graph covering a 20km radius around ZONE_CENTER
// (frontend/public/graph/pup-20km.bin — built by scripts/fetch-graph.mjs + scripts/build-graph.mjs
// from OSM/Overpass data). This replaced OpenRouteService (ADR-0003, see
// docs/06-system-design.md): no external routing API, no key, no quota, no cold start — the
// demo keeps working even if a routing provider would've been down.
//
// The engine returns each route's crossedRed/crossedYellow/usedHighway/redUnavoidable flags
// directly (computed from which penalized graph edges the path used) — describeStatus() below
// just collapses those into the badge vocabulary ZoneMap.jsx's STATUS_META already expects.

// Hard-avoid / soft-avoid radii — must match frontend/rust/router/src/penalties.rs's
// RED_AVOID_RADIUS_M / YELLOW_AVOID_RADIUS_M (kept here too since ZoneMap.jsx needs
// YELLOW_AVOID_RADIUS_M for on-route marker visibility, unrelated to the engine itself).
export const RED_AVOID_RADIUS_M = 90;
export const YELLOW_AVOID_RADIUS_M = 60;

let worker = null;
let nextRequestId = 0;
const pending = new Map(); // request id -> { resolve, reject }

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/routeWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const { id, routes, error } = data;
      const request = pending.get(id);
      if (!request) return;
      pending.delete(id);
      if (error) request.reject(new Error(error));
      else request.resolve(routes);
    };
    worker.onerror = (event) => {
      // A worker-level failure (e.g. the wasm module itself failed to load) has no request id to
      // target — reject everything currently in flight rather than hang forever.
      for (const { reject } of pending.values()) {
        reject(new Error(event.message || 'Routing worker failed to load'));
      }
      pending.clear();
    };
  }
  return worker;
}

function requestRoutes(a, b, flaggedReports) {
  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, a, b, flaggedReports });
  });
}

// Collapse a severity+highway pair into one of a small set of badge states, prioritizing red
// (loudest) over yellow over highway-only.
function describeStatus({ crossedRed, crossedYellow, usedHighway, redUnavoidable }) {
  if (crossedRed) return redUnavoidable ? 'caution-red-unavoidable' : 'caution-red';
  if (crossedYellow) return 'caution-yellow';
  if (usedHighway) return 'caution-highway';
  return 'safe';
}

const TIER_BY_RANK = ['safest', 'shortest'];

// Fetches exactly 2 severity-tiered route candidates — safest (rank 0) + shortest
// (rank 1) — whenever a second path exists at all; 1 only when the safest path is the sole
// way through. Never 3.
export async function fetchSafeRoutes(a, b, flaggedReports) {
  const routes = await requestRoutes(a, b, flaggedReports);
  if (!routes?.length) throw new Error('No route found.');
  return routes.map((route, rank) => ({
    coords: route.coords,
    status: describeStatus(route),
    tier: TIER_BY_RANK[rank] ?? `alternative-${rank}`,
  }));
}

// Straight-line distance in metres between two lat/lng points (flat-earth approximation, fine at
// this zone's scale).
function metersBetween(lat1, lng1, lat2, lng2) {
  const latOff = (lat2 - lat1) * 111320;
  const midLat = (lat1 + lat2) / 2;
  const lngOff = (lng2 - lng1) * 111320 * Math.cos(midLat * Math.PI / 180);
  return Math.hypot(latOff, lngOff);
}

// Nearest distance (metres) from `point` ({lat,lng}) to any vertex of a route's coordinate
// array ([lng,lat][]). Vertex-based, not a true point-to-segment distance — an approximation
// consistent with the graph's node density, and precise enough for a "is this report near my
// route" check.
export function nearestDistanceToRoute(routeCoords, point) {
  let min = Infinity;
  for (const [lng, lat] of routeCoords) {
    const d = metersBetween(lat, lng, point.lat, point.lng);
    if (d < min) min = d;
  }
  return min;
}

// Named hazards (each { segmentId, geo, severity, title }) that sit within their own severity's
// avoid radius of a route — used both to name a specific incident in a route's status note
// (instead of a generic phrase) and to compare two routes' exposure. Grounded only in real
// report/hotspot data (title), never invented (BR-006's spirit, applied client-side).
export function hazardsNearRoute(routeCoords, hazards) {
  return hazards.filter((hazard) => {
    if (hazard.severity !== 'red' && hazard.severity !== 'yellow') return false;
    const radius = hazard.severity === 'red' ? RED_AVOID_RADIUS_M : YELLOW_AVOID_RADIUS_M;
    return nearestDistanceToRoute(routeCoords, hazard.geo) <= radius;
  });
}

// The single closest named hazard of a given severity within radius — for picking which
// incident's title to surface in a route's note (closest wins when more than one qualifies).
export function nearestNamedHazard(routeCoords, hazards, severity) {
  const radius = severity === 'red' ? RED_AVOID_RADIUS_M : YELLOW_AVOID_RADIUS_M;
  let nearest = null;
  let nearestDist = Infinity;
  for (const hazard of hazards) {
    if (hazard.severity !== severity || !hazard.title) continue;
    const dist = nearestDistanceToRoute(routeCoords, hazard.geo);
    if (dist <= radius && dist < nearestDist) {
      nearest = hazard;
      nearestDist = dist;
    }
  }
  return nearest;
}
