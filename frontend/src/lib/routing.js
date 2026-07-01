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
