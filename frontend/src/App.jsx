// guidHER root — auth gate + shared state + routing shell.
// Traces to: docs/06-system-design.md (React + Vite SPA architecture).
import { useEffect, useState, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SEED_SEGMENTS, WELL_USED_SEGMENTS } from './data/seed-segments.js';
import { subscribeReports, latestBySegment } from './lib/reports.js';
import { parseRoadSegmentId } from './lib/osmRoads.js';
import { useAuth } from './lib/authContext.jsx';
import AppHeader from './components/AppHeader.jsx';
import BottomNav from './components/BottomNav.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MapPage from './pages/MapPage.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import SafetyTipsPage from './pages/SafetyTipsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const segments = [...SEED_SEGMENTS, ...WELL_USED_SEGMENTS];

function AuthenticatedApp({ onExitToLanding }) {
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const { pathname } = useLocation();
  const isMapPage = pathname === '/map';

  useEffect(() => subscribeReports(setReports), []);
  const latest = useMemo(() => latestBySegment(reports), [reports]);

  // Reports pinned on arbitrary roads carry a dynamic seg_osm_* id that encodes their location
  // and road name (lib/osmRoads.js) — synthesize a segment for each so SegmentFlag, the heatmap,
  // RiskSummary/RouteCheck, and route avoidance all see them like any seeded segment.
  const allSegments = useMemo(() => {
    const known = new Set(segments.map((s) => s.segmentId));
    const dynamic = [];
    for (const r of reports) {
      if (known.has(r.segmentId)) continue;
      const parsed = parseRoadSegmentId(r.segmentId);
      if (parsed) {
        dynamic.push({ segmentId: r.segmentId, name: parsed.name, geo: parsed.geo });
        known.add(r.segmentId);
      }
    }
    return [...segments, ...dynamic];
  }, [reports]);

  return (
    <div className="app">
      <AppHeader onBrandClick={onExitToLanding} />
      <main className={`app-main${isMapPage ? ' app-main--map' : ''}`}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={
            <MapPage segments={allSegments} latest={latest} reports={reports} selectedId={selectedId} onSelect={setSelectedId} />
          } />
          <Route path="/routes"    element={<RoutesPage />} />
          <Route path="/report"    element={<ReportPage segments={segments} selectedId={selectedId} onSelect={setSelectedId} />} />
          <Route path="/tips"      element={<SafetyTipsPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
          <Route path="/login"     element={<AccountPage />} />
          <Route path="/admin"     element={<AdminPage reports={reports} segments={allSegments} />} />
          <Route path="/"   element={<Navigate to="/dashboard" replace />} />
          <Route path="*"   element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <BottomNav />
      {!isMapPage && (
        <footer className="app-footer">
          <small>Conditions only — lighting, crowd, recent incident. Single zone. No live tracking.</small>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entered, setEntered] = useState(!!user);

  useEffect(() => { if (user) setEntered(true); }, [user]);
  useEffect(() => { if (!user) setEntered(false); }, [user]);

  function enterApp() { setEntered(true); }
  function enterProfile() { setEntered(true); navigate('/profile'); }
  function exitToLanding() { setEntered(false); }

  if (!user || !entered) {
    return <WelcomePage onEnter={enterApp} onEnterProfile={enterProfile} />;
  }
  return <AuthenticatedApp onExitToLanding={exitToLanding} />;
}
