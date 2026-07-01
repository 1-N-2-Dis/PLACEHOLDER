// Report form section: location (required) — pick from the segment list, or pin on the map.
// Both paths resolve to the same segmentId (see segmentSnap.js — a pin snaps to the nearest known
// segment; segments are point geometry, not roads, so this is the enforcement for "only on roads,
// not places/houses"). Traces to: docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md.
import { useState } from 'react';
import PinMap from '../PinMap.jsx';

export default function LocationStep({ segments, segmentId, onSelect }) {
  const [mode, setMode] = useState('list'); // 'list' | 'pin'

  return (
    <section className="report-step">
      <h2>Where is this?</h2>

      <div className="location-mode-toggle">
        <button type="button" className={`condition-btn${mode === 'list' ? ' condition-btn--selected' : ''}`} onClick={() => setMode('list')}>
          Choose from list
        </button>
        <button type="button" className={`condition-btn${mode === 'pin' ? ' condition-btn--selected' : ''}`} onClick={() => setMode('pin')}>
          Pin on map
        </button>
      </div>

      {mode === 'list' ? (
        <div className="form-group">
          <label className="form-label" htmlFor="report-segment">Segment</label>
          <select id="report-segment" className="form-input" value={segmentId || ''} onChange={(e) => onSelect(e.target.value || null)}>
            <option value="">— choose a segment —</option>
            {segments.map((s) => (
              <option key={s.segmentId} value={s.segmentId}>{s.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="pin-map-wrap">
            <PinMap segments={segments} onSnap={(segment) => onSelect(segment.segmentId)} />
          </div>
          <p className="muted">Tap a spot near a mapped street to place your pin.</p>
        </>
      )}

      {segmentId && (
        <p className="status-ok">Selected: {segments.find((s) => s.segmentId === segmentId)?.name}</p>
      )}
    </section>
  );
}
