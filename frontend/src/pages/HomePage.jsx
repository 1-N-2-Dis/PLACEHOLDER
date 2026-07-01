import ZoneMap from '../features/map/ZoneMap.jsx';
import RouteCheck from '../features/route-check/RouteCheck.jsx';
import RiskSummary from '../features/risk-summary/RiskSummary.jsx';

export default function HomePage({ segments, latest, reports, selectedId, onSelect }) {
  return (
    <div className="home-layout">
      <div className="map-pane">
        <ZoneMap
          segments={segments}
          latest={latest}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>

      <aside className="side-pane">
        <p className="tagline">
          Community-sourced conditions for the PUP Sta. Mesa commute.
          Check your route before you go. Informational — not an emergency service.
        </p>
        <RouteCheck segments={segments} latest={latest} />
        <RiskSummary segments={segments} selectedId={selectedId} reports={reports} />
      </aside>
    </div>
  );
}
