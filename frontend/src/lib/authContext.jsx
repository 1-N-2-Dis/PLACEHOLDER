// guidHER auth context — wraps mockAuth.js so any component can read/update the current user.
import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, signIn, signUp, signOut, updateProfile, signInWithProfile } from './mockAuth.js';
import { signInWithGoogleIdToken } from './auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const navigate = useNavigate();

  const login = useCallback(async (creds) => {
    const u = await signIn(creds);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const u = await signUp(data);
    setUser(u);
    return u;
  }, []);

  // Google One Tap / button sign-in: exchange the Google ID token for a Firebase session
  // (preserving an anonymous reporter uid via account linking), then mirror the Google profile
  // into the mock UX identity so the rest of the app sees a logged-in user.
  const loginWithGoogle = useCallback(async (idToken) => {
    const { user: fbUser } = await signInWithGoogleIdToken(idToken);
    const u = await signInWithProfile({ name: fbUser.displayName, email: fbUser.email });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    signOut();
    setUser(null);
    // Reset the URL so a later login doesn't remount <Routes> against a stale
    // authenticated-only path (e.g. /profile) and skip straight past the dashboard.
    navigate('/', { replace: true });
  }, [navigate]);

  const update = useCallback(async (changes) => {
    const u = await updateProfile(changes);
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, update }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
