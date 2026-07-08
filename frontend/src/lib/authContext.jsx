// guidHER auth context — backed by real Firebase Authentication (lib/auth.js), the same
// identity used by /login (features/auth/AccountPage.jsx) and validated by
// backend/scripts/seed-auth-users.mjs's seeded accounts. Login/signup here go through Firebase's
// actual email+password check (wrong password -> rejected, unknown email -> rejected) instead of
// the old mockAuth.js local storage, which never checked the password at all.
//
// Firebase Auth has no fields for campus/commute-prefs/saved-routes/etc., so those stay cached
// in localStorage, keyed by the real Firebase uid (PROFILE_PREFIX below) purely as display data —
// never used for identity or password checks.
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { signInWithEmail, signUpWithEmail, signInWithGoogleIdToken, signOutUser } from './auth.js';

const AuthContext = createContext(null);

const PROFILE_PREFIX = 'guidher_profile_';

function loadExtras(uid) {
  try {
    const raw = localStorage.getItem(PROFILE_PREFIX + uid);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveExtras(uid, extras) {
  localStorage.setItem(PROFILE_PREFIX + uid, JSON.stringify(extras));
}

// Anonymous sessions (auto-created on load for report writes, see main.jsx's ensureSignedIn)
// never count as "logged in" here — matches lib/useAuthUser.js's isAnonymous handling.
function buildUser(fbUser) {
  if (!fbUser || fbUser.isAnonymous) return null;
  const extras = loadExtras(fbUser.uid);
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    name: extras.name || fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
    campus: extras.campus || 'PUP Main Campus',
    commutePrefs: extras.commutePrefs || [],
    savedRoutes: extras.savedRoutes || [],
    reportsCount: extras.reportsCount || 0,
    homeLocation: extras.homeLocation || '',
    destination: extras.destination || '',
    photoURL: fbUser.photoURL || null,
  };
}

// Firebase's raw error messages ("Firebase: Error (auth/invalid-credential).") aren't fit for end
// users — map the codes that actually surface here to the same copy AccountPage.jsx already uses.
function friendlyAuthError(err) {
  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return new Error('Incorrect email or password.');
    case 'auth/email-already-in-use':
      return new Error('An account with that email already exists — try logging in instead.');
    case 'auth/weak-password':
      return new Error('Password must be at least 6 characters.');
    case 'auth/invalid-email':
      return new Error('Please enter a valid email address.');
    default:
      return new Error('Something went wrong. Please try again.');
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => buildUser(auth.currentUser));
  const navigate = useNavigate();

  useEffect(() => onAuthStateChanged(auth, (fbUser) => setUser(buildUser(fbUser))), []);

  const login = useCallback(async ({ email, password }) => {
    try {
      const { user: fbUser } = await signInWithEmail(email, password);
      const u = buildUser(fbUser);
      setUser(u);
      return u;
    } catch (err) {
      throw friendlyAuthError(err);
    }
  }, []);

  const register = useCallback(async ({ name, email, password, campus, commutePrefs }) => {
    try {
      const { user: fbUser } = await signUpWithEmail(email, password);
      saveExtras(fbUser.uid, { name, campus, commutePrefs });
      const u = buildUser(fbUser);
      setUser(u);
      return u;
    } catch (err) {
      throw friendlyAuthError(err);
    }
  }, []);

  // Google One Tap / button sign-in: exchange the Google ID token for a Firebase session
  // (preserving an anonymous reporter uid via account linking, see lib/auth.js).
  const loginWithGoogle = useCallback(async (idToken) => {
    const { user: fbUser } = await signInWithGoogleIdToken(idToken);
    const u = buildUser(fbUser);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await signOutUser();
    setUser(null);
    // Reset the URL back to "/" too — otherwise AuthenticatedApp's <Routes> remounts against a
    // stale authenticated-only path (e.g. /profile) and skip straight past the dashboard.
    navigate('/', { replace: true });
  }, [navigate]);

  const update = useCallback(async (changes) => {
    if (!user) return null;
    const extras = { ...loadExtras(user.uid), ...changes };
    saveExtras(user.uid, extras);
    const u = { ...user, ...changes };
    setUser(u);
    return u;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, update }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
