// Distance helpers for map-pin report locations.
// Role: shared haversine + snap threshold for lib/osmRoads.js, which snaps a tap onto the
// nearest real road rendered from the basemap's vector tiles (the old nearest-seed-point
// snapping this file used to implement was retired with the tile-based road coverage change).
// "Only pin on roads, not places/houses" is enforced by rejecting taps farther than
// MAX_SNAP_METERS from any road line (see docs/superpowers/specs/
// 2026-07-01-report-wizard-frontend-design.md).
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
