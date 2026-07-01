// One-time seeding of the 8 zone segments into Firestore.
// Role: upload reference segments, since `segments` is client-write-locked by the rules (BR-001).
// Traces to: idea.md §7, docs/09-data-model.md, backend/firestore.rules.
//
// Run against the LOCAL EMULATOR (no credentials needed) — PowerShell:
//   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; node backend/scripts/seed-segments.mjs
// Run against a REAL project (service-account creds, NOT committed):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"; node backend/scripts/seed-segments.mjs
//
// Keep this list in sync with frontend/src/data/seed-segments.js (the demo map's source of truth).
// [unverified] DEMO CONTENT — approximate coordinates, confirm in field-walks post-July-2.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, GeoPoint } from 'firebase-admin/firestore';

const SEGMENTS = [
  { segmentId: 'seg_teresa_st', name: 'Teresa St (PUP side)', lat: 14.5996, lng: 121.0108 },
  { segmentId: 'seg_pureza_south_exit', name: 'Pureza LRT-2 south exit', lat: 14.5979, lng: 121.0030 },
  { segmentId: 'seg_pureza_approaches', name: 'Pureza station approaches', lat: 14.5985, lng: 121.0040 },
  { segmentId: 'seg_legarda_estero', name: 'Legarda east / Estero de San Miguel', lat: 14.6010, lng: 120.9975 },
  { segmentId: 'seg_recto_legarda', name: 'Recto–Legarda environs', lat: 14.6035, lng: 120.9968 },
  { segmentId: 'seg_vmapa_sm', name: 'V. Mapa → SM Sta. Mesa', lat: 14.6020, lng: 121.0145 },
  { segmentId: 'seg_pcampa_altroute', name: 'P. Campa / Loyola / Dalupan alt-route', lat: 14.6055, lng: 120.9930 },
  { segmentId: 'seg_magsaysay_jeeps', name: 'Magsaysay Blvd / Old Sta. Mesa jeepney route', lat: 14.5968, lng: 121.0085 },
];

// Against the emulator (FIRESTORE_EMULATOR_HOST set) no real credentials are needed — just a projectId.
const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(
  useEmulator
    ? { projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' }
    : { credential: applicationDefault() },
);
const db = getFirestore();

async function seed() {
  const batch = db.batch();
  for (const s of SEGMENTS) {
    const ref = db.collection('segments').doc(s.segmentId);
    batch.set(ref, {
      segmentId: s.segmentId,
      name: s.name,
      geo: new GeoPoint(s.lat, s.lng),
    });
  }
  await batch.commit();
  console.log(`Seeded ${SEGMENTS.length} segments.`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
