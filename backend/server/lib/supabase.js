// Supabase (Postgres) service-role client — backend-only. Holds the service_role key, which
// bypasses Row Level Security entirely, so this is the sole writer to reports/analytics tables
// (mirrors firebase-admin/firestore's role as the only writer to Firestore's `reports`).
//
// Never import this file from frontend code — the service_role key must never ship in a client
// bundle. Client-side reads use frontend/src/lib/supabase.js (anon key + RLS) instead.
import { createClient } from '@supabase/supabase-js';
// supabase-js always constructs a Realtime client internally, which requires a native
// WebSocket global — only present on Node 22+. This server pins Node 20 (package.json
// engines), so `ws` is supplied as the transport; the backend never actually opens a Realtime
// channel (only frontend/src/lib/supabase.js does), but construction fails without this.
import WebSocket from 'ws';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see backend/server/.env.example).');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket },
});
