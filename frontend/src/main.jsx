// guidHER entry point — mounts providers + App into #root.
// Traces to: docs/06-system-design.md (React + Vite SPA).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './lib/authContext.jsx';
import { ThemeProvider } from './lib/theme.jsx';
import { ensureSignedIn } from './lib/auth.js';
import './styles.css';

// Kick off anonymous Firebase Auth sign-in for report writes (BR-005). AuthProvider
// (lib/authContext.jsx) is also backed by Firebase Auth, but only counts a real (non-anonymous)
// session as "logged in" — this anonymous uid just satisfies the submitReport auth gate until/
// unless the visitor actually logs in.
ensureSignedIn().catch((err) => console.error('Firebase anonymous sign-in failed:', err.message));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
