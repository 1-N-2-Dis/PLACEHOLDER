# Deploying SaferRoute — v2

> **Guide version: v2 (2026-07-06).** What changed since v1 (2026-07-02):
>
> - **Routing is now fully client-side** — a Rust/WASM engine (ADR-0003) over a preprocessed
>   graph asset committed to the repo. Nothing routing-related deploys to Render or any external
>   API anymore; the deploy story for routing is "the assets are already in git."
> - **New demo-data step:** a heatmap baseline seed
>   (`backend/scripts/seed-heatmap-baseline.mjs`) derived from the 99-incident evidence dataset,
>   with a 24-hour freshness window that matters on demo day.
> - Corrected the Vercel setup instructions (Root Directory + what `vercel.json` actually sets)
>   and the Node-engine note.

This is the detailed, step-by-step companion for going from "local testing passes" to a real,
publicly reachable deployment. If you haven't run the app against the emulators yet, do that
first — see [`LOCAL_DEV.md`](./LOCAL_DEV.md). This guide assumes you have.

## What you're deploying

Three separate pieces:

| Piece | Platform | Why there |
|---|---|---|
| React + Vite single-page frontend (includes the routing engine + graph asset) | **Vercel** | Static/SPA hosting, fast previews per PR |
| `submitReport`, `summarizeSegment`, `assessRoute` (hold the Gemini key server-side) | **Render** | Plain Node/Express host — no Blaze plan required (see note below) |
| Firestore (report data) + Firebase Auth (anonymous/Google/email sign-in) | **Firebase** | Google-technology requirement for this hackathon; both stay on the free **Spark** plan |

Map rendering (MapLibre GL + OpenFreeMap) is an external, non-Google, keyless service. Routing
(F-005) runs entirely in the browser — a Rust/WASM engine (ADR-0003) doing A* in a Web Worker
(`frontend/src/workers/routeWorker.js`) over a preprocessed ~12.2 MB pedestrian graph shipped as
a static asset (`frontend/public/graph/pup-20km.bin`). No routing service, no key, no quota, and
no cold start — the Render free-tier spin-down below never affects routing. For the full
architecture and the reasoning behind each choice, see
[`06-system-design.md`](./06-system-design.md) — that document is the canonical owner of the
stack; this guide only covers *how to ship it*.

> **Why Render instead of Firebase Functions:** the three Gemini-backed routes used to be
> Firebase Cloud Functions (v2). Functions v2 requires the **Blaze** (pay-as-you-go) plan even at
> zero real usage, because it runs on Cloud Run/Cloud Build/Artifact Registry under the hood. They
> are now a plain Express app (`backend/server/`) that talks to Firestore via the Admin SDK and
> verifies each request's Firebase ID token itself — no Blaze plan needed anywhere in this stack.
>
> **Free-tier note:** Render's free Web Service tier spins the instance down after ~15 minutes of
> inactivity and takes some tens of seconds to wake back up on the next request. This affects
> **report submission and the AI route verdict only** — map rendering and route computation are
> client-side and stay instant. Fine for a demo; upgrade to a paid Render instance type if the
> cold start on report submission is unacceptable.

## Routing assets: committed to git, not built at deploy time

Two build artifacts ship inside the frontend and are **committed to the repo on purpose**
(Vercel has no Rust toolchain, so they can't be produced during the Vercel build):

| Artifact | Path | What it is |
|---|---|---|
| Routing graph | `frontend/public/graph/pup-20km.bin` (+ `pup-20km.meta.json`) | ~12.2 MB preprocessed 20 km pedestrian graph, fetched by the app at runtime as a same-origin static file |
| WASM router | `frontend/src/wasm/router/` (`router_bg.wasm` + JS glue) | ~148 KB wasm-pack output of `frontend/rust/router`, bundled by Vite (`vite-plugin-wasm` is already configured) |

**For a normal deploy you do nothing** — push, and Vercel serves what's committed. Rebuild them
only when the graph area or the Rust router code changes:

```powershell
# Regenerate the graph (repo root; intermediate output goes to scratch/, git-ignored):
npm run graph:fetch
npm run graph:build

# Rebuild the WASM router (requires the Rust toolchain + wasm-pack):
cd frontend
npm run build:wasm
```

Commit the regenerated outputs — if either is missing from a push, routing breaks in production
(see troubleshooting below).

## Prerequisites

| Requirement | Why | Where to get it |
|---|---|---|
| Node.js 20+ | Frontend build (Vite 6) + the Express API's runtime (`engines.node: "20"` in `backend/server/package.json`) | https://nodejs.org |
| A Vercel account | Hosts the frontend | https://vercel.com |
| A Render account | Hosts the Express API | https://render.com |
| Firebase CLI | Deploys Firestore rules/indexes only now | `npm install -g firebase-tools` |
| A Google account with a Firebase project | Firestore + Auth (Spark/free plan — no Blaze needed) | https://console.firebase.google.com — create a new project |
| A Firebase service account key | Lets the Render API authenticate to Firestore/Auth outside GCP, and lets you run the seed scripts against production | Firebase Console → Project settings → Service accounts → Generate new private key |
| Gemini API key | Powers `submitReport`'s moderation gate (P0) and the optional summary/route-check routes | https://aistudio.google.com/apikey (free tier) |
| *(Optional)* Rust toolchain + `wasm-pack` | **Only** to regenerate the routing engine/graph (see section above) — not needed for deploys | https://rustup.rs · `cargo install wasm-pack` |

You do **not** need an OpenRouteService (or any routing) key. Routing (F-005) is the client-side
Rust/WASM engine described above (ADR-0003) — nothing to sign up for, nothing to restrict.

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

> There is no `render.yaml` in this repo — the dashboard setup above is the whole thing. Routing
> never touches this service (ADR-0003), so the Render deploy carries only the three
> Gemini-backed routes.

### 5. Deploy the frontend to Vercel

1. Import the repo into a new Vercel project and set **Root Directory** to `frontend` in the
   project settings. The repo-root [`vercel.json`](../vercel.json) supplies the build command
   (`npm install && npm run build`), the output directory (`dist`, relative to that root), and
   the SPA rewrite (`/(.*)` → `/index.html`) — if Vercel doesn't pick those up under your root
   directory setting, mirror them in the dashboard's Build & Development settings.
2. Set the Vercel environment variables from the table above, including `VITE_API_BASE_URL`
   pointing at the Render URL from step 4.
3. Deploy (`vercel --prod` via the CLI, or push to the connected branch). The first deploy
   uploads the ~12.2 MB routing graph along with the bundle — that's expected (ADR-0003); no
   Rust toolchain runs on Vercel because the WASM router is committed prebuilt.
4. Once the frontend is live, go back to Render and set `CORS_ORIGIN` to the real Vercel URL
   (tightening it from the permissive default) and redeploy the API.

### 6. Seed the demo heatmap baseline (recommended before any demo)

The community heatmap (F-010) renders live from the Firestore `reports` collection. On a fresh
project that collection is empty, so the map shows no severity markers until someone reports. A
baseline seed derived from the 99-incident evidence dataset
(`backend/data/crime-reports.csv` + `backend/data/heatmap-baseline.json` — see
[`HEATMAP_INTEGRATION_GUIDE.md`](./HEATMAP_INTEGRATION_GUIDE.md)) writes 9 condition-only
baseline reports (4 red, 5 yellow) so the demo heatmap looks like the real, lived-in thing:

```powershell
cd backend
npm install
npm run seed          # segments first — the baseline script expects them (see its header)
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
node scripts/seed-heatmap-baseline.mjs
```

Notes that matter:

- The script writes via the **Admin SDK**, which is exactly why it works despite the
  deny-client-write rule from step 3 — that rule blocks *clients*, not server-side credentials.
- Doc IDs are deterministic, so re-running is **idempotent** (it refreshes timestamps, it doesn't
  duplicate).
- **Re-run it within 24 hours of the demo.** The heatmap only shows reports that are fresh
  "tonight" — baseline reports older than the freshness window silently drop off the map.

### 7. (Optional) Firestore segments, beyond the seed above

The app reads segment pins from a static frontend module (`frontend/src/data/seed-segments.js`),
not from Firestore — `npm run seed` in step 6 populates a Firestore `segments` collection for the
server-side paths that expect it, but note this is a known, already-flagged doc drift (see
`docs/index.md` §3 "Known consistency gaps") — segments-as-Firestore-collection isn't the current
canonical data model.

## Post-deploy verification checklist

Pulled from `docs/index.md` §2 (health check) and `AGENTS.md` ("Definition of done"):

- [ ] Firestore rules deployed and confirmed denying direct client writes to `reports`.
- [ ] Render API's `/health` endpoint responds; `GEMINI_API_KEY` and
      `FIREBASE_SERVICE_ACCOUNT_KEY` are Render env vars only — grep the built `frontend/dist`
      bundle to confirm neither ever appears client-side.
- [ ] `CORS_ORIGIN` on Render is set to the real Vercel URL (not left permissive) if this is a
      public, non-demo deploy.
- [ ] **Routing smoke test:** pick an origin/destination → exactly 2 route recommendations
      (F-005); the Network tab shows only same-origin fetches (`/graph/pup-20km.bin`, the
      `.wasm` chunk) — no request to any external routing API.
- [ ] **Heatmap smoke test:** severity markers render over the seeded segments; baseline seed
      re-run within 24 h of the demo (step 6 freshness window).
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
- **First report submission / route verdict after idle is slow** — the free Render Web Service
  tier spun down and is cold-starting (see the free-tier note above). Map and routing are
  unaffected (client-side). Retry after ~30–60 s, or upgrade the instance type.
- **Routes fail to load / routing errors in console** — check that
  `frontend/public/graph/pup-20km.bin` and `frontend/src/wasm/router/` were actually committed
  and included in the Vercel build (both are prebuilt artifacts, not generated at deploy time —
  see the "Routing assets" section and ADR-0003); check the Network tab for a failed fetch of
  `/graph/pup-20km.bin`.
- **Heatmap is empty** — most likely the baseline reports aged past the 24 h freshness window;
  re-run `backend/scripts/seed-heatmap-baseline.mjs` (step 6). If real reports are also missing,
  confirm the Firestore rules deploy left `reports` publicly readable.
- **Blank map after deploy** — this points to a Firebase config issue, not a Maps key (there isn't
  one to configure). Check the browser console for the actual failing request.
- **Roll back a bad Vercel deploy** — use the Vercel dashboard's Deployments tab → "Promote to
  Production" on a previous deployment, or `vercel rollback`.
- **Roll back a bad Render deploy** — Render keeps deploy history under the service's **Events**/
  **Deploys** tab; pick a previous successful deploy and use **Manual Deploy → Deploy an existing
  commit**, or redeploy from a known-good commit on the connected branch.

## References

- [`deploy.md`](./deploy.md) — condensed copy-paste checklist for deploy day, no explanations
- [`LOCAL_DEV.md`](./LOCAL_DEV.md) — local dev setup and testing, the prerequisite to this guide
- [`06-system-design.md`](./06-system-design.md) — architecture, deployment topology, and
  the rationale behind each technology choice (canonical owner of the stack)
- [`adr/ADR-0003-client-side-wasm-routing.md`](./adr/ADR-0003-client-side-wasm-routing.md) — the
  decision record behind the committed routing assets
- [`HEATMAP_INTEGRATION_GUIDE.md`](./HEATMAP_INTEGRATION_GUIDE.md) — where the heatmap baseline
  data comes from and how it maps to segments
- [`12-security-compliance.md`](./12-security-compliance.md) — full pre-demo security
  checklist and threat model
- [`index.md`](./index.md) — source-of-truth map and health check used above
- [`../AGENTS.md`](../AGENTS.md) — build/test conventions and the security must-dos this guide expands on
