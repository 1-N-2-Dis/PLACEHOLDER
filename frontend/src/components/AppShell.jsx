// guidHER app shell — bottom nav + topbar.
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Navigation, FileText, User, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { path: '/app',         icon: Map,        label: 'Map',     id: 'nav-map' },
  { path: '/app/routes',  icon: Navigation, label: 'Routes',  id: 'nav-routes' },
  { path: '/app/report',  icon: FileText,   label: 'Reports', id: 'nav-report' },
  { path: '/app/profile', icon: User,       label: 'Profile', id: 'nav-profile' },
];

export default function AppShell({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { theme, toggleTheme } = useAuth();

  const isMap = loc.pathname === '/app';

  return (
    <div className="gh-app">
      {/* Top bar — hidden on map (map has its own overlays) */}
      {!isMap && (
        <header className="gh-topbar">
          <div className="gh-logo"><span>guid</span><span>HER</span></div>
          <div className="gh-topbar-actions">
            <button id="btn-theme-toggle" className="gh-icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
              {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
            <button id="btn-notifications" className="gh-icon-btn" aria-label="Notifications">
              <Bell size={18}/>
            </button>
          </div>
        </header>
      )}

      {/* Page content */}
      <main className={`gh-main ${isMap ? 'gh-main--map' : ''}`}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="gh-bottom-nav" aria-label="Main navigation">
        {NAV.map(({ path, icon: Icon, label, id }) => {
          const active = path === '/app' ? loc.pathname === '/app' : loc.pathname.startsWith(path);
          return (
            <button key={path} id={id} className={`gh-nav-item ${active ? 'active' : ''}`} onClick={() => nav(path)} aria-label={label} aria-current={active ? 'page' : undefined}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8}/>
              <span>{label}</span>
              <div className="gh-nav-dot"/>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
