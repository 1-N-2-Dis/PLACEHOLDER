// LegalModal — scrollable in-page modal for Terms of Service / Privacy Notice.
// Props:
//   doc   — { title, effectiveDate, intro?, sections: [{ heading, body }] }
//   onClose — () => void
// Closes on backdrop click, Escape key, or the × button.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function LegalModal({ doc, onClose }) {
  const dialogRef = useRef(null);
  const closeRef  = useRef(null);

  // Focus the close button on open for keyboard accessibility.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape to close.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent scroll bleed on the page behind.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleBackdrop(e) {
    if (e.target === dialogRef.current) onClose();
  }

  return createPortal(
    <div
      ref={dialogRef}
      className="legal-modal-backdrop"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="legal-modal-panel">
        {/* ── Header ── */}
        <div className="legal-modal-header">
          <div>
            <h2 id="legal-modal-title" className="legal-modal-title">{doc.title}</h2>
            <p className="legal-modal-date">Effective: {doc.effectiveDate}</p>
          </div>
          <button
            ref={closeRef}
            className="legal-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="legal-modal-body">
          {doc.intro && (
            <p className="legal-modal-intro">{doc.intro}</p>
          )}
          {doc.sections.map((sec) => (
            <section key={sec.heading} className="legal-modal-section">
              <h3 className="legal-modal-section-heading">{sec.heading}</h3>
              {/* Render newlines as paragraph breaks */}
              {sec.body.split('\n\n').map((para, i) => (
                <p key={i} className="legal-modal-para">{para}</p>
              ))}
            </section>
          ))}
        </div>

        {/* ── Footer close ── */}
        <div className="legal-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
