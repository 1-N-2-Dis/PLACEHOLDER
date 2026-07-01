// React entry point for SaferRoute.
// Role: mount <App /> into #root (see index.html) and kick off anonymous sign-in.
// Traces to: docs/06-system-design.md (React + Vite SPA).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ensureSignedIn } from './lib/auth.js';
import './styles.css';

// Sign in anonymously up front so report writes (BR-005) work without a sign-in step.
ensureSignedIn().catch((err) => console.error('Anonymous sign-in failed:', err.message));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
