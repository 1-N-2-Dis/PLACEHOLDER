// Mock auth service for guidHER prototype (replaces Firebase Auth).
const KEY = 'guidher_auth';
const load = () => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (u) => localStorage.setItem(KEY, JSON.stringify(u));
const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const getStoredUser = () => load();
export const signOut = () => localStorage.removeItem(KEY);

export async function signUp({ name, email, campus, commutePrefs }) {
  await delay(700);
  const user = { uid: `u_${Date.now()}`, name, email, campus: campus||'PUP Main Campus', commutePrefs: commutePrefs||[], createdAt: new Date().toISOString(), savedRoutes: [], reportsCount: 0, homeLocation: '', destination: '', theme: 'light' };
  save(user); return user;
}

export async function signIn({ email }) {
  await delay(600);
  const existing = load();
  if (existing && existing.email === email) return existing;
  const user = { uid: `u_${Date.now()}`, name: email.split('@')[0], email, campus: 'PUP Main Campus', commutePrefs: ['lrt','jeepney'], createdAt: new Date().toISOString(), savedRoutes: [], reportsCount: 0, homeLocation: '', destination: '', theme: 'light' };
  save(user); return user;
}

// Google sign-in bridge: like signIn but takes the real display name from the Google profile
// instead of deriving it from the email prefix. No artificial delay — the Firebase credential
// exchange already provided the wait.
export async function signInWithProfile({ name, email }) {
  const existing = load();
  if (existing && existing.email === email) return existing;
  const user = { uid: `u_${Date.now()}`, name: name || email.split('@')[0], email, campus: 'PUP Main Campus', commutePrefs: [], createdAt: new Date().toISOString(), savedRoutes: [], reportsCount: 0, homeLocation: '', destination: '', theme: 'light' };
  save(user); return user;
}

export async function updateProfile(updates) {
  await delay(300);
  const u = { ...load(), ...updates };
  save(u); return u;
}
