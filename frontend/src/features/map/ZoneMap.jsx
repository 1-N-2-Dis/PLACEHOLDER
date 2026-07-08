// F-001 zone safety map (P0).
// Role: render the PUP Sta. Mesa zone with segment flags, mock location (A), and optional destination (B).
// Traces to: docs/03-prd.md F-001, docs/06-system-design.md.
//
// Uses MapLibre GL JS via react-map-gl + OpenFreeMap vector tiles (OSM data, includes buildings).
// Routing: client-side Rust/WASM A* engine (ADR-0003), safety-first — avoids flagged segments,
// falls back if no safe path exists. See frontend/src/lib/routing.js.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useMemo, useRef, useCallback } from 'react';
import Map, { NavigationControl, Layer, Marker } from 'react-map-gl/maplibre';
import { CheckCircle2, AlertTriangle, AlertOctagon, MapPin, X, Layers, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../lib/theme.jsx';
import { ZONE_CENTER, ZONE_ZOOM, getMapStyle, PHILIPPINES_BOUNDS } from '../../lib/maps.js';
import { isWithinCoverage, snapToRenderedRoad, ROAD_FILTER } from '../../lib/osmRoads.js';
import { segmentStatus } from '../../lib/freshness.js';
import { nearestDistanceToRoute, hazardsNearRoute, nearestNamedHazard, YELLOW_AVOID_RADIUS_M } from '../../lib/routing.js';
import { HEATMAP_BASELINE } from '../../data/heatmap-baseline.js';
import { computeHazards } from '../../lib/hazards.js';
import { STATUS_META } from '../../lib/routeStatus.js';
import { useAuthUser } from '../../lib/useAuthUser.js';
import { toggleReportLike } from '../../lib/likes.js';
import SegmentFlag from './SegmentFlag.jsx';
import MockLocation from './MockLocation.jsx';
import DestinationMarker from './DestinationMarker.jsx';
import RouteLayer from './RouteLayer.jsx';
import ReportHeatmap from './ReportHeatmap.jsx';
import SafeHeatmap from './SafeHeatmap.jsx';
import BubblePopup from './BubblePopup.jsx';
import SosButton from './SosButton.jsx';
import { OwlyMapLoader, OwlyRouteNotifyLoading } from './MapLoading.jsx';

const INITIAL_A = [ZONE_CENTER.lat, ZONE_CENTER.lng];

// Query-only layers so Point B can only be placed by snapping onto a real road (mirrors the
// report wizard's PinMap.jsx) — otherwise a click on a rooftop/courtyard silently became a route
// with a straight-line "spike" from the pin to the nearest street (see the WASM router's
// extend_to_exact_pin, frontend/rust/router/src/lib.rs). Opacity 0: purely for hit-testing via
// queryRenderedFeatures, not rendered.
const DESTINATION_ROAD_LAYER_ID = 'route-b-roads';
const DESTINATION_ROAD_NAME_LAYER_ID = 'route-b-road-names';

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

export default function ZoneMap({ segments, latest, reports, selectedId, onSelect, initialDestination = null, destinationLabel = null }) {
  const { theme } = useTheme();
  const { user } = useAuthUser();
  const mapRef = useRef(null);
  const [locationA, setLocationA] = useState(INITIAL_A);
  // Pre-place Point B if navigated from Routes page
  const [locationB, setLocationB] = useState(initialDestination);
  const [settingB, setSettingB] = useState(false);
  // 'coverage' | 'miss' | null — why the last settingB tap didn't place Point B.
  const [destinationHint, setDestinationHint] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [routes, setRoutes] = useState([]); // Array<{ coords, status, tier }>, safest first
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showHeatmapRed, setShowHeatmapRed] = useState(false);
  const [showHeatmapYellow, setShowHeatmapYellow] = useState(false);
  const [showHeatmapGreen, setShowHeatmapGreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  // The basemap's vector source id, detected on load (liberty's is 'openmaptiles') — the
  // destination road-query layers reference it directly, same pattern as report/PinMap.jsx.
  const [roadSourceId, setRoadSourceId] = useState(null);

  // Hazards passed to RouteLayer as avoid zones — reports flagged tonight (live Firestore),
  // merged with the baked-in heatmap-baseline.json hotspots (backend/data/heatmap-baseline.json,
  // via frontend/src/data/heatmap-baseline.js). Baseline hotspots carry their own geo, so they
  // apply even where the frontend has no matching segment (e.g. seg_magsaysay_jeeps) and don't
  // depend on ever seeding them into Firestore. A live report on the same segment wins over its
  // baseline counterpart (fresher, real signal). Missing severity on a live report (written
  // before AI classification shipped) defaults to 'red', preserving today's hard-avoid behavior.
  // Memoized so RouteLayer's useEffect only re-fires when reports actually change.
  const hazards = useMemo(() => computeHazards(segments, latest), [segments, latest]);

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
      const tapPoint = { lat: e.lngLat.lat, lng: e.lngLat.lng };

      if (!isWithinCoverage(tapPoint)) {
        setDestinationHint('coverage');
        return;
      }

      const map = mapRef.current?.getMap();
      const snapped = map && roadSourceId
        ? snapToRenderedRoad(map, e.point, tapPoint, {
            roadLayerId: DESTINATION_ROAD_LAYER_ID,
            nameLayerId: DESTINATION_ROAD_NAME_LAYER_ID,
          })
        : null;
      if (!snapped) {
        setDestinationHint('miss');
        return;
      }

      setDestinationHint(null);
      setLocationB([snapped.point.lat, snapped.point.lng]);
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
    setDestinationHint(null);
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

  const handleMapLoad = useCallback((e) => {
    setMapLoaded(true);
    const sources = e.target.getStyle().sources || {};
    const vectorId = Object.keys(sources).find((id) => sources[id].type === 'vector');
    if (vectorId) setRoadSourceId(vectorId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
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
        onLoad={handleMapLoad}
        attributionControl={false}
        maxBounds={PHILIPPINES_BOUNDS}
        minZoom={5}
      >
        <NavigationControl position="top-left" />

        {roadSourceId && (
          <>
            <Layer
              id={DESTINATION_ROAD_LAYER_ID}
              type="line"
              source={roadSourceId}
              source-layer="transportation"
              filter={ROAD_FILTER}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#8b5cf6', 'line-width': 4, 'line-opacity': 0 }}
            />
            {/* Query-only twin for road names, same reason as PinMap.jsx: transportation
                geometry carries no `name`, only transportation_name does. Not used for Point B's
                hint copy today, but keeps parity with snapToRenderedRoad's return shape. */}
            <Layer
              id={DESTINATION_ROAD_NAME_LAYER_ID}
              type="line"
              source={roadSourceId}
              source-layer="transportation_name"
              filter={ROAD_FILTER}
              paint={{ 'line-opacity': 0 }}
            />
          </>
        )}

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

      <OwlyMapLoader hidden={mapLoaded} />

      {/* Neat Map Controls Toolbar */}
      <div className="map-toolbar">
        {/* Destination & Options Group */}
        <div className="map-toolbar-group">
          {!locationB && !settingB && (
            <div style={{ position: 'relative' }}>
              <button
                className="map-toolbar-btn primary"
                title="Set destination"
                onClick={() => { setDestinationHint(null); setSettingB(true); }}
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
        {isComputingRoute && <OwlyRouteNotifyLoading />}
        {!isComputingRoute && routes.length > 0 && (
          <RouteNotify tone={routeSummary.tone}>{routeSummary.message}</RouteNotify>
        )}
        {settingB && (
          <span className={destinationHint ? 'map-ctrl-error' : 'map-ctrl-hint'} style={{ width: 'auto', padding: '8px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            {destinationHint === 'coverage' && 'Outside the coverage area — tap within 20 km of PUP Sta. Mesa.'}
            {destinationHint === 'miss' && 'Tap closer to a road.'}
            {!destinationHint && 'Click on a road to place Point B'}
          </span>
        )}
        {routeError && (
          <span className="map-ctrl-error" style={{ width: 'auto', padding: '8px 16px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            {routeError}
          </span>
        )}
      </div>

      <BubblePopup
        segments={segments}
        selectedId={selectedId}
        reports={reports}
      />

      <SosButton />
    </div>
  );
}
