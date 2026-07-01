// Draggable marker for Point B (destination).
import { Marker } from 'react-map-gl/maplibre';

export default function DestinationMarker({ position, onMove }) {
  return (
    <Marker
      longitude={position[1]}
      latitude={position[0]}
      anchor="center"
      draggable
      onDragEnd={(e) => onMove([e.lngLat.lat, e.lngLat.lng])}
    >
      <div className="marker-dot marker-b" title="Destination (drag to move)" />
    </Marker>
  );
}
