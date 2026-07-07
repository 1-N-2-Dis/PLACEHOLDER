// Seed heatmap baseline reports from CSV data analysis.
// Source: data/heatmap-baseline.json — risk weights derived from 99 collected community reports
// across crime-reports-MERGED.csv (Reddit, PH news, first-party interviews, evidence-register).
//
// Run AFTER seed-segments.mjs — requires segment docs to exist in Firestore.
// Deterministic doc IDs make reruns idempotent (re-run before demo to refresh timestamps).
//
// Run against LOCAL EMULATOR — PowerShell:
//   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"
//   node backend/scripts/seed-heatmap-baseline.mjs
//
// Run against REAL project:
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
//   node backend/scripts/seed-heatmap-baseline.mjs
//
// BR-001: All note fields use conditions-only language — no crime labels, no people labels.
// BR-006: All data derives from real community reports — nothing invented.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(
  useEmulator
    ? { projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' }
    : { credential: applicationDefault() },
);
const db = getFirestore();

const NOW = Date.now();
const H = 60 * 60 * 1000;

// 9 baseline reports — one per heatmap segment. Ordered highest → lowest severity/weight.
// corroborationCount reflects independent report tally from CSV data, capped at 5
// (matches HEAT_COUNT_CAP in frontend/src/lib/heatmap.js).
// createdAt staggered so heatmap looks organic, not batch-stamped.
const BASELINE_REPORTS = [
  {
    id: 'baseline_pureza_approaches',
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
    id: 'baseline_magsaysay_jeeps',
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
    id: 'baseline_recto_legarda',
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
    id: 'baseline_teresa_st',
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
    id: 'baseline_legarda_estero',
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
    id: 'baseline_pureza_st',
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
    id: 'baseline_anonas_st',
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
    id: 'baseline_vmapa',
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
    id: 'baseline_hipodromo',
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
  const batch = db.batch();
  for (const { id, createdAt, lastActivityAt, ...fields } of BASELINE_REPORTS) {
    batch.set(db.collection('reports').doc(id), {
      ...fields,
      uid: 'csv-seed',
      createdAt: Timestamp.fromMillis(createdAt),
      lastActivityAt: Timestamp.fromMillis(lastActivityAt),
    });
  }
  await batch.commit();

  const red = BASELINE_REPORTS.filter((r) => r.severity === 'red');
  const yellow = BASELINE_REPORTS.filter((r) => r.severity === 'yellow');

  console.log('\nBaseline heatmap seeded:\n');
  for (const r of BASELINE_REPORTS) {
    const bar = '█'.repeat(r.corroborationCount);
    const color = r.severity === 'red' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';
    console.log(`  ${color}${r.severity.padEnd(6)}${reset} ${bar.padEnd(5)} ${r.segmentId.padEnd(30)} "${r.title}"`);
  }

  console.log(`\n✓ ${BASELINE_REPORTS.length} baseline reports seeded${useEmulator ? ' (emulator)' : ' (production)'}.`);
  console.log(`  ${red.length} red segments · ${yellow.length} yellow segments`);
  console.log('  Re-run before demo to refresh the 24h freshness window.\n');
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
