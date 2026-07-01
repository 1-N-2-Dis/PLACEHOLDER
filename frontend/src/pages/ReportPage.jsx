// guidHER Report page — condition selector + existing F-002/F-006 wizard.
// The quick-tap type selector shown here feeds into the existing ReportForm wizard.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, AlertTriangle, AlertOctagon, Users } from 'lucide-react';
import ReportForm from '../features/report/ReportForm.jsx';

const REPORT_TYPES = [
  { id: 'poor_lighting',   label: 'Poor lighting',      Icon: Lightbulb,    bg: '#FFF3D9', fg: '#f57f17' },
  { id: 'no_crowd',        label: 'No crowd / empty',   Icon: Users,        bg: '#EFE7F8', fg: '#7D5CC7' },
  { id: 'recent_incident', label: 'Recent incident',    Icon: AlertOctagon, bg: '#FDEBF2', fg: '#c2185b' },
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
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)', marginBottom: 4 }}>
            Community Reporting
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            Share &amp; protect — your experience can help another commuter.
          </div>
        </div>

        {/* Report wizard (F-002 / F-006) */}
        <div className="card" style={{ marginBottom: 20 }}>
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
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: 14 }}>
            Recent community reports
          </div>
          {recentReports.map(r => {
            const meta = REPORT_TYPES.find(t => t.id === r.type) || REPORT_TYPES[0];
            const { Icon, bg, fg } = meta;
            return (
              <div key={r.id} className="feed-item" style={{ marginBottom: 10 }}>
                <div className="feed-icon" style={{ background: bg, color: fg }}>
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
