// RequireAdmin — route-level security HOC.
// Wraps any component that must only be reachable by admin accounts.
//
// Behaviour:
//   - role === 'admin'     → renders children normally.
//   - role === null        → loading state (role subscription still resolving).
//   - role === 'user'/other → hard redirect to /dashboard; the URL bar also
//                             changes so the user can't manually re-enter /admin.
//
// Relies on useAuthUser (lib/useAuthUser.js) which subscribes to both the real
// Firebase Auth session and the users/{uid}.role Firestore document — the same
// source of truth as the backend's isAdmin middleware. A non-admin user who
// somehow navigates to /admin in the browser will see this redirect instantly,
// without any flash of admin content.
//
// Usage:
//   <Route path="/admin" element={
//     <RequireAdmin><AdminPage ... /></RequireAdmin>
//   } />
import { Navigate } from 'react-router-dom';
import { useAuthUser } from '../lib/useAuthUser.js';
import { Shield } from 'lucide-react';

export default function RequireAdmin({ children }) {
  const { role, isAnonymous } = useAuthUser();

  // Still resolving the role subscription — show a brief non-content loading state.
  // We avoid rendering children while role is null to prevent a flash of admin UI.
  if (role === null && !isAnonymous) {
    return (
      <div className="report-page">
        <div className="report-page-inner">
          <div className="icon-line" style={{ marginTop: '2rem', color: 'var(--muted)' }}>
            <Shield size={16} />
            <span>Verifying access…</span>
          </div>
        </div>
      </div>
    );
  }

  // Anonymous users and non-admins are sent to the dashboard immediately.
  if (isAnonymous || role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
