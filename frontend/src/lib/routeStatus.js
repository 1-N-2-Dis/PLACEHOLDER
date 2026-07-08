// Route status vocabulary shared by ZoneMap.jsx and DashboardPage.jsx — badge copy/icon plus a
// deterministic display score, so a route reads consistently wherever it's shown.
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

// Route status -> short badge copy + icon. Kept small and flat rather than enumerating every
// severity/highway combination (routing.js's describeStatus already collapses to these).
export const STATUS_META = {
  safe: { copy: 'Avoids flagged areas', Icon: CheckCircle2 },
  'caution-highway': { copy: 'Uses a major road', Icon: AlertTriangle },
  'caution-yellow': { copy: 'Passes a caution area', Icon: AlertTriangle },
  'caution-red': { copy: 'Passes a dangerous area', Icon: AlertOctagon },
  'caution-red-unavoidable': { copy: 'Dangerous area could not be avoided', Icon: AlertOctagon },
};

// Fixed score bands per status tier, matching RoutesPage.jsx's existing mock route scores
// (safe ~88-92, caution-yellow ~70-74, caution-red/alert ~55-58) so a real computed route's card
// reads consistently with the rest of the app's score language.
const SCORE_BY_STATUS = {
  safe: 92,
  'caution-highway': 85,
  'caution-yellow': 72,
  'caution-red': 55,
  'caution-red-unavoidable': 40,
};

export function routeScoreFromStatus(status) {
  return SCORE_BY_STATUS[status] ?? 70;
}
