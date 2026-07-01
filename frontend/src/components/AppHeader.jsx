// guidHER top navigation header.
// Navigation: Home · Safety Map · Routes · Reports · Safety Tips + profile button.
import { NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../lib/theme.jsx';
import { useAuth } from '../lib/authContext.jsx';

function BrandMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="30" cy="30" r="30" fill="#4B2E83"/>
      <path d="M18 24C18 18 23 14 30 14C37 14 42 18 42 24V32C42 38 37 42 30 42C23 42 18 38 18 32V24Z" fill="#B69AD9"/>
      <circle cx="24" cy="26" r="4.5" fill="#FFF9EF"/>
      <circle cx="36" cy="26" r="4.5" fill="#FFF9EF"/>
      <circle cx="24" cy="26" r="2" fill="#2C1B47"/>
      <circle cx="36" cy="26" r="2" fill="#2C1B47"/>
      <path d="M28 32L30 35L32 32" stroke="#FFC857" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
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
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onClick={() => navigate('/dashboard')}
        aria-label="guidHER home"
      >
        <BrandMark size={30} />
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#4B2E83' }}>
          guid<span style={{ color: '#F28DBB' }}>HER</span>
        </span>
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
          className="btn btn-ghost btn-sm"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ padding: '6px 8px' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/profile')}
            aria-label="My profile"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <User size={16} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user.name?.split(' ')[0] || 'Profile'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
