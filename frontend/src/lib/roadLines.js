// Groups WELL_USED_SEGMENTS points into per-street polylines so a report pin can snap onto the
// road itself, not just the nearest sampled point (see PinMap.jsx). Uses only data already in
// data/seed-segments.js — no new fetching, no new segmentIds.
//
// Groups are an explicit segmentId table, not inferred from name/id suffixes: several single-point
// entries ("Road 2".."Road 12") have ids that look structurally identical to a real multi-point
// index suffix (e.g. "seg_road_2" vs "seg_pureza_st_2"), so stripping a trailing "_<n>" would
// wrongly merge unrelated single-point roads into one fake cross-town line. See seed-segments.js's
// own point-count comments for where these lists come from.
import { MAX_SNAP_METERS } from './segmentSnap.js';

const MULTI_POINT_STREETS = [
  ['seg_pureza_st_1', 'seg_pureza_st_2', 'seg_pureza_st_3', 'seg_pureza_st_4', 'seg_pureza_st_5', 'seg_pureza_st_6'],
  ['seg_anonas_st_1', 'seg_anonas_st_2', 'seg_anonas_st_3', 'seg_anonas_st_4', 'seg_anonas_st_5', 'seg_anonas_st_6', 'seg_anonas_st_7', 'seg_anonas_st_8'],
  ['seg_v_francisco_st_1', 'seg_v_francisco_st_2'],
  ['seg_albina_st_1', 'seg_albina_st_2'],
  ['seg_altura_ext_1', 'seg_altura_ext_2', 'seg_altura_ext_3'],
  ['seg_teresa_wellused_1', 'seg_teresa_wellused_2'],
  ['seg_hipodromo_st_1', 'seg_hipodromo_st_2', 'seg_hipodromo_st_3', 'seg_hipodromo_st_4', 'seg_hipodromo_st_5', 'seg_hipodromo_st_6', 'seg_hipodromo_st_7'],
  ['seg_road_1_1', 'seg_road_1_2'],
  ['seg_road_5_1', 'seg_road_5_2', 'seg_road_5_3', 'seg_road_5_4'],
  ['seg_jh_panganiban_st_1', 'seg_jh_panganiban_st_2', 'seg_jh_panganiban_st_3', 'seg_jh_panganiban_st_4'],
  ['seg_c_arellano_st_1', 'seg_c_arellano_st_2', 'seg_c_arellano_st_3', 'seg_c_arellano_st_4', 'seg_c_arellano_st_5'],
  ['seg_gregorio_araneta_st_1', 'seg_gregorio_araneta_st_2'],
  ['seg_m_araullo_st_1', 'seg_m_araullo_st_2', 'seg_m_araullo_st_3', 'seg_m_araullo_st_4'],
  ['seg_jose_abad_santos_st_1', 'seg_jose_abad_santos_st_2', 'seg_jose_abad_santos_st_3', 'seg_jose_abad_santos_st_4', 'seg_jose_abad_santos_st_5'],
  ['seg_valencia_st_1', 'seg_valencia_st_2', 'seg_valencia_st_3'],
];

// Builds { name, points }[] road lines from a segments array. Only segments matching a known
// multi-point group become a line; everything else (including all SEED_SEGMENTS pins) stays a
// single point with no line — callers should still point-snap against the full segments list as
// a fallback for those.
export function buildRoadLines(segments) {
  const bySegmentId = new Map(segments.map((s) => [s.segmentId, s]));
  const roads = [];
  for (const ids of MULTI_POINT_STREETS) {
    const points = ids.map((id) => bySegmentId.get(id)).filter(Boolean);
    if (points.length < 2) continue; // data not present (e.g. a filtered/partial segments list)
    const name = points[0].name.replace(/\s+(?:\(\d+\)|\d+)$/, '');
    roads.push({ name, points });
  }
  return roads;
}

// Local flat-plane meters, accurate enough at this zone's ~2km scale. origin anchors the
// projection so cos(lat) stays consistent across a single point-pair's calculation.
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

// Projects tapPoint onto the nearest point along any road's polyline. Returns
// { point, distanceMeters, nearerSegment } for the closest projection within MAX_SNAP_METERS —
// nearerSegment is whichever of the two straddling points is closer, and supplies the real
// segmentId/name a report actually gets filed under. Returns null if nothing is close enough.
export function projectPointToRoadLines(roadLines, tapPoint) {
  let best = null;
  for (const road of roadLines) {
    const { points } = road;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i].geo;
      const b = points[i + 1].geo;
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
        best = {
          point: toLatLng(a, projLocal),
          distanceMeters,
          nearerSegment: t < 0.5 ? points[i] : points[i + 1],
        };
      }
    }
  }
  if (!best || best.distanceMeters > MAX_SNAP_METERS) return null;
  return best;
}
