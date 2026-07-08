// SosButton — F-011 quick-dial 911 shortcut.
// A persistent button on the map page that opens the device's native dialer
// pre-filled with 911. A misclick-protection dialog (8-second countdown) lets
// the user cancel before the tel: link is followed.
//
// Traces to: docs/03-prd.md F-011, BR-002 (amended 2026-07-08).
// CONSTRAINTS (BR-002):
//   - No in-app rescue, dispatch, or emergency-tracking promise.
//   - The button is a passive shortcut; GuidHer hands off to the native dialer.
//   - Copy must NOT imply GuidHer itself will help.
import { useState, useEffect, useRef } from 'react';
import { Phone, X } from 'lucide-react';

const COUNTDOWN_SECONDS = 8;

export default function SosButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [countdown, setCountdown]   = useState(COUNTDOWN_SECONDS);
  const dialLinkRef = useRef(null);
  const tickRef     = useRef(null);

  // Start countdown when dialog opens; dial when it hits 0
  useEffect(() => {
    if (!showDialog) return;
    setCountdown(COUNTDOWN_SECONDS);

    tickRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(tickRef.current);
          // Auto-follow the tel: link
          dialLinkRef.current?.click();
          return 0;
        }
        return n - 1;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, [showDialog]);

  // Close on Escape
  useEffect(() => {
    if (!showDialog) return;
    const onKey = (e) => { if (e.key === 'Escape') handleCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showDialog]);

  function handleSosClick() {
    setShowDialog(true);
  }

  function handleCancel() {
    clearInterval(tickRef.current);
    setShowDialog(false);
  }

  // Progress fraction (1 → 0)
  const progress = countdown / COUNTDOWN_SECONDS;
  // SVG ring params
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        type="button"
        className="sos-trigger-btn"
        onClick={handleSosClick}
        aria-label="Open emergency quick-dial"
        title="Emergency quick-dial (opens your phone dialer)"
      >
        <Phone size={18} strokeWidth={2.5} />
        <span className="sos-trigger-label">SOS</span>
      </button>

      {/* ── Misclick-protection dialog ── */}
      {showDialog && (
        <div
          className="sos-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
          aria-hidden="true"
        >
          <div
            className="sos-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sos-dialog-title"
            aria-describedby="sos-dialog-desc"
          >
            {/* Countdown ring */}
            <div className="sos-ring-wrap" aria-hidden="true">
              <svg className="sos-ring-svg" viewBox="0 0 48 48">
                {/* Background track */}
                <circle cx="24" cy="24" r={r} className="sos-ring-track" />
                {/* Progress arc */}
                <circle
                  cx="24" cy="24" r={r}
                  className="sos-ring-progress"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeDashoffset={0}
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <span className="sos-ring-count">{countdown}</span>
            </div>

            <h2 id="sos-dialog-title" className="sos-dialog-title">
              Did you mean to call?
            </h2>
            <p id="sos-dialog-desc" className="sos-dialog-desc">
              Calling 911 connects you to emergency services.
              GuidHer does not dispatch or track — your device's phone app will open.
            </p>

            <div className="sos-dialog-actions">
              <button
                type="button"
                className="btn sos-cancel-btn"
                onClick={handleCancel}
                autoFocus
              >
                <X size={15} />
                Cancel
              </button>

              {/* Hidden anchor; triggered programmatically on countdown end,
                  or directly by the "Call 911" button below */}
              {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
              <a
                ref={dialLinkRef}
                href="tel:911"
                aria-hidden="true"
                tabIndex={-1}
                style={{ display: 'none' }}
              />

              <a
                href="tel:911"
                className="btn sos-call-btn"
                role="button"
                onClick={handleCancel}
                aria-label="Call 911 now"
              >
                <Phone size={15} strokeWidth={2.5} />
                No, call 911
              </a>
            </div>

            <p className="sos-disclaimer">
              Calling in {countdown}s — tap Cancel to stop
            </p>
          </div>
        </div>
      )}
    </>
  );
}
