// Google One Tap (Google Identity Services) loader for guidHER auth views.
// Role: show the One Tap prompt and render the official "Continue with Google" button on the
// login/signup views; both paths hand a Google ID token to the caller, which exchanges it for a
// Firebase session (lib/auth.js signInWithGoogleIdToken).
//
// OPTIONAL FEATURE: everything here no-ops when VITE_GOOGLE_CLIENT_ID is unset, so builds
// without the OAuth Web client ID lose One Tap silently instead of erroring.
const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let gsiLoadPromise = null;

// Load the GIS script once. Resolves with window.google.accounts.id, or null when the feature
// is disabled or the script fails (ad blockers commonly block gsi/client).
function loadGsi() {
  if (!CLIENT_ID) return Promise.resolve(null);
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!gsiLoadPromise) {
    gsiLoadPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve(window.google?.accounts?.id ?? null);
      script.onerror = () => {
        gsiLoadPromise = null; // allow a retry on the next view mount
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }
  return gsiLoadPromise;
}

// Initialize GIS with our client ID, show the One Tap prompt, and optionally render the official
// Google button into buttonEl. onIdToken receives the raw Google ID token (JWT) on success.
// Returns true if GIS initialized, false if the feature is disabled/unavailable.
export async function initGoogleSignIn({ onIdToken, buttonEl }) {
  const gsi = await loadGsi();
  if (!gsi) return false;
  gsi.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      if (response?.credential) onIdToken(response.credential);
    },
  });
  // One Tap prompt. Google may suppress it (cooldown after dismissal, incognito) — that is
  // silent by design; the rendered button below stays as the visible entry point.
  gsi.prompt();
  if (buttonEl) {
    gsi.renderButton(buttonEl, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: buttonEl.clientWidth || 320,
    });
  }
  return true;
}

// Dismiss any visible One Tap prompt (call on auth-view unmount so it doesn't linger).
export function cancelGoogleOneTap() {
  window.google?.accounts?.id?.cancel();
}
