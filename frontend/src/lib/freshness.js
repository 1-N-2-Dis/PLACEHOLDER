// "tonight" freshness logic for SaferRoute.
// Role: decide whether a segment's newest report still counts as "flagged tonight."
// Traces to: docs/09-data-model.md §Freshness window, docs/03-prd.md §Open questions.
//
// Serves: F-003 (pre-trip route check), enforces BR-004 (flag carries type + timestamp).
//
// DECISION: 24-hour window. A report counts as "flagged tonight" for 24h after createdAt.
// This is a code constant — changing it needs no schema migration.

export const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000;

// Normalize a Firestore Timestamp | Date | millis to epoch millis. Returns null if absent.
export function toMillis(createdAt) {
  if (!createdAt) return null;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt === 'number') return createdAt;
  return null;
}

// Is a single report still within the freshness window relative to `now` (epoch millis)?
// Uses lastActivityAt when present (bumped on every AI-detected duplicate corroboration —
// backend/functions submitReport) so corroboration refreshes a flag's "tonight" freshness,
// falling back to createdAt for reports predating that field.
export function isFlaggedTonight(report, now = Date.now()) {
  const ms = toMillis(report && (report.lastActivityAt || report.createdAt));
  if (ms === null) return false;
  return now - ms <= FRESHNESS_WINDOW_MS;
}

// Status for a segment given its newest report (or undefined if none).
// Returns 'flagged_tonight' | 'okay'.
export function segmentStatus(latestReport, now = Date.now()) {
  if (latestReport && isFlaggedTonight(latestReport, now)) return 'flagged_tonight';
  return 'okay';
}
