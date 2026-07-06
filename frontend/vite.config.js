// Vite config for the SaferRoute web app.
// Role: build/dev tooling for the React SPA served from Vercel.
// Traces to: docs/06-system-design.md (React + Vite, Vercel deploy).
//
// wasm()/topLevelAwait(): load the routing engine's wasm-bindgen output (src/wasm/router — a
// committed build artifact, see ADR-0003 / rust/router/README.md) inside routeWorker.js. Applied
// to `worker` too since the wasm module is only ever imported from within the Web Worker, not the
// main bundle.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
  // Build output is served by Vercel (vercel.json outputDirectory = frontend/dist).
  build: { outDir: 'dist' },
});
