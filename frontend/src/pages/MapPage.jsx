// guidHER Safety Map page — full-viewport ZoneMap.
// Accepts optional navigation state { destination: [lat, lng], destinationLabel }
// so Routes page "View on map" pre-places Point B and triggers routing (client-side WASM engine).
import { useLocation } from 'react-router-dom';
import ZoneMap from '../features/map/ZoneMap.jsx';

export default function MapPage({ segments, latest, reports, selectedId, onSelect }) {
  const { state } = useLocation();

  // state may carry { destination: [lat, lng], destinationLabel } from RoutesPage
  const initialDestination = state?.destination ?? null;
  const destinationLabel   = state?.destinationLabel ?? null;

  return (
    <div className="map-page-shell" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <ZoneMap
        segments={segments}
        latest={latest}
        reports={reports}
        selectedId={selectedId}
        onSelect={onSelect}
        initialDestination={initialDestination}
        destinationLabel={destinationLabel}
      />
    </div>
  );
}
