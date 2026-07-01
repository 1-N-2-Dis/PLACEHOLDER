// F-003/F-008: AI-generated "is my route okay tonight?" assessment for the currently selected
// point-to-point route.
// Traces to: docs/03-prd.md F-003/F-008, backend/functions/index.js assessRoute.
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';
import { ensureSignedIn } from './auth.js';

const assessRouteCallable = httpsCallable(functions, 'assessRoute');

// onRouteSegments: [{ segmentId, name }] — the segments near the route (see
// frontend/src/lib/routing.js nearestDistanceToRoute). Returns
// { assessment: string, consideredCount: number } — assessment is null when nothing active was
// found along the route (cut-safe: no Gemini call made in that case).
export async function assessRouteSafety(onRouteSegments) {
  await ensureSignedIn();
  const payload = {
    segments: onRouteSegments.map(({ segmentId, name }) => ({ segmentId, segmentName: name })),
  };
  const result = await assessRouteCallable(payload);
  return result.data;
}
