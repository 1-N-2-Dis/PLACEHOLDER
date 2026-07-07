// Admin API client — all calls require an authenticated Firebase session; the server's
// isAdmin middleware will reject any request from a non-admin uid with 403.
// Traces to: backend/server/index.js admin routes, docs/12-security-compliance.md.
//
// Pattern mirrors lib/apiClient.js: get a Firebase ID token, send it as Bearer, throw on
// non-2xx. Extended here for GET and DELETE methods, and for the PDF binary download path
// which uses a Blob rather than JSON.
import { ensureSignedIn } from './auth.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── shared bearer-token fetch ────────────────────────────────────────────────

async function adminFetch(path, options = {}) {
  const user = await ensureSignedIn();
  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
}

// ─── GET /api/v1/admin/reports/summary ───────────────────────────────────────
// Returns { reports, count, nextCursor }.
// Pass `cursor` (a doc id) to fetch the next page.
export async function fetchReportsSummary({ limit = 50, cursor = null } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('after', cursor);

  const res = await adminFetch(`/api/v1/admin/reports/summary?${params}`);
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((body && body.message) || `Failed to load reports (${res.status}).`);
  }
  return body; // { reports, count, nextCursor }
}

// ─── DELETE /api/v1/admin/reports/:id ────────────────────────────────────────
// Returns { status: 'deleted', reportId }.
export async function deleteAdminReport(id) {
  const res = await adminFetch(`/api/v1/admin/reports/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((body && body.message) || `Failed to delete report (${res.status}).`);
  }
  return body;
}

// ─── POST /api/v1/admin/compile-analytics ────────────────────────────────────
// Returns { status, zonesWritten, reportsProcessed, aiCallsMade, aiEnabled }.
export async function compileCacheTrigger() {
  const res = await adminFetch('/api/v1/admin/compile-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((body && body.message) || `Compilation failed (${res.status}).`);
  }
  return body;
}

// ─── GET /api/v1/analytics/download-pdf?location=<zone> ──────────────────────
// Streams the PDF binary and triggers a browser download — no JSON response.
export async function downloadPdf(location) {
  const params = new URLSearchParams({ location });
  const res = await adminFetch(`/api/v1/analytics/download-pdf?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body && body.message) || `PDF export failed (${res.status}).`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  // Synthetic anchor click — triggers Save dialog without navigating away.
  const a = document.createElement('a');
  const safeName = location.replace(/[^a-z0-9]/gi, '_');
  a.href = url;
  a.download = `GuidHer_Brief_${safeName}.pdf`;
  document.body.appendChild(a);
  a.click();

  // Clean up the object URL after a short delay.
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 200);
}
