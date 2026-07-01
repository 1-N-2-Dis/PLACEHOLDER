// guidHER Report page — condition selector + existing F-002/F-006 wizard.
// The quick-tap type selector shown here feeds into the existing ReportForm wizard.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, AlertTriangle, AlertOctagon, Users } from 'lucide-react';
import ReportForm from '../features/report/ReportForm.jsx';

const REPORT_TYPES = [
  { id: 'poor_lighting',   label: 'Poor lighting',      Icon: Lightbulb,    variant: 'lighting' },
  { id: 'no_crowd',        label: 'No crowd / empty',   Icon: Users,        variant: 'crowd' },
  { id: 'recent_incident', label: 'Recent incident',    Icon: AlertOctagon, variant: 'incident' },
];

export default function ReportPage({ segments, selectedId, onSelect }) {
  const navigate = useNavigate();
  const [anon, setAnon] = useState(true);
  const [recentReports] = useState([
    { id: 'm1', type: 'poor_lighting',   location: 'Teresa Street',      time: '30 min ago' },
    { id: 'm2', type: 'no_crowd',        location: 'Pureza Footbridge',   time: '1 hr ago' },
    { id: 'm3', type: 'recent_incident', location: 'Legarda Station',     time: '2 hr ago' },
  ]);

  return (
    <div className="page-scroll">
      <div className="report-page-inner">

        <button className="btn btn-ghost btn-sm back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="mb-20">
          <div className="text-h1" style={{ marginBottom: 4 }}>
            Community Reporting
          </div>
          <div className="text-body" style={{ color: 'var(--muted)' }}>
            Share &amp; protect — your experience can help another commuter.
          </div>
        </div>

        {/* Report wizard (F-002 / F-006) */}
        <div className="card mb-20">
          <ReportForm segments={segments} selectedId={selectedId} onSelect={onSelect} />
        </div>

        {/* Anonymous toggle (UI context — actual anon handled by Firebase Auth anonymous uid) */}
        <div className="anon-row">
          <div>
            <div className="anon-label">Post anonymously</div>
            <div className="anon-sub">Your name won't be shown to other commuters.</div>
          </div>
          <button
            type="button"
            className={`toggle-switch${anon ? ' on' : ''}`}
            onClick={() => setAnon(a => !a)}
            aria-pressed={anon}
            aria-label="Toggle anonymous posting"
          />
        </div>

        {/* Recent reports */}
        <div style={{ marginTop: 28, marginBottom: 8 }}>
          <div className="text-h2 mb-14">
            Recent community reports
          </div>
          {recentReports.map(r => {
            const meta = REPORT_TYPES.find(t => t.id === r.type) || REPORT_TYPES[0];
            const { Icon, variant } = meta;
            return (
              <div key={r.id} className="feed-item" style={{ marginBottom: 10 }}>
                <div className={`feed-icon feed-icon-${variant}`}>
                  <Icon size={18} />
                </div>
                <div className="feed-body">
                  <div className="feed-top">
                    <b>{meta.label}</b>
                    <span>{r.time}</span>
                  </div>
                  <p className="feed-text">{r.location}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
