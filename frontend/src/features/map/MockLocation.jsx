// Draggable mock marker for Point A (user's current location).
// Drag anywhere on the map to simulate movement.
import { Marker } from 'react-map-gl/maplibre';

export default function MockLocation({ position, onMove }) {
  return (
    <Marker
      longitude={position[1]}
      latitude={position[0]}
      anchor="center"
      draggable
      onDragEnd={(e) => onMove([e.lngLat.lat, e.lngLat.lng])}
    >
      <div className="marker-dot marker-a" title="You (drag to move)" />
    </Marker>
  );
}
