// Supabase client init for SaferRoute — public anon key, safe for the client bundle.
// Role: client-side reads + Realtime subscription of `reports` (replaces Firestore's
// onSnapshot — see reports.js). Row Level Security (backend/supabase/schema.sql) is the real
// access gate: every table allows public SELECT and denies client insert/update/delete, so
// writes still go exclusively through backend/server (submitReport, likeReport, admin routes)
// using the service_role key.
//
// Unlike Firestore, there is no local Supabase emulator wired up here — this always talks to
// the real hosted project, in both dev and prod.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
