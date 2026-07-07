// One-shot script to write the admin role document for the known production admin account.
// This is the only way to grant 'role: admin' — Firestore rules block client-side privilege
// escalation, and the emulator seed creates its own fresh UIDs that don't match production.
//
// The Admin SDK bypasses firestore.rules entirely, so no credentials for the admin *user*
// are needed here — only the service account key for the Firebase project.
//
// Run against the REAL project (service-account creds, NOT committed):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
//   node backend/scripts/seed-admin-role.mjs
//
// Run against the LOCAL EMULATOR (for local testing):
//   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; $env:GCLOUD_PROJECT="demo-saferroute"
//   node backend/scripts/seed-admin-role.mjs
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Known admin account ────────────────────────────────────────────────────────
// Source: seed-auth-users.mjs output from the real Firebase project.
// UID is stable — it's the Firebase Auth uid, not a session token.
const ADMIN_ACCOUNTS = [
  { uid: 'AFgvOssPLXePCPIIv2HqP5xTHzhn', email: 'admin@gmail.com', role: 'admin' },
];

const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(
  useEmulator
    ? { projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' }
    : { credential: applicationDefault() },
);
const db = getFirestore();

async function seed() {
  for (const { uid, email, role } of ADMIN_ACCOUNTS) {
    // set() with no merge — always overwrites so a stale 'role: user' doc can't block access.
    await db.collection('users').doc(uid).set({ email, role });
    console.log(`  ${role.padEnd(5)} ${email}  (uid: ${uid})`);
  }
  console.log(`\n✓ Admin role doc written${useEmulator ? ' (emulator)' : ' (production)'}.\n`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
