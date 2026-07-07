// Landing-page hero stats — derived from the public `reports` collection (allow read: if true in
// backend/firestore.rules, so this works pre-login too). "Community members" is approximated as
// distinct reporters, since `users` docs are not publicly listable (auth-gated, self-or-admin read).
import { SEED_SEGMENTS, WELL_USED_SEGMENTS } from '../data/seed-segments.js';
import { toMillis } from './freshness.js';

export const ZONE_SEGMENT_COUNT = SEED_SEGMENTS.length + WELL_USED_SEGMENTS.length;

export function computeLandingStats(reports) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  const reporters = new Set();
  let reportsThisMonth = 0;
  for (const r of reports) {
    if (r.uid) reporters.add(r.uid);
    const ms = toMillis(r.createdAt);
    if (ms !== null && ms >= monthStartMs) reportsThisMonth++;
  }

  return {
    reportsThisMonth,
    segmentsTracked: ZONE_SEGMENT_COUNT,
    communityMembers: reporters.size,
  };
}
