# Operations and observability — GuidHer

> Applies because this repository contains deployment configuration for a frontend, API, and
> Firebase services. It describes the current checkout; operational claims not verified in this
> migration are explicitly marked as such.

## Deploy and configuration

- Frontend: Vercel configuration in `vercel.json`.
- API: `backend/server` is the Express deployment unit. `GEMINI_API_KEY` and
  `FIREBASE_SERVICE_ACCOUNT_KEY` are server-side environment variables only.
- Firebase: Auth and Firestore `users/{uid}.role` records use `firebase.json` and
  `backend/firestore.rules`.
- Supabase: `reports`, analytics caches, and reference tables are Postgres-owned. The browser has
  read-only anon access through RLS; `backend/server` holds the service-role writer credential.
- Photo Storage is disabled by `PHOTO_UPLOAD_ENABLED = false`; do not treat storage rules as an
  active production surface until photo upload is deliberately re-enabled.

## Signals and common failures

| Signal | Interpretation | First response |
|---|---|---|
| `/health` fails | API unavailable | Check Render/service configuration and server logs without exposing secrets. |
| Report submission returns unauthenticated | token/auth boundary issue | Re-authenticate; inspect Firebase Auth emulator/production configuration. |
| Reports cannot be written | moderation/API or Supabase server-writer path issue | Verify `submitReport` against the intended environment before changing RLS or credentials. |
| Route worker fails | graph/WASM asset unavailable or invalid | Verify same-origin graph and WASM asset requests; no external routing fallback exists. |

## Recovery boundaries

- Roll back frontend/API through their host’s prior deployment mechanism only after confirming the
  failing release.
- Do not weaken Supabase's client-write denial or Firestore's role-record rules as a quick fix.
- A GitHub projection failure is process-only: suspend it in the implementation plan and continue
  local coding/testing.
