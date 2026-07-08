// AdminCompileCache — "Force Re-Compile Analytics" control.
// Triggers POST /api/v1/admin/compile-analytics (isAdmin-guarded), which runs the full
// batch-caching pipeline inline: reads all reports → buckets by zone → calls Gemini once
// per active zone → writes barangay_analytics_cache + platform_transparency_stats.
//
// After a successful compile, calls onCompiled() so the parent AdminPage can re-fetch the
// moderation table (new report counts may have changed). The result summary is shown inline
// so the admin can confirm how many zones were written and whether AI was active.
//
// The button is intentionally large and distinct — it is a one-shot admin action and should
// not be confused with the delete or PDF buttons.
import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { compileCacheTrigger } from '../../lib/adminApi.js';

export default function AdminCompileCache({ onCompiled }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);  // { zonesWritten, reportsProcessed, aiCallsMade, aiEnabled }
  const [error, setError] = useState(null);

  async function handleCompile() {
    if (busy) return;
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const data = await compileCacheTrigger();
      setResult(data);
      if (typeof onCompiled === 'function') onCompiled();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">
        <Cpu size={16} />
        Analytics Cache
      </h3>
      <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
        Rebuilds the <code>barangay_analytics_cache</code> and{' '}
        <code>platform_transparency_stats</code> from the current live reports.
        Calls Gemini once per active zone — allow up to 60 seconds if AI is enabled.
      </p>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleCompile}
        disabled={busy}
        style={{ minWidth: '12rem' }}
      >
        {busy
          ? <><span className="spinner" /> Compiling…</>
          : <><RefreshCw size={14} /> Force Re-Compile Cache</>}
      </button>

      {result && (
        <div className="admin-compile-result" style={{ marginTop: '0.75rem' }}>
          <p className="icon-line" style={{ color: 'var(--green, #22c55e)', gap: '0.4rem' }}>
            <CheckCircle2 size={14} />
            Compiled successfully
          </p>
          <ul className="admin-result-list">
            <li>Zones written: <strong>{result.zonesWritten}</strong></li>
            <li>Reports processed: <strong>{result.reportsProcessed}</strong></li>
            <li>
              AI calls made: <strong>{result.aiCallsMade}</strong>
              {!result.aiEnabled && (
                <span className="muted"> (GEMINI_API_KEY not set — placeholder text written)</span>
              )}
            </li>
          </ul>
        </div>
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
