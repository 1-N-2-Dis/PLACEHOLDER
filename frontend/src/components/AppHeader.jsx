// guidHER top navigation header.
// Navigation: Home · Safety Map · Routes · Reports · Safety Tips + profile button.
import { NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../lib/theme.jsx';
import { useAuth } from '../lib/authContext.jsx';
import BrandMark from './BrandMark.jsx';

function BrandWordmark() {
  return <span className="brand-wordmark">Guid<span className="accent">Her</span></span>;
}

const NAV_LINKS = [
  { to: '/dashboard', label: 'Home' },
  { to: '/map',       label: 'Safety Map' },
  { to: '/routes',    label: 'Routes' },
  { to: '/report',    label: 'Reports' },
  { to: '/tips',      label: 'Safety Tips' },
];

export default function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="app-nav">
      <button
        className="app-nav-brand-btn"
        onClick={() => navigate('/dashboard')}
        aria-label="GuidHer home"
      >
        <BrandMark size={30} />
        <BrandWordmark />
      </button>

      <nav className="desktop-nav-links" aria-label="Main navigation">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions">
        <button
          className="btn btn-ghost btn-sm nav-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user && (
          <button
            className="btn btn-secondary btn-sm nav-profile-btn"
            onClick={() => navigate('/profile')}
            aria-label="My profile"
          >
            <User size={16} />
            <span>{user.name?.split(' ')[0] || 'Profile'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
