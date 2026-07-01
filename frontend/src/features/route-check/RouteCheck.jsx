// F-003/F-008: "Is my route okay tonight?" — AI-generated assessment of the currently selected
// point-to-point route. Replaces the original per-segment manual checklist and the separate
// rule-based RouteSafetyPanel.jsx — consolidated into one on-demand AI check, on request.
// Traces to: docs/03-prd.md F-003/F-008, backend/functions/index.js assessRoute.
//
// Reuses the same Point A/B route ZoneMap.jsx already computes for routing (F-005) — no separate
// path picker. `onRouteSegments` (which segments sit near that route) is computed once in
// ZoneMap.jsx via frontend/src/lib/routing.js nearestDistanceToRoute, the same helper
// RouteSafetyPanel used to use, and shared with the marker-visibility toggle.
//
// CONSTRAINTS:
//   - No SOS / rescue / dispatch (BR-002) — informational only, enforced in the backend prompt.
//   - The assessment is derived only from each segment's real, currently-stored report — the
//     backend reads Firestore itself rather than trusting client-supplied report content
//     (BR-006/BR-007 spirit), so a client can't spoof what the AI is told.
//
// Presentation: collapsed to a single toggle button until clicked (mounted as a bottom-center
// map overlay by ZoneMap.jsx) — the assessment only runs once the user asks for it.
import { useState } from 'react';
import { X } from 'lucide-react';
import { assessRouteSafety } from '../../lib/routeAssessment.js';

export default function RouteCheck({ hasRoute, onRouteSegments }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { assessment, consideredCount } | { error: msg }

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

  function close() {
    setExpanded(false);
    setResult(null);
  }

  if (!expanded) {
    return (
      <button type="button" className="overlay-toggle-btn" onClick={() => setExpanded(true)}>
        Is my route okay tonight?
      </button>
    );
  }

  return (
    <section className="route-check overlay-card">
      <div className="overlay-card-header">
        <h2>Is my route okay tonight?</h2>
        <button type="button" className="overlay-card-close" onClick={close} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {!hasRoute ? (
        <p className="muted">Set a destination on the map first, then ask here.</p>
      ) : (
        <>
          <button type="button" className="btn btn-primary btn-sm btn-full" disabled={busy} onClick={checkRoute}>
            {busy ? <span className="spinner" /> : 'Ask: is my route safe tonight?'}
          </button>

          {result && result.error && (
            <p className="status-err">{result.error}</p>
          )}
          {result && !result.error && result.assessment === null && (
            <p className="status-ok">
              No flagged conditions reported along this route right now — looks okay based on
              current reports.
            </p>
          )}
          {result && !result.error && result.assessment && (
            <p className="summary-text">{result.assessment}</p>
          )}
        </>
      )}

      <p className="muted">Informational only — no rescue or dispatch.</p>
    </section>
  );
}
