// Shared loading-state primitives — shimmering placeholders shown while network-bound content
// (map tiles/style, the client-side WASM route computation) hasn't resolved yet, so slow
// connections see a filled-in shape instead of a blank pane. Reduced-motion is handled globally
// (styles.css's `prefers-reduced-motion` rule zeroes all animation durations app-wide).
export function Skeleton({ width = '100%', height = 14, radius = 8, style, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

// A map-shaped placeholder — city-block rectangles, two roads, a pulsing pin — shown over a
// MapLibre <Map> until its `onLoad` fires, so a slow style/tile fetch reads as "loading a map"
// instead of an empty surface.
export function MapSkeleton({ className = '', hidden = false }) {
  return (
    <div className={`map-skeleton${hidden ? ' map-skeleton--hidden' : ''} ${className}`.trim()} aria-hidden="true">
      <span className="skeleton map-skeleton-block" style={{ top: '16%', left: '8%', width: '30%', height: '24%' }} />
      <span className="skeleton map-skeleton-block" style={{ top: '58%', left: '54%', width: '36%', height: '26%' }} />
      <span className="skeleton map-skeleton-block" style={{ top: '12%', left: '62%', width: '24%', height: '18%' }} />
      <span className="skeleton map-skeleton-road" style={{ top: '46%', left: 0, width: '100%', height: 5 }} />
      <span className="skeleton map-skeleton-road" style={{ top: 0, left: '46%', width: 5, height: '100%' }} />
      <span className="map-skeleton-pin" />
    </div>
  );
}
