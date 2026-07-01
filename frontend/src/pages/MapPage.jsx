// guidHER Safety Map page — full-viewport ZoneMap.
// Accepts optional navigation state { destination: [lat, lng], destinationLabel }
// so Routes page "View on map" pre-places Point B and triggers ORS routing.
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ZoneMap from '../features/map/ZoneMap.jsx';

function useMapHeight() {
  const [height, setHeight] = useState('calc(100vh - 56px)');
  useEffect(() => {
    function update() {
      const headerH = 56;
      const isMobile = window.innerWidth <= 768;
      const bottomH = isMobile ? 68 : 0;
      setHeight(`${window.innerHeight - headerH - bottomH}px`);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return height;
}

export default function MapPage({ segments, latest, reports, selectedId, onSelect }) {
  const height = useMapHeight();
  const { state } = useLocation();

  // state may carry { destination: [lat, lng], destinationLabel } from RoutesPage
  const initialDestination = state?.destination ?? null;
  const destinationLabel   = state?.destinationLabel ?? null;

  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
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
