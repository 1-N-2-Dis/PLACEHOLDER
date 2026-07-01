import { NavLink } from 'react-router-dom';

export default function AppHeader() {
  return (
    <header className="app-nav">
      <span className="nav-brand">SaferRoute</span>
      <nav>
        <NavLink to="/report" className="nav-link">Report a condition</NavLink>
      </nav>
    </header>
  );
}
