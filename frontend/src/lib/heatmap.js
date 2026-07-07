// Community heatmap of "condition validated" reports (F-010).
// Role: build the per-segment incident markers ReportHeatmap.jsx's cloud layers render.
// Traces to: docs/03-prd.md F-010, docs/09-data-model.md (no stored `validated` field).
//
// "Validated" = severity is yellow or red (AI-assigned, F-006, BR-007) — never green, never
// user-selectable. Reports are collapsed to one marker per segment: worst severity wins, and the
// real, cross-user like count (report.likedBy, from the /likeReport endpoint) scales cloud size —
// distinct from the AI-driven corroborationCount, which submitReport uses for duplicate merging,
// not for this visual.
import { isFlaggedTonight } from './freshness.js';

// One heavily liked segment shouldn't swamp the layer — same cap spirit as the old
// density-weight cap.
export const HEAT_COUNT_CAP = 5;

export function buildIncidentMarkers(reports, segments, now = Date.now()) {
  const segmentById = new Map(segments.map((s) => [s.segmentId, s]));
  const bySegment = new Map(); // segmentId -> { segmentId, lng, lat, severity, likeCount }

  for (const report of reports) {
    if (report.severity !== 'yellow' && report.severity !== 'red') continue;
    if (!isFlaggedTonight(report, now)) continue;

    const segment = segmentById.get(report.segmentId);
    if (!segment?.geo) continue;

    const contribution = report.likedBy?.length || 0;
    const existing = bySegment.get(report.segmentId);
    if (existing) {
      existing.likeCount = Math.min(existing.likeCount + contribution, HEAT_COUNT_CAP);
      if (report.severity === 'red') existing.severity = 'red';
    } else {
      bySegment.set(report.segmentId, {
        segmentId: report.segmentId,
        lng: segment.geo.lng,
        lat: segment.geo.lat,
        severity: report.severity,
        likeCount: Math.min(contribution, HEAT_COUNT_CAP),
      });
    }
  }

  return [...bySegment.values()];
}
