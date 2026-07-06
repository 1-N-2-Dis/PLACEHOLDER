# Deploying SaferRoute

This is the detailed, step-by-step companion for going from "local testing passes" to a real,
publicly reachable deployment. If you haven't run the app against the emulators yet, do that
first — see [`LOCAL_DEV.md`](./LOCAL_DEV.md). This guide assumes you have.

## What you're deploying

Three separate pieces:

| Piece | Platform | Why there |
|---|---|---|
| React + Vite single-page frontend | **Vercel** | Static/SPA hosting, fast previews per PR |
| `submitReport`, `summarizeSegment`, `assessRoute` (hold the Gemini key server-side) | **Render** | Plain Node/Express host — no Blaze plan required (see note below) |
| Firestore (report data) + Firebase Auth (anonymous/Google/email sign-in) | **Firebase** | Google-technology requirement for this hackathon; both stay on the free **Spark** plan |

Map rendering (MapLibre GL + OpenFreeMap) is an external, non-Google, keyless service. Routing
(F-005) runs entirely client-side — a Rust/WASM engine over a preprocessed graph asset committed
to the repo (ADR-0003) — no external routing service or key at all. For the full architecture and
the reasoning behind each choice, see [`06-system-design.md`](./06-system-design.md) — that
document is the canonical owner of the stack; this guide only covers *how to ship it*.

> **Why Render instead of Firebase Functions:** the three Gemini-backed routes used to be
> Firebase Cloud Functions (v2). Functions v2 requires the **Blaze** (pay-as-you-go) plan even at
> zero real usage, because it runs on Cloud Run/Cloud Build/Artifact Registry under the hood. They
> are now a plain Express app (`backend/server/`) that talks to Firestore via the Admin SDK and
> verifies each request's Firebase ID token itself — no Blaze plan needed anywhere in this stack.
>
> **Free-tier note:** Render's free Web Service tier spins the instance down after ~15 minutes of
> inactivity and takes some tens of seconds to wake back up on the next request — the first report
> submission or route check after idle time will feel slow. Fine for a demo; upgrade to a paid
> Render instance type if that cold-start is unacceptable.

## Prerequisites

| Requirement | Why | Where to get it |
|---|---|---|
| Node.js 20+ | Frontend build + the Express API's runtime (`engines.node: "20"` in both `frontend/package.json` and `backend/server/package.json`) | https://nodejs.org |
| A Vercel account | Hosts the frontend | https://vercel.com |
| A Render account | Hosts the Express API | https://render.com |
| Firebase CLI | Deploys Firestore rules/indexes only now | `npm install -g firebase-tools` |
| A Google account with a Firebase project | Firestore + Auth (Spark/free plan — no Blaze needed) | https://console.firebase.google.com — create a new project |
| A Firebase service account key | Lets the Render API authenticate to Firestore/Auth outside GCP | Firebase Console → Project settings → Service accounts → Generate new private key |
| Gemini API key | Powers `submitReport`'s moderation gate (P0) and the optional summary/route-check routes | https://aistudio.google.com/apikey (free tier) |

You do **not** need an OpenRouteService (or any routing) key either. Routing (F-005) is a
client-side Rust/WASM engine over a preprocessed graph asset committed to the repo
(`frontend/public/graph/pup-20km.bin`, ADR-0003) — nothing to sign up for, nothing to restrict.

You do **not** need a Google Maps key. Map rendering is MapLibre GL JS + OpenFreeMap vector tiles,
which are free and keyless by design (see system design's "Resolved 2026-07-01" note). If you see
`VITE_MAPS_API_KEY` referenced in `frontend/.env.example` or `LOCAL_DEV.md`'s Tier 3 section, that's
a leftover from before the switch to MapLibre/OpenFreeMap — it's unused by the current code and can
be left blank.

Firebase Storage (F-007, photo evidence) is **disabled** — new Firebase projects can't provision a
Storage bucket on the free Spark plan either. See `PHOTO_UPLOAD_ENABLED` in
`frontend/src/lib/storage.js`; flip it back on (and provision Storage under Blaze) if you upgrade.

## Required configuration

### Vercel (frontend) environment variables

Set these in the Vercel project's Settings → Environment Variables (or in `frontend/.env.local`
for local testing against real services):

| Variable | Required? | Notes |
|---|---|---|
| `VITE_USE_EMULATORS` | Yes | `false` for a real deploy |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Console → Project settings → your web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Same source |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Same source |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Same source (client config value; Storage itself is disabled — see above) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Same source |
| `VITE_FIREBASE_APP_ID` | Yes | Same source |
| `VITE_API_BASE_URL` | Yes | Your Render deployment URL (e.g. `https://saferroute-api.onrender.com`) |
| `VITE_MAPS_API_KEY` | No — unused | Legacy var from the pre-MapLibre design; safe to leave blank |

The Firebase `VITE_FIREBASE_*` values are client identifiers, not secrets — Firestore Security
Rules are the real access gate, not key secrecy. There is no routing key to configure at all
(ADR-0003) — the routing graph asset ships as a committed static file, not a live API.

### Render (backend API) environment variables

Set these in the Render service's Environment tab (or in `backend/server/.env`, git-ignored, for
local testing):

| Variable | Required? | Notes |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Yes | Full JSON contents of the service account key (see Prerequisites). **Never commit this.** |
| `GEMINI_API_KEY` | Yes | Never put this in any frontend `.env` or client code |
| `CORS_ORIGIN` | Yes for a public deploy | Comma-separated allowed origins — your Vercel URL(s) + `http://localhost:5173` for local dev. Left unset, the API reflects any origin. |
| `PORT` | No | Render sets this automatically |

## Step-by-step deploy

### 1. Point the Firebase project at your real project

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

### 2. Verify `submitReport` against the emulator before touching production rules

**Do not skip this.** `backend/firestore.rules` denies all client writes to `reports` — the *only*
way a report gets written is through the `submitReport` route. If you deploy that deny-write rule
before confirming `submitReport` actually works, report submission breaks in production with no
fallback. Run the Tier 2 flow from `LOCAL_DEV.md` (Firestore/Auth emulators + `backend/server`
running locally, `GEMINI_API_KEY` in `backend/server/.env`) and confirm a report round-trips end
to end before proceeding.

### 3. Deploy Firestore security rules + indexes

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

This is the access-control gate: public reads, denied client writes to `reports`.

### 4. Deploy the backend API to Render

1. Render dashboard → **New +** → **Web Service** → connect this GitHub repo.
2. Set **Root Directory** to `backend/server` (Render builds/runs from that subfolder — the rest
   of the repo is ignored for this service).
3. Runtime **Node**; **Build Command** `npm install`; **Start Command** `npm start` (runs `node
   index.js` per `backend/server/package.json`).
4. Set the environment variables from the table above (`FIREBASE_SERVICE_ACCOUNT_KEY`,
   `GEMINI_API_KEY`, `CORS_ORIGIN`) in the service's **Environment** tab. Leave `PORT` unset —
   Render injects it automatically and the app already reads `process.env.PORT`.
5. Create the service. Render builds and deploys on every push to the connected branch by default.
6. Once deployed, note the public URL (e.g. `https://saferroute-api.onrender.com`) and confirm it
   responds: `curl https://your-render-url/health` → `{"ok":true}`.

> A `render.yaml` (Blueprint) at the repo root is optional — it lets `render blueprint` create the
> service from a config file instead of clicking through the dashboard, but isn't required for a
> single-service deploy like this one.

> **Resolved (ADR-0003):** the prior open item here — an unrestricted OpenRouteService key
> shipping in the client bundle — no longer applies. Routing is a client-side Rust/WASM engine
> with no external key at all.

### 5. Deploy the frontend to Vercel

1. Import the repo into a new Vercel project (`vercel.json` at the repo root already sets the
   build command and output directory to `frontend/`).
2. Set the Vercel environment variables from the table above, including `VITE_API_BASE_URL`
   pointing at the Render URL from step 4.
3. Deploy (`vercel --prod` via the CLI, or push to the connected branch).
4. Once the frontend is live, go back to Render and set `CORS_ORIGIN` to the real Vercel URL
   (tightening it from the permissive default) and redeploy the API.

### 6. (Optional) Seed Firestore segments

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
- [ ] Render API's `/health` endpoint responds; `GEMINI_API_KEY` and
      `FIREBASE_SERVICE_ACCOUNT_KEY` are Render env vars only — grep the built `frontend/dist`
      bundle to confirm neither ever appears client-side.
- [ ] `CORS_ORIGIN` on Render is set to the real Vercel URL (not left permissive) if this is a
      public, non-demo deploy.
- [x] ~~ORS key is origin-restricted in the ORS dashboard~~ — **N/A (ADR-0003):** routing has no
      client-side key anymore.
- [ ] Smoke-test the full report flow: sign in (anonymous is fine) → submit a report with a
      condition flag → confirm it appears in Firestore via `submitReport`, not a direct write.
- [ ] Smoke-test the route check (`assessRoute`) and, if enabled, the summary (`summarizeSegment`).
- [ ] No `.env` files, service account keys, or secrets are committed to the repo.

## Rollback / troubleshooting

- **Reports stop writing right after a rules deploy** — you deployed the deny-write rule without
  verifying `submitReport` first (step 2). Check the Render service's Logs tab for the actual error
  from `submitReport`, fix it, redeploy the API, then redeploy rules again.
- **`submitReport` errors mentioning a missing/invalid credential** — `FIREBASE_SERVICE_ACCOUNT_KEY`
  wasn't set, or isn't valid JSON, on Render. Re-paste the full service account key JSON and
  redeploy.
- **`submitReport` errors mentioning Gemini** — `GEMINI_API_KEY` wasn't set for this environment,
  or `AI_FEATURES_ENABLED` in `backend/server/index.js` is intentionally `false` (demo mode) —
  see the comment there.
- **CORS errors in the browser console** — `CORS_ORIGIN` on Render doesn't include the frontend's
  actual origin. Update it to a comma-separated list including the Vercel URL, then redeploy.
- **First request after idle is slow / times out** — the free Render Web Service tier spun down
  after inactivity and is cold-starting (see the free-tier note above). Retry after ~30-60s, or
  upgrade the instance type if this isn't acceptable for the demo.
- **Roll back a bad Vercel deploy** — use the Vercel dashboard's Deployments tab → "Promote to
  Production" on a previous deployment, or `vercel rollback`.
- **Roll back a bad Render deploy** — Render keeps deploy history under the service's **Events**/
  **Deploys** tab; pick a previous successful deploy and use **Manual Deploy → Deploy an existing
  commit**, or redeploy from a known-good commit on the connected branch.
- **Blank map after deploy** — this points to a Firebase config issue, not a Maps key (there isn't
  one to configure). Check the browser console for the actual failing request.
- **Routes fail to load** — check that `frontend/public/graph/pup-20km.bin` and
  `frontend/src/wasm/router/` were actually committed and included in the Vercel build (both are
  build artifacts, not generated at deploy time — see ADR-0003); check the Network tab for a
  failed fetch of `/graph/pup-20km.bin`.

## References

- [`deploy.md`](./deploy.md) — condensed copy-paste checklist for deploy day, no explanations
- [`LOCAL_DEV.md`](./LOCAL_DEV.md) — local dev setup and testing, the prerequisite to this guide
- [`06-system-design.md`](./06-system-design.md) — architecture, deployment topology, and
  the rationale behind each technology choice (canonical owner of the stack)
- [`12-security-compliance.md`](./12-security-compliance.md) — full pre-demo security
  checklist and threat model
- [`index.md`](./index.md) — source-of-truth map and health check used above
- [`../AGENTS.md`](../AGENTS.md) — build/test conventions and the security must-dos this guide expands on
