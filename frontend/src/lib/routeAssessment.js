// F-003/F-008: AI-generated "is my route okay tonight?" assessment for the currently selected
// point-to-point route.
// Traces to: docs/03-prd.md F-003/F-008, backend/server/index.js assessRoute.
import { callApi } from './apiClient.js';

// onRouteSegments: [{ segmentId, name }] — the segments near the route (see
// frontend/src/lib/routing.js nearestDistanceToRoute). Returns
// { assessment: string, consideredCount: number } — assessment is null when nothing active was
// found along the route (cut-safe: no Gemini call made in that case).
export async function assessRouteSafety(onRouteSegments) {
  const payload = {
    segments: onRouteSegments.map(({ segmentId, name }) => ({ segmentId, segmentName: name })),
  };
  return callApi('/assessRoute', payload);
}
