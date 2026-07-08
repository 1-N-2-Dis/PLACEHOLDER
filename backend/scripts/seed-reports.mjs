// Demo seeding of `reports` rows so the zone map / incident heatmap isn't empty at demo
// (F-001/F-010). Writes rows in the exact shape submitReport produces (docs/09-data-model.md)
// — including the required AI-era fields (severity, corroboration_count, last_activity_at) and
// a title — to Supabase (see backend/supabase/schema.sql) instead of Firestore.
//
// DEMO-ONLY content: segment ids come from frontend/src/data/seed-segments.js; notes describe
// observable, fixable conditions only (BR-001 — no crime labels, no people classification).
// Re-runnable: clears rows with uid='demo-seed' before inserting, so reruns refresh timestamps
// without duplicating.
//
// Run against the Supabase project configured in backend/server/.env:
//   node backend/scripts/seed-reports.mjs
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
// See backend/server/lib/supabase.js for why: supabase-js needs a WebSocket global (Node 22+)
// just to construct its client, even for scripts that never open a Realtime channel.
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile?.(path.join(__dirname, '..', 'server', '.env'));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/server/.env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket },
});

const NOW = Date.now();
const H = 60 * 60 * 1000;

// Fresh (within the 24h freshness window) so they flag "tonight" and feed the heatmap; the last
// entry is deliberately stale (>24h) to demo freshness decay (its segment reads "not tonight").
const DEMO_REPORTS = [
  {
    segmentId: 'seg_legarda_estero',
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Dim walkway lights after 8 PM',
    note: 'Street lighting along the estero walkway is very dim after 8 PM.',
    corroborationCount: 3,
    createdAt: NOW - 2 * H,
    lastActivityAt: NOW - 0.5 * H,
  },
  {
    segmentId: 'seg_pureza_approaches',
    conditionType: 'no_crowd',
    severity: 'yellow',
    title: 'Station underpass empty tonight',
    note: 'Station underpass very empty tonight, feels uncomfortable alone.',
    corroborationCount: 2,
    createdAt: NOW - 1 * H,
    lastActivityAt: NOW - 0.75 * H,
  },
  {
    segmentId: 'seg_recto_legarda',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Incident reported near corner store',
    note: 'An incident was reported near the corner store earlier tonight.',
    corroborationCount: 5,
    createdAt: NOW - 3 * H,
    lastActivityAt: NOW - 0.33 * H,
  },
  {
    segmentId: 'seg_anonas_st_3',
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Two streetlights out mid-block',
    note: 'Two consecutive streetlights are out, the middle of the block is dark.',
    corroborationCount: 1,
    createdAt: NOW - 4 * H,
    lastActivityAt: NOW - 4 * H,
  },
  {
    segmentId: 'seg_hipodromo_st_2',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Snatching incident reported earlier',
    note: 'A phone-snatching incident was reported on this stretch earlier this evening.',
    corroborationCount: 2,
    createdAt: NOW - 5 * H,
    lastActivityAt: NOW - 1.5 * H,
  },
  {
    segmentId: 'seg_vmapa_sm',
    conditionType: 'no_crowd',
    severity: 'yellow',
    title: 'Quiet stretch past the mall',
    note: 'Foot traffic thins out a lot past the mall entrance late at night.',
    corroborationCount: 1,
    createdAt: NOW - 30 * H,
    lastActivityAt: NOW - 30 * H,
  },
];

async function seed() {
  const { error: delErr } = await supabase.from('reports').delete().eq('uid', 'demo-seed');
  if (delErr) throw new Error(`Clearing previous demo reports failed: ${delErr.message}`);

  const rows = DEMO_REPORTS.map((r) => ({
    segment_id: r.segmentId,
    condition_type: r.conditionType,
    severity: r.severity,
    title: r.title,
    note: r.note,
    corroboration_count: r.corroborationCount,
    uid: 'demo-seed',
    created_at: new Date(r.createdAt).toISOString(),
    last_activity_at: new Date(r.lastActivityAt).toISOString(),
  }));

  const { error: insErr } = await supabase.from('reports').insert(rows);
  if (insErr) throw new Error(`Inserting demo reports failed: ${insErr.message}`);

  for (const r of DEMO_REPORTS) {
    console.log(`${r.severity.padEnd(6)} ${r.segmentId.padEnd(24)} "${r.title}"`);
  }
  console.log(`\nSeeded ${DEMO_REPORTS.length} demo reports (Supabase).`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
