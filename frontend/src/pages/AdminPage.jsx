// Admin Control Panel — full dashboard for report moderation, PDF export, and cache management.
// Route: /admin (registered in App.jsx, receives { reports, segments } from AuthenticatedApp).
//
// Security model — two independent layers:
//   1. RequireAdmin (components/RequireAdmin.jsx): checks the real Firebase Auth role from
//      users/{uid}.role in Firestore. Non-admins are redirected to /dashboard before any
//      admin UI renders. There is never a "you need an admin account" soft message — it
//      redirects hard, matching the backend's isAdmin middleware behaviour.
//   2. Every backend call in adminApi.js re-verifies the ID token server-side (isAdmin
//      middleware reads users/{uid}.role at request time). A client-side bypass of the HOC
//      cannot grant API access.
//
// Three panels, each in its own admin-card:
//   A. Report Moderation — live Firestore reports (from App.jsx subscription) with backend
//      delete via DELETE /api/v1/admin/reports/:id. Falls back to the App.jsx report list
//      so the table is always populated without an extra fetch.
//   B. Barangay PDF Export — AdminPdfExport zone dropdown + export button.
//   C. Analytics Cache — AdminCompileCache force-recompile button.
//
// Traces to: docs/03-prd.md F-009, backend/server/index.js admin routes.
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import RequireAdmin from '../components/RequireAdmin.jsx';
import AdminPdfExport from '../features/admin/AdminPdfExport.jsx';
import AdminCompileCache from '../features/admin/AdminCompileCache.jsx';
import { CONDITION_META } from '../data/condition-types.js';
import { deleteAdminReport } from '../lib/adminApi.js';

// ─── Report Moderation Panel ──────────────────────────────────────────────────
// Uses the live Firestore subscription (reports prop from App.jsx) so the table
// updates in real-time without an extra API fetch. Delete calls the new admin
// endpoint which also atomically decrements platform_transparency_stats.

function ModerationTable({ reports, segments }) {
  const [busyId, setBusyId] = useState(null);
  const [errors, setErrors] = useState({}); // reportId → error message

  const segmentName = useCallback(
    (segId) => segments.find((s) => s.segmentId === segId)?.name ?? segId,
    [segments],
  );

  async function handleDelete(id) {
    setErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setBusyId(id);
    try {
      await deleteAdminReport(id);
      // The live Firestore subscription in App.jsx removes the doc automatically —
      // no local state splice needed.
    } catch (err) {
      setErrors((prev) => ({ ...prev, [id]: err.message }));
    } finally {
      setBusyId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        No reports in the database yet.
      </p>
    );
  }

  return (
    <div className="admin-moderation-table" role="table" aria-label="Community reports">
      {/* Column headers — visually present but hidden from AT via aria-hidden since each
          row already uses descriptive button labels */}
      <div className="admin-table-header" role="row" aria-hidden="true">
        <span style={{ flex: '0 0 7rem' }}>Type</span>
        <span style={{ flex: '1' }}>Title</span>
        <span style={{ flex: '0 0 10rem' }}>Location</span>
        <span style={{ flex: '0 0 4rem' }}>Sev.</span>
        <span style={{ flex: '0 0 6.5rem' }}>Action</span>
      </div>

      {reports.map((r) => {
        const meta = CONDITION_META[r.conditionType];
        const CondIcon = meta?.Icon;
        const severityClass =
          r.severity === 'red' ? 'badge-red' :
          r.severity === 'yellow' ? 'badge-yellow' : 'badge-green';

        return (
          <div key={r.id} role="row" className="admin-table-row">
            {/* Condition type */}
            <span
              role="cell"
              className="icon-line"
              style={{ flex: '0 0 7rem', gap: '0.3rem', fontSize: '0.82rem' }}
            >
              {CondIcon && <CondIcon size={13} aria-hidden="true" />}
              {meta?.label ?? r.conditionType}
            </span>

            {/* Title + optional note */}
            <span
              role="cell"
              style={{ flex: '1', minWidth: 0 }}
            >
              <span className="admin-report-title">{r.title}</span>
              {r.note && (
                <span className="admin-report-note muted"> — {r.note}</span>
              )}
            </span>

            {/* Segment / location */}
            <span
              role="cell"
              className="muted"
              style={{ flex: '0 0 10rem', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {segmentName(r.segmentId)}
            </span>

            {/* Severity badge */}
            <span role="cell" style={{ flex: '0 0 4rem' }}>
              <span className={`status-badge ${severityClass}`} style={{ fontSize: '0.75rem' }}>
                {r.severity ?? '—'}
              </span>
            </span>

            {/* Delete */}
            <span role="cell" style={{ flex: '0 0 6.5rem' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(r.id)}
                disabled={busyId === r.id}
                aria-label={`Delete report: ${r.title}`}
              >
                {busyId === r.id
                  ? <span className="spinner" aria-hidden="true" />
                  : <><Trash2 size={13} aria-hidden="true" /> Delete</>}
              </button>
            </span>

            {/* Per-row error (rare — surfaced inline rather than a top banner) */}
            {errors[r.id] && (
              <span
                role="cell"
                className="status-err"
                style={{ flex: '1 0 100%', fontSize: '0.8rem', marginTop: '0.25rem' }}
              >
                <AlertCircle size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                {errors[r.id]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function AdminPage({ reports, segments }) {
  return (
    <RequireAdmin>
      <div className="report-page">
        <div className="report-page-inner" style={{ maxWidth: '56rem' }}>

          {/* Page header */}
          <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
          <div className="icon-line" style={{ marginBottom: '1.5rem', marginTop: '0.25rem', gap: '0.5rem' }}>
            <ShieldCheck size={20} aria-hidden="true" />
            <h2 style={{ margin: 0 }}>Admin Control Panel</h2>
          </div>

          {/* ── Panel A: Report Moderation ───────────────────────────────── */}
          <section className="admin-card" aria-labelledby="panel-moderation-title">
            <h3 className="admin-card-title" id="panel-moderation-title">
              <Trash2 size={16} aria-hidden="true" />
              Report Moderation
            </h3>
            <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              All community reports, newest first. Deleting a report also decrements the
              platform transparency counter atomically.
            </p>
            <ModerationTable reports={reports} segments={segments} />
          </section>

          {/* ── Panel B: Barangay PDF Export ─────────────────────────────── */}
          <AdminPdfExport />

          {/* ── Panel C: Analytics Cache ─────────────────────────────────── */}
          <AdminCompileCache />

        </div>
      </div>
    </RequireAdmin>
  );
}
