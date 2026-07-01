# Deploying SaferRoute

This is the detailed, step-by-step companion for going from "local testing passes" to a real,
publicly reachable Firebase deployment. If you haven't run the app against the emulators yet, do
that first — see [`LOCAL_DEV.md`](./LOCAL_DEV.md). This guide assumes you have.

## What you're deploying

A React + Vite single-page app on Firebase Hosting, backed by Cloud Firestore, Firebase Auth,
Firebase Storage, and three Cloud Functions (`submitReport`, `summarizeSegment`, `assessRoute`)
that hold the Gemini API key server-side. Map rendering (MapLibre GL + OpenFreeMap) and routing
(OpenRouteService) are external, non-Google services. For the full architecture and the reasoning
behind each choice, see [`docs/06-system-design.md`](./docs/06-system-design.md) — that document is
the canonical owner of the stack; this guide only covers *how to ship it*.

## Prerequisites

| Requirement | Why | Where to get it |
|---|---|---|
| Node.js 20+ | Frontend build + Cloud Functions runtime (`engines.node: "20"` in `backend/functions/package.json`) | https://nodejs.org |
| Firebase CLI | Deploys hosting, rules, functions | `npm install -g firebase-tools` |
| A Google account with a Firebase project | Hosts everything | https://console.firebase.google.com — create a new project |
| **Firebase Blaze (pay-as-you-go) plan** | The Cloud Functions here are v2 (`firebase-functions ^6.1.1`) and use `defineSecret` for `GEMINI_API_KEY`. Both Functions v2 and Secret Manager **require Blaze**, even at zero real usage. Deploys will fail on the free Spark plan. | Firebase Console → upgrade plan (has a no-cost usage tier; you're billed only past free-tier limits) |
| Gemini API key | Powers `submitReport`'s moderation gate (P0) and the optional summary/route-check functions | https://aistudio.google.com/apikey (free tier) |
| OpenRouteService (ORS) API key | Powers point-to-point routing (F-005) | https://openrouteservice.org/dev/#/signup (free tier) |

You do **not** need a Google Maps key. Map rendering is MapLibre GL JS + OpenFreeMap vector tiles,
which are free and keyless by design (see system design's "Resolved 2026-07-01" note). If you see
`VITE_MAPS_API_KEY` referenced in `frontend/.env.example` or `LOCAL_DEV.md`'s Tier 3 section, that's
a leftover from before the switch to MapLibre/OpenFreeMap — it's unused by the current code and can
be left blank.

## Required configuration

All frontend values live in `frontend/.env.local` (git-ignored — copy from `.env.example` as a
starting point, but see the Maps-key note above). All values marked "Function secret" are set via
the Firebase CLI, never committed, and never shipped to the browser.

| Variable | Required? | Where | Notes |
|---|---|---|---|
| `VITE_USE_EMULATORS` | Yes | `frontend/.env.local` | Set to `false` for a real deploy |
| `VITE_FIREBASE_API_KEY` | Yes | `frontend/.env.local` | From Firebase Console → Project settings → your web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | `frontend/.env.local` | Same source |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `frontend/.env.local` | Same source |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | `frontend/.env.local` | Same source |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | `frontend/.env.local` | Same source |
| `VITE_FIREBASE_APP_ID` | Yes | `frontend/.env.local` | Same source |
| `VITE_ORS_API_KEY` | Yes | `frontend/.env.local` | Used by `frontend/src/lib/routing.js`. **Ships in the client bundle by design** — see the security note below. |
| `VITE_MAPS_API_KEY` | No — unused | — | Legacy var from the pre-MapLibre design; safe to leave blank |
| `GEMINI_API_KEY` | Yes | Function secret (`firebase functions:secrets:set`) | Never put this in any `.env` file or client code |

The Firebase `VITE_FIREBASE_*` values are client identifiers, not secrets — Firestore/Storage
Security Rules are the real access gate, not key secrecy. `GEMINI_API_KEY` and `VITE_ORS_API_KEY`
are different: Gemini must never reach the client; ORS is meant to be client-side but should be
origin-restricted (see the security note in step 5).

## Step-by-step deploy

### 1. Point the project at your real Firebase project

`.firebaserc` currently defaults to `demo-saferroute`, which only works against the local emulator.
Update it to your real project id:

```json
{
  "projects": {
    "default": "your-real-project-id"
  }
}
```

Or, without editing the file: `firebase use --add` and select your project.

### 2. Set production frontend environment variables

Edit `frontend/.env.local` with your real Firebase config (from Firebase Console → Project settings
→ your web app → SDK config) and your ORS key:

```
VITE_USE_EMULATORS=false
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ORS_API_KEY=...
```

### 3. Verify `submitReport` against the emulator before touching production rules

**Do not skip this.** `backend/firestore.rules` denies all client writes to `reports` — the *only*
way a report gets written is through the `submitReport` Cloud Function. If you deploy that
deny-write rule before confirming `submitReport` actually works, report submission breaks in
production with no fallback. Run the Tier 2 flow from `LOCAL_DEV.md` (full emulator suite,
`GEMINI_API_KEY` in `backend/functions/.secret.local`) and confirm a report round-trips end to end
before proceeding.

### 4. Deploy Firestore and Storage security rules + indexes

```powershell
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

This is the access-control gate: public reads, denied client writes to `reports`, auth-gated and
path-scoped Storage writes (`reports/{uid}/...`, <5MB, JPEG/PNG only).

### 5. Set the Gemini secret and deploy Cloud Functions

```powershell
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

This deploys `submitReport`, `summarizeSegment`, and `assessRoute` to `asia-southeast1`. All three
read `GEMINI_API_KEY` server-side only — it never ships to the browser.

> **Open security item, carried from `docs/06-system-design.md`:** the ORS key ships in the client
> bundle and is not yet origin-restricted. Before a real (non-demo) launch, restrict it by
> HTTP referrer in the ORS dashboard and set a request-volume cap. Treat this as a deploy-day
> must-do, not an optional hardening step, if the deployment is public.

### 6. Build and deploy the frontend

```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

`npm run build` runs `vite build` into `frontend/dist`, which `firebase.json` is already configured
to serve (with an SPA rewrite of all routes to `/index.html`).

### 7. (Optional) Seed Firestore segments

The app currently reads segment pins from a static frontend module
(`frontend/src/data/seed-segments.js`), not from Firestore — you do not need this step for the app
to work. A `backend/scripts/seed-segments.mjs` script exists to populate a `segments` collection in
Firestore for cases that need it server-side, but note this is a known, already-flagged doc drift
(see `docs/index.md` §3 "Known consistency gaps") — segments-as-Firestore-collection isn't the
current canonical data model. If you do need it:

```powershell
cd backend
npm install
npm run seed
```

## Post-deploy verification checklist

Pulled from `docs/index.md` §2 (health check) and `AGENTS.md` ("Definition of done"):

- [ ] Firestore rules deployed and confirmed denying direct client writes to `reports`.
- [ ] Storage rules deployed and confirmed auth-gated + path-scoped.
- [ ] `GEMINI_API_KEY` is a Function secret only — grep the built `frontend/dist` bundle to confirm
      it never appears client-side.
- [ ] ORS key is origin-restricted in the ORS dashboard (if this is a public, non-demo deploy).
- [ ] Smoke-test the full report flow: sign in (anonymous is fine) → submit a report with a
      condition flag → confirm it appears in Firestore via `submitReport`, not a direct write.
- [ ] Smoke-test the route check (`assessRoute`) and, if enabled, the summary (`summarizeSegment`).
- [ ] No `.env` files, service account keys, or secrets are committed to the repo.

## Rollback / troubleshooting

- **Deploy fails with a billing/permission error on Functions** — you're likely still on the Spark
  plan. Upgrade to Blaze (see Prerequisites) and retry.
- **Reports stop writing right after a rules deploy** — you deployed the deny-write rule without
  verifying `submitReport` first (step 3). Check `firebase functions:log` for the actual error from
  `submitReport`, fix it, redeploy functions, then redeploy rules again.
- **`submitReport` errors mentioning a missing secret** — `GEMINI_API_KEY` wasn't set for this
  project/environment. Re-run `firebase functions:secrets:set GEMINI_API_KEY` and redeploy
  functions.
- **Roll back a bad Hosting deploy** — Firebase Hosting keeps deploy history; use the Firebase
  Console → Hosting → release history to roll back to a previous release, or re-run
  `firebase deploy --only hosting` after fixing the build.
- **Roll back a bad Functions deploy** — redeploy the previous working code
  (`firebase deploy --only functions` from a known-good commit); Cloud Functions doesn't have a
  one-command rollback, so keep the last working commit deployable.
- **Blank map after deploy** — this points to an ORS or Firebase config issue, not a Maps key (there
  isn't one to configure). Check the browser console for the actual failing request.

## References

- [`LOCAL_DEV.md`](./LOCAL_DEV.md) — local emulator setup and testing, the prerequisite to this guide
- [`docs/06-system-design.md`](./docs/06-system-design.md) — architecture, deployment topology, and
  the rationale behind each technology choice (canonical owner of the stack)
- [`docs/12-security-compliance.md`](./docs/12-security-compliance.md) — full pre-demo security
  checklist and threat model
- [`docs/index.md`](./docs/index.md) — source-of-truth map and health check used above
- [`AGENTS.md`](./AGENTS.md) — build/test conventions and the security must-dos this guide expands on
