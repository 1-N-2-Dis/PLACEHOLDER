// Report form section: location (required) — pin on the map.
// Pin mode snaps onto any real road within the coverage radius and produces a dynamic seg_osm_* id 
// that encodes the snapped location + road name.
// Traces to: docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md.
import PinMap from '../PinMap.jsx';
import { parseRoadSegmentId } from '../../../lib/osmRoads.js';
import { MapPin, RefreshCcw } from 'lucide-react';

export default function LocationStep({ segments, segmentId, onSelect }) {
  const selectedName = segmentId 
    ? (segments.find((s) => s.segmentId === segmentId)?.name ?? parseRoadSegmentId(segmentId)?.name)
    : null;

  return (
    <section className="report-section-card">
      <div className="report-section-header">
        <div className="report-section-icon">
          <MapPin size={24} />
        </div>
        <div>
          <h3 className="report-section-title">Where is this?</h3>
          <p className="report-section-desc">Tap anywhere on the map to drop a pin on a road.</p>
        </div>
      </div>

      <div className="report-map-container">
        <div className="report-map-overlay">Tap a road to place your pin</div>
        <PinMap onSnap={(segment) => onSelect(segment.segmentId)} />
      </div>

      {segmentId && (
        <div className="report-location-summary">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Location</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>{selectedName}</div>
          </div>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => onSelect(null)} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg)' }}>
            <RefreshCcw size={14} /> Change
          </button>
        </div>
      )}
    </section>
  );
}
