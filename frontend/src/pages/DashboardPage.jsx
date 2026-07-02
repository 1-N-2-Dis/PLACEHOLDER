// guidHER Dashboard — cards, quick actions, zone overview, activity feed.
import { CheckCircle2, AlertTriangle, AlertOctagon, Flag, Navigation, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TriangleMesh, GradientBlobs } from '../components/BackgroundDecorations.jsx';
import { useAuth } from '../lib/authContext.jsx';
import { useTheme } from '../lib/theme.jsx';
import { ZONE_CENTER, getMapStyle } from '../lib/maps.js';
import MockLocation from '../features/map/MockLocation.jsx';
import Owly from '../components/Owly.jsx';

const MOCK_FEED = [
  { id: 1, type: 'poor_lighting', location: 'Teresa Street', time: '12 min ago', note: 'Two streetlights out near the mud path again. Stay close to the market side.', variant: 'lighting', tag: 'Lighting', helpCount: 51 },
  { id: 2, type: 'no_crowd', location: 'Pureza Station approach', time: '38 min ago', note: 'Station underpass very empty tonight. Uncomfortable walking alone.', variant: 'crowd', tag: 'Crowd', helpCount: 34 },
  { id: 3, type: 'recent_incident', location: 'Legarda / Estero area', time: '1 hr ago', note: 'Someone followed a rider near the south exit. Backed off near a crowd.', variant: 'incident', tag: 'Incident', helpCount: 89 },
  { id: 4, type: 'poor_lighting', location: 'P. Campa St.', time: '2 hr ago', note: 'This detour is fully lit tonight and there\'s a tanod near the corner store. Felt safe.', variant: 'clear', tag: 'All clear', helpCount: 73 },
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
  const { theme } = useTheme();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Commuter';
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Goodnight' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Goodnight';

  return (
    <div className="page-scroll">
      <GradientBlobs opacity={0.35} variant="dashboard" />
      <div className="page-scroll-inner">

        {/* Greeting */}
        <div className="greeting mb-20">
          <div className="text-h1" style={{ margin: 0, fontSize: '2.2rem', color: 'var(--ink)' }}>{greeting}, {firstName}.</div>
          <div className="text-body" style={{ color: 'var(--muted)', marginTop: 8, fontSize: '1.05rem', lineHeight: 1.4 }}>Here is tonight's commute picture for the Sta. Mesa zone.</div>
        </div>

        {/* Owly tip */}
        <div className="owly-tip-card mb-24">
          <div className="owly-tip-text">
            <div className="label">Owly says</div>
            <div className="tip">Always check tonight's conditions before you leave. A 30-second look can make all the difference on your walk home.</div>
          </div>
          <Owly 
            size={105} 
            pose="looks-out" 
            className="owly-flipped"
            style={{ 
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
              margin: '-24px -12px -24px 0' 
            }} 
          />
        </div>

        {/* Zone overview */}
        <div className="mb-24">
          <div className="section-title mb-12">Your Location</div>
          <div style={{ height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <Map
              initialViewState={{
                longitude: ZONE_CENTER.lng,
                latitude: ZONE_CENTER.lat,
                zoom: 14,
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={getMapStyle(theme)}
              interactive={false}
              attributionControl={false}
            >
              <MockLocation position={[ZONE_CENTER.lat, ZONE_CENTER.lng]} onMove={() => {}} />
            </Map>
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="dash-cards mb-24">
          <div className="dash-card dash-card--hero">
            <div className="dash-card-label dash-card-label--on-hero">Safety score</div>
            <div className="dash-card-value dash-card-value--gold">72</div>
            <div className="dash-card-sub dash-card-sub--on-hero">Moderate — 2 flagged segments</div>
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
          <div className="dash-card dash-card--surface">
            <div className="dash-card-label">Zone coverage</div>
            <div className="dash-card-value">8</div>
            <div className="dash-card-sub">Segments tracked tonight</div>
            <Navigation size={52} color="var(--lavender)" className="dash-card-accent" />
          </div>
        </div>

        {/* Activity feed */}
        <div className="mb-32">
          <div className="flex-between mb-12">
            <div className="section-title">Recent community activity</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/report')} style={{ fontSize: '0.78rem' }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {MOCK_FEED.map(item => (
            <div key={item.id} className="feed-item">
              <div className={`feed-icon feed-icon-${item.variant}`}>
                {conditionIcon(item.type)}
              </div>
              <div className="feed-body">
                <div className="feed-top">
                  <b>{item.location}</b>
                  <span>{item.time}</span>
                </div>
                <p className="feed-text">{item.note}</p>
                <div className="feed-foot">
                  <div className="feed-tags">
                    <span className={`feed-tag feed-tag-${item.variant}`}>{item.tag}</span>
                  </div>
                  <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
