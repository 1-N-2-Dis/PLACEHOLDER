// F-002/F-006/F-007 four-step report wizard (P0).
// Role: let an authenticated user flag a location with one condition, backed by a required photo
// and note; the report is classified/deduped/rejected by AI (backend/functions submitReport)
// before it's ever written. Traces to: docs/03-prd.md F-002/F-006/F-007, docs/superpowers/specs/
// 2026-07-01-report-wizard-frontend-design.md.
//
// Steps: photo -> location (list or map pin, both resolve to a segmentId) -> details (condition +
// note) -> review/submit -> blocking AI review -> one of: filed (with severity), merged as
// corroboration, or not filed.
//
// HARD CONSTRAINTS:
//   - Only the closed enum is selectable. NO free-form crime/neighborhood field exists (BR-001, TC-004).
//   - Photo and note are now required (BR-008 amendment) — a stronger evidence bar than the
//     original one-tap flow.
//   - Write requires auth (BR-005); the Cloud Function is the sole enforcement point now (BR-001).
import { useState } from 'react';
import { submitReportForReview } from '../../lib/reportIntake.js';
import PhotoStep from './steps/PhotoStep.jsx';
import LocationStep from './steps/LocationStep.jsx';
import DetailsStep from './steps/DetailsStep.jsx';
import ReviewStep from './steps/ReviewStep.jsx';

const STEPS = ['photo', 'location', 'details', 'review'];
const STEP_LABELS = { photo: 'Photo', location: 'Location', details: 'Details', review: 'Review' };

function canAdvance(step, { photoFile, selectedId, conditionType, note }) {
  if (step === 'photo') return !!photoFile;
  if (step === 'location') return !!selectedId;
  if (step === 'details') return !!conditionType && note.trim().length > 0;
  return true;
}

export default function ReportForm({ segments, selectedId, onSelect }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [conditionType, setConditionType] = useState(null);
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { status: 'created'|'duplicate'|'rejected', ... } | { status: 'error', msg }

  const step = STEPS[stepIndex];
  const fields = { photoFile, selectedId, conditionType, note };

  function goNext() {
    if (!canAdvance(step, fields)) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setResult(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function submit() {
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
        setStepIndex(0);
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

      <ol className="wizard-steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === stepIndex ? 'wizard-step--active' : i < stepIndex ? 'wizard-step--done' : undefined}>
            {STEP_LABELS[s]}
          </li>
        ))}
      </ol>

      {step === 'photo' && (
        <PhotoStep photoFile={photoFile} onChange={setPhotoFile} />
      )}
      {step === 'location' && (
        <LocationStep segments={segments} segmentId={selectedId} onSelect={onSelect} />
      )}
      {step === 'details' && (
        <DetailsStep
          conditionType={conditionType}
          onConditionChange={setConditionType}
          note={note}
          onNoteChange={setNote}
        />
      )}
      {step === 'review' && (
        <ReviewStep
          segmentName={segments.find((s) => s.segmentId === selectedId)?.name}
          conditionType={conditionType}
          note={note}
          photoFile={photoFile}
          busy={busy}
          result={result}
          onSubmit={submit}
        />
      )}

      <div className="wizard-nav">
        {stepIndex > 0 && (
          <button type="button" disabled={busy} onClick={goBack}>Back</button>
        )}
        {step !== 'review' && (
          <button type="button" disabled={!canAdvance(step, fields)} onClick={goNext}>Next</button>
        )}
      </div>
    </section>
  );
}
