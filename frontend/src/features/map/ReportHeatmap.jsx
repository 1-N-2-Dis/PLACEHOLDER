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
// SEED_SEGMENTS/WELL_USED_SEGMENTS counterpart (e.g. seg_magsaysay_jeeps). They're curated seed
// content, not live user reports, so there's no real "people liking it" signal for them — they
// keep a static weight from their curated corroborationCount instead of the live likes formula
// below.
const BASELINE_MARKERS = HEATMAP_BASELINE.filter((h) => h.severity === 'red' || h.severity === 'yellow').map((h) => ({
  segmentId: h.segmentId,
  lng: h.geo.lng,
  lat: h.geo.lat,
  severity: h.severity,
  weight: Math.min(h.corroborationCount || 1, HEAT_COUNT_CAP),
}));

export default function ReportHeatmap({ reports, segments, showRed, showYellow }) {
  const markers = useMemo(() => {
    // Cloud size scales with real, cross-user likes on the report(s) at this segment — a
    // baseline weight of 1 keeps a freshly-flagged segment visible even before anyone's liked
    // it yet, capped so one heavily-liked report can't swamp the whole layer.
    const live = buildIncidentMarkers(reports, segments).map((m) => ({
      ...m,
      weight: Math.min(1 + m.likeCount, HEAT_COUNT_CAP),
    }));
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
        properties: { weight: m.weight, segmentId: m.segmentId },
        geometry: { type: 'Point', coordinates: [m.lng, m.lat] }
      }))
    };
  }, [markers]);

  const yellowGeojson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: markers.filter(m => m.severity === 'yellow').map(m => ({
        type: 'Feature',
        properties: { weight: m.weight, segmentId: m.segmentId },
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
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': [
                'interpolate', ['linear'], ['zoom'],
                11, 0.5,
                15, 1.0
              ],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.15, 'rgba(255,205,150,0.18)',
                0.35, 'rgba(255,150,115,0.4)',
                0.6, 'rgba(224,95,75,0.6)',
                0.85, 'rgba(185,35,35,0.8)',
                1, 'rgba(130,10,10,0.97)'
              ],
              'heatmap-radius': [
                'interpolate', ['linear'], ['zoom'],
                11, 13,
                15, 40
              ],
              'heatmap-opacity': [
                'interpolate', ['linear'], ['zoom'],
                11, 0.9,
                15, 1.0
              ]
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
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': [
                'interpolate', ['linear'], ['zoom'],
                11, 0.5,
                15, 1.0
              ],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.15, 'rgba(255,245,190,0.18)',
                0.35, 'rgba(255,215,120,0.4)',
                0.6, 'rgba(255,180,30,0.6)',
                0.85, 'rgba(224,120,10,0.8)',
                1, 'rgba(185,75,0,0.97)'
              ],
              'heatmap-radius': [
                'interpolate', ['linear'], ['zoom'],
                11, 13,
                15, 40
              ],
              'heatmap-opacity': [
                'interpolate', ['linear'], ['zoom'],
                11, 0.9,
                15, 1.0
              ]
            }}
          />
        </Source>
      )}
    </Fragment>
  );
}
