// guidHER bottom navigation — Home · Map · Routes · Reports · Tips
import { Home, Map, Navigation, Flag, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/dashboard', label: 'Home',    Icon: Home },
  { path: '/map',       label: 'Map',     Icon: Map },
  { path: '/routes',    label: 'Routes',  Icon: Navigation },
  { path: '/report',    label: 'Reports', Icon: Flag },
  { path: '/tips',      label: 'Tips',    Icon: BookOpen },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {TABS.map(({ path, label, Icon }) => (
          <button
            key={path}
            type="button"
            className={`bottom-nav-item${pathname === path ? ' active' : ''}`}
            onClick={() => navigate(path)}
            aria-current={pathname === path ? 'page' : undefined}
          >
            <Icon size={21} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
