// guidHER Routes — recommended + saved route cards (F-005, mock data).
import { useState } from 'react';
import { TriangleMesh, GradientBlobs } from '../components/BackgroundDecorations.jsx';
import { CheckCircle2, AlertTriangle, AlertOctagon, Navigation, Clock, Map, Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Owly from '../components/Owly.jsx';

const RECOMMENDED = [
  {
    id: 'rec1', from: 'PUP Main Campus', to: 'LRT-2 Pureza Station',
    via: 'via Magsaysay Blvd', score: 92, status: 'safe',
    distance: '1.2 km', time: '14 min',
    note: 'Most commuters use this route. Well-lit main road with active jeepney flow.',
    conditions: ['Well-lit path', 'Active foot traffic', 'Near commercial areas'],
    // OSM-sourced coords for Pureza LRT-2 station
    destCoords: [14.60167, 121.00519],
  },
  {
    id: 'rec2', from: 'PUP Main Campus', to: 'LRT-2 Legarda Station',
    via: 'via Pureza St.', score: 74, status: 'caution',
    distance: '2.1 km', time: '25 min',
    note: 'Stick to the Magsaysay Blvd path. Avoid the estero shortcut after 8 PM.',
    conditions: ['Passes estero area', 'Variable lighting', 'Moderate traffic'],
    destCoords: [14.6010, 120.9975],
  },
  {
    id: 'rec3', from: 'PUP Main Campus', to: 'Teresa Street (Direct)',
    via: 'direct', score: 58, status: 'alert',
    distance: '0.7 km', time: '9 min',
    note: 'Low lighting reported after 9 PM. Consider the Magsaysay detour at night.',
    conditions: ['Low lighting after 9 PM', 'Thin foot traffic at night'],
    destCoords: [14.60026, 121.01279],
  },
  {
    id: 'rec4', from: 'PUP Main Campus', to: 'V. Mapa / SM Sta. Mesa',
    via: 'via Anonas St.', score: 88, status: 'safe',
    distance: '0.8 km', time: '10 min',
    note: 'Quick and direct. SM provides a safe waiting area for jeepneys.',
    conditions: ['Short walk', 'Commercial area', 'Good lighting'],
    destCoords: [14.6020, 121.0145],
  },
];

const SAVED_INITIAL = [
  {
    id: 'sav1', from: 'Home (near Pureza)', to: 'PUP Main Campus',
    via: 'Evening class route', score: 88, status: 'safe',
    distance: '1.4 km', time: '16 min',
    note: 'Default night route — well-lit, familiar.',
    conditions: ['Default night route', 'Well-lit'],
    destCoords: [14.5985, 121.0102],
  },
];

function scoreColor(score) {
  if (score >= 85) return 'var(--sev-green-fg)';
  if (score >= 65) return 'var(--sev-yellow-fg)';
  return 'var(--sev-red-fg)';
}

function statusIcon(status) {
  if (status === 'safe') return <CheckCircle2 size={15} color="var(--sev-green-fg)" />;
  if (status === 'caution') return <AlertTriangle size={15} color="var(--sev-yellow-fg)" />;
  return <AlertOctagon size={15} color="var(--sev-red-fg)" />;
}

function RouteCard({ route, isSaved, onSave, onViewMap }) {
  return (
    <div className={`route-card-v2${isSaved ? ' selected' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ marginTop: 2, flexShrink: 0, display: 'flex' }}>
          {statusIcon(route.status)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="route-card-header">
            <div className="route-name">
              <span style={{ lineHeight: 1.1 }}>{route.from} → {route.to}</span>
              <div className="route-score-pill" style={{ borderColor: scoreColor(route.score) }}>
                <span className="route-score-num" style={{ color: scoreColor(route.score) }}>{route.score}</span>
                <span className="route-score-label">safety</span>
              </div>
            </div>
            <div className="route-via">{route.via}</div>
          </div>
          <div className="route-meta">
            <span><Navigation size={13} />{route.distance}</span>
            <span><Clock size={13} />{route.time} walk</span>
          </div>
          <div className="route-note">"{route.note}"</div>
          <div className="route-card-footer">
            <div className="route-conditions">
              {route.conditions.map(c => (
                <span key={c} className="route-condition-chip">{c}</span>
              ))}
            </div>
            <div className="route-actions">
              <button className="btn btn-primary btn-sm" onClick={() => onViewMap(route)}>
                <Map size={14} /> View on Safety Map
              </button>
              <button
                className={`btn btn-sm ${isSaved ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => onSave(route)}
              >
                {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isSaved ? 'Saved' : 'Save route'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(SAVED_INITIAL);
  const [activeTab, setActiveTab] = useState('recommended');

  function toggleSave(route) {
    setSaved(s => s.find(r => r.id === route.id)
      ? s.filter(r => r.id !== route.id)
      : [...s, route]);
  }

  function handleViewMap(route) {
    navigate('/map', {
      state: {
        destination: route.destCoords,   // [lat, lng]
        destinationLabel: route.to,
      },
    });
  }

  const isSaved = (id) => saved.some(r => r.id === id);

  return (
    <div className="page-scroll">
      <GradientBlobs opacity={0.35} variant="routes" />
      <div className="page-scroll-inner">

        {/* Header */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ paddingRight: 16 }}>
              <div className="text-h1" style={{ margin: 0, fontSize: '2.2rem', color: 'var(--ink)' }}>Routes</div>
              <div className="text-body" style={{ color: 'var(--muted)', marginTop: 8, fontSize: '1.05rem', lineHeight: 1.4 }}>Curated by Owly based on tonight's safety activity</div>
            </div>
            <Owly size={88} pose="pointstheway" className="owly-flipped" />
          </div>
        </div>

        {activeTab === 'recommended' && (
          <div className="route-list">
            {RECOMMENDED.map(route => (
              <RouteCard key={route.id} route={route}
                isSaved={isSaved(route.id)}
                onSave={toggleSave}
                onViewMap={handleViewMap} />
            ))}
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
              For live routing with road flags, use the Safety Map.
            </p>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="route-list">
            {saved.length === 0 ? (
              <div className="empty-state">
                <Bookmark size={40} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, color: 'var(--muted)' }}>No saved routes yet</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 6 }}>
                  Save a route from the Recommended tab to find it here.
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => setActiveTab('recommended')}>
                  Browse recommended routes <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              saved.map(route => (
                <RouteCard key={route.id} route={route}
                  isSaved={true}
                  onSave={toggleSave}
                  onViewMap={handleViewMap} />
              ))
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="route-tabs">
          {[['recommended','Recommended'],['saved','Saved']].map(([id, label]) => (
            <button key={id}
              className={`route-tab${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}>
              {label} {id === 'saved' && saved.length > 0 && (
                <span className="route-tab-count">{saved.length}</span>
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
