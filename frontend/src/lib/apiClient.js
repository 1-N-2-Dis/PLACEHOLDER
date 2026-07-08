// Client for the Render-hosted API (backend/server) that replaced the Firebase Cloud Functions
// in backend/functions — Functions v2 required the Firebase Blaze plan even at zero usage.
// Traces to: DEPLOYMENT_GUIDE.md, backend/server/index.js.
//
// httpsCallable used to attach the caller's Firebase ID token automatically; a plain fetch has
// to do that itself, so every call here ensures a signed-in user first and sends the token as
// `Authorization: Bearer <token>`, matching backend/server/index.js's requireAuth middleware.
import { ensureSignedIn } from './auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// path: one of '/submitReport', '/summarizeSegment', '/assessRoute', '/likeReport' (see
// backend/server/index.js).
// Returns the parsed JSON body on success. Throws on any non-2xx response or network failure —
// callers already handle a thrown Error the same way they handled a rejected httpsCallable call.
export async function callApi(path, payload) {
  const user = await ensureSignedIn();
  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((body && body.message) || `Request to ${path} failed (${res.status}).`);
  }
  return body;
}
