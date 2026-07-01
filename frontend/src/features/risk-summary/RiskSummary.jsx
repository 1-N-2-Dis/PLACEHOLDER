// F-004 structured risk summary (P1 STRETCH).
// Role: show a clean, deduplicated summary of a segment's reports instead of raw noise.
// Traces to: docs/03-prd.md F-004, docs/06-system-design.md (UJ-003, Gemini via Cloud Function).
//
// Flow: request a summary → the backend callable reads the segment's report notes → Gemini dedupes +
// structures ONLY the submitted content (BR-006) → returns summary text to render.
//
// CONSTRAINTS:
//   - Summary adds NO facts not present in the input reports (BR-006) — enforced by the backend prompt.
//   - CUT-SAFE: on empty/error, degrade to the raw flag list (TC-006 fallback).
//   - The Gemini key is NEVER in the client — the Cloud Function holds it (Threat T2).
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase.js';
import { CONDITION_META } from '../../data/condition-types.js';

const summarizeSegment = httpsCallable(functions, 'summarizeSegment');

export default function RiskSummary({ segments, selectedId, reports }) {
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
      const res = await summarizeSegment({ segmentId: selectedId });
      setSummary(res.data.summary); // null when there are no notes → fallback renders below
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!segment) {
    return (
      <section className="risk-summary">
        <h2>Risk summary</h2>
        <p className="muted">Select a segment to see its summary.</p>
      </section>
    );
  }

  return (
    <section className="risk-summary">
      <h2>Risk summary — {segment.name}</h2>
      <button type="button" onClick={requestSummary} disabled={busy}>
        {busy ? 'Summarizing…' : 'Summarize reports'}
      </button>

      {summary && <p className="summary-text">{summary}</p>}

      {/* Cut-safe fallback: raw flag list when the summary is empty or the call failed (TC-006). */}
      {(error || (summary === null && !busy)) && (
        <div className="summary-fallback">
          {error && <p className="status-err">Summary unavailable — showing raw reports.</p>}
          {segReports.length === 0 ? (
            <p className="muted">No reports for this segment yet.</p>
          ) : (
            <ul>
              {segReports.map((r) => {
                const meta = CONDITION_META[r.conditionType];
                return (
                  <li key={r.id}>
                    {meta ? `${meta.icon} ${meta.label}` : r.conditionType}
                    {r.note ? ` — “${r.note}”` : ''}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
