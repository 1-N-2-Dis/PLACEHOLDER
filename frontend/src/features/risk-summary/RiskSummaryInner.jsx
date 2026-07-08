// RiskSummaryInner — the content-only variant of RiskSummary, for use inside
// BubblePopup. Same logic as RiskSummary.jsx but renders only the panel body
// (no collapsed/expanded toggle — the parent BubblePopup controls visibility).
//
// Traces to: docs/03-prd.md F-004, docs/06-system-design.md (UJ-003, Gemini via Render API).
// CONSTRAINTS: BR-001 (conditions only), BR-006 (AI adds no facts), BR-007 (no place labels).
import { useState } from 'react';
import { callApi } from '../../lib/apiClient.js';
import { CONDITION_META } from '../../data/condition-types.js';

export default function RiskSummaryInner({ segments, selectedId, reports }) {
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const segment = segments.find((s) => s.segmentId === selectedId) || null;
  const segReports = reports.filter((r) => r.segmentId === selectedId);

  async function requestSummary() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const res = await callApi('/summarizeSegment', { segmentId: selectedId });
      setSummary(res.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bubble-section">
      {!segment ? (
        <>
          <p className="bubble-section-intro">
            Tap a road segment on the map to see an AI-structured summary of its community reports.
          </p>
          <p className="muted">No road segment selected yet.</p>
        </>
      ) : (
        <>
          <p className="bubble-section-intro">
            AI summary for <strong>{segment.name}</strong>:
          </p>

          <button
            type="button"
            className="btn btn-primary btn-sm btn-full"
            onClick={requestSummary}
            disabled={busy}
          >
            {busy ? <span className="spinner" /> : 'Summarize reports'}
          </button>

          {summary && (
            <p className="summary-text" style={{ marginTop: 10 }}>{summary}</p>
          )}

          {/* Cut-safe fallback: raw flag list (TC-006) */}
          {(error || (summary === null && !busy)) && (
            <div className="summary-fallback" style={{ marginTop: 10 }}>
              {error && (
                <p className="status-err">Summary unavailable — showing raw reports.</p>
              )}
              {segReports.length === 0 ? (
                <p className="muted">No reports for this road yet.</p>
              ) : (
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {segReports.map((r) => {
                    const meta = CONDITION_META[r.conditionType];
                    return (
                      <li key={r.id} className="icon-line" style={{ marginBottom: 4 }}>
                        {meta ? <><meta.Icon size={14} /> {meta.label}</> : r.conditionType}
                        {r.note ? ` — "${r.note}"` : ''}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
