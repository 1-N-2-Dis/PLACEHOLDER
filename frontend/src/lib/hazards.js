// Hazard set fed to the routing engine (lib/routing.js) as avoid zones — reports flagged tonight
// (live Firestore), merged with the baked-in heatmap-baseline.json hotspots so avoidance still
// applies where the frontend has no matching segment, or before any live reports exist. A live
// report on the same segment wins over its baseline counterpart. Shared by ZoneMap.jsx and
// DashboardPage.jsx so both feed the routing engine identical data.
import { segmentStatus } from './freshness.js';
import { HEATMAP_BASELINE } from '../data/heatmap-baseline.js';

export function computeHazards(segments, latest) {
  const live = segments
    .filter((seg) => segmentStatus(latest.get(seg.segmentId)) === 'flagged_tonight')
    .map((seg) => {
      const report = latest.get(seg.segmentId);
      return { segmentId: seg.segmentId, geo: seg.geo, severity: report?.severity || 'red', title: report?.title || null };
    });
  const liveIds = new Set(live.map((h) => h.segmentId));
  const baseline = HEATMAP_BASELINE
    .filter((h) => (h.severity === 'red' || h.severity === 'yellow') && !liveIds.has(h.segmentId))
    .map((h) => ({ segmentId: h.segmentId, geo: h.geo, severity: h.severity, title: h.title }));
  return [...live, ...baseline];
}
