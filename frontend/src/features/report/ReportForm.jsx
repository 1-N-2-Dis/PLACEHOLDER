// F-002/F-006/F-007 single-page report form (P0).
// Role: let an authenticated user flag a location with one condition and a required note, with an
// optional photo, in a single quick pass; the report is classified/deduped/rejected by AI
// (backend/functions submitReport) before it's ever written. Traces to: docs/03-prd.md
// F-002/F-006/F-007, docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md.
//
// Sections (all on one page, no step navigation): location (list or map pin, both resolve to a
// segmentId) -> details (condition + note) -> photo (optional) -> submit -> blocking AI review ->
// one of: filed (with severity), merged as corroboration, or not filed.
//
// HARD CONSTRAINTS:
//   - Only the closed enum is selectable. NO free-form crime/neighborhood field exists (BR-001, TC-004).
//   - Location, condition, and note are required to submit; photo is optional (BR-008).
//   - Write requires auth (BR-005); the Cloud Function is the sole enforcement point now (BR-001).
import { useState } from 'react';
import { submitReportForReview } from '../../lib/reportIntake.js';
import LocationStep from './steps/LocationStep.jsx';
import DetailsStep from './steps/DetailsStep.jsx';
import PhotoStep from './steps/PhotoStep.jsx';

export default function ReportForm({ segments, selectedId, onSelect }) {
  const [conditionType, setConditionType] = useState(null);
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { status: 'created'|'duplicate'|'rejected', ... } | { status: 'error', msg }

  const canSubmit = !!selectedId && !!conditionType && note.trim().length > 0;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setResult(null);
    try {
      const segmentName = segments.find((s) => s.segmentId === selectedId)?.name;
      const outcome = await submitReportForReview({
        segmentId: selectedId, segmentName, conditionType, note, photoFile,
      });
      setResult(outcome);
      if (outcome.status !== 'rejected') {
        setNote('');
        setConditionType(null);
        setPhotoFile(null);
        onSelect(null);
      }
    } catch (err) {
      setResult({ status: 'error', msg: `Could not submit report: ${err.message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="report-form">
      <h2>Report a condition</h2>

      <LocationStep segments={segments} segmentId={selectedId} onSelect={onSelect} />
      <DetailsStep
        conditionType={conditionType}
        onConditionChange={setConditionType}
        note={note}
        onNoteChange={setNote}
      />
      <PhotoStep photoFile={photoFile} onChange={setPhotoFile} />

      <button type="button" className="btn btn-primary btn-full" disabled={busy || !canSubmit} onClick={submit}>
        {busy ? <span className="spinner" /> : 'Submit report'}
      </button>

      {result && result.status === 'created' && (
        <p className="status-ok">Report filed ({result.severity}). Thanks — others can see it now.</p>
      )}
      {result && result.status === 'duplicate' && (
        <p className="status-ok">
          Merged with an existing report — thanks for confirming
          {typeof result.corroborationCount === 'number' ? ` (${result.corroborationCount} reports now)` : ''}.
        </p>
      )}
      {result && result.status === 'rejected' && (
        <p className="status-err">Not filed: {result.reason}</p>
      )}
      {result && result.status === 'error' && (
        <p className="status-err">{result.msg}</p>
      )}
    </section>
  );
}
