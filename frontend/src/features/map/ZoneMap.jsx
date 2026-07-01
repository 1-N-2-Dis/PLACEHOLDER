// F-001 zone safety map (P0).
// Role: render the PUP Sta. Mesa zone with segment flags, mock location (A), and optional destination (B).
// Traces to: docs/03-prd.md F-001, docs/06-system-design.md.
//
// Uses MapLibre GL JS via react-map-gl + OpenFreeMap vector tiles (OSM data, includes buildings).
// Routing: ORS foot-walking, safety-first — avoids flagged segments, falls back if no safe path exists.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import { ZONE_CENTER, ZONE_ZOOM, MAP_STYLE } from '../../lib/maps.js';
import { segmentStatus } from '../../lib/freshness.js';
import SegmentFlag from './SegmentFlag.jsx';
import MockLocation from './MockLocation.jsx';
import DestinationMarker from './DestinationMarker.jsx';
import RouteLayer from './RouteLayer.jsx';

const INITIAL_A = [ZONE_CENTER.lat, ZONE_CENTER.lng];

export default function ZoneMap({ segments, latest, selectedId, onSelect }) {
  const [locationA, setLocationA] = useState(INITIAL_A);
  const [locationB, setLocationB] = useState(null);
  const [settingB, setSettingB] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeStatus, setRouteStatus] = useState(null); // 'safe' | 'caution-flagged' | 'caution-highway' | 'caution-both' | null

  // Geo points of segments flagged tonight — passed to RouteLayer as avoid zones.
  // Memoized so RouteLayer's useEffect only re-fires when reports actually change.
  const flaggedSegments = useMemo(
    () => segments
      .filter((seg) => segmentStatus(latest.get(seg.segmentId)) === 'flagged_tonight')
      .map((seg) => seg.geo),
    [segments, latest],
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
    setRouteStatus(null);
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
            flaggedSegments={flaggedSegments}
            onError={setRouteError}
            onRouteStatus={setRouteStatus}
          />
        )}

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
            />
          );
        })}
      </Map>

      <div className="map-controls">
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
        {routeStatus === 'safe' && (
          <span className="map-ctrl-safe">Safe route</span>
        )}
        {routeStatus === 'caution-flagged' && (
          <span className="map-ctrl-caution">Caution: passes a flagged area</span>
        )}
        {routeStatus === 'caution-highway' && (
          <span className="map-ctrl-caution">Caution: uses a major road</span>
        )}
        {routeStatus === 'caution-both' && (
          <span className="map-ctrl-caution">Caution: passes a flagged area and uses a major road</span>
        )}
        {routeError && (
          <span className="map-ctrl-error">{routeError}</span>
        )}
      </div>
    </div>
  );
}
