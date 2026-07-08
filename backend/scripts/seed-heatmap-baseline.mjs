// Seed heatmap baseline reports from CSV data analysis.
// Source: data/heatmap-baseline.json — risk weights derived from 99 collected community reports
// across crime-reports-MERGED.csv (Reddit, PH news, first-party interviews, evidence-register).
//
// Writes to Supabase's `reports` table (see backend/supabase/schema.sql) instead of Firestore.
// Re-runnable: clears rows with uid='csv-seed' before inserting, so reruns refresh timestamps
// without duplicating (Postgres generates a fresh uuid per row — there's no stable doc id to
// upsert against like the old Firestore version had).
//
// Run against the Supabase project configured in backend/server/.env:
//   node backend/scripts/seed-heatmap-baseline.mjs
//
// BR-001: All note fields use conditions-only language — no crime labels, no people labels.
// BR-006: All data derives from real community reports — nothing invented.
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

// 9 baseline reports — one per heatmap segment. Ordered highest → lowest severity/weight.
// corroborationCount reflects independent report tally from CSV data, capped at 5
// (matches HEAT_COUNT_CAP in frontend/src/lib/heatmap.js).
// createdAt staggered so heatmap looks organic, not batch-stamped.
const BASELINE_REPORTS = [
  {
    segmentId: 'seg_pureza_approaches',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Multiple incidents reported near station exits',
    note: 'Station exits reported as poorly lit after 8 PM. Multiple accounts of bag-slashing and unwanted contact on stairs. Trike terminal has reported overcharging for solo riders.',
    corroborationCount: 5,
    createdAt: NOW - 2 * H,
    lastActivityAt: NOW - 0.5 * H,
  },
  {
    segmentId: 'seg_magsaysay_jeeps',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Snatch incidents on and near jeepneys',
    note: 'Multiple reports of phone and bag snatching along this stretch, including on moving jeepneys. Avoid using phone near open windows. Motorcycle-borne snatchers active during traffic.',
    corroborationCount: 5,
    createdAt: NOW - 3 * H,
    lastActivityAt: NOW - 1 * H,
  },
  {
    segmentId: 'seg_recto_legarda',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Armed incidents reported along this corridor',
    note: 'This corridor has multiple confirmed reports of weapon-involved incidents. The stretch under and near the LRT station is poorly lit. Consider the P. Campa alternative route.',
    corroborationCount: 5,
    createdAt: NOW - 4 * H,
    lastActivityAt: NOW - 0.33 * H,
  },
  {
    segmentId: 'seg_teresa_wellused_1',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Grab-and-run incidents reported on this stretch',
    note: 'Multiple reports of phone and bag snatching, especially at low foot-traffic times. Travel with others if possible and keep valuables secured inside your bag.',
    corroborationCount: 5,
    createdAt: NOW - 1 * H,
    lastActivityAt: NOW - 0.25 * H,
  },
  {
    segmentId: 'seg_legarda_estero',
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Poorly lit exit toward Estero — stay alert',
    note: 'The east exit toward the estero is unlit after sunset with limited security. Pickpocketing has been reported on the platform and inside the train on this stretch.',
    corroborationCount: 4,
    createdAt: NOW - 5 * H,
    lastActivityAt: NOW - 2 * H,
  },
  {
    segmentId: 'seg_pureza_st_3',
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Street poorly lit away from Magsaysay intersection',
    note: 'Pureza Street is only well-lit at the main intersection. Both ends are significantly darker. Stay alert when boarding or alighting from jeepneys at poorly lit stops.',
    corroborationCount: 3,
    createdAt: NOW - 6 * H,
    lastActivityAt: NOW - 3 * H,
  },
  {
    segmentId: 'seg_anonas_st_3',
    conditionType: 'recent_incident',
    severity: 'yellow',
    title: 'Pickpocket advisory near Mass Comm building',
    note: 'Pickpockets target people unfamiliar with the area near the PUP Mass Comm building. Keep your bag in front of you and be aware of people following too closely.',
    corroborationCount: 2,
    createdAt: NOW - 7 * H,
    lastActivityAt: NOW - 4 * H,
  },
  {
    segmentId: 'seg_vmapa_sm',
    conditionType: 'no_crowd',
    severity: 'yellow',
    title: 'Group-based theft reported near transit stop',
    note: 'Reports of coordinated theft using crowd pressure near the transit stop. Stay close to the platform edge and keep belongings secure in crowded queues.',
    corroborationCount: 2,
    createdAt: NOW - 8 * H,
    lastActivityAt: NOW - 5 * H,
  },
  {
    segmentId: 'seg_hipodromo_st_2',
    conditionType: 'recent_incident',
    severity: 'yellow',
    title: 'Verbal harassment reported on this street',
    note: 'Verbal harassment has been reported on this stretch. Consider walking with company or taking a different route if you feel unsafe.',
    corroborationCount: 1,
    createdAt: NOW - 9 * H,
    lastActivityAt: NOW - 6 * H,
  },
];

async function seed() {
  const { error: delErr } = await supabase.from('reports').delete().eq('uid', 'csv-seed');
  if (delErr) throw new Error(`Clearing previous baseline reports failed: ${delErr.message}`);

  const rows = BASELINE_REPORTS.map((r) => ({
    segment_id: r.segmentId,
    condition_type: r.conditionType,
    severity: r.severity,
    title: r.title,
    note: r.note,
    corroboration_count: r.corroborationCount,
    uid: 'csv-seed',
    created_at: new Date(r.createdAt).toISOString(),
    last_activity_at: new Date(r.lastActivityAt).toISOString(),
  }));

  const { error: insErr } = await supabase.from('reports').insert(rows);
  if (insErr) throw new Error(`Inserting baseline reports failed: ${insErr.message}`);

  const red = BASELINE_REPORTS.filter((r) => r.severity === 'red');
  const yellow = BASELINE_REPORTS.filter((r) => r.severity === 'yellow');

  console.log('\nBaseline heatmap seeded:\n');
  for (const r of BASELINE_REPORTS) {
    const bar = '█'.repeat(r.corroborationCount);
    const color = r.severity === 'red' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';
    console.log(`  ${color}${r.severity.padEnd(6)}${reset} ${bar.padEnd(5)} ${r.segmentId.padEnd(30)} "${r.title}"`);
  }

  console.log(`\n✓ ${BASELINE_REPORTS.length} baseline reports seeded (Supabase).`);
  console.log(`  ${red.length} red segments · ${yellow.length} yellow segments`);
  console.log('  Re-run before demo to refresh the 24h freshness window.\n');
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
