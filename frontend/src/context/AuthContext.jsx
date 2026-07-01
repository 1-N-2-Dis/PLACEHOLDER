// guidHER auth context — provides user + theme state app-wide.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, signOut } from '../lib/mockAuth.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [theme, setTheme] = useState(() => {
    const stored = getStoredUser();
    return stored?.theme || localStorage.getItem('guidher_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('guidher_theme', theme);
  }, [theme]);

  const login = useCallback((u) => setUser(u), []);
  const logout = useCallback(() => { signOut(); setUser(null); }, []);
  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);

  return (
    <AuthCtx.Provider value={{ user, login, logout, theme, toggleTheme, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
