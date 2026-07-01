// Report form section: condition type + note (both required).
// Closed enum only — there is deliberately no free-form crime/neighborhood field (BR-001, TC-004).
import { CONDITION_TYPES, CONDITION_META } from '../../../data/condition-types.js';

export default function DetailsStep({ conditionType, onConditionChange, note, onNoteChange }) {
  return (
    <section className="report-step">
      <h2>Describe the condition</h2>

      <div className="condition-buttons">
        {CONDITION_TYPES.map((type) => {
          const meta = CONDITION_META[type];
          return (
            <button
              key={type}
              type="button"
              className={`condition-btn${type === conditionType ? ' condition-btn--selected' : ''}`}
              onClick={() => onConditionChange(type)}
            >
              <meta.Icon size={14} /> {meta.label}
            </button>
          );
        })}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="report-note">Note (required)</label>
        <textarea
          id="report-note"
          className="form-input"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          maxLength={280}
          placeholder="Describe the condition (lighting, crowd). Please don't name individuals."
        />
      </div>
    </section>
  );
}
