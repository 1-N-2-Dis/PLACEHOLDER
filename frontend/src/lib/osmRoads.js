// OSM road snapping for map-pin report locations (F-002 amendment, 30km coverage).
// Role: the report pin map no longer snaps to hand-sampled seed points — it snaps onto the real
// road geometry already present in the basemap's vector tiles (OpenFreeMap, OpenMapTiles schema:
// `transportation` carries every road's LineString, `transportation_name` carries names). This
// gives accurate pin-on-road coverage for every street within ROAD_COVERAGE_RADIUS_M of the
// zone center with no extra data fetching.
//
// A pin on an arbitrary road can't resolve to a seeded segmentId, and the backend persists only
// segmentId on a report (backend/server/index.js submitReport — name/geo are never stored). So
// dynamic pins ENCODE location + road name inside the segmentId itself:
//   seg_osm_<lat>_<lng>_<slug>   e.g. seg_osm_14.6021_121.0089_pureza-street
// Coordinates are rounded to 4 decimals (~11m grid) so re-reports of the same spot share an id —
// the backend's dedupe-by-segmentId query and corroboration counting keep working unchanged.
// parseRoadSegmentId() recovers { geo, name } for display (see App.jsx's dynamic segments).
import { ZONE_CENTER } from './maps.js';
import { haversineMeters, MAX_SNAP_METERS } from './segmentSnap.js';

export const ROAD_COVERAGE_RADIUS_M = 20000;

// The OpenMapTiles `transportation` layer also carries non-road ways — rail/transit lines, ferry
// routes, aerialways. Any consumer adding a road-query layer over this source-layer should apply
// this filter so those ways neither render nor accept a snap (e.g. a road under an elevated rail
// line, like Magsaysay Blvd under LRT-2, shouldn't pick up the rail line's name).
export const NON_ROAD_CLASSES = ['rail', 'transit', 'ferry', 'aerialway'];
export const ROAD_FILTER = ['!', ['in', ['get', 'class'], ['literal', NON_ROAD_CLASSES]]];

// Pixel half-size of the queryRenderedFeatures box around a tap. Generous on purpose: the box
// only gathers candidate roads — the MAX_SNAP_METERS check below is what actually rejects taps.
const QUERY_BOX_PX = 30;

const DYNAMIC_ID_PREFIX = 'seg_osm_';
const SLUG_MAX_LEN = 40;

export function isWithinCoverage(point) {
  return haversineMeters(ZONE_CENTER, point) <= ROAD_COVERAGE_RADIUS_M;
}

// ── Local flat-plane meters (moved from the retired roadLines.js) — accurate enough at the
// few-hundred-meter scale of a single snap calculation.
const M_PER_DEG_LAT = 111320;
function metersPerDegLng(lat) {
  return M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}
function toLocalMeters(origin, point) {
  return {
    x: (point.lng - origin.lng) * metersPerDegLng(origin.lat),
    y: (point.lat - origin.lat) * M_PER_DEG_LAT,
  };
}
function toLatLng(origin, local) {
  return {
    lat: origin.lat + local.y / M_PER_DEG_LAT,
    lng: origin.lng + local.x / metersPerDegLng(origin.lat),
  };
}

// Flattens a queried feature's geometry into an array of [lng, lat] coordinate lines.
function featureLines(feature) {
  const { type, coordinates } = feature.geometry || {};
  if (type === 'LineString') return [coordinates];
  if (type === 'MultiLineString') return coordinates;
  return [];
}

// Projects tapPoint onto the nearest point along any of the features' line geometries.
// Returns { point: {lat,lng}, distanceMeters, feature } or null if features yield no lines.
function projectOntoFeatures(features, tapPoint) {
  let best = null;
  for (const feature of features) {
    for (const line of featureLines(feature)) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = { lng: line[i][0], lat: line[i][1] };
        const b = { lng: line[i + 1][0], lat: line[i + 1][1] };
        const pB = toLocalMeters(a, b);
        const pT = toLocalMeters(a, tapPoint);

        const lenSq = pB.x * pB.x + pB.y * pB.y;
        let t = lenSq === 0 ? 0 : (pT.x * pB.x + pT.y * pB.y) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const projLocal = { x: pB.x * t, y: pB.y * t };
        const dx = pT.x - projLocal.x;
        const dy = pT.y - projLocal.y;
        const distanceMeters = Math.sqrt(dx * dx + dy * dy);

        if (!best || distanceMeters < best.distanceMeters) {
          best = { point: toLatLng(a, projLocal), distanceMeters, feature };
        }
      }
    }
  }
  return best;
}

// Human label when transportation_name has no named road near the tap. `class` is the
// OpenMapTiles transportation class (motorway/primary/…/service/path).
function classLabel(roadClass) {
  if (!roadClass) return 'Unnamed road';
  if (roadClass === 'path') return 'Unnamed path';
  if (roadClass === 'service') return 'Unnamed service road';
  return 'Unnamed street';
}

// Snaps a tap to the nearest rendered road. `map` is the MapLibre instance, `screenPoint` the
// tap's {x, y} in screen px, `tapPoint` its {lat, lng}. `roadLayerId`/`nameLayerId` are the two
// style layers PinMap adds over the basemap's transportation source-layers.
// Returns { point: {lat,lng}, name, distanceMeters } or null if no road is within MAX_SNAP_METERS.
export function snapToRenderedRoad(map, screenPoint, tapPoint, { roadLayerId, nameLayerId }) {
  const box = [
    [screenPoint.x - QUERY_BOX_PX, screenPoint.y - QUERY_BOX_PX],
    [screenPoint.x + QUERY_BOX_PX, screenPoint.y + QUERY_BOX_PX],
  ];

  const roads = map.queryRenderedFeatures(box, { layers: [roadLayerId] });
  const snapped = projectOntoFeatures(roads, tapPoint);
  if (!snapped || snapped.distanceMeters > MAX_SNAP_METERS) return null;

  // Name lookup: nearest named feature in the invisible transportation_name layer. Falls back to
  // a class-based label — plenty of alleys/service roads in OSM carry no name.
  let name = null;
  const named = map
    .queryRenderedFeatures(box, { layers: [nameLayerId] })
    .filter((f) => typeof f.properties?.name === 'string' && f.properties.name);
  const nearestNamed = projectOntoFeatures(named, snapped.point);
  if (nearestNamed && nearestNamed.distanceMeters <= MAX_SNAP_METERS) {
    name = nearestNamed.feature.properties.name;
  }

  return {
    point: snapped.point,
    name: name || classLabel(snapped.feature.properties?.class),
    distanceMeters: snapped.distanceMeters,
  };
}

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LEN)
    .replace(/-+$/, '');
}

// 4 decimals ≈ 11m grid — close taps on the same spot produce the same id.
function quantize(coord) {
  return coord.toFixed(4);
}

export function makeRoadSegmentId(geo, name) {
  const slug = slugify(name);
  const base = `${DYNAMIC_ID_PREFIX}${quantize(geo.lat)}_${quantize(geo.lng)}`;
  return slug ? `${base}_${slug}` : base;
}

// Recovers { geo, name } from a dynamic road segmentId, or null for seeded/unknown ids.
// The slug de-slugs to Title Case for display ("pureza-street" -> "Pureza Street").
export function parseRoadSegmentId(segmentId) {
  if (typeof segmentId !== 'string') return null;
  const match = segmentId.match(/^seg_osm_(-?\d+(?:\.\d+)?)_(-?\d+(?:\.\d+)?)(?:_([a-z0-9-]+))?$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = match[3]
    ? match[3].split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
    : 'Unnamed road';
  return { geo: { lat, lng }, name };
}
