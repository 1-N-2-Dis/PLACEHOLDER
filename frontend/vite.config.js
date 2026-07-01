// Vite config for the SaferRoute web app.
// Role: build/dev tooling for the React SPA served from Firebase Hosting.
// Traces to: docs/06-system-design.md (React + Vite, Firebase Hosting deploy).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Build output is served by Firebase Hosting (firebase.json hosting.public = frontend/dist).
  build: { outDir: 'dist' },
});
