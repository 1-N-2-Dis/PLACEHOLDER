// Severity-aware, multi-route line rendering between Point A and Point B.
// Fetches up to 3 ranked route candidates (safest first — see src/lib/routing.js's tiered
// cascade) and renders each as its own line, all in the same "safe" green, opacity stepped by
// rank so the safest route reads as the recommendation and the rest as lower-emphasis
// alternatives (not a caution color — a route only appears here at all if it's one of the
// ranked candidates ORS could produce).
import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { fetchSafeRoutes } from '../../lib/routing.js';

// Rank 0 (safest) drawn fully opaque; each further alternative fades out. Capped at 3 ranks —
// fetchSafeRoutes never returns more.
const OPACITY_BY_RANK = [0.9, 0.45, 0.25];

export default function RouteLayer({ locationA, locationB, flaggedReports = [], onError, onRoutes }) {
  const [routes, setRoutes] = useState(null); // Array<{ coords, status, tier }> | null

  useEffect(() => {
    if (!locationA || !locationB) { setRoutes(null); onRoutes?.([]); return; }

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchSafeRoutes(locationA, locationB, flaggedReports)
        .then((r) => {
          if (!cancelled) {
            setRoutes(r);
            onError?.(null);
            onRoutes?.(r);
          }
        })
        .catch((err) => {
          console.error('Route fetch failed:', err.message);
          if (!cancelled) { setRoutes(null); onError?.(err.message); onRoutes?.([]); }
        });
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [locationA, locationB, flaggedReports]);

  if (!routes || !routes.length) return null;

  // Draw lowest-rank first, safest last, so the safest (highest-opacity) line renders on top.
  return (
    <>
      {routes.map((route, rank) => (
        <Source
          key={route.tier}
          id={`route-alt-${rank}`}
          type="geojson"
          data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: route.coords } }}
        >
          <Layer
            type="line"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{
              'line-color': '#2e7d32',
              'line-width': 4,
              'line-opacity': OPACITY_BY_RANK[rank] ?? 0.25,
            }}
          />
        </Source>
      )).reverse()}
    </>
  );
}
