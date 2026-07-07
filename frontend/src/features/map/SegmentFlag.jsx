// F-001/F-006/F-007 segment flag marker + detail (P0).
// Role: draw one segment's flag on the map (colored by AI severity) and show its detail —
// including photo evidence, if any — on tap.
// Traces to: docs/03-prd.md F-001/F-006/F-007 + BR-004, docs/11-qa-test-plan.md TC-002.
//
// Detail on tap shows: condition type, AI severity, exact report timestamp (BR-004), optional
// note, and optional photo. Never renders a crime/neighborhood classification (BR-001) — there
// is no such field; severity is a per-report triage signal, not a place label (BR-007).
import { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { Camera, ThumbsUp } from 'lucide-react';
import { CONDITION_META } from '../../data/condition-types.js';
import { SEVERITY_META } from '../../data/severity-types.js';
import { resolvePhotoUrl, PHOTO_UPLOAD_ENABLED } from '../../lib/storage.js';

function formatTimestamp(createdAt) {
  if (!createdAt) return null;
  const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
  return date.toLocaleString();
}

export default function SegmentFlag({
  segment, report, status, isOpen, onSelect, isOnRoute = false, isLiked, onLike
}) {
  const flagged = status === 'flagged_tonight';
  const meta = report ? CONDITION_META[report.conditionType] : null;
  // Legacy reports written before AI classification shipped have no severity — default to red
  // (matches the same compatibility default used for routing avoidance in ZoneMap.jsx).
  const severity = flagged ? (report?.severity || 'red') : 'green';
  const severityMeta = SEVERITY_META[severity];
  const [showPopup, setShowPopup] = useState(isOpen);
  const [photoUrl, setPhotoUrl] = useState(null);

  // Sync with parent-controlled selection (e.g. RouteCheck clicking a segment).
  useEffect(() => setShowPopup(isOpen), [isOpen]);

  useEffect(() => {
    setPhotoUrl(null);
    if (!PHOTO_UPLOAD_ENABLED || !showPopup || !report?.photoPath) return;
    let cancelled = false;
    resolvePhotoUrl(report.photoPath)
      .then((url) => { if (!cancelled) setPhotoUrl(url); })
      .catch((err) => console.error('Could not load report photo:', err.message));
    return () => { cancelled = true; };
  }, [showPopup, report?.photoPath]);

  // Low-concern (green severity / no-report) markers are no longer shown to avoid cluttering the UI.
  if (severity === 'green') return null;

  return (
    <>
      <Marker
        longitude={segment.geo.lng}
        latitude={segment.geo.lat}
        anchor="center"
      >
        <div
          className={`seg-dot seg-dot--${severity}`}
          style={{ opacity: 0, pointerEvents: 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(segment.segmentId);
          }}
        >
          {PHOTO_UPLOAD_ENABLED && report?.photoPath && (
            <span className="seg-dot-photo-badge">
              <Camera size={9} strokeWidth={3} color="#1a1a2e" />
            </span>
          )}
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={segment.geo.lng}
          latitude={segment.geo.lat}
          offset={12}
          closeButton
          closeOnClick={true}
          onClose={() => { setShowPopup(false); onSelect(null); }}
        >
          <div className="segment-detail">
            <strong>{segment.name}</strong>
            {report && meta ? (
              <>
                {report.title && <div className="report-title">{report.title}</div>}
                <div className="icon-line"><meta.Icon size={14} /> {meta.label}{flagged ? ' · flagged tonight' : ' · not tonight'}</div>
                <div className="severity-line" style={{ color: severityMeta.color }}>
                  <severityMeta.Icon size={14} /> {severityMeta.label}
                </div>
                <div className="muted">Reported: {formatTimestamp(report.createdAt) || '—'}</div>
                {/* Baseline (seed) hotspots have no real Firestore doc to like against — hide the
                    control rather than let it silently do nothing. */}
                {report.id && (
                  <div className="report-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onLike(!isLiked); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: isLiked ? 'var(--sev-red-fg)' : 'var(--muted)', padding: 0, fontSize: '0.85rem' }}
                    >
                      <ThumbsUp size={14} fill={isLiked ? 'var(--sev-red-fg)' : 'none'} />
                      {report.likedBy?.length > 0 ? `Liked by ${report.likedBy.length}` : 'Like'}
                    </button>
                  </div>
                )}
                {report.note ? <div className="note">"{report.note}"</div> : null}
                {PHOTO_UPLOAD_ENABLED && report.photoPath && (
                  photoUrl
                    ? <img className="report-photo" src={photoUrl} alt="Reported condition" />
                    : <div className="muted">Loading photo…</div>
                )}
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
