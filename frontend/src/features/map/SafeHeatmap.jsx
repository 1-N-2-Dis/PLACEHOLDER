// Safe-spot layer — discrete landmark points (well-lit streets, 24/7 stores, high foot traffic,
// police/security presence) from backend/data/safe/safe-heatmap.json (mirrored verbatim into
// ../../data/safe-heatmap.json, same convention as heatmap-baseline.json). Rendered as individual
// circle markers (not a blurred density layer) so each spot reads as a specific, tappable place —
// consistent with the seg-dot markers used for report flags. Tapping a dot opens a popup bubble
// naming that spot, the same interaction pattern as SegmentFlag's report popups.
import { useEffect, useMemo, useState } from 'react';
import { Source, Layer, Popup, useMap } from 'react-map-gl/maplibre';
import { ShieldCheck } from 'lucide-react';
import SAFE_HEATMAP_POINTS from '../../data/safe-heatmap.json';

const LAYER_ID = 'heatmap-green-layer';
const SAFE_GREEN = '#2e7d32';

export default function SafeHeatmap({ show }) {
  const { current: map } = useMap();
  const [selected, setSelected] = useState(null);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: SAFE_HEATMAP_POINTS.map((p) => ({
      type: 'Feature',
      properties: { weight: p.weight, safetyType: p.safety_type, landmarkName: p.landmark_name },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }), []);

  // Bound directly to the underlying maplibre-gl instance (rather than react-map-gl's declarative
  // onClick) so this layer's click/hover behavior stays self-contained here instead of routed
  // through ZoneMap's segment-selection click handler, which these static landmark points have no
  // part in.
  useEffect(() => {
    if (!map || !show) {
      setSelected(null);
      return undefined;
    }
    const mapInstance = map.getMap();

    function handleClick(e) {
      const feature = e.features?.[0];
      if (!feature) return;
      setSelected({
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
        safetyType: feature.properties.safetyType,
        landmarkName: feature.properties.landmarkName,
      });
    }
    function handleEnter() { mapInstance.getCanvas().style.cursor = 'pointer'; }
    function handleLeave() { mapInstance.getCanvas().style.cursor = ''; }

    mapInstance.on('click', LAYER_ID, handleClick);
    mapInstance.on('mouseenter', LAYER_ID, handleEnter);
    mapInstance.on('mouseleave', LAYER_ID, handleLeave);
    return () => {
      mapInstance.off('click', LAYER_ID, handleClick);
      mapInstance.off('mouseenter', LAYER_ID, handleEnter);
      mapInstance.off('mouseleave', LAYER_ID, handleLeave);
    };
  }, [map, show]);

  if (!show) return null;

  return (
    <>
      <Source id="heatmap-green-source" type="geojson" data={geojson}>
        <Layer
          id={LAYER_ID}
          type="circle"
          paint={{
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              11, ['+', 1, ['*', ['get', 'weight'], 1]],
              16, ['+', 2.5, ['*', ['get', 'weight'], 3]]
            ],
            'circle-color': SAFE_GREEN,
            'circle-opacity': [
              'interpolate', ['linear'], ['zoom'],
              11, 0.55,
              16, 0.88
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': [
              'interpolate', ['linear'], ['zoom'],
              11, 0.5,
              16, 0.95
            ]
          }}
        />
      </Source>

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          offset={10}
          closeButton
          closeOnClick={false}
          onClose={() => setSelected(null)}
        >
          <div className="segment-detail">
            <div className="severity-line" style={{ color: SAFE_GREEN }}>
              <ShieldCheck size={14} /> {selected.safetyType}
            </div>
            <strong>{selected.landmarkName}</strong>
          </div>
        </Popup>
      )}
    </>
  );
}
