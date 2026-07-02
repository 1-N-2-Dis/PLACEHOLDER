// Demo seeding of `reports` docs so the zone map / incident heatmap isn't empty at demo
// (F-001/F-010). Writes real Firestore docs in the exact shape submitReport produces
// (docs/09-data-model.md) — including the required AI-era fields (severity, corroborationCount,
// lastActivityAt) and a title — via the Admin SDK (bypasses the deny-client-write rules).
//
// DEMO-ONLY content: segment ids come from frontend/src/data/seed-segments.js; notes describe
// observable, fixable conditions only (BR-001 — no crime labels, no people classification).
// Deterministic doc ids make reruns idempotent (a rerun refreshes timestamps, no duplicates).
//
// Run against the LOCAL EMULATOR (no credentials needed) — PowerShell:
//   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; node backend/scripts/seed-reports.mjs
// Run against a REAL project (service-account creds, NOT committed):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"; node backend/scripts/seed-reports.mjs
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

// Fresh (within the 24h freshness window) so they flag "tonight" and feed the heatmap; the last
// entry is deliberately stale (>24h) to demo freshness decay (its segment reads "not tonight").
const DEMO_REPORTS = [
  {
    id: 'demo_seed_1',
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
    id: 'demo_seed_2',
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
    id: 'demo_seed_3',
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
    id: 'demo_seed_4',
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
    id: 'demo_seed_5',
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
    id: 'demo_seed_6_stale',
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
  const batch = db.batch();
  for (const { id, createdAt, lastActivityAt, ...fields } of DEMO_REPORTS) {
    batch.set(db.collection('reports').doc(id), {
      ...fields,
      uid: 'demo-seed',
      createdAt: Timestamp.fromMillis(createdAt),
      lastActivityAt: Timestamp.fromMillis(lastActivityAt),
    });
  }
  await batch.commit();
  for (const r of DEMO_REPORTS) {
    console.log(`${r.severity.padEnd(6)} ${r.segmentId.padEnd(24)} "${r.title}"`);
  }
  console.log(`\nSeeded ${DEMO_REPORTS.length} demo reports${useEmulator ? ' (emulator)' : ''}.`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
