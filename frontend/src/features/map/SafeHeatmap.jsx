// Safe-zone density layer — an ambient "cloud" of positive safety signals (well-lit streets,
// 24/7 stores, high foot traffic, police/security presence) from
// backend/data/safe/safe-heatmap.json (mirrored verbatim into ../../data/safe-heatmap.json, same
// convention as heatmap-baseline.json). Visual only, no click interaction: unlike ReportHeatmap's
// red/yellow layers, these are static landmark points, not live reports, so there's nothing to
// join against segments or select on click.
import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import SAFE_HEATMAP_POINTS from '../../data/safe-heatmap.json';

export default function SafeHeatmap({ show }) {
  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: SAFE_HEATMAP_POINTS.map((p) => ({
      type: 'Feature',
      properties: { weight: p.weight },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }), []);

  if (!show) return null;

  return (
    <Source id="heatmap-green-source" type="geojson" data={geojson}>
      <Layer
        id="heatmap-green-layer"
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
            0.15, 'rgba(180,230,190,0.18)',
            0.35, 'rgba(120,200,140,0.4)',
            0.6, 'rgba(70,170,95,0.6)',
            0.85, 'rgba(40,135,65,0.8)',
            1, 'rgba(20,95,40,0.97)'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            11, 17,
            15, 52
          ],
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            11, 0.8,
            15, 1.0
          ]
        }}
      />
    </Source>
  );
}
