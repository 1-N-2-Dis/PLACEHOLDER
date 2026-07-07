// F-010: toggle the current user's like on a report — the real, cross-user signal that now
// drives community-heatmap cloud size (frontend/src/features/map/ReportHeatmap.jsx), distinct
// from the AI-driven corroborationCount (backend/server/index.js submitReport). Reports never
// carry an optimistic local update: the live Firestore subscription (subscribeReports) reflects
// the new likedBy array once the write lands, same "no optimistic map update" convention as
// reportIntake.js's submitReportForReview.
import { callApi } from './apiClient.js';

// Returns { status: 'ok', reportId, likeCount, liked }. Throws on a network/auth/server failure.
export function toggleReportLike(reportId, liked) {
  return callApi('/likeReport', { reportId, liked });
}
