// Minimal pin-placement map for the report wizard's location step (F-002 amendment).
// Role: let a user tap a location and snap it to the nearest known segment. Deliberately NOT the
// live ZoneMap — no routing, no destination marker, no report subscription — just segment dots
// for visual reference and a click handler. See docs/superpowers/specs/
// 2026-07-01-report-wizard-frontend-design.md.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import { ZONE_CENTER, ZONE_ZOOM, MAP_STYLE } from '../../lib/maps.js';
import { findNearestSegment, MAX_SNAP_METERS } from '../../lib/segmentSnap.js';

export default function PinMap({ segments, onSnap }) {
  const [pin, setPin] = useState(null); // { lat, lng } | null
  const [missHint, setMissHint] = useState(false);

  function handleClick(e) {
    const tapPoint = { lat: e.lngLat.lat, lng: e.lngLat.lng };
    const nearest = findNearestSegment(segments, tapPoint);
    if (!nearest || nearest.distanceMeters > MAX_SNAP_METERS) {
      setMissHint(true);
      return;
    }
    setMissHint(false);
    setPin(nearest.segment.geo);
    onSnap(nearest.segment);
  }

  return (
    <div className="pin-map">
      <Map
        initialViewState={{ longitude: ZONE_CENTER.lng, latitude: ZONE_CENTER.lat, zoom: ZONE_ZOOM }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        cursor="crosshair"
        onClick={handleClick}
      >
        <NavigationControl position="top-left" />

        {segments.map((seg) => (
          <Marker key={seg.segmentId} longitude={seg.geo.lng} latitude={seg.geo.lat} anchor="center">
            <div className="pin-map-dot" title={seg.name} />
          </Marker>
        ))}

        {pin && (
          <Marker longitude={pin.lng} latitude={pin.lat} anchor="center">
            <div className="marker-dot marker-b" />
          </Marker>
        )}
      </Map>

      {missHint && (
        <p className="pin-map-hint">Tap closer to a mapped street.</p>
      )}
    </div>
  );
}
