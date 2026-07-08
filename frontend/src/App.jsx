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
import RequireAdmin from './components/RequireAdmin.jsx';
import RequireUser from './components/RequireUser.jsx';

const segments = [...SEED_SEGMENTS, ...WELL_USED_SEGMENTS];

function AuthenticatedApp({ onExitToLanding, entryPath, onRequireLogin }) {
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
          <Route path="/report"    element={
            <RequireUser onBlocked={onRequireLogin}>
              <ReportPage segments={segments} selectedId={selectedId} onSelect={setSelectedId} />
            </RequireUser>
          } />
          <Route path="/tips"      element={<SafetyTipsPage />} />
          <Route path="/profile"   element={
            <RequireUser onBlocked={onRequireLogin}>
              <ProfilePage />
            </RequireUser>
          } />
          <Route path="/login"     element={<AccountPage />} />
          <Route path="/admin"     element={
            <RequireAdmin>
              <AdminPage reports={reports} segments={allSegments} />
            </RequireAdmin>
          } />
          <Route path="/"   element={<Navigate to={entryPath} replace />} />
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
  const [entryPath, setEntryPath] = useState('/dashboard');
  // Guest is a real, unprivileged, in-memory-only state — never written to localStorage, unlike
  // a real login. It lets AuthenticatedApp mount with user === null so RequireUser can gate
  // account-only routes (/report, /profile) instead of guests silently getting a fake account.
  const [isGuest, setIsGuest] = useState(false);
  const [forceLoginView, setForceLoginView] = useState(false);

  useEffect(() => { if (user) setEntered(true); }, [user]);
  useEffect(() => { if (!user) setEntered(false); }, [user]);

  // path defaults to the dashboard; callers that want to land somewhere else (e.g. the landing
  // page's guest map button) pass it explicitly, avoiding a race with AuthenticatedApp's own
  // "/" redirect that a separate post-mount navigate() call would lose to.
  function enterApp(path) { if (path) setEntryPath(path); setEntered(true); }
  function enterGuest() { setIsGuest(true); enterApp('/map'); }
  function enterProfile() { setEntered(true); navigate('/profile'); }
  // Reset the URL back to "/" too — otherwise AuthenticatedApp's <Routes> remounts against
  // whatever sub-route (e.g. /profile) was still showing underneath, matching that route
  // directly on next entry instead of respecting entryPath (e.g. the guest map button).
  function exitToLanding() { navigate('/'); setEntered(false); }
  // A guest hit an account-only route (RequireUser's onBlocked) — drop guest mode and land
  // straight on the login form instead of the landing hero, since they were already trying
  // to do something that needs an account.
  function requireLogin() { setIsGuest(false); setForceLoginView(true); navigate('/', { replace: true }); }

  if ((!user && !isGuest) || !entered) {
    return (
      <WelcomePage
        onEnter={enterApp}
        onEnterProfile={enterProfile}
        onGuest={enterGuest}
        initialView={forceLoginView ? 'login' : 'landing'}
      />
    );
  }
  return <AuthenticatedApp onExitToLanding={exitToLanding} entryPath={entryPath} onRequireLogin={requireLogin} />;
}
