// Safety-aware route between Point A and Point B.
// Tries to avoid both flagged segments and highway-class legs (the "yellow roads"); falls back to
// using one or both when ORS finds no street-level alternative. See src/lib/routing.js for the
// avoidance cascade.
import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { fetchSafeRoute } from '../../lib/routing.js';

export default function RouteLayer({ locationA, locationB, flaggedSegments = [], onError, onRouteStatus }) {
  const [route, setRoute] = useState(null); // { coords, status }

  useEffect(() => {
    if (!locationA || !locationB) { setRoute(null); onRouteStatus?.(null); return; }

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchSafeRoute(locationA, locationB, flaggedSegments)
        .then((r) => {
          if (!cancelled) {
            setRoute(r);
            onError?.(null);
            onRouteStatus?.(r.status);
          }
        })
        .catch((err) => {
          console.error('Route fetch failed:', err.message);
          if (!cancelled) { onError?.(err.message); onRouteStatus?.(null); }
        });
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [locationA, locationB, flaggedSegments]);

  if (!route) return null;

  return (
    <Source type="geojson" data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: route.coords } }}>
      <Layer
        type="line"
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{
          // Green = safe (no flagged segments, no highway legs). Orange = any caution-* state.
          'line-color': route.status === 'safe' ? '#2e7d32' : '#e65100',
          'line-width': 4,
          'line-opacity': 0.8,
        }}
      />
    </Source>
  );
}
