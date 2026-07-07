// F-001 zone safety map (P0).
// Role: render the PUP Sta. Mesa zone with segment flags, mock location (A), and optional destination (B).
// Traces to: docs/03-prd.md F-001, docs/06-system-design.md.
//
// Uses MapLibre GL JS via react-map-gl + OpenFreeMap vector tiles (OSM data, includes buildings).
// Routing: client-side Rust/WASM A* engine (ADR-0003), safety-first — avoids flagged segments,
// falls back if no safe path exists. See frontend/src/lib/routing.js.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useMemo } from 'react';
import Map, { NavigationControl, Layer, Marker } from 'react-map-gl/maplibre';
import { CheckCircle2, AlertTriangle, AlertOctagon, MapPin, X, Layers } from 'lucide-react';
import { useTheme } from '../../lib/theme.jsx';
import { ZONE_CENTER, ZONE_ZOOM, getMapStyle, PHILIPPINES_BOUNDS } from '../../lib/maps.js';
import { segmentStatus } from '../../lib/freshness.js';
import { nearestDistanceToRoute, hazardsNearRoute, nearestNamedHazard, YELLOW_AVOID_RADIUS_M } from '../../lib/routing.js';
import { HEATMAP_BASELINE } from '../../data/heatmap-baseline.js';
import SegmentFlag from './SegmentFlag.jsx';
import MockLocation from './MockLocation.jsx';
import DestinationMarker from './DestinationMarker.jsx';
import RouteLayer from './RouteLayer.jsx';
import ReportHeatmap from './ReportHeatmap.jsx';
import RouteCheck from '../route-check/RouteCheck.jsx';
import RiskSummary from '../risk-summary/RiskSummary.jsx';

const INITIAL_A = [ZONE_CENTER.lat, ZONE_CENTER.lng];

// Route status -> short badge copy + icon. Kept small and flat rather than enumerating every
// severity/highway combination (routing.js's describeStatus already collapses to these).
const STATUS_META = {
  safe: { copy: 'Avoids flagged areas', Icon: CheckCircle2 },
  'caution-highway': { copy: 'Uses a major road', Icon: AlertTriangle },
  'caution-yellow': { copy: 'Passes a caution area', Icon: AlertTriangle },
  'caution-red': { copy: 'Passes a dangerous area', Icon: AlertOctagon },
  'caution-red-unavoidable': { copy: 'Dangerous area could not be avoided', Icon: AlertOctagon },
};

// Route note copy — names the specific report/hotspot a route passes near instead of a generic
// phrase, when one is known (grounded in real data; falls back to STATUS_META's generic copy
// when nothing specific is nearby, e.g. a highway-only caution).
function routeNoteCopy(route, hazards) {
  const meta = STATUS_META[route.status];
  if (route.status === 'caution-red' || route.status === 'caution-red-unavoidable') {
    const hazard = nearestNamedHazard(route.coords, hazards, 'red');
    if (hazard) {
      return route.status === 'caution-red-unavoidable'
        ? `Could not avoid: ${hazard.title}`
        : `Passes near: ${hazard.title}`;
    }
  } else if (route.status === 'caution-yellow') {
    const hazard = nearestNamedHazard(route.coords, hazards, 'yellow');
    if (hazard) return `Passes near: ${hazard.title}`;
  }
  return meta ? meta.copy : route.status;
}

export default function ZoneMap({ segments, latest, reports, selectedId, onSelect, initialDestination = null, destinationLabel = null }) {
  const { theme } = useTheme();
  const [locationA, setLocationA] = useState(INITIAL_A);
  // Pre-place Point B if navigated from Routes page
  const [locationB, setLocationB] = useState(initialDestination);
  const [settingB, setSettingB] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routes, setRoutes] = useState([]); // Array<{ coords, status, tier }>, safest first
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showHeatmapRed, setShowHeatmapRed] = useState(false);
  const [showHeatmapYellow, setShowHeatmapYellow] = useState(false);
  const [localLikes, setLocalLikes] = useState({});

  // Hazards passed to RouteLayer as avoid zones — reports flagged tonight (live Firestore),
  // merged with the baked-in heatmap-baseline.json hotspots (backend/data/heatmap-baseline.json,
  // via frontend/src/data/heatmap-baseline.js). Baseline hotspots carry their own geo, so they
  // apply even where the frontend has no matching segment (e.g. seg_magsaysay_jeeps) and don't
  // depend on ever seeding them into Firestore. A live report on the same segment wins over its
  // baseline counterpart (fresher, real signal). Missing severity on a live report (written
  // before AI classification shipped) defaults to 'red', preserving today's hard-avoid behavior.
  // Memoized so RouteLayer's useEffect only re-fires when reports actually change.
  const hazards = useMemo(() => {
    const live = segments
      .filter((seg) => segmentStatus(latest.get(seg.segmentId)) === 'flagged_tonight')
      .map((seg) => {
        const report = latest.get(seg.segmentId);
        return { segmentId: seg.segmentId, geo: seg.geo, severity: report?.severity || 'red', title: report?.title || null };
      });
    const liveIds = new Set(live.map((h) => h.segmentId));
    const baseline = HEATMAP_BASELINE
      .filter((h) => (h.severity === 'red' || h.severity === 'yellow') && !liveIds.has(h.segmentId))
      .map((h) => ({ segmentId: h.segmentId, geo: h.geo, severity: h.severity, title: h.title }));
    return [...live, ...baseline];
  }, [segments, latest]);

  const selectedRouteCoords = routes[selectedRouteIndex]?.coords || null;

  // Segments that sit near the currently selected route — shared by low-concern marker
  // visibility (which just needs the IDs; see SegmentFlag.jsx) and RouteCheck's AI assessment
  // (which also needs the display name, since segments aren't a Firestore collection the backend
  // can look up itself — see docs/09-data-model.md).
  const onRouteSegments = useMemo(() => {
    if (!selectedRouteCoords) return [];
    return segments.filter(
      (seg) => nearestDistanceToRoute(selectedRouteCoords, seg.geo) <= YELLOW_AVOID_RADIUS_M,
    );
  }, [segments, selectedRouteCoords]);
  const onRouteSegmentIds = useMemo(
    () => new Set(onRouteSegments.map((s) => s.segmentId)),
    [onRouteSegments],
  );

  // One-line comparison of the two routes' hazard exposure, shown above the route picker so the
  // safest recommendation is explicit rather than left to the per-route badges alone.
  const routeSummary = useMemo(() => {
    if (routes.length < 2) {
      if (routes.length === 1 && routes[0].status === 'safe') return 'The safest route is completely clear.';
      return 'Showing the safest available route — no shorter alternative found.';
    }
    const [safest, shortest] = routes;
    if (shortest.status === 'safe' || shortest.status === 'caution-highway') {
      return 'Both routes avoid all known flagged areas.';
    }
    return 'We recommend the Safest route. The Shortest path passes through flagged areas.';
  }, [routes]);

  function handleMapClick(e) {
    if (settingB) {
      setLocationB([e.lngLat.lat, e.lngLat.lng]);
      setSettingB(false);
      return;
    }

    if (e.features && e.features.length > 0) {
      const feature = e.features.find(f => f.layer.id.startsWith('heatmap-red') || f.layer.id.startsWith('heatmap-yellow'));
      if (feature?.properties?.segmentId) {
        onSelect(feature.properties.segmentId);
        return;
      }
    }
  }

  function clearDestination() {
    setLocationB(null);
    setSettingB(false);
    setRouteError(null);
    setRoutes([]);
    setSelectedRouteIndex(0);
  }

  function handleRoutes(nextRoutes) {
    setRoutes(nextRoutes);
    setSelectedRouteIndex(0);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        initialViewState={{
          longitude: initialDestination ? initialDestination[1] : ZONE_CENTER.lng,
          latitude: initialDestination ? initialDestination[0] : ZONE_CENTER.lat,
          zoom: initialDestination ? 15 : ZONE_ZOOM,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={getMapStyle(theme)}
        cursor={settingB ? 'crosshair' : 'grab'}
        interactiveLayerIds={useMemo(() => {
          const ids = [];
          if (showHeatmapRed) {
            ids.push('heatmap-red-layer');
          }
          if (showHeatmapYellow) {
            ids.push('heatmap-yellow-layer');
          }
          return ids;
        }, [showHeatmapRed, showHeatmapYellow])}
        onClick={handleMapClick}
        attributionControl={false}
        maxBounds={PHILIPPINES_BOUNDS}
        minZoom={5}
      >
        <NavigationControl position="top-left" />

        <MockLocation position={locationA} onMove={setLocationA} />

        {locationB && (
          <DestinationMarker position={locationB} onMove={setLocationB} />
        )}
        {locationB && (
          <RouteLayer
            locationA={locationA}
            locationB={locationB}
            flaggedReports={hazards}
            onError={setRouteError}
            onRoutes={handleRoutes}
            selectedIndex={selectedRouteIndex}
          />
        )}

        {theme === 'dark' && (
          <Layer
            id="highlight-roads-dark"
            type="line"
            source="openmaptiles"
            source-layer="transportation"
            filter={['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk', 'minor', 'service', 'track', 'path'], true, false]}
            paint={{
              'line-color': 'rgba(255, 255, 255, 0.07)',
              'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 13, 2, 20, 15],
            }}
            beforeId="highway_name_other"
          />
        )}

        <ReportHeatmap reports={reports} segments={segments} showRed={showHeatmapRed} showYellow={showHeatmapYellow} localLikes={localLikes} />

        {(() => {
          const renderedIds = new Set();
          const allFlags = segments.map((seg) => {
            let report = latest.get(seg.segmentId);
            let status = segmentStatus(report);
            
            if (!report || status !== 'flagged_tonight') {
              const baseline = HEATMAP_BASELINE.find(b => b.segmentId === seg.segmentId);
              if (baseline) {
                report = baseline;
                status = 'flagged_tonight';
              }
            }
            renderedIds.add(seg.segmentId);
            return { seg, report, status };
          });

          for (const b of HEATMAP_BASELINE) {
            if (!renderedIds.has(b.segmentId) && (b.severity === 'red' || b.severity === 'yellow')) {
              allFlags.push({
                seg: { segmentId: b.segmentId, name: b.name || b.segmentId, geo: b.geo },
                report: b,
                status: 'flagged_tonight'
              });
              renderedIds.add(b.segmentId);
            }
          }

          return allFlags.map(({ seg, report, status }) => (
            <SegmentFlag
              key={seg.segmentId}
              segment={seg}
              report={report}
              status={status}
              isOpen={selectedId === seg.segmentId}
              onSelect={onSelect}
              isOnRoute={onRouteSegmentIds.has(seg.segmentId)}
              isLiked={!!localLikes[seg.segmentId]}
              onLike={(liked) => setLocalLikes(prev => ({ ...prev, [seg.segmentId]: liked }))}
            />
          ));
        })()}

        {/* Route Bubble Notifications */}
        {routes.length > 0 && routes.map((route, i) => {
          // Stagger the bubbles along the path (35% and 65%) so they don't overlap 
          // if the two routes share segments in the middle.
          const ratio = i === 0 ? 0.35 : 0.65;
          const pointIndex = Math.floor(route.coords.length * ratio);
          const placementPoint = route.coords[pointIndex]; // [lng, lat]
          const meta = STATUS_META[route.status];
          const isSelected = i === selectedRouteIndex;
          const variantClass = i === 0 ? 'route-bubble-safest' : 'route-bubble-shortest';

          return (
            <Marker 
              key={`route-bubble-${i}`} 
              longitude={placementPoint[0]} 
              latitude={placementPoint[1]} 
              anchor="bottom" 
              onClick={(e) => { 
                e.originalEvent.stopPropagation(); 
                setSelectedRouteIndex(i); 
              }}
              style={{ cursor: 'pointer', zIndex: isSelected ? 10 : 5 }}
            >
              <div className={`route-bubble ${isSelected ? 'route-bubble-selected' : ''} ${variantClass}`}>
                <div className="route-bubble-content">
                  {meta && (
                    <span className="route-bubble-icon" style={{ color: isSelected ? (i === 0 ? 'var(--okay)' : '#f57f17') : 'inherit' }}>
                      <meta.Icon size={16} />
                    </span>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="route-bubble-title">{i === 0 ? 'Safest' : 'Shortest'}</span>
                    {isSelected && (
                      <span className="route-bubble-note" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px', maxWidth: '120px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                        {routeNoteCopy(route, hazards)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="route-bubble-pointer"></div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Neat Map Controls Toolbar */}
      <div className="map-toolbar">
        {/* Destination & Options Group */}
        <div className="map-toolbar-group">
          {!locationB && !settingB && (
            <div style={{ position: 'relative' }}>
              <button 
                className="map-toolbar-btn primary" 
                title="Set destination"
                onClick={() => setSettingB(true)}
              >
                <MapPin size={20} />
              </button>
            </div>
          )}

          {locationB && (
            <div style={{ position: 'relative' }}>
              <button 
                className="map-toolbar-btn danger" 
                title="Clear destination" 
                onClick={clearDestination}
              >
                <X size={20} />
              </button>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <button 
              className={`map-toolbar-btn ${showControls ? 'active-primary' : ''}`} 
              title="Map Options" 
              onClick={() => setShowControls(!showControls)}
            >
              <Layers size={20} />
            </button>
          </div>
        </div>
        
        {/* Layer Toggles Group */}
        {showControls && (
          <div className="map-toolbar-group fade-up" style={{ transformOrigin: 'top right' }}>
            <button
              className={`map-toolbar-btn ${showHeatmapRed ? 'active-red' : ''}`}
              title="Toggle Red Zones"
              onClick={() => setShowHeatmapRed((v) => !v)}
            >
              <AlertOctagon size={18} />
            </button>
            <button
              className={`map-toolbar-btn ${showHeatmapYellow ? 'active-yellow' : ''}`}
              title="Toggle Yellow Zones"
              onClick={() => setShowHeatmapYellow((v) => !v)}
            >
              <AlertTriangle size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Floating Status & Errors (Top Center) */}
      <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', pointerEvents: 'none', zIndex: 1000 }}>
        {destinationLabel && locationB && (
          <span className="map-ctrl-safe" style={{ fontWeight: 600, width: 'auto', padding: '8px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            Destination: {destinationLabel}
          </span>
        )}
        {settingB && (
          <span className="map-ctrl-hint" style={{ width: 'auto', padding: '8px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            Click on the map to place Point B
          </span>
        )}
        {routeError && (
          <span className="map-ctrl-error" style={{ width: 'auto', padding: '8px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            {routeError}
          </span>
        )}
      </div>

      <div className="map-controls" style={{ top: 'auto', bottom: '110px', left: '10px', right: '10px', maxWidth: 'none', alignItems: 'center' }}>
        {/* Route summary message (if any) moved here */}
        {routes.length > 0 && routeSummary && (
          <div style={{ pointerEvents: 'auto', background: 'var(--card)', padding: '8px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-md)', marginBottom: '16px' }}>
            <p className="route-summary" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600 }}>{routeSummary}</p>
          </div>
        )}
      </div>

      <div className="bottom-center-overlay">
        <RouteCheck hasRoute={!!selectedRouteCoords} onRouteSegments={onRouteSegments} />
        <RiskSummary segments={segments} selectedId={selectedId} reports={reports} />
      </div>
    </div>
  );
}
