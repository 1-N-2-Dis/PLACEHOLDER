// Dashboard ("Home") hero-card stats — derived from live segment/report data only (no
// heatmap-baseline fallback, unlike lib/hazards.js), so these cards reflect real reported
// activity rather than demo hotspots.
import { isFlaggedTonight, segmentStatus } from './freshness.js';

// Segments (from the caller's tracked list) whose latest report is still inside the 24h
// freshness window.
export function flaggedSegmentsTonight(segments, latest) {
  return segments
    .filter((seg) => segmentStatus(latest.get(seg.segmentId)) === 'flagged_tonight')
    .map((seg) => ({ segment: seg, report: latest.get(seg.segmentId) }));
}

// Zone-wide 0-100 score: subtract a fixed penalty per currently flagged road, weighted by
// severity (red costs more than yellow), floored at 0. A simple, explainable deduction rather
// than a black-box model — consistent with the app's conditions-only, no-hidden-scoring design.
export function computeSafetyScore(flagged) {
  const penalty = flagged.reduce((sum, { report }) => sum + (report?.severity === 'red' ? 12 : 6), 0);
  return Math.max(0, 100 - penalty);
}

export function safetyScoreTier(score) {
  if (score >= 85) return 'Calm';
  if (score >= 65) return 'Moderate';
  return 'High alert';
}

// Count of report docs still inside the 24h freshness window — a report-count, distinct from
// flaggedSegmentsTonight's segment-count (a segment can have at most one live report at a time,
// but "nearby reports" is about submissions, "zone coverage" is about roads).
export function reportsActiveTonight(reports) {
  return reports.filter((r) => isFlaggedTonight(r)).length;
}
