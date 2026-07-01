// Minimal pin-placement map for the report wizard's location step (F-002 amendment).
// Role: let a user tap a location and snap it onto the nearest known road. Deliberately NOT the
// live ZoneMap — no routing, no destination marker, no report subscription — just road lines/dots
// for visual reference and a click handler. See docs/superpowers/specs/
// 2026-07-01-report-wizard-frontend-design.md.
//
// Roads with 2+ sampled points (see lib/roadLines.js) render as a line and a tap snaps onto the
// nearest point ON that line, not just the nearest sampled dot — the pin lands close to where the
// user actually tapped instead of jumping to whichever original point happens to be nearest.
// Segments with only one point (all SEED_SEGMENTS pins, plus a few standalone WELL_USED_SEGMENTS
// entries) still render and snap as plain dots, unchanged from before.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMemo, useState } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import { ZONE_CENTER, ZONE_ZOOM, MAP_STYLE } from '../../lib/maps.js';
import { findNearestSegment, MAX_SNAP_METERS } from '../../lib/segmentSnap.js';
import { buildRoadLines, projectPointToRoadLines } from '../../lib/roadLines.js';

export default function PinMap({ segments, onSnap }) {
  const [pin, setPin] = useState(null); // { lat, lng } | null
  const [missHint, setMissHint] = useState(false);

  const roadLines = useMemo(() => buildRoadLines(segments), [segments]);
  const linedSegmentIds = useMemo(
    () => new Set(roadLines.flatMap((road) => road.points.map((p) => p.segmentId))),
    [roadLines],
  );
  const looseSegments = useMemo(
    () => segments.filter((s) => !linedSegmentIds.has(s.segmentId)),
    [segments, linedSegmentIds],
  );

  function handleClick(e) {
    const tapPoint = { lat: e.lngLat.lat, lng: e.lngLat.lng };

    const onRoad = projectPointToRoadLines(roadLines, tapPoint);
    if (onRoad) {
      setMissHint(false);
      setPin(onRoad.point);
      onSnap(onRoad.nearerSegment);
      return;
    }

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

        {roadLines.map((road) => (
          <Source
            key={road.name}
            id={`pin-map-road-${road.name}`}
            type="geojson"
            data={{
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: road.points.map((p) => [p.geo.lng, p.geo.lat]) },
            }}
          >
            <Layer
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#8b5cf6', 'line-width': 4, 'line-opacity': 0.6 }}
            />
          </Source>
        ))}

        {looseSegments.map((seg) => (
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
