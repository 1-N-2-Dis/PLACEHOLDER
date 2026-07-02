// F-001 zone safety map (P0).
// Role: render the PUP Sta. Mesa zone with segment flags, mock location (A), and optional destination (B).
// Traces to: docs/03-prd.md F-001, docs/06-system-design.md.
//
// Uses MapLibre GL JS via react-map-gl + OpenFreeMap vector tiles (OSM data, includes buildings).
// Routing: ORS foot-walking, safety-first — avoids flagged segments, falls back if no safe path exists.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { ZONE_CENTER, ZONE_ZOOM, MAP_STYLE } from '../../lib/maps.js';
import { segmentStatus } from '../../lib/freshness.js';
import { nearestDistanceToRoute, YELLOW_AVOID_RADIUS_M } from '../../lib/routing.js';
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

export default function ZoneMap({ segments, latest, reports, selectedId, onSelect, initialDestination = null, destinationLabel = null }) {
  const [locationA, setLocationA] = useState(INITIAL_A);
  // Pre-place Point B if navigated from Routes page
  const [locationB, setLocationB] = useState(initialDestination);
  const [settingB, setSettingB] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routes, setRoutes] = useState([]); // Array<{ coords, status, tier }>, safest first
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Reports flagged tonight, with their AI severity — passed to RouteLayer as avoid zones.
  // Missing severity (reports written before AI classification shipped) defaults to 'red',
  // preserving today's hard-avoid behavior for those reports.
  // Memoized so RouteLayer's useEffect only re-fires when reports actually change.
  const flaggedReports = useMemo(
    () => segments
      .filter((seg) => segmentStatus(latest.get(seg.segmentId)) === 'flagged_tonight')
      .map((seg) => {
        const report = latest.get(seg.segmentId);
        return { geo: seg.geo, severity: report?.severity || 'red' };
      }),
    [segments, latest],
  );

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

  function handleMapClick(e) {
    if (!settingB) return;
    setLocationB([e.lngLat.lat, e.lngLat.lng]);
    setSettingB(false);
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
          longitude: ZONE_CENTER.lng,
          latitude: ZONE_CENTER.lat,
          zoom: ZONE_ZOOM,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        cursor={settingB ? 'crosshair' : 'grab'}
        onClick={handleMapClick}
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
            flaggedReports={flaggedReports}
            onError={setRouteError}
            onRoutes={handleRoutes}
            selectedIndex={selectedRouteIndex}
          />
        )}

        <ReportHeatmap reports={reports} segments={segments} visible={showHeatmap} />

        {segments.map((seg) => {
          const report = latest.get(seg.segmentId);
          const status = segmentStatus(report);
          return (
            <SegmentFlag
              key={seg.segmentId}
              segment={seg}
              report={report}
              status={status}
              isOpen={selectedId === seg.segmentId}
              onSelect={onSelect}
              isOnRoute={onRouteSegmentIds.has(seg.segmentId)}
            />
          );
        })}
      </Map>

      <div className="map-controls">
        {destinationLabel && locationB && (
          <span className="map-ctrl-safe" style={{ fontWeight: 600 }}>
            Destination: {destinationLabel}
          </span>
        )}
        <button
          className={`map-ctrl-btn${showHeatmap ? ' map-ctrl-btn--active' : ''}`}
          onClick={() => setShowHeatmap((v) => !v)}
        >
          {showHeatmap ? 'Hide' : 'Show'} incident heatmap
        </button>
        {!locationB && !settingB && (
          <button className="map-ctrl-btn" onClick={() => setSettingB(true)}>
            + Set destination
          </button>
        )}
        {settingB && (
          <span className="map-ctrl-hint">Click on the map to place Point B</span>
        )}
        {locationB && (
          <button className="map-ctrl-btn map-ctrl-clear" onClick={clearDestination}>
            × Clear destination
          </button>
        )}
        {routes.length > 0 && (
          <div className="route-options">
            {routes.map((route, i) => {
              const meta = STATUS_META[route.status];
              return (
                <button
                  key={route.tier}
                  type="button"
                  className={`route-option${i === selectedRouteIndex ? ' route-option--selected' : ''}`}
                  onClick={() => setSelectedRouteIndex(i)}
                >
                  {meta && (
                    <span className="route-option-icon">
                      <meta.Icon size={14} />
                    </span>
                  )}
                  {i === 0 ? 'Safest route' : `Alternative ${i + 1}`}
                  {' — '}
                  {meta ? meta.copy : route.status}
                </button>
              );
            })}
          </div>
        )}
        {routeError && (
          <span className="map-ctrl-error">{routeError}</span>
        )}
      </div>

      <div className="bottom-center-overlay">
        <RouteCheck hasRoute={!!selectedRouteCoords} onRouteSegments={onRouteSegments} />
        <RiskSummary segments={segments} selectedId={selectedId} reports={reports} />
      </div>
    </div>
  );
}
