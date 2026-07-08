// Minimal pin-placement map for the report wizard's location step (F-002 amendment).
// Role: let a user tap a location and snap it onto the nearest real road. Deliberately NOT the
// live ZoneMap — no routing, no destination marker, no report subscription — just purple road
// lines for visual reference and a click handler.
//
// Roads are NOT hand-sampled seed points anymore (see the retired lib/roadLines.js): the purple
// lines restyle the basemap's own `transportation` vector source-layer, so EVERY road the tiles
// contain renders and is snappable — full coverage within ROAD_COVERAGE_RADIUS_M (20km) of the
// zone center, enforced on the tap (see lib/osmRoads.js for why the layer itself isn't clipped).
// A tap projects onto the nearest rendered road line and resolves to a dynamic segmentId that
// encodes the snapped location + road name (backend persists only segmentId — osmRoads.js).
//
// Note: minor roads exist in vector tiles only at street zooms (~z13+); at the default zoom all
// streets render. Zoomed far out only major roads show/snap — pinning a road you can see implies
// being zoomed in anyway.
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRef, useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, Layer } from 'react-map-gl/maplibre';
import { ZONE_CENTER, ZONE_ZOOM, getMapStyle, PHILIPPINES_BOUNDS } from '../../lib/maps.js';
import { isWithinCoverage, snapToRenderedRoad, makeRoadSegmentId, ROAD_FILTER } from '../../lib/osmRoads.js';
import { useTheme } from '../../lib/theme.jsx';

const ROAD_LAYER_ID = 'pin-roads';
const NAME_LAYER_ID = 'pin-road-names';

const HINTS = {
  coverage: 'Outside the coverage area (20 km around PUP Sta. Mesa).',
  miss: 'Tap closer to a road.',
};

export default function PinMap({ onSnap }) {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const [pin, setPin] = useState(null); // { lat, lng } | null
  const [hint, setHint] = useState(null); // 'coverage' | 'miss' | null
  // The basemap's vector source id, detected on load (liberty's is 'openmaptiles') — our two
  // road layers reference it directly, so they can't render until the style has loaded.
  const [roadSourceId, setRoadSourceId] = useState(null);

  const handleLoad = useCallback((e) => {
    const sources = e.target.getStyle().sources || {};
    const vectorId = Object.keys(sources).find((id) => sources[id].type === 'vector');
    if (vectorId) setRoadSourceId(vectorId);
  }, []);

  function handleClick(e) {
    const tapPoint = { lat: e.lngLat.lat, lng: e.lngLat.lng };

    if (!isWithinCoverage(tapPoint)) {
      setHint('coverage');
      return;
    }

    const map = mapRef.current?.getMap();
    const snapped = map && roadSourceId
      ? snapToRenderedRoad(map, e.point, tapPoint, { roadLayerId: ROAD_LAYER_ID, nameLayerId: NAME_LAYER_ID })
      : null;
    if (!snapped) {
      setHint('miss');
      return;
    }

    setHint(null);
    setPin(snapped.point);
    onSnap({
      segmentId: makeRoadSegmentId(snapped.point, snapped.name),
      name: snapped.name,
      geo: snapped.point,
    });
  }

  return (
    <div className="pin-map">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: ZONE_CENTER.lng, latitude: ZONE_CENTER.lat, zoom: ZONE_ZOOM }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={getMapStyle(theme)}
        cursor="crosshair"
        onClick={handleClick}
        onLoad={handleLoad}
        maxBounds={PHILIPPINES_BOUNDS}
        minZoom={5}
      >
        <NavigationControl position="top-left" />

        {roadSourceId && (
          <>
            <Layer
              id={ROAD_LAYER_ID}
              type="line"
              source={roadSourceId}
              source-layer="transportation"
              filter={ROAD_FILTER}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#8b5cf6', 'line-width': 4, 'line-opacity': 0 }}
            />
            {/* Query-only twin for road names: transportation geometry carries no `name` in the
                OpenMapTiles schema — names live in transportation_name. Opacity 0 keeps it
                invisible while queryRenderedFeatures still returns its features. */}
            <Layer
              id={NAME_LAYER_ID}
              type="line"
              source={roadSourceId}
              source-layer="transportation_name"
              filter={ROAD_FILTER}
              paint={{ 'line-opacity': 0 }}
            />
          </>
        )}

        {pin && (
          <Marker longitude={pin.lng} latitude={pin.lat} anchor="center">
            <div className="marker-dot marker-b" />
          </Marker>
        )}
      </Map>

      {hint && (
        <p className="pin-map-hint">{HINTS[hint]}</p>
      )}
    </div>
  );
}
