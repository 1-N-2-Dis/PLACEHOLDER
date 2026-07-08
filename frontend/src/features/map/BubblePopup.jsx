// BubblePopup — mascot bubble trigger + speech-bubble popup.
// Fixed position (no longer draggable): sits above the SOS button, bottom-right.
// Single panel: "What can I help you?" header + Risk Summary content.
//
// Traces to: docs/03-prd.md F-004/F-008.
import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import RiskSummaryInner from '../risk-summary/RiskSummaryInner.jsx';

const bubbleImg = '/bubble.png';
const SPARKLE_COUNT = 5;
const PANEL_ID = 'bubble-popup-panel';

export default function BubblePopup({ segments, selectedId, reports }) {
  const [open, setOpen] = useState(false);

  const popupRef   = useRef(null);
  const triggerRef = useRef(null);

  // ── Close / toggle ───────────────────────────────────────────────────────
  const close      = useCallback(() => { setOpen(false); triggerRef.current?.focus(); }, []);
  const toggleOpen = useCallback(() => setOpen(v => !v), []);

  // Escape closes panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Shift focus into panel on open
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      const first = popupRef.current?.querySelector(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [open]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(); }
  }

  return (
    <div className="bubble-popup-root" aria-live="polite">

      {/* ── Sparkles (dark mode golden glow, float upward) ── */}
      <div className="bubble-sparkles" aria-hidden="true">
        {Array.from({ length: SPARKLE_COUNT }, (_, i) => (
          <span key={i} className="bubble-spark" style={{ '--i': i }} />
        ))}
      </div>

      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        className={`bubble-trigger-btn${open ? ' bubble-trigger-btn--open' : ''}`}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={open ? 'Close safety panel' : 'Open safety panel'}
        title="Safety Assistant"
      >
        <img src={bubbleImg} alt="" className="bubble-trigger-img" draggable={false} />
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="bubble-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          aria-hidden="true"
        />
      )}

      {/* ── Popup panel ── */}
      <div
        id={PANEL_ID}
        ref={popupRef}
        className={`bubble-panel${open ? ' bubble-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Safety Assistant"
        aria-hidden={!open}
        inert={!open ? '' : undefined}
      >
        <div className="bubble-panel-tail" aria-hidden="true" />

        <div className="bubble-panel-header">
          <p className="bubble-panel-greeting">What can I help you?</p>
          <button type="button" className="bubble-panel-close" onClick={close} aria-label="Close safety panel">
            <X size={18} />
          </button>
        </div>

        <div className="bubble-tabpanel">
          <RiskSummaryInner segments={segments} selectedId={selectedId} reports={reports} />
        </div>
      </div>
    </div>
  );
}
