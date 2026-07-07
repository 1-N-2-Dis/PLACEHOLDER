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
import { CheckCircle2, AlertTriangle, AlertOctagon, MapPin, X, Layers, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../lib/theme.jsx';
import { ZONE_CENTER, ZONE_ZOOM, getMapStyle, PHILIPPINES_BOUNDS } from '../../lib/maps.js';
import { segmentStatus } from '../../lib/freshness.js';
import { nearestDistanceToRoute, hazardsNearRoute, nearestNamedHazard, YELLOW_AVOID_RADIUS_M } from '../../lib/routing.js';
import { HEATMAP_BASELINE } from '../../data/heatmap-baseline.js';
import { useAuthUser } from '../../lib/useAuthUser.js';
import { toggleReportLike } from '../../lib/likes.js';
import SegmentFlag from './SegmentFlag.jsx';
import MockLocation from './MockLocation.jsx';
import DestinationMarker from './DestinationMarker.jsx';
import RouteLayer from './RouteLayer.jsx';
import ReportHeatmap from './ReportHeatmap.jsx';
import SafeHeatmap from './SafeHeatmap.jsx';
import RouteCheck from '../route-check/RouteCheck.jsx';
import RiskSummary from '../risk-summary/RiskSummary.jsx';
import { Skeleton, MapSkeleton } from '../../components/Skeleton.jsx';

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

// Top-of-map notification — replaces a plain status line with an icon + tone (caution when the
// shortest path forces a tradeoff, safe when there's nothing to trade off) so the recommendation
// reads as a system message rather than a caption.
function RouteNotify({ tone, children }) {
  const Icon = tone === 'caution' ? AlertTriangle : CheckCircle2;
  return (
    <div className={`route-notify route-notify--${tone}`} role="status">
      <Icon size={17} className="route-notify-icon" />
      <span className="route-notify-text">{children}</span>
    </div>
  );
}

// Shown in the same slot while the WASM engine is still computing a route, so a slow device or
// a large graph fetch reads as "working on it" instead of leaving the top of the map blank.
function RouteNotifySkeleton() {
  return (
    <div className="route-notify route-notify--loading" aria-hidden="true">
      <Skeleton className="route-notify-icon-skeleton" width={17} height={17} radius="50%" />
      <span className="route-notify-text-skeleton">
        <Skeleton width="78%" height={10} />
        <Skeleton width="52%" height={10} />
      </span>
    </div>
  );
}

export default function ZoneMap({ segments, latest, reports, selectedId, onSelect, initialDestination = null, destinationLabel = null }) {
  const { theme } = useTheme();
  const { user } = useAuthUser();
  const [locationA, setLocationA] = useState(INITIAL_A);
  // Pre-place Point B if navigated from Routes page
  const [locationB, setLocationB] = useState(initialDestination);
  const [settingB, setSettingB] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routes, setRoutes] = useState([]); // Array<{ coords, status, tier }>, safest first
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showHeatmapRed, setShowHeatmapRed] = useState(false);
  const [showHeatmapYellow, setShowHeatmapYellow] = useState(false);
  const [showHeatmapGreen, setShowHeatmapGreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  // While a route is being shown, the map already has route bubbles competing for the same
  // screen space as report heatmap popups — disable heatmap clicks so the two can't overlap.
  const isRoutingActive = routes.length > 0;

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

  // One-line comparison of the two routes' hazard exposure, shown as the top-of-map notification
  // so the safest recommendation is explicit rather than left to the per-route badges alone.
  // `tone` drives the notification's color: 'caution' when picking Safest trades off distance,
  // 'safe' when there's nothing to trade off.
  const routeSummary = useMemo(() => {
    if (routes.length < 2) {
      if (routes.length === 1 && routes[0].status === 'safe') {
        return { tone: 'safe', message: 'The safest route is completely clear.' };
      }
      return { tone: 'safe', message: 'Showing the safest available route — no shorter alternative found.' };
    }
    const [, shortest] = routes;
    if (shortest.status === 'safe' || shortest.status === 'caution-highway') {
      return { tone: 'safe', message: 'Both routes avoid all known flagged areas.' };
    }
    return { tone: 'caution', message: 'We recommend the Safest route — the Shortest path passes through flagged areas.' };
  }, [routes]);

  // True from the moment Point B is placed until the client-side WASM engine's fetchSafeRoutes
  // resolves (success or failure) — the window a slow connection/device would otherwise render
  // as a blank top-of-map area.
  const isComputingRoute = !!locationB && routes.length === 0 && !routeError;

  function handleMapClick(e) {
    if (settingB) {
      setLocationB([e.lngLat.lat, e.lngLat.lng]);
      setSettingB(false);
      return;
    }

    if (isRoutingActive) return;

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
    setIsConfirmed(false);
  }

  function handleRoutes(nextRoutes) {
    setRoutes(nextRoutes);
    setSelectedRouteIndex(0);
    setIsConfirmed(false);
    if (nextRoutes.length > 0) onSelect(null);
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
          if (isRoutingActive) return [];
          const ids = [];
          if (showHeatmapRed) {
            ids.push('heatmap-red-layer');
          }
          if (showHeatmapYellow) {
            ids.push('heatmap-yellow-layer');
          }
          return ids;
        }, [showHeatmapRed, showHeatmapYellow, isRoutingActive])}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
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
            isConfirmed={isConfirmed}
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

        <ReportHeatmap reports={reports} segments={segments} showRed={showHeatmapRed} showYellow={showHeatmapYellow} />
        <SafeHeatmap show={showHeatmapGreen} />

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
              isLiked={!!(user && report?.likedBy?.includes(user.uid))}
              onLike={(liked) => {
                if (!report?.id) return; // baseline hotspots have no real doc to like
                toggleReportLike(report.id, liked).catch((err) => {
                  console.error('Could not update like:', err.message);
                });
              }}
            />
          ));
        })()}

        {/* Route Bubble Notifications */}
        {routes.length > 0 && routes.map((route, i) => {
          const isSelected = i === selectedRouteIndex;
          const isHidden = isConfirmed && !isSelected;

          // Stagger the bubbles along the path (35% and 65%) so they don't overlap 
          // if the two routes share segments in the middle.
          const ratio = i === 0 ? 0.35 : 0.65;
          const pointIndex = Math.floor(route.coords.length * ratio);
          const placementPoint = route.coords[pointIndex]; // [lng, lat]
          const meta = STATUS_META[route.status];
          const variantClass = i === 0 ? 'route-bubble-safest' : 'route-bubble-shortest';

          return (
            <Marker 
              key={`route-bubble-${i}`} 
              longitude={placementPoint[0]} 
              latitude={placementPoint[1]} 
              anchor="bottom" 
              onClick={(e) => { 
                e.originalEvent.stopPropagation(); 
                if (!isHidden) {
                  setSelectedRouteIndex(i); 
                  setIsConfirmed(false);
                }
              }}
              style={{ 
                cursor: isHidden ? 'default' : 'pointer', 
                zIndex: isSelected ? 10 : 5, 
                opacity: isHidden ? 0 : 1, 
                pointerEvents: isHidden ? 'none' : 'auto',
                transition: 'opacity 0.2s ease-in-out'
              }}
            >
              <div className={`route-bubble ${isSelected ? 'route-bubble-selected' : ''} ${variantClass}`}>
                <div className="route-bubble-content" style={{ padding: isSelected ? '12px' : '8px 12px', width: isSelected ? '160px' : '115px' }}>
                  <div className="route-bubble-header" style={{ justifyContent: isSelected ? 'flex-start' : 'center' }}>
                    {meta && <meta.Icon size={16} />}
                    <span>{i === 0 ? 'Safest' : 'Shortest'}</span>
                  </div>
                  
                  {isSelected && (
                    <div className="route-bubble-details">
                      <span className="route-bubble-note">
                        {routeNoteCopy(route, hazards)}
                      </span>
                      {isConfirmed ? (
                        <button 
                          className="btn btn-sm" 
                          style={{ width: '100%', background: 'var(--surface)', color: 'var(--muted)', border: 'none', fontWeight: 600 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirmed(false);
                          }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button 
                          className="btn btn-sm" 
                          style={{ 
                            width: '100%', 
                            background: i === 0 ? 'var(--okay)' : '#fbc02d',
                            color: '#fff', 
                            border: 'none',
                            fontWeight: 600
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirmed(true);
                          }}
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="route-bubble-pointer"></div>
              </div>
            </Marker>
          );
        })}
      </Map>

      <MapSkeleton hidden={mapLoaded} />

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
            <button
              className={`map-toolbar-btn ${showHeatmapGreen ? 'active-green' : ''}`}
              title="Toggle Safe Zones"
              onClick={() => setShowHeatmapGreen((v) => !v)}
            >
              <ShieldCheck size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Floating Status & Notifications (Top Center) */}
      <div className="map-top-stack">
        {destinationLabel && locationB && (
          <span className="map-ctrl-safe" style={{ fontWeight: 600, width: 'auto', padding: '8px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            Destination: {destinationLabel}
          </span>
        )}
        {isComputingRoute && <RouteNotifySkeleton />}
        {!isComputingRoute && routes.length > 0 && (
          <RouteNotify tone={routeSummary.tone}>{routeSummary.message}</RouteNotify>
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

      <div className="bottom-center-overlay">
        <RouteCheck hasRoute={!!selectedRouteCoords} onRouteSegments={onRouteSegments} />
        <RiskSummary segments={segments} selectedId={selectedId} reports={reports} />
      </div>
    </div>
  );
}
