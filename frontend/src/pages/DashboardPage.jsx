// guidHER Dashboard — cards, quick actions, zone overview, activity feed.
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Flag, Navigation, Lightbulb, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TriangleMesh, GradientBlobs } from '../components/BackgroundDecorations.jsx';
import { useAuth } from '../lib/authContext.jsx';
import { useAuthUser } from '../lib/useAuthUser.js';
import { useTheme } from '../lib/theme.jsx';
import { ZONE_CENTER, PUREZA_STATION, getMapStyle } from '../lib/maps.js';
import { fetchSafeRoutes } from '../lib/routing.js';
import { computeHazards } from '../lib/hazards.js';
import { STATUS_META, routeScoreFromStatus } from '../lib/routeStatus.js';
import { flaggedSegmentsTonight, computeSafetyScore, safetyScoreTier, reportsActiveTonight } from '../lib/dashboardStats.js';
import MockLocation from '../features/map/MockLocation.jsx';
import Owly from '../components/Owly.jsx';
import { MapSkeleton } from '../components/Skeleton.jsx';


function statusBadgeClass(status) {
  if (status === 'red') return 'status-badge badge-red';
  if (status === 'yellow') return 'status-badge badge-yellow';
  return 'status-badge badge-green';
}

export default function DashboardPage({ segments = [], latest = new Map(), reports = [] }) {
  const { user } = useAuth();
  const { role } = useAuthUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ state: 'loading' }); // { state: 'loading' | 'ready' | 'error', status?, score? }
  const firstName = user?.name?.split(' ')[0] || 'Commuter';
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Goodnight' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Goodnight';

  const flagged = useMemo(() => flaggedSegmentsTonight(segments, latest), [segments, latest]);
  const safetyScore = computeSafetyScore(flagged);
  const scoreTier = safetyScoreTier(safetyScore);
  const nearbyCount = reportsActiveTonight(reports);
  const zoneCoverage = flagged.length;

  useEffect(() => {
    let cancelled = false;
    setRouteInfo({ state: 'loading' });
    const hazards = computeHazards(segments, latest);
    fetchSafeRoutes([ZONE_CENTER.lat, ZONE_CENTER.lng], [PUREZA_STATION.lat, PUREZA_STATION.lng], hazards)
      .then((routes) => {
        if (cancelled || !routes.length) return;
        const status = routes[0].status;
        setRouteInfo({ state: 'ready', status, score: routeScoreFromStatus(status) });
      })
      .catch(() => {
        if (!cancelled) setRouteInfo({ state: 'error' });
      });
    return () => { cancelled = true; };
  }, [segments, latest]);

  return (
    <div className="page-scroll">
      <GradientBlobs opacity={0.35} variant="dashboard" />
      <div className="page-scroll-inner">

        {/* Greeting */}
        <div className="greeting mb-20">
          <div className="text-h1" style={{ margin: 0, fontSize: '2.2rem', color: 'var(--ink)' }}>{greeting}, <span className="greeting-name">{firstName}</span>.</div>
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

            {/* Speech-bubble hint — inside the map frame, pointing down at the dot */}
            <div className="location-dot-bubble" aria-label="You are here. Drag the dot in the Safety Map to adjust your location.">
              <span className="location-dot-bubble-text">
                📍 You are here — drag the dot on the Safety Map to adjust
              </span>
              <span className="location-dot-bubble-tail" aria-hidden="true" />
            </div>

            <MapSkeleton hidden={mapLoaded} />
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="dash-cards mb-24">
          <div className="dash-card dash-card--hero">
            <div className="dash-card-label dash-card-label--on-hero">Safety score</div>
            <div className="dash-card-value dash-card-value--gold">{safetyScore}</div>
            <div className="dash-card-sub dash-card-sub--on-hero">
              {zoneCoverage === 0 ? 'No flagged roads right now' : `${scoreTier} — ${zoneCoverage} flagged road${zoneCoverage === 1 ? '' : 's'}`}
            </div>
            <AlertTriangle size={52} className="dash-card-accent" />
          </div>
          <div className="dash-card">
            <div className="dash-card-label">Nearby reports</div>
            <div className="dash-card-value">{nearbyCount}</div>
            <div className="dash-card-sub">{nearbyCount === 0 ? 'No active reports right now' : 'Active in the last 24 hours'}</div>
            <Flag size={52} color="var(--secondary)" className="dash-card-accent" />
          </div>
          <div
            className="dash-card"
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/map', {
              state: { destination: [PUREZA_STATION.lat, PUREZA_STATION.lng], destinationLabel: 'LRT-2 Pureza Station' },
            })}
          >
            <div className="dash-card-label">Recommended route</div>
            <div className="dash-card-value" style={{ fontSize: '1rem', paddingTop: 4 }}>To Pureza</div>
            <div className="dash-card-sub">
              {routeInfo.state === 'loading' && 'Calculating…'}
              {routeInfo.state === 'error' && 'Route unavailable — check the Safety Map'}
              {routeInfo.state === 'ready' && `Score ${routeInfo.score} — ${STATUS_META[routeInfo.status]?.copy ?? routeInfo.status}`}
            </div>
            <Navigation size={52} color="var(--lavender)" className="dash-card-accent" />
          </div>
          <div className="dash-card dash-card--surface">
            <div className="dash-card-label">Zone coverage</div>
            <div className="dash-card-value">{zoneCoverage}</div>
            <div className="dash-card-sub">Roads tracked tonight</div>
            <Navigation size={52} color="var(--lavender)" className="dash-card-accent" />
          </div>
        </div>



      </div>
    </div>
  );
}
