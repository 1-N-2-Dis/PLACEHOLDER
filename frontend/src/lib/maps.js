// Zone config for SaferRoute. Used by ZoneMap.jsx (MapLibre GL via react-map-gl).
// Traces to: docs/06-system-design.md (F-001/F-003).
//
// Single zone only (BR-003): PUP Main, Sta. Mesa, Manila. Approximate center.
// OpenFreeMap positron/dark styles — free OSM vector tiles, flat 2D (no 3D building
// extrusion, unlike the "liberty" style this replaced). No API key required.

export const ZONE_CENTER = { lat: 14.5985, lng: 121.0102 };
export const ZONE_ZOOM = 15;

// OSM-sourced coords for LRT-2 Pureza Station — the zone's canonical "recommended route"
// destination (Dashboard hero card, RoutesPage's default recommended route).
export const PUREZA_STATION = { lat: 14.60167, lng: 121.00519 };

// Keeps the map from panning/zooming out past the Philippines (SW/NE corners, [lng, lat]).
export const PHILIPPINES_BOUNDS = [
  [116.9, 4.6],
  [126.6, 21.4],
];

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
export const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

export function getMapStyle(theme) {
  return theme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE;
}
