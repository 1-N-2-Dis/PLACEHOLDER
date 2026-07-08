// RouteCheckInner — the content-only variant of RouteCheck, for use inside
// BubblePopup. Same logic as RouteCheck.jsx but renders only the panel body
// (no collapsed/expanded toggle — the parent BubblePopup controls visibility).
//
// Traces to: docs/03-prd.md F-003/F-008, backend/server assessRoute.
// CONSTRAINTS: BR-002 (no rescue/dispatch), BR-006 (AI adds no facts).
import { useState } from 'react';
import { assessRouteSafety } from '../../lib/routeAssessment.js';

export default function RouteCheckInner({ hasRoute, onRouteSegments }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { assessment, consideredCount } | { error }

  async function checkRoute() {
    setBusy(true);
    setResult(null);
    try {
      const outcome = await assessRouteSafety(onRouteSegments);
      setResult(outcome);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bubble-section">
      <p className="bubble-section-intro">
        Get an AI-generated assessment of your currently selected route based on tonight's reports.
      </p>

      {!hasRoute ? (
        <p className="muted">Set a destination on the map first, then ask here.</p>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-full"
            disabled={busy}
            onClick={checkRoute}
          >
            {busy ? <span className="spinner" /> : 'Is my route okay tonight?'}
          </button>

          {result?.error && (
            <p className="status-err" style={{ marginTop: 10 }}>{result.error}</p>
          )}
          {result && !result.error && result.assessment === null && (
            <p className="status-ok" style={{ marginTop: 10 }}>
              No flagged conditions along this route right now — looks okay based on current reports.
            </p>
          )}
          {result?.assessment && (
            <p className="summary-text" style={{ marginTop: 10 }}>{result.assessment}</p>
          )}
        </>
      )}

      <p className="muted" style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        Informational only — no rescue or dispatch.
      </p>
    </div>
  );
}
