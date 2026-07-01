import ZoneMap from '../features/map/ZoneMap.jsx';

export default function HomePage({ segments, latest, reports, selectedId, onSelect }) {
  return (
    <div className="home-layout">
      <div className="map-pane">
        <ZoneMap
          segments={segments}
          latest={latest}
          reports={reports}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
