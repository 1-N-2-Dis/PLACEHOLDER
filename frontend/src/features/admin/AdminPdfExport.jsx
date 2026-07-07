// AdminPdfExport — Barangay PDF selector + download trigger.
// Shows a dropdown of the 25 target zone anchors and an Export PDF button that
// calls GET /api/v1/analytics/download-pdf (isAdmin-guarded) and streams the
// pdfkit-generated brief directly to the browser's Save dialog.
//
// Relies on the barangay_analytics_cache being seeded by compile-analytics.mjs
// or the "Force Re-Compile" button (AdminCompileCache). If the cache is empty,
// the backend returns 404 and this component surfaces the message inline.
import { useState } from 'react';
import { FileDown, AlertCircle } from 'lucide-react';
import { downloadPdf } from '../../lib/adminApi.js';

// 25 hyper-local zone anchors — must match ANALYTICS_ZONES in backend/server/index.js.
const ZONES = [
  'Teresa Street',
  'LRT-2 Pureza Station',
  'Pureza Street',
  'LRT-2 Legarda Station',
  'Magsaysay Boulevard',
  'Recto Avenue',
  'Legarda Street',
  'España Boulevard',
  'Earnshaw Street',
  'Morayta Street',
  'Lacson Avenue',
  'Anonas Street',
  'Hipodromo',
  'NDC Compound',
  'V. Mapa',
  'P. Campa',
  'Stop & Shop',
  'Recto Legarda',
  'Sampaloc',
  'Sta. Mesa',
  'LRT-2 V. Mapa Station',
  'LRT-2 J. Ruiz Station',
  'LRT-2 Gilmore Station',
  'LRT-2 Betty Go-Belmonte Station',
  'LRT-2 Araneta-Cubao Station',
];

export default function AdminPdfExport() {
  const [location, setLocation] = useState(ZONES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleExport() {
    setError(null);
    setSuccess(false);
    setBusy(true);
    try {
      await downloadPdf(location);
      setSuccess(true);
      // Auto-clear the success note after 4 seconds.
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">
        <FileDown size={16} />
        Barangay PDF Brief Export
      </h3>
      <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
        Download a compiled infrastructure brief for any of the 25 zone anchors.
        The brief includes the AI executive summary and actionable mitigations
        from the last analytics compile.
      </p>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="form-label" htmlFor="pdf-zone-select">Zone</label>
        <select
          id="pdf-zone-select"
          className="form-input"
          value={location}
          onChange={(e) => { setLocation(e.target.value); setError(null); setSuccess(false); }}
          disabled={busy}
        >
          {ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleExport}
        disabled={busy}
        style={{ minWidth: '10rem' }}
      >
        {busy ? <span className="spinner" /> : <><FileDown size={14} /> Export PDF</>}
      </button>

      {success && (
        <p className="status-ok" style={{ marginTop: '0.6rem' }}>
          PDF downloaded — check your browser downloads.
        </p>
      )}
      {error && (
        <p className="status-err" style={{ marginTop: '0.6rem' }}>
          <AlertCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {error}
        </p>
      )}
    </div>
  );
}
