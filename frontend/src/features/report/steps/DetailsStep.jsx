// Report form section: condition type + title + note (all required).
// Closed enum only — there is deliberately no free-form crime/neighborhood field (BR-001, TC-004).
import { CONDITION_TYPES, CONDITION_META } from '../../../data/condition-types.js';
import { AlertTriangle, FileText } from 'lucide-react';

export default function DetailsStep({ conditionType, onConditionChange, title, onTitleChange, note, onNoteChange }) {
  return (
    <>
      <section className="report-section-card">
        <div className="report-section-header">
          <div className="report-section-icon">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="report-section-title">Condition</h3>
            <p className="report-section-desc">What did you observe at this location?</p>
          </div>
        </div>

        <div className="condition-grid">
          {CONDITION_TYPES.map((type) => {
            const meta = CONDITION_META[type];
            const isSelected = type === conditionType;
            return (
              <button
                key={type}
                type="button"
                className={`condition-grid-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => onConditionChange(type)}
              >
                <div className="condition-grid-icon">
                  <meta.Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className="condition-grid-label">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="report-section-card">
        <div className="report-section-header">
          <div className="report-section-icon">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="report-section-title">Details</h3>
            <p className="report-section-desc">Provide specifics to help others stay safe.</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="report-title">Title <span style={{ color: 'var(--flag)' }}>*</span></label>
          <input
            id="report-title"
            type="text"
            className="form-input report-input"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={60}
            placeholder="Summarize the condition"
          />
          <div className="char-counter">{title.length}/60</div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="report-note">Note <span style={{ color: 'var(--flag)' }}>*</span></label>
          <textarea
            id="report-note"
            className="form-input report-input"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={280}
            placeholder="Describe the condition (lighting, crowd). Please don't name individuals."
            style={{ resize: 'none', minHeight: '100px' }}
          />
          <div className="char-counter">{note.length}/280</div>
        </div>
      </section>
    </>
  );
}
