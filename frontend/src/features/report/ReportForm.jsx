// F-002/F-006/F-007 single-page report form (P0).
// Role: let an authenticated user flag a location with one condition, a required title, and a
// required note, with an optional photo, in a single quick pass; the report is validated/
// classified/deduped/rejected by AI (backend/functions submitReport) before it's ever written.
// Traces to: docs/03-prd.md F-002/F-006/F-007,
// docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md.
//
// Sections (all on one page, no step navigation): location (list or map pin, both resolve to a
// segmentId) -> details (condition + title + note) -> photo (optional) -> submit -> blocking AI
// review -> one of: filed (with severity), merged as corroboration, or not filed (with reason).
//
// HARD CONSTRAINTS:
//   - Only the closed enum is selectable. NO free-form crime/neighborhood field exists (BR-001, TC-004).
//   - Location, condition, title, and note are required to submit; photo is optional (BR-008).
//   - Write requires auth (BR-005); the Cloud Function is the sole enforcement point now (BR-001).
import { useState } from 'react';
import { submitReportForReview } from '../../lib/reportIntake.js';
import { parseRoadSegmentId } from '../../lib/osmRoads.js';
import { PHOTO_UPLOAD_ENABLED } from '../../lib/storage.js';
import LocationStep from './steps/LocationStep.jsx';
import DetailsStep from './steps/DetailsStep.jsx';
import PhotoStep from './steps/PhotoStep.jsx';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

function ReportProgress({ currentStep }) {
  const steps = [
    { num: 1, label: 'Location' },
    { num: 2, label: 'Condition' },
    { num: 3, label: 'Details' },
    { num: 4, label: 'Submit' }
  ];

  return (
    <div className="report-progress">
      {steps.map(step => {
        let status = '';
        if (currentStep > step.num) status = 'completed';
        else if (currentStep === step.num) status = 'current';

        return (
          <div key={step.num} className={`report-progress-step ${status}`}>
            <div className="report-progress-dot">
              {status === 'completed' ? <CheckCircle2 size={18} /> : step.num}
            </div>
            <span className="report-progress-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportForm({ segments, selectedId, onSelect }) {
  const [conditionType, setConditionType] = useState(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const canSubmit = !!selectedId && !!conditionType && title.trim().length > 0 && note.trim().length > 0;

  let currentStep = 1;
  if (selectedId) currentStep = 2;
  if (selectedId && conditionType) currentStep = 3;
  if (canSubmit) currentStep = 4;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setResult(null);
    try {
      const segmentName = segments.find((s) => s.segmentId === selectedId)?.name
        ?? parseRoadSegmentId(selectedId)?.name;
      const outcome = await submitReportForReview({
        segmentId: selectedId, segmentName, conditionType, title, note, photoFile,
      });
      setResult(outcome);
      if (outcome.status !== 'rejected') {
        setTitle('');
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
    <section className="report-form-container">
      <ReportProgress currentStep={currentStep} />

      {result && result.status === 'created' && (
        <div className="report-section-card" style={{ border: '1px solid var(--primary)' }}>
          <p className="status-ok mb-0">Report filed ({result.severity}). Thanks — others can see it now.</p>
        </div>
      )}
      {result && result.status === 'duplicate' && (
        <div className="report-section-card">
          <p className="status-ok mb-0">
            Merged with an existing report — thanks for confirming
            {typeof result.corroborationCount === 'number' ? ` (${result.corroborationCount} reports now)` : ''}.
          </p>
        </div>
      )}
      {result && result.status === 'rejected' && (
        <div className="report-section-card">
          <p className="status-err mb-0">Not filed: {result.reason}</p>
        </div>
      )}
      {result && result.status === 'error' && (
        <div className="report-section-card">
          <p className="status-err mb-0">{result.msg}</p>
        </div>
      )}

      <LocationStep segments={segments} segmentId={selectedId} onSelect={onSelect} />
      
      <DetailsStep
        conditionType={conditionType}
        onConditionChange={setConditionType}
        title={title}
        onTitleChange={setTitle}
        note={note}
        onNoteChange={setNote}
      />
      
      {PHOTO_UPLOAD_ENABLED && <PhotoStep photoFile={photoFile} onChange={setPhotoFile} />}

      <div className="report-section-card report-submit-card">
        <div className="report-section-header" style={{ justifyContent: 'center' }}>
          <div className="report-section-icon">
            <ShieldCheck size={24} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 className="report-section-title">Review & Submit</h3>
            <p className="report-section-desc">Your report helps protect other commuters.</p>
          </div>
        </div>
        <button type="button" className="btn-full btn-submit-gradient" disabled={busy || !canSubmit} onClick={submit}>
          {busy ? <span className="spinner" /> : 'Submit Community Report'}
        </button>
      </div>
    </section>
  );
}
