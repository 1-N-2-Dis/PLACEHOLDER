// Firebase client init for SaferRoute.
// Role: initialize the Firebase app and export Auth + Firestore handles.
// Traces to: docs/06-system-design.md (Firebase Auth + Firestore), docs/09-data-model.md.
//
// Firebase client config is NOT secret (it is an identifier). Firestore Security Rules
// (backend/firestore.rules) are the real access gate.
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Functions region near PH for the F-004 Gemini proxy (backend/functions). [unverified] asia-southeast1.
export const functions = getFunctions(app, 'asia-southeast1');

// Local testing: point the SDK at the Firebase Emulator Suite instead of the cloud.
// Toggled by VITE_USE_EMULATORS=true in .env.local. Must run before any Auth/Firestore use.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  // eslint-disable-next-line no-console
  console.info('[SaferRoute] Using Firebase emulators (Auth:9099, Firestore:8080, Functions:5001).');
}
