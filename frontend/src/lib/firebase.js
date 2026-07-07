// Firebase client init for SaferRoute.
// Role: initialize the Firebase app and export Auth + Firestore handles.
// Traces to: docs/06-system-design.md (Firebase Auth + Firestore), docs/09-data-model.md.
//
// Firebase client config is NOT secret (it is an identifier). Firestore Security Rules
// (backend/firestore.rules) are the real access gate.
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
// Report photo evidence (F-007) — unused while PHOTO_UPLOAD_ENABLED is false (storage.js).
export const storage = getStorage(app);

// Local testing: point the SDK at the Firebase Emulator Suite instead of the cloud.
// Toggled by VITE_USE_EMULATORS=true in .env.local. Must run before any Auth/Firestore use.
// Gemini-backed calls (backend/server) are no longer Firebase Functions, so there's no
// Functions emulator to connect to — run backend/server locally instead (see LOCAL_DEV.md).
// Defaults match firebase.json's emulator ports (Firestore moved to 8081 so the Express API can
// keep 8080); override via env when the emulators run elsewhere (e.g. the Docker dev stack).
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || '127.0.0.1';
  const firestorePort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8081);
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, firestorePort);
  connectStorageEmulator(storage, emulatorHost, 9199);
  // eslint-disable-next-line no-console
  console.info(`[SaferRoute] Using Firebase emulators (Auth:9099, Firestore:${firestorePort}, Storage:9199).`);
}
