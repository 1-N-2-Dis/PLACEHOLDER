// Owly-branded loading states for the map page — replaces generic shimmer skeletons with the
// GuidHer mascot so both the "map still loading" panel and the "computing a route" notification
// read as Owly working on it, not a blank system placeholder.
import Owly from '../../components/Owly.jsx';

const DOT_COUNT = 5;

// Five dots that pop in a staggered wave, looping — a CSS keyframe animation rather than a JS
// interval, so it's automatically covered by styles.css's global prefers-reduced-motion rule
// (animation-duration collapses to ~0, freezing the dots at rest) like the rest of the app's
// loading indicators (skeleton-pulse, live-pulse).
function OwlyLoadingText({ className = '' }) {
  return (
    <span className={`owly-loading-text ${className}`.trim()}>
      Loading
      <span className="owly-loading-dots">
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <span key={i} className="owly-loading-dot" style={{ '--i': i }} />
        ))}
      </span>
    </span>
  );
}

// Shown over the MapLibre <Map> until its `onLoad` fires — replaces the block/road/pin skeleton
// with Owly heading out, so a slow style/tile fetch reads as "Owly's on the way" instead of an
// empty surface.
export function OwlyMapLoader({ hidden = false }) {
  return (
    <div className={`map-owly-loader${hidden ? ' map-owly-loader--hidden' : ''}`} aria-hidden="true">
      <Owly size={110} pose="ontheway" />
      <OwlyLoadingText />
    </div>
  );
}

// Shown in the same top-of-map slot as RouteNotify while the WASM engine is still computing a
// route, so a slow device or large graph fetch reads as "Owly's working on it" instead of a
// shimmering placeholder.
export function OwlyRouteNotifyLoading() {
  return (
    <div className="route-notify route-notify--loading" role="status">
      <Owly size={22} pose="ontheway" className="route-notify-owly" />
      <OwlyLoadingText className="route-notify-text" />
    </div>
  );
}
