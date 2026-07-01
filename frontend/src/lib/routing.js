// Safety-aware, severity-tiered routes between Point A and Point B (frontend/src/lib/routing.js).
// Strategy: reports carry an AI-assigned severity (green | yellow | red — see backend/functions
// submitReport). Red segments are hard-avoided, yellow segments are soft-avoided (crossed only
// when there's truly no street-level alternative), green segments are informational only and
// never enter avoidance. Returns up to 3 ranked route candidates (safest first) instead of one,
// reusing the same avoid_polygons + waytype-inspection mechanism the original single-route
// cascade used.
//
// Highway legs ("yellow roads" in the map style — unrelated to AI severity="yellow") are NOT
// hard-avoided the way red/yellow-severity reports are: a highway alone carries no reported
// danger, so it's only worth detouring around when the detour is roughly comparable in distance
// (HIGHWAY_DETOUR_TOLERANCE). Otherwise the direct/closer route is kept and just labeled
// caution-highway — a road-class caution should never silently discard the closest path.
//
// ORS's foot-walking profile has no avoid-by-road-class option (avoid_features only supports
// fords/steps for this profile — 'highways' is invalid and errors, confirmed live). avoid_polygons
// is the only lever, so highway legs are discovered via extra_info:['waytype'] on a first-pass
// route and then avoided the same way severity zones already are: as buffered polygons.
//
// Call budget: up to 4 ORS calls per route request (safest, safest+highway-refine, red-only,
// unrestricted) — up from the original 2-call ceiling, in exchange for 2-3 ranked alternatives.
// Requests that can't add a distinct alternative (e.g. no reports at all on the way) are skipped
// rather than fetched-and-deduped, so the common no-flag case still costs only 1-2 calls.

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// ORS waytype values (extras.waytype): 1 = State Road, 2 = Road — both are "highway" class for
// this feature. 3 = Street, 4 = Path, 6 = Cycleway, 7 = Footway, 8 = Pedestrian are not.
const HIGHWAY_WAYTYPES = new Set([1, 2]);

export const RED_AVOID_RADIUS_M = 90;    // hard avoid — matches an AI-classified "dangerous" report
export const YELLOW_AVOID_RADIUS_M = 60; // soft avoid — matches an AI-classified "a bit dangerous" report
const HIGHWAY_AVOID_RADIUS_M = 20;

// A highway leg alone (no reported danger there) is a much weaker caution signal than an actual
// red/yellow severity report — so it's only worth detouring around if the detour is roughly
// comparable in length. Beyond this multiplier, the highway route is treated as "the closest
// option" and kept (with a caution-highway note) rather than discarded in favor of a much longer
// walk just to dodge a road color.
const HIGHWAY_DETOUR_TOLERANCE = 1.3;

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

// Split flagged reports into red (hard-avoid) and yellow (soft-avoid) ring sets. Green reports
// never enter avoidance — informational only (still rendered as map markers by the caller).
function severityRings(flaggedReports) {
  const redRings = [];
  const yellowRings = [];
  for (const { geo, severity } of flaggedReports) {
    if (severity === 'red') redRings.push(circleRing(geo.lat, geo.lng, RED_AVOID_RADIUS_M));
    else if (severity === 'yellow') yellowRings.push(circleRing(geo.lat, geo.lng, YELLOW_AVOID_RADIUS_M));
  }
  return { redRings, yellowRings };
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

// Straight-line distance in metres between two lat/lng points, using the same flat-earth
// approximation as circleRing/segmentBufferRing (fine at this zone's scale).
function metersBetween(lat1, lng1, lat2, lng2) {
  const latOff = (lat2 - lat1) * 111320;
  const midLat = (lat1 + lat2) / 2;
  const lngOff = (lng2 - lng1) * 111320 * Math.cos(midLat * Math.PI / 180);
  return Math.hypot(latOff, lngOff);
}

// Total walking length of a route ([lng,lat][]), in metres — sum of consecutive-vertex
// distances. Used to decide whether a highway-avoiding detour is worth taking (see
// HIGHWAY_DETOUR_TOLERANCE) rather than assuming any detour is automatically better.
function routeLengthMeters(coords) {
  let total = 0;
  for (let i = 0; i + 1 < coords.length; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    total += metersBetween(lat1, lng1, lat2, lng2);
  }
  return total;
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

// Route candidates are deduped by comparing their coordinate arrays (rounded to ~1m precision).
// ORS returns byte-identical geometry for identical constraint sets, so an exact-match check is
// reliable here — no fuzzy geometric comparison needed.
function routeKey(coords) {
  return coords.map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join('|');
}

// Collapse a severity+highway pair into one of a small set of badge states, prioritizing red
// (loudest) over yellow over highway-only.
function describeStatus({ severityCrossed, highwayUsed, redUnavoidable }) {
  if (severityCrossed === 'red') return redUnavoidable ? 'caution-red-unavoidable' : 'caution-red';
  if (severityCrossed === 'yellow') return 'caution-yellow';
  if (highwayUsed) return 'caution-highway';
  return 'safe';
}

// Fetch the "safest" tier: avoid both red and yellow zones. If the resulting route uses a
// highway leg, try refining away from it too — but only ADOPT that refinement if it doesn't cost
// a disproportionate amount of extra walking distance (HIGHWAY_DETOUR_TOLERANCE). A highway leg
// alone, with no reported danger on it, doesn't warrant forcing a much longer detour — the direct
// route is kept instead, tagged highwayUsed so it still surfaces as a caution note, not silently
// dropped. Throws only if the initial (severity-avoiding) fetch itself is infeasible — the caller
// falls back to a looser tier in that case.
async function fetchSafestTier(a, b, redRings, yellowRings) {
  const polygons = toMultiPolygon([...redRings, ...yellowRings]);
  const direct = await doFetch(a, b, polygons);

  if (!hasHighwayLeg(direct.waytypeValues)) {
    return { coords: direct.coords, highwayUsed: false };
  }

  const directLength = routeLengthMeters(direct.coords);
  const highwayRings = highwaySpanRings(direct.coords, direct.waytypeValues);
  const combined = toMultiPolygon([...redRings, ...yellowRings, ...highwayRings]);

  let refined;
  try {
    refined = await doFetch(a, b, combined);
  } catch (err) {
    console.warn('No street-level alternative to the highway leg, keeping the direct route:', err.message);
    return { coords: direct.coords, highwayUsed: true };
  }

  // Avoiding the detected leg can route onto a *different* highway-class road elsewhere
  // (observed live) — recheck rather than assume the refinement actually got rid of it.
  const refinedStillHasHighway = hasHighwayLeg(refined.waytypeValues);
  const refinedLength = routeLengthMeters(refined.coords);
  const worthwhile = !refinedStillHasHighway && refinedLength <= directLength * HIGHWAY_DETOUR_TOLERANCE;

  if (worthwhile) {
    return { coords: refined.coords, highwayUsed: false };
  }

  console.warn(
    `Highway detour not worthwhile (avoided: ${Math.round(refinedLength)}m vs direct: ${Math.round(directLength)}m, `
    + `still on a highway: ${refinedStillHasHighway}) — keeping the direct, closer route.`,
  );
  return { coords: direct.coords, highwayUsed: true };
}

// Tries, in order: avoid red+yellow ("safest"), avoid red only ("red-only", may cross yellow),
// no avoidance ("unrestricted"). Each tier that succeeds and differs geometrically from prior
// tiers becomes one of up to 3 ranked route candidates, safest first. Tiers that can't add a
// distinct alternative are skipped rather than fetched (e.g. "red-only" is skipped entirely when
// there's no red to differentially avoid), keeping the common no-flag case cheap.
export async function fetchSafeRoutes(a, b, flaggedReports) {
  const { redRings, yellowRings } = severityRings(flaggedReports);
  const routes = [];
  const seenKeys = new Set();

  function addCandidate(coords, status, tier) {
    const key = routeKey(coords);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    routes.push({ coords, status, tier });
    return true;
  }

  try {
    const safest = await fetchSafestTier(a, b, redRings, yellowRings);
    addCandidate(safest.coords, describeStatus({ severityCrossed: 'none', highwayUsed: safest.highwayUsed }), 'safest');
  } catch (err) {
    if (!redRings.length && !yellowRings.length) throw err; // nothing to fall back from — a genuine routing failure
    console.warn('Could not avoid red/yellow zones, falling back to a looser tier:', err.message);
  }

  let redOnlyFailed = false;
  if (redRings.length) {
    try {
      const redOnly = await doFetch(a, b, toMultiPolygon(redRings));
      addCandidate(
        redOnly.coords,
        describeStatus({ severityCrossed: yellowRings.length ? 'yellow' : 'none', highwayUsed: hasHighwayLeg(redOnly.waytypeValues) }),
        'red-only',
      );
    } catch (err) {
      console.warn('Red zone is genuinely unavoidable:', err.message);
      redOnlyFailed = true;
    }
  }

  if (redRings.length || yellowRings.length) {
    const unrestricted = await doFetch(a, b, null);
    addCandidate(
      unrestricted.coords,
      describeStatus({
        severityCrossed: redRings.length ? 'red' : 'yellow',
        highwayUsed: hasHighwayLeg(unrestricted.waytypeValues),
        redUnavoidable: redOnlyFailed && redRings.length > 0,
      }),
      'unrestricted',
    );
  }

  if (!routes.length) throw new Error('No route found.');
  return routes;
}

// Nearest distance (metres) from `point` ({lat,lng}) to any vertex of a route's coordinate
// array ([lng,lat][]). Vertex-based, not a true point-to-segment distance — an approximation
// consistent with the buffer-radius approximations used elsewhere in this file, and precise
// enough at ORS's route-vertex density for a "is this report near my route" check.
export function nearestDistanceToRoute(routeCoords, point) {
  let min = Infinity;
  for (const [lng, lat] of routeCoords) {
    const d = metersBetween(lat, lng, point.lat, point.lng);
    if (d < min) min = d;
  }
  return min;
}
