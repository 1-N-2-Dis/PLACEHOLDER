// Vite config for the SaferRoute web app.
// Role: build/dev tooling for the React SPA served from Vercel.
// Traces to: docs/06-system-design.md (React + Vite, Vercel deploy).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Build output is served by Vercel (vercel.json outputDirectory = frontend/dist).
  build: { outDir: 'dist' },
});
