// One-time seeding of 4 demo accounts (F-009: 2 admin, 2 end users) for trying out the
// login/signup + admin moderation flow.
// Role: create the Auth users AND their users/{uid} Firestore role doc (Admin SDK bypasses
// backend/firestore.rules, which is the only way to set role: 'admin' — see firestore.rules).
// Traces to: docs/superpowers/specs/2026-07-01-login-account-page-design.md.
//
// DEMO-ONLY credentials — never reuse this password for a real account.
//
// Run against the LOCAL EMULATOR (no credentials needed) — PowerShell:
//   $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"; $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; node backend/scripts/seed-auth-users.mjs
// Run against a REAL project (service-account creds, NOT committed):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"; node backend/scripts/seed-auth-users.mjs
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const DEMO_PASSWORD = 'Passw0rd!';

const ACCOUNTS = [
  { email: 'admin@gmail.com', role: 'admin' },
  // Easy-to-remember login for demo day — same password as the email's local part.
  { email: 'adminadmin@gmail.com', role: 'admin', password: 'adminadmin' },
  { email: 'user1@gmail.com', role: 'user' },
  { email: 'user2@gmail.com', role: 'user' },
];

const useEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
initializeApp(
  useEmulator
    ? { projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' }
    : { credential: applicationDefault() },
);
const auth = getAuth();
const db = getFirestore();

// Idempotent: re-running always pins the account to its intended password + role, even if the
// account already exists (e.g. was previously created via self-signup with a different password,
// which is exactly how admin@gmail.com got stuck with role:'user' on prod before).
async function upsertAccount({ email, role, password = DEMO_PASSWORD }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, emailVerified: true });
  }
  await auth.updateUser(user.uid, { password, emailVerified: true });
  await db.collection('users').doc(user.uid).set({ email, role });
  console.log(`${role.padEnd(5)} ${email} / ${password} (uid: ${user.uid})`);
}

async function seed() {
  for (const account of ACCOUNTS) {
    await upsertAccount(account);
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
