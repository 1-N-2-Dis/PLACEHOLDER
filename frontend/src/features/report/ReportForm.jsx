// F-002 one-tap condition report (P0).
// Role: let an authenticated user flag a selected segment with one condition, in one tap.
// Traces to: docs/03-prd.md F-002, docs/06-system-design.md (UJ-002 data flow).
//
// Flow: pick a segment → tap one condition from the closed enum → optional note → write to Firestore.
// The map updates live via the App's onSnapshot subscription.
//
// HARD CONSTRAINTS:
//   - Only the closed enum is selectable. NO free-form crime/neighborhood field exists (BR-001, TC-004).
//   - `note` is optional and feeds F-004 only (BR-006); the hint discourages naming people (T6).
//   - Write requires auth (BR-005); rules enforce this again server-side.
import { useState } from 'react';
import { CONDITION_TYPES, CONDITION_META } from '../../data/condition-types.js';
import { addReport } from '../../lib/reports.js';

export default function ReportForm({ segments, selectedId, onSelect }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok: boolean, msg: string }

  async function fileReport(conditionType) {
    if (!selectedId) {
      setStatus({ ok: false, msg: 'Pick a segment first.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await addReport({ segmentId: selectedId, conditionType, note });
      setNote('');
      setStatus({ ok: true, msg: 'Report filed. Thanks — others can see it now.' });
    } catch (err) {
      setStatus({ ok: false, msg: `Could not file report: ${err.message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="report-form">
      <h2>Report a condition</h2>

      <label>
        Segment
        <select value={selectedId || ''} onChange={(e) => onSelect(e.target.value || null)}>
          <option value="">— choose a segment —</option>
          {segments.map((s) => (
            <option key={s.segmentId} value={s.segmentId}>{s.name}</option>
          ))}
        </select>
      </label>

      {/* Closed enum only — there is deliberately no free-form crime/neighborhood field (BR-001, TC-004). */}
      <div className="condition-buttons">
        {CONDITION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            disabled={busy || !selectedId}
            onClick={() => fileReport(type)}
          >
            {CONDITION_META[type].icon} {CONDITION_META[type].label}
          </button>
        ))}
      </div>

      <label>
        Note (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          placeholder="Describe the condition (lighting, crowd). Please don't name individuals."
        />
      </label>

      {status && (
        <p className={status.ok ? 'status-ok' : 'status-err'}>{status.msg}</p>
      )}
    </section>
  );
}
