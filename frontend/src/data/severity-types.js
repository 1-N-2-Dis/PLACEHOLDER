// AI-assigned report severity vocabulary (F-006).
// Role: display metadata for a report's severity, as classified by backend/functions
// submitReport. NOT user-selectable — the AI assigns this, not the reporter (see ReportForm.jsx).
// Traces to: docs/03-prd.md F-006, BR-007 (severity is a per-report triage signal, never a
// place/neighborhood classification).
//
// green  = not too dangerous, but worth noting.
// yellow = a bit dangerous — routing prefers to avoid, crosses only if no alternative exists.
// red    = dangerous — routing actively avoids this.
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export const SEVERITY_VALUES = ['green', 'yellow', 'red'];

export const SEVERITY_META = {
  // Purple-ish rather than green, on request — distinct from the "safe route" green used
  // elsewhere (route lines, success messages), which is a different concept (routing outcome,
  // not report severity). CSS var refs (not raw hex) so these stay WCAG-AA in dark mode too —
  // --wellused and --sev-red-fg already carry dark-mode-safe values for these exact colors.
  green: { label: 'Low concern', Icon: CheckCircle2, color: 'var(--wellused)' },
  yellow: { label: 'Caution', Icon: AlertTriangle, color: 'var(--sev-yellow-fg)' },
  red: { label: 'Dangerous', Icon: AlertOctagon, color: 'var(--sev-red-fg)' },
};

export function isValidSeverity(value) {
  return SEVERITY_VALUES.includes(value);
}
