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

export default function RouteLayer({ locationA, locationB, flaggedReports = [], onError, onRoutes, selectedIndex = 0 }) {
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

  // We want the selected route to render on top. We can reorder the array we map over so the selected index is last.
  const ordered = routes.map((route, rank) => ({ route, rank })).sort((a, b) => {
    if (a.rank === selectedIndex) return 1;
    if (b.rank === selectedIndex) return -1;
    return b.rank - a.rank; // otherwise reverse order so safest (0) is on top of 1, etc.
  });

  return (
    <>
      {ordered.map(({ route, rank }) => {
        const isSelected = rank === selectedIndex;
        return (
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
                'line-width': isSelected ? 6 : 4,
                'line-opacity': isSelected ? 1.0 : 0.25,
              }}
            />
          </Source>
        );
      })}
    </>
  );
}
