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

// Kick off anonymous Firebase Auth sign-in for report writes (BR-005).
// The guidHER mock auth layer (AuthProvider/mockAuth.js) is separate — it manages
// the UX identity (name, prefs). Firebase Auth anonymous uid is still needed for
// the Cloud Function gate (submitReport).
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
