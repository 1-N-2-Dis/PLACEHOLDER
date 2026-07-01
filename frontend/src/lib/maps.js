// Zone config for SaferRoute. Used by ZoneMap.jsx (MapLibre GL via react-map-gl).
// Traces to: docs/06-system-design.md (F-001/F-003).
//
// Single zone only (BR-003): PUP Main, Sta. Mesa, Manila. Approximate center.
// OpenFreeMap liberty style — free OSM vector tiles, includes buildings. No API key required.

export const ZONE_CENTER = { lat: 14.5985, lng: 121.0102 };
export const ZONE_ZOOM = 15;

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
