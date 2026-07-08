// guidHER Dashboard — cards, quick actions, zone overview, activity feed.
import { useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Flag, Navigation, Lightbulb, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TriangleMesh, GradientBlobs } from '../components/BackgroundDecorations.jsx';
import { useAuth } from '../lib/authContext.jsx';
import { useAuthUser } from '../lib/useAuthUser.js';
import { useTheme } from '../lib/theme.jsx';
import { ZONE_CENTER, getMapStyle } from '../lib/maps.js';
import MockLocation from '../features/map/MockLocation.jsx';
import Owly from '../components/Owly.jsx';
import { MapSkeleton } from '../components/Skeleton.jsx';


function statusBadgeClass(status) {
  if (status === 'red') return 'status-badge badge-red';
  if (status === 'yellow') return 'status-badge badge-yellow';
  return 'status-badge badge-green';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { role } = useAuthUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [mapLoaded, setMapLoaded] = useState(false);
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
          {role === 'admin' && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 14 }}
              onClick={() => navigate('/admin')}
            >
              <ShieldCheck size={14} /> Admin Dashboard
            </button>
          )}
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
            style={{ margin: '-24px -12px -24px 0' }}
          />
        </div>

        {/* Zone overview */}
        <div className="mb-24">
          <div className="section-title mb-12">Your Location</div>
          <div className="dashboard-map-wrapper">
            <Map
              initialViewState={{
                longitude: ZONE_CENTER.lng,
                latitude: ZONE_CENTER.lat,
                zoom: 16.8,
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={getMapStyle(theme)}
              interactive={false}
              attributionControl={false}
              onLoad={() => setMapLoaded(true)}
            >
              <MockLocation position={[ZONE_CENTER.lat, ZONE_CENTER.lng]} onMove={() => {}} />
            </Map>
            <MapSkeleton hidden={mapLoaded} />
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="dash-cards mb-24">
          <div className="dash-card dash-card--hero">
            <div className="dash-card-label dash-card-label--on-hero">Safety score</div>
            <div className="dash-card-value dash-card-value--gold">72</div>
            <div className="dash-card-sub dash-card-sub--on-hero">Moderate — 2 flagged roads</div>
            <AlertTriangle size={52} className="dash-card-accent" />
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
            <div className="dash-card-sub">Roads tracked tonight</div>
            <Navigation size={52} color="var(--lavender)" className="dash-card-accent" />
          </div>
        </div>



      </div>
    </div>
  );
}
