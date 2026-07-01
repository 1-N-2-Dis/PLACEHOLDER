// guidHER auth context — wraps mockAuth.js so any component can read/update the current user.
import { createContext, useContext, useState, useCallback } from 'react';
import { getStoredUser, signIn, signUp, signOut, updateProfile } from './mockAuth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

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

  const logout = useCallback(() => {
    signOut();
    setUser(null);
  }, []);

  const update = useCallback(async (changes) => {
    const u = await updateProfile(changes);
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, update }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
