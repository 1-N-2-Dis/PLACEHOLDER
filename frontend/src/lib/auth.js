// Authentication helper for SaferRoute.
// Role: sign a reporter in so they can write a report; optionally upgrade to a persistent
// Google account without losing the uid already stamped on their reports.
// Traces to: docs/06-system-design.md (Firebase Auth), docs/12-security-compliance.md.
//
// Serves: BR-005 (report writes require an authenticated user).
//
// DECISION: anonymous sign-in by default (demo speed), with an optional Google upgrade via
// account linking. KNOWN LIMITATION: weak abuse control while still anonymous — a user can drop
// the anonymous identity and get a fresh uid at will (Threat T3). Documented, accepted for demo.
import {
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  linkWithPopup,
  signInWithPopup,
  signInWithCredential,
  linkWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase.js';
import { ensureUserDoc } from './users.js';

// DEMO-ONLY validation (F-009): "for now" the only check is a @gmail.com suffix, per explicit
// request — not real email verification. Revisit before any real deployment.
export function isGmailAddress(email) {
  return /^[^\s@]+@gmail\.com$/i.test(email);
}

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

// Upgrade the current anonymous user to Google sign-in, keeping the same uid so reports already
// submitted anonymously stay attributed to the upgraded account. Falls back to a plain Google
// sign-in (new uid) only if that Google account is already linked to a different Firebase user.
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  let result;
  if (auth.currentUser?.isAnonymous) {
    try {
      result = await linkWithPopup(auth.currentUser, provider);
    } catch (err) {
      if (err.code !== 'auth/credential-already-in-use') throw err;
    }
  }
  if (!result) result = await signInWithPopup(auth, provider);
  await ensureUserDoc(result.user.uid, result.user.email);
  return result;
}

// Google One Tap variant of signInWithGoogle: exchanges a Google ID token (from Google Identity
// Services — see googleOneTap.js) for a Firebase session, with the same anonymous-uid-preserving
// link-first behavior. Falls back to a plain credential sign-in when that Google account is
// already linked to a different Firebase user.
export async function signInWithGoogleIdToken(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  let result;
  if (auth.currentUser?.isAnonymous) {
    try {
      result = await linkWithCredential(auth.currentUser, credential);
    } catch (err) {
      if (err.code !== 'auth/credential-already-in-use') throw err;
    }
  }
  if (!result) result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user.uid, result.user.email);
  return result;
}

// Sign out entirely. A later ensureSignedIn() call establishes a fresh anonymous session.
export function signOutUser() {
  return signOut(auth);
}

// Create a new email/password account (F-009), linking onto the current anonymous uid when
// possible so already-submitted reports stay attributed. Also writes the users/{uid} role doc
// (always 'role: user' for self-signup — see backend/firestore.rules).
export async function signUpWithEmail(email, password) {
  const credential = EmailAuthProvider.credential(email, password);
  const result = auth.currentUser?.isAnonymous
    ? await linkWithCredential(auth.currentUser, credential)
    : await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(result.user.uid, email);
  return result;
}

// Sign in to an existing email/password account (F-009). Does not preserve any prior anonymous
// uid — same as any normal login.
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(result.user.uid, email);
  return result;
}
