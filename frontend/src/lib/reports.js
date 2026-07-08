// Supabase read access for reports — shared by F-001/002/003/004.
// Traces to: docs/09-data-model.md (reports table), docs/03-prd.md (BR-001/004/005/006).
//
// Live Supabase Realtime subscription (mockReports.js was the prototype-era stand-in; it is no
// longer imported and can be removed once nothing references it).
//
// Report WRITES no longer happen here — see reportIntake.js. RLS (backend/supabase/schema.sql)
// denies ALL direct client writes, including delete: Supabase RLS has no visibility into
// Firebase Auth sessions (Auth intentionally stayed on Firebase — see AGENTS.md), so there is no
// way to authorize an admin-only delete at the database layer via the anon key. Every report
// write, including admin delete (F-009 moderation), goes through backend/server instead.
import { supabase } from './supabase.js';
import { callApiDelete } from './apiClient.js';

const TABLE = 'reports';

// Supabase returns snake_case Postgres columns; normalize to the camelCase shape the rest of
// the frontend (freshness.js, heatmap.js, stats.js, ...) already expects from the Firestore era.
function normalizeRow(row) {
  return {
    id: row.id,
    segmentId: row.segment_id,
    conditionType: row.condition_type,
    severity: row.severity,
    title: row.title,
    note: row.note ?? undefined,
    photoPath: row.photo_path ?? undefined,
    uid: row.uid,
    corroborationCount: row.corroboration_count,
    likedBy: row.liked_by || [],
    verdict: row.verdict ?? undefined,
    location: row.location ?? undefined,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
  };
}

async function fetchAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase read failed in subscribeReports:', error.message);
    return [];
  }
  return (data || []).map(normalizeRow);
}

// Mirrors the old Firestore onSnapshot contract: calls onChange(reports) immediately with the
// current list, then again on every insert/update/delete. Returns an unsubscribe function.
// Report volume is small (demo scale) so a full refetch per change event is simpler and cheap
// enough vs. hand-merging Realtime deltas into local state.
export function subscribeReports(onChange) {
  let cancelled = false;

  fetchAll().then((reports) => {
    if (!cancelled) onChange(reports);
  });

  const channel = supabase
    .channel('reports-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
      const reports = await fetchAll();
      if (!cancelled) onChange(reports);
    })
    .subscribe();

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}

export function latestBySegment(reports) {
  const map = new Map();
  for (const r of reports) {
    if (!map.has(r.segmentId)) map.set(r.segmentId, r);
  }
  return map;
}

// F-009 admin moderation: remove a report (remove-only). Routed through backend/server's
// isAdmin-guarded DELETE /api/v1/admin/reports/:id — see the note above on why this can't be a
// direct Supabase client call.
export function deleteReport(id) {
  return callApiDelete(`/api/v1/admin/reports/${id}`);
}
