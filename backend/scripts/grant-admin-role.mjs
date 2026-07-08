// One-shot script to grant 'role: admin' to a specific Firebase Auth uid.
// Firestore rules block clients from writing this field themselves — the Admin SDK bypasses
// rules, so only a service-account credential is needed here, not the admin user's own login.
//
// Run against the REAL project (service-account creds, NOT committed):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
//   node backend/scripts/grant-admin-role.mjs
//
// Run against the LOCAL EMULATOR (for local testing):
//   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; $env:GCLOUD_PROJECT="demo-saferroute"
//   node backend/scripts/grant-admin-role.mjs
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const UID = 'tATNM1pMF7gnHa0iv1PnrzGRqZt2';

const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(
  useEmulator
    ? { projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' }
    : { credential: applicationDefault() },
);
const db = getFirestore();

// merge: true — preserves any existing fields on the doc (e.g. email) instead of overwriting them.
await db.collection('users').doc(UID).set({ role: 'admin' }, { merge: true });
console.log(`admin role granted (uid: ${UID})${useEmulator ? ' [emulator]' : ' [production]'}`);
