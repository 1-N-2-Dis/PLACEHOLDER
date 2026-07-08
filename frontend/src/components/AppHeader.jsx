// guidHER top navigation header.
// Navigation: Home · Safety Map · Routes · Reports · Safety Tips + profile button.
import { NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, User, ShieldCheck } from 'lucide-react';
import { useTheme } from '../lib/theme.jsx';
import { useAuth } from '../lib/authContext.jsx';
import { useAuthUser } from '../lib/useAuthUser.js';
import BrandMark from './BrandMark.jsx';

function BrandWordmark() {
  return <span className="brand-wordmark">Guid<span className="accent">Her</span></span>;
}

const NAV_LINKS = [
  { to: '/dashboard', label: 'Home' },
  { to: '/routes',    label: 'Routes' },
  { to: '/map',       label: 'Safety Map' },
  { to: '/report',    label: 'Reports' },
  { to: '/tips',      label: 'Safety Tips' },
];

export default function AppHeader({ onBrandClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  // Both `user` above and `role` here read the same real Firebase Auth session now — `role`
  // just adds the users/{uid} Firestore role lookup (lib/useAuthUser.js) that
  // backend/firestore.rules' isAdmin() check relies on. Log in with the seeded admin account
  // (backend/scripts/seed-auth-users.mjs) to see the admin button.
  const { role } = useAuthUser();
  const navigate = useNavigate();

  return (
    <header className="app-nav">
      <button
        className="app-nav-brand-btn"
        onClick={onBrandClick}
        aria-label="Back to GuidHer landing page"
      >
        <BrandMark size={34} />
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
        {role === 'admin' && (
          <button
            className="btn btn-ghost btn-sm nav-icon-btn"
            onClick={() => navigate('/admin')}
            aria-label="Admin dashboard"
          >
            <ShieldCheck size={18} />
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm nav-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="btn btn-secondary btn-sm nav-profile-btn"
          onClick={() => navigate('/profile')}
          aria-label="My profile"
        >
          <User className="nav-profile-icon" />
          <span className="nav-profile-name">{user?.name?.split(' ')[0] || 'Profile'}</span>
        </button>
      </div>
    </header>
  );
}
