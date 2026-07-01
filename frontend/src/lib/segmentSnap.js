// Nearest-segment snapping for map-pin report locations.
// Role: segments are point geometry (see data/seed-segments.js), not road polylines, so "only
// pin on roads, not places/houses" is enforced by snapping a tap to the nearest known segment
// point and rejecting taps too far from any of them (see docs/superpowers/specs/
// 2026-07-01-report-wizard-frontend-design.md). A snapped pin always resolves to an existing
// segmentId — it never introduces a new, unlisted location.
const EARTH_RADIUS_M = 6371000;

export const MAX_SNAP_METERS = 40;

export function haversineMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Returns { segment, distanceMeters } for the closest segment to tapPoint, or null if segments is empty.
export function findNearestSegment(segments, tapPoint) {
  let best = null;
  for (const segment of segments) {
    const distanceMeters = haversineMeters(segment.geo, tapPoint);
    if (!best || distanceMeters < best.distanceMeters) {
      best = { segment, distanceMeters };
    }
  }
  return best;
}
