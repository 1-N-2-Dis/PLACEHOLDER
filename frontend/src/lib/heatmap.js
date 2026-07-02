// Community heatmap of "condition validated" reports (F-010).
// Role: build the per-segment incident markers the ZoneMap heatmap layer renders as glowing
// severity icons.
// Traces to: docs/03-prd.md F-010, docs/09-data-model.md (no stored `validated` field).
//
// "Validated" = severity is yellow or red (AI-assigned, F-006, BR-007) — never green, never
// user-selectable. Reports are collapsed to one marker per segment: worst severity wins, and the
// qualifying report count scales the marker's glow so corroborated segments read as "hotter".
import { isFlaggedTonight } from './freshness.js';

// One heavily corroborated segment shouldn't swamp the layer — same cap spirit as the old
// density-weight cap.
export const HEAT_COUNT_CAP = 5;

export function buildIncidentMarkers(reports, segments, now = Date.now()) {
  const segmentById = new Map(segments.map((s) => [s.segmentId, s]));
  const bySegment = new Map(); // segmentId -> { segmentId, lng, lat, severity, count }

  for (const report of reports) {
    if (report.severity !== 'yellow' && report.severity !== 'red') continue;
    if (!isFlaggedTonight(report, now)) continue;

    const segment = segmentById.get(report.segmentId);
    if (!segment?.geo) continue;

    const existing = bySegment.get(report.segmentId);
    if (existing) {
      existing.count = Math.min(existing.count + 1, HEAT_COUNT_CAP);
      if (report.severity === 'red') existing.severity = 'red';
    } else {
      bySegment.set(report.segmentId, {
        segmentId: report.segmentId,
        lng: segment.geo.lng,
        lat: segment.geo.lat,
        severity: report.severity,
        count: 1,
      });
    }
  }

  return [...bySegment.values()];
}
