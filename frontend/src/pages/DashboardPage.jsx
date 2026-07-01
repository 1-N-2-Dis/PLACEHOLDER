// guidHER Dashboard — cards, quick actions, zone overview, activity feed.
import { CheckCircle2, AlertTriangle, AlertOctagon, Flag, Navigation, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext.jsx';
import { ZONE_OVERVIEW } from '../lib/mockData.js';

function OwlySVG({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="36" cy="40" rx="24" ry="26" fill="#7D5CC7"/>
      <ellipse cx="36" cy="38" rx="20" ry="22" fill="#B69AD9"/>
      <circle cx="27" cy="34" r="9" fill="white"/><circle cx="45" cy="34" r="9" fill="white"/>
      <circle cx="27" cy="34" r="6" fill="#4B2E83"/><circle cx="45" cy="34" r="6" fill="#4B2E83"/>
      <circle cx="29" cy="32" r="2" fill="white"/><circle cx="47" cy="32" r="2" fill="white"/>
      <ellipse cx="36" cy="43" rx="6" ry="4" fill="#FFC857"/>
      <path d="M23 20 Q20 12 15 14 Q18 20 23 22Z" fill="#7D5CC7"/>
      <path d="M49 20 Q52 12 57 14 Q54 20 49 22Z" fill="#7D5CC7"/>
    </svg>
  );
}

const MOCK_FEED = [
  { id: 1, type: 'poor_lighting', location: 'Teresa Street', time: '12 min ago', note: 'Two streetlights out near the mud path again. Stay close to the market side.', bg: '#FFF3D9', fg: '#f57f17', tag: 'Lighting', helpCount: 51 },
  { id: 2, type: 'no_crowd', location: 'Pureza Station approach', time: '38 min ago', note: 'Station underpass very empty tonight. Uncomfortable walking alone.', bg: '#EFE7F8', fg: '#7D5CC7', tag: 'Crowd', helpCount: 34 },
  { id: 3, type: 'recent_incident', location: 'Legarda / Estero area', time: '1 hr ago', note: 'Someone followed a rider near the south exit. Backed off near a crowd.', bg: '#FDEBF2', fg: '#c2185b', tag: 'Incident', helpCount: 89 },
  { id: 4, type: 'poor_lighting', location: 'P. Campa St.', time: '2 hr ago', note: 'This detour is fully lit tonight and there\'s a tanod near the corner store. Felt safe.', bg: '#E4F5EC', fg: '#3FA772', tag: 'All clear', helpCount: 73 },
];

function conditionIcon(type) {
  if (type === 'poor_lighting') return <Lightbulb size={18} />;
  if (type === 'no_crowd') return <AlertTriangle size={18} />;
  return <AlertOctagon size={18} />;
}

function statusBadgeClass(status) {
  if (status === 'red') return 'status-badge badge-red';
  if (status === 'yellow') return 'status-badge badge-yellow';
  return 'status-badge badge-green';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Commuter';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-scroll">
      <div className="page-scroll-inner">

        {/* Greeting */}
        <div className="greeting" style={{ marginBottom: 20 }}>
          <div className="greeting-name">{greeting}, {firstName}.</div>
          <div className="greeting-sub">Here is tonight's commute picture for the Sta. Mesa zone.</div>
        </div>

        {/* Dashboard cards */}
        <div className="dash-cards">
          <div className="dash-card" style={{ background: 'linear-gradient(135deg,#4B2E83,#7D5CC7)', color: '#fff' }}>
            <div className="dash-card-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Safety score</div>
            <div className="dash-card-value" style={{ color: '#FFC857' }}>72</div>
            <div className="dash-card-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>Moderate — 2 flagged segments</div>
            <AlertTriangle size={52} color="#fff" className="dash-card-accent" />
          </div>
          <div className="dash-card">
            <div className="dash-card-label">Nearby reports</div>
            <div className="dash-card-value">3</div>
            <div className="dash-card-sub">Active in the last 2 hours</div>
            <Flag size={52} color="var(--secondary)" className="dash-card-accent" />
          </div>
          <div className="dash-card">
            <div className="dash-card-label">Recommended route</div>
            <div className="dash-card-value" style={{ fontSize: '1rem', paddingTop: 4 }}>via Magsaysay</div>
            <div className="dash-card-sub">Score 92 — well-lit, active</div>
            <Navigation size={52} color="var(--lavender)" className="dash-card-accent" />
          </div>
          <div className="dash-card" style={{ background: 'var(--surface)' }}>
            <div className="dash-card-label">Zone coverage</div>
            <div className="dash-card-value">8</div>
            <div className="dash-card-sub">Segments tracked tonight</div>
            <Navigation size={52} color="var(--lavender)" className="dash-card-accent" />
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/report')}>
            <Flag size={15} /> Report a Condition
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/routes')}>
            <Navigation size={15} /> Find Route
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tips')}>
            <Lightbulb size={15} /> Safety Tips
          </button>
        </div>

        {/* Zone overview */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Zone overview tonight</div>
          <div className="zone-list">
            {ZONE_OVERVIEW.map(zone => (
              <div key={zone.name} className="zone-item">
                <div>
                  <div className="zone-name">{zone.name}</div>
                  <div className="zone-detail">{zone.detail}</div>
                </div>
                <span className={statusBadgeClass(zone.status)}>{zone.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Owly tip */}
        <div className="owly-tip-card" style={{ marginBottom: 24 }}>
          <OwlySVG size={52} />
          <div className="owly-tip-text">
            <div className="label">Owly says</div>
            <div className="tip">Always check tonight's conditions before you leave. A 30-second look can make all the difference on your walk home.</div>
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ marginBottom: 32 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="section-title">Recent community activity</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/report')} style={{ fontSize: '0.78rem' }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {MOCK_FEED.map(item => (
            <div key={item.id} className="feed-item">
              <div className="feed-icon" style={{ background: item.bg, color: item.fg }}>
                {conditionIcon(item.type)}
              </div>
              <div className="feed-body">
                <div className="feed-top">
                  <b>{item.location}</b>
                  <span>{item.time}</span>
                </div>
                <p className="feed-text">{item.note}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div className="feed-tags">
                    <span className="feed-tag" style={{ background: item.bg, color: item.fg }}>{item.tag}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> {item.helpCount} found this helpful
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
