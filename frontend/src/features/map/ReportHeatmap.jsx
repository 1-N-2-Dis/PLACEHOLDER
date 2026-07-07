// Community heatmap layer of validated (yellow/red severity) reports (F-010).
// Renders native MapLibre WebGL heatmap layers to create perfect spatial density clouds
// resembling a weather radar system.
import { useMemo, Fragment } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { buildIncidentMarkers, HEAT_COUNT_CAP } from '../../lib/heatmap.js';
import { HEATMAP_BASELINE } from '../../data/heatmap-baseline.js';

// Baseline hotspots carry their own geo (unlike live reports, which only carry a segmentId and
// are joined against the frontend's static segment list) — so they're turned into markers
// directly rather than via buildIncidentMarkers, and never drop silently for a location with no
// SEED_SEGMENTS/WELL_USED_SEGMENTS counterpart (e.g. seg_magsaysay_jeeps).
const BASELINE_MARKERS = HEATMAP_BASELINE.filter((h) => h.severity === 'red' || h.severity === 'yellow').map((h) => ({
  segmentId: h.segmentId,
  lng: h.geo.lng,
  lat: h.geo.lat,
  severity: h.severity,
  count: Math.min(h.corroborationCount || 1, HEAT_COUNT_CAP),
}));

export default function ReportHeatmap({ reports, segments, showRed, showYellow, localLikes = {} }) {
  const markers = useMemo(() => {
    const live = buildIncidentMarkers(reports, segments);
    const liveIds = new Set(live.map((m) => m.segmentId));
    // A baseline hotspot yields to a live report on the same segment — the live report is the
    // fresher, real signal.
    return [...live, ...BASELINE_MARKERS.filter((m) => !liveIds.has(m.segmentId))];
  }, [reports, segments]);

  const redGeojson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: markers.filter(m => m.severity === 'red').map(m => ({
        type: 'Feature',
        properties: { weight: m.count + (localLikes[m.segmentId] ? 3 : 0), segmentId: m.segmentId },
        geometry: { type: 'Point', coordinates: [m.lng, m.lat] }
      }))
    };
  }, [markers]);

  const yellowGeojson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: markers.filter(m => m.severity === 'yellow').map(m => ({
        type: 'Feature',
        properties: { weight: m.count + (localLikes[m.segmentId] ? 3 : 0), segmentId: m.segmentId },
        geometry: { type: 'Point', coordinates: [m.lng, m.lat] }
      }))
    };
  }, [markers]);

  return (
    <Fragment>
      {showRed && (
        <Source id="heatmap-red-source" type="geojson" data={redGeojson}>
          <Layer
            id="heatmap-red-layer"
            type="heatmap"
            paint={{
              'heatmap-weight': ['min', ['+', ['get', 'weight'], 1], 10],
              'heatmap-intensity': [
                'interpolate', ['linear'], ['zoom'],
                11, 0.5,
                15, 1.0
              ],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.3, 'rgba(255,180,100,0.1)',
                0.6, 'rgba(220,80,50,0.25)',
                0.85, 'rgba(180,20,20,0.5)',
                1, 'rgba(120,0,0,0.75)'
              ],
              'heatmap-radius': [
                'interpolate', ['linear'], ['zoom'],
                11, 15,
                15, 45
              ],
              'heatmap-opacity': 0.85
            }}
          />
        </Source>
      )}
      {showYellow && (
        <Source id="heatmap-yellow-source" type="geojson" data={yellowGeojson}>
          <Layer
            id="heatmap-yellow-layer"
            type="heatmap"
            paint={{
              'heatmap-weight': ['min', ['+', ['get', 'weight'], 1], 10],
              'heatmap-intensity': [
                'interpolate', ['linear'], ['zoom'],
                11, 0.5,
                15, 1.0
              ],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.3, 'rgba(255,240,150,0.1)',
                0.6, 'rgba(255,180,0,0.25)',
                0.85, 'rgba(220,100,0,0.5)',
                1, 'rgba(180,60,0,0.75)'
              ],
              'heatmap-radius': [
                'interpolate', ['linear'], ['zoom'],
                11, 15,
                15, 45
              ],
              'heatmap-opacity': 0.85
            }}
          />
        </Source>
      )}
    </Fragment>
  );
}
