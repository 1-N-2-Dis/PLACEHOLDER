// Admin moderation list (F-009): every report, newest first, with a delete button.
// Traces to: docs/superpowers/specs/2026-07-01-login-account-page-design.md, backend/firestore.rules isAdmin().
// Remove-only moderation — no edit, matching reports' immutability everywhere else (BR-004).
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { CONDITION_META } from '../../data/condition-types.js';
import { deleteReport } from '../../lib/reports.js';

export default function AdminReports({ reports, segments }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const segmentNames = new Map(segments.map((s) => [s.segmentId, s.name]));

  async function handleDelete(id) {
    setError(null);
    setBusyId(id);
    try {
      await deleteReport(id);
    } catch {
      setError('Could not delete that report. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (reports.length === 0) {
    return <p className="muted">No reports yet.</p>;
  }

  return (
    <>
      {error && <p className="status-err">{error}</p>}
      <ul className="review-summary">
        {reports.map((r) => {
          const meta = CONDITION_META[r.conditionType];
          return (
            <li key={r.id} className="icon-line flex-between">
              <span className="icon-line">
                {meta && <meta.Icon size={14} />}
                {meta?.label || r.conditionType} — {segmentNames.get(r.segmentId) || r.segmentId}
              </span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} disabled={busyId === r.id}>
                {busyId === r.id ? <span className="spinner" /> : <><Trash2 size={14} /> Delete</>}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
