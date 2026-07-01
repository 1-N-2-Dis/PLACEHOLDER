// F-001 segment flag marker + detail (P0).
// Role: draw one segment's flag on the map and show its detail on tap.
// Traces to: docs/03-prd.md F-001 + BR-004, docs/11-qa-test-plan.md TC-002.
//
// Detail on tap shows: condition type {poor_lighting | no_crowd | recent_incident} + timestamp (BR-004).
// Never renders a crime/neighborhood classification (BR-001) — there is no such field.
import { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { CONDITION_META } from '../../data/condition-types.js';

function formatTimestamp(createdAt) {
  if (!createdAt) return null;
  const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
  return date.toLocaleString();
}

export default function SegmentFlag({ segment, report, status, isOpen, onSelect }) {
  const flagged = status === 'flagged_tonight';
  const meta = report ? CONDITION_META[report.conditionType] : null;
  const [showPopup, setShowPopup] = useState(isOpen);

  // Sync with parent-controlled selection (e.g. RouteCheck clicking a segment).
  useEffect(() => setShowPopup(isOpen), [isOpen]);

  return (
    <>
      <Marker
        longitude={segment.geo.lng}
        latitude={segment.geo.lat}
        anchor="center"
      >
        <div
          className={`seg-dot${flagged ? ' seg-dot--flagged' : ' seg-dot--okay'}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(segment.segmentId);
          }}
        />
      </Marker>

      {showPopup && (
        <Popup
          longitude={segment.geo.lng}
          latitude={segment.geo.lat}
          anchor="bottom"
          offset={12}
          closeButton
          closeOnClick={false}
          onClose={() => { setShowPopup(false); onSelect(null); }}
        >
          <div className="segment-detail">
            <strong>{segment.name}</strong>
            {report && meta ? (
              <>
                <div>{meta.icon} {meta.label}{flagged ? ' · flagged tonight' : ' · not tonight'}</div>
                <div className="muted">Reported: {formatTimestamp(report.createdAt) || '—'}</div>
                {report.note ? <div className="note">"{report.note}"</div> : null}
              </>
            ) : (
              <div className="muted">No reports yet.</div>
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
