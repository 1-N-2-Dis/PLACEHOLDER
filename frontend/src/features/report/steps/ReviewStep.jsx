// Report wizard step 4/4: review + submit, and the created/duplicate/rejected/error outcome.
import { CONDITION_META } from '../../../data/condition-types.js';

export default function ReviewStep({ segmentName, conditionType, note, photoFile, busy, result, onSubmit }) {
  const meta = CONDITION_META[conditionType];

  return (
    <section className="report-step">
      <h2>Review &amp; submit</h2>

      <ul className="review-summary">
        <li><strong>Location:</strong> {segmentName}</li>
        <li><strong>Condition:</strong> {meta && <meta.Icon size={14} />} {meta?.label}</li>
        <li><strong>Note:</strong> {note}</li>
        <li><strong>Photo:</strong> {photoFile?.name}</li>
      </ul>

      <button type="button" disabled={busy} onClick={onSubmit}>
        {busy ? 'Reviewing…' : 'Submit report'}
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
