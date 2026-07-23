# ADR — Architecture Decision Record

> Append-only log. One entry per significant decision. Never edit a past entry — supersede it
> with a new one.

---

## ADR-0002 — Hosting/compute split: Vercel + Render alongside Firebase; Storage disabled

- **Date:** 2026-07-02
- **Status:** Accepted
- **Context:** Firebase Storage can no longer be provisioned on the free Spark plan for new
  projects — it now requires the Blaze (pay-as-you-go) plan. The same is true, separately, of the
  three Cloud Functions (`submitReport`, `assessRoute`, `summarizeSegment`): they are Functions v2
  (`firebase-functions/v2`), which runs on Cloud Run/Cloud Build/Artifact Registry under the hood
  and requires Blaze regardless of actual usage volume. This is a Google-hackathon build with a
  hard requirement to keep using Firebase, but not a requirement to put every piece of the stack
  on Firebase, and not a budget for Blaze.
- **Options considered:**
  1. **Stay entirely on Firebase, upgrade to Blaze.** Simplest architecture, no new vendors. Blaze
     has a real free-usage tier (you're billed only past it), so cost risk is low — but it still
     requires attaching a billing account, which was ruled out for this build.
  2. **Move everything off Firebase.** Would lose the Google-technology requirement entirely —
     rejected outright; this is a Google hackathon.
  3. **Split: keep Firestore + Auth on Firebase (Spark/free, satisfies the Google-tech
     requirement); move the three Gemini-backed routes to a plain Node/Express host; move static
     frontend hosting off Firebase Hosting too since it was only there for Firebase-project
     convenience, not a hard dependency; disable Storage.** More moving parts (three platforms
     instead of one), but zero Blaze/billing requirement anywhere, and Firestore/Auth — the
     surfaces that actually carry the Google-tech requirement — are untouched.
- **Decision:** Option 3.
  - **Frontend (React/Vite SPA):** Vercel, not Firebase Hosting.
  - **`submitReport`/`assessRoute`/`summarizeSegment`:** a new Express app, `backend/server/`,
    deployed on Render — replaces `backend/functions` (deleted). Same validation/prompt logic as
    before; the only functional change is that a Firebase ID token is now verified manually
    (`Authorization: Bearer <token>` → `admin.auth().verifyIdToken()`) instead of relying on
    `onCall`'s built-in `request.auth`, and CORS is hand-configured (`CORS_ORIGIN` env var) instead
    of framework-provided.
  - **Firestore + Firebase Auth:** unchanged, stay on Firebase (Spark/free plan). This is what
    satisfies the Google-technology requirement now that compute has moved elsewhere.
  - **Firebase Storage (F-007, photo evidence):** disabled via `PHOTO_UPLOAD_ENABLED = false`
    (`frontend/src/lib/storage.js`) rather than removed — the photo-upload code path, UI step, and
    `backend/storage.rules` all still exist, just unused/unwired, so re-enabling under a future
    Blaze upgrade is a one-line flip plus re-adding the `storage` block to `firebase.json`.
- **Consequences:**
  - No Blaze plan or billing account needed anywhere in the stack.
  - Three deploy targets instead of one (Vercel, Render, Firebase) — more moving parts to keep in
    sync (env vars in two places, CORS between Vercel and Render) than a single-vendor setup.
  - Auth is now hand-verified in `backend/server/index.js` instead of framework-provided by
    `onCall` — a new surface that must stay correct (see
    `docs/security-compliance.md` for the updated threat notes).
  - `backend/functions/` (the old Cloud Functions code) was deleted; recoverable via git history
    if ever needed.
  - Superseded in this doc: the "Firebase Hosting", "Cloud Function (`backend/functions`)", and
    "Firebase Storage" entries throughout `docs/system-design.md`'s components table and
    deployment topology are updated in place with pointers back to this ADR rather than rewritten
    as if this were the original decision — see the "Resolved (2026-07-02)" note in that doc's
    Context diagram section.
