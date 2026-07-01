// Authentication helper for SaferRoute.
// Role: sign a reporter in so they can write a report.
// Traces to: docs/06-system-design.md (Firebase Auth), docs/12-security-compliance.md.
//
// Serves: BR-005 (report writes require an authenticated user).
//
// DECISION: anonymous sign-in (demo speed). KNOWN LIMITATION: weak abuse control — a user can
// drop the anonymous identity and get a fresh uid at will (Threat T3). Documented, accepted for demo.
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';

// Resolve once the user has a uid. Safe to call repeatedly; signs in anonymously if needed.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        unsub();
        reject(err);
      });
    }
  });
}

// Current Firebase Auth uid, or null if not signed in yet. Stamped onto reports (uid == request.auth.uid).
export function currentUid() {
  return auth.currentUser ? auth.currentUser.uid : null;
}
