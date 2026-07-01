// F-003 pre-trip route check (P0).
// Role: before leaving, tell a commuter which segments of her route are flagged tonight.
// Traces to: docs/03-prd.md F-003, docs/06-system-design.md (UJ-001 data flow).
//
// Flow: user ticks the segments on her route → Check → each shows okay vs flagged-tonight, computed
// from the live latest-report-per-segment map + the 24h freshness window (src/lib/freshness.js, BR-004).
//
// CONSTRAINTS:
//   - No SOS / rescue / dispatch (BR-002) — informational only.
//   - The route is a client-side selection and is NOT persisted (data minimization, Threat T6).
import { useState } from 'react';
import { segmentStatus } from '../../lib/freshness.js';
import { CONDITION_META } from '../../data/condition-types.js';

export default function RouteCheck({ segments, latest }) {
  const [route, setRoute] = useState(() => new Set());
  const [results, setResults] = useState(null);

  function toggle(segmentId) {
    setRoute((prev) => {
      const next = new Set(prev);
      next.has(segmentId) ? next.delete(segmentId) : next.add(segmentId);
      return next;
    });
    setResults(null);
  }

  function checkRoute() {
    const now = Date.now();
    const rows = segments
      .filter((s) => route.has(s.segmentId))
      .map((s) => {
        const report = latest.get(s.segmentId);
        const status = segmentStatus(report, now);
        return { segment: s, status, report };
      });
    setResults(rows);
  }

  const flaggedCount = results ? results.filter((r) => r.status === 'flagged_tonight').length : 0;

  return (
    <section className="route-check">
      <h2>Is my route okay tonight?</h2>
      <p className="muted">Tick the segments on your route, then check. Informational only — no rescue or dispatch.</p>

      <ul className="route-picker">
        {segments.map((s) => (
          <li key={s.segmentId}>
            <label>
              <input
                type="checkbox"
                checked={route.has(s.segmentId)}
                onChange={() => toggle(s.segmentId)}
              />
              {s.name}
            </label>
          </li>
        ))}
      </ul>

      <button type="button" disabled={route.size === 0} onClick={checkRoute}>
        Check route
      </button>

      {results && (
        <div className="route-results">
          <p>
            {flaggedCount === 0
              ? 'No segments flagged tonight on this route.'
              : `${flaggedCount} of ${results.length} segment(s) flagged tonight.`}
          </p>
          <ul>
            {results.map(({ segment, status, report }) => {
              const flagged = status === 'flagged_tonight';
              const meta = report ? CONDITION_META[report.conditionType] : null;
              return (
                <li key={segment.segmentId} className={flagged ? 'seg-flagged' : 'seg-okay'}>
                  <strong>{segment.name}</strong>{' — '}
                  {flagged ? `flagged tonight (${meta ? meta.label : 'condition'})` : 'okay'}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
