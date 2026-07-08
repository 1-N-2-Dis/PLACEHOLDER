// RequireUser — route-level guard for account-only pages.
// Wraps any component that must only be reachable by a signed-in user, not a guest.
//
// Behaviour:
//   - user exists      → renders children normally.
//   - user is null (guest, since AuthenticatedApp only mounts for a real user or a
//     guest) → fires onBlocked (kicks back to the login form) and renders nothing.
//
// Mirrors RequireAdmin.jsx's route-guard pattern.
import { useEffect } from 'react';
import { useAuth } from '../lib/authContext.jsx';

export default function RequireUser({ onBlocked, children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) onBlocked();
  }, [user, onBlocked]);

  if (!user) return null;
  return children;
}
