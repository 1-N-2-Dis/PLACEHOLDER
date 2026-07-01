// Root component / layout shell for SaferRoute.
// Owns shared state (segments, reports, selectedId) and passes it to page components.
// Traces to: docs/03-prd.md (UJ-001/002/003), docs/06-system-design.md.
import { useEffect, useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SEED_SEGMENTS } from './data/seed-segments.js';
import { subscribeReports, latestBySegment } from './lib/reports.js';
import AppHeader from './components/AppHeader.jsx';
import HomePage from './pages/HomePage.jsx';
import ReportPage from './pages/ReportPage.jsx';

export default function App() {
  const segments = SEED_SEGMENTS;
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Live flags: one subscription for the whole app (single zone, small dataset).
  useEffect(() => subscribeReports(setReports), []);

  const latest = useMemo(() => latestBySegment(reports), [reports]);

  return (
    <div className="app">
      <AppHeader />

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                segments={segments}
                latest={latest}
                reports={reports}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            }
          />
          <Route
            path="/report"
            element={
              <ReportPage
                segments={segments}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            }
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <small>Conditions only (lighting, crowd, recent incident). Single zone. No live tracking.</small>
      </footer>
    </div>
  );
}
