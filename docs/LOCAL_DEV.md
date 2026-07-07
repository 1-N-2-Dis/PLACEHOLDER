# Running SaferRoute locally

Test everything on your machine before you deploy anything to the cloud. You will run the React app
with the **Firebase Emulator Suite** (local copies of Auth + Firestore) alongside the Express API
(`backend/server/`) running as a plain Node process — no real Firebase project, no billing, nothing
to clean up.

## How the pieces fit

| Part | Where it runs locally | Needs a real key? |
|------|----------------------|-------------------|
| React app (Vite) | `frontend/` on `http://localhost:5173` | no |
| Auth + Firestore | Firebase emulators on your machine | no |
| `submitReport`/`assessRoute`/`summarizeSegment` (F-004) | `backend/server/` running locally (plain `node`, port 8080) | yes — a free Gemini key (optional) |
| Google Map tiles | Google's servers (no emulator exists) | yes — a Maps key (optional) |

You can test most of the app — reporting, the live map flags, the route check, the security rules —
with **zero** real keys. The Maps key and Gemini key only unlock the visual map and the AI summary.

---

## Docker quickstart (zero local setup)

If you just want the whole stack running on a fresh machine, install **Docker Desktop** and run,
from the repo root:

```powershell
docker compose up --build
```

That starts everything below — no Node, Java, or firebase-tools install needed:

| URL | What |
|-----|------|
| http://localhost:5173 | The app (Vite dev server, hot reload on file save) |
| http://localhost:8080 | Express API (`/health` to check) |
| http://localhost:4000 | Firebase Emulator Suite UI (browse Auth + Firestore data) |
| localhost:9099 / localhost:8081 | Auth / Firestore emulators (the app is pre-wired to them) |

A one-shot `seed` container populates the emulators on every start: the 8 zone segments, the
9-report heatmap baseline (`backend/data/heatmap-baseline.json`), and 3 demo accounts —
`admin@gmail.com`, `user1@gmail.com`, `user2@gmail.com`, all with password `Passw0rd!`
(demo-only, see `backend/scripts/seed-auth-users.mjs`).

Notes:
- **Emulator data is in-memory.** Stopping the stack wipes it; the next `up` reseeds with fresh
  timestamps, so the baseline reports always count as "tonight" (24h freshness window).
- Frontend and backend containers bind-mount your working tree and `npm install` on start, so
  dependency changes need no image rebuild. Frontend hot reload works (polling); if a backend
  edit doesn't get picked up through the mount, `docker compose restart backend`.
- No real keys are involved: the backend talks to the emulators with no service account, and
  Gemini features are behind `AI_FEATURES_ENABLED` (off). To try them, set `GEMINI_API_KEY` in
  your shell before `docker compose up` and flip the flag.
- Prefer running things directly? The manual setup below is unchanged.

---

## One-time setup

1. **Node 20+** — check with `node -v`. You already have it if the app built.

2. **Java (JDK 21+)** — the Firestore emulator needs it. Check with `java -version`. If it is missing,
   install Temurin/Adoptium (https://adoptium.net) and reopen your terminal.

3. **Firebase CLI** — install once, globally:
   ```powershell
   npm install -g firebase-tools
   firebase --version
   ```

4. **Frontend dependencies** (already installed; rerun after a fresh clone):
   ```powershell
   cd frontend
   npm install
   ```

Your `frontend/.env.local` is already created with `VITE_USE_EMULATORS=true` and demo values, so the
app will talk to the emulators automatically.

5. **Rust + wasm-pack — only if you're changing the routing engine.** The compiled routing graph
   (`frontend/public/graph/pup-20km.bin`) and the wasm build output (`frontend/src/wasm/router/`)
   are both committed to the repo (Vercel has no Rust toolchain — see
   [ADR-0003](./adr/ADR-0003-client-side-wasm-routing.md)), so a fresh clone works with **zero**
   Rust setup. Only install this if you're editing `frontend/rust/router` or refreshing the graph
   data:
   ```powershell
   rustup target add wasm32-unknown-unknown
   cargo install wasm-pack
   ```
   Then:
   ```powershell
   cd frontend && npm run build:wasm   # rebuild the wasm package after a Rust change
   cd .. && npm run graph:fetch        # repo root — re-fetch OSM data via Overpass (slow, ~a few minutes)
   npm run graph:build                 # repo root — recompile the fetched data into pup-20km.bin
   ```
   `cargo test` inside `frontend/rust/router` runs the engine's fixture-based unit tests (no wasm
   toolchain needed for that — they run natively).

---

## Tier 1 — core features (no keys needed)

This covers F-001 map flags, F-002 reporting, F-003 route check, and the security rules. Use **two
terminals**.

**Terminal A — start the emulators** (from the repo root):
```powershell
firebase emulators:start --project demo-saferroute --only "auth,firestore"
```
> Quote `"auth,firestore"` — PowerShell otherwise splits it on the comma and the filter breaks.
Leave it running. It loads `backend/firestore.rules` automatically. Open the dashboard at
**http://localhost:4000** to watch data appear live.

**Terminal B — start the app** (from `frontend/`):
```powershell
cd frontend
npm run dev
```
Open **http://localhost:5173**. The browser console should say
`[SaferRoute] Using Firebase emulators`.

### What to try
- **F-002 report:** in the side panel, pick a segment, tap a condition (e.g. *Poor lighting*), add an
  optional note, and watch the report appear under **Firestore** in the emulator dashboard (port 4000).
- **F-001 map flags:** the segment you just flagged turns red (flagged tonight) once you have a Maps key
  (Tier 3). Without a key, the pin status still drives the route check below.
- **F-003 route check:** tick a few segments, press **Check route**. Segments flagged within the last
  24 hours read *flagged tonight*; the rest read *okay*.

> The map pins come from `frontend/src/data/seed-segments.js`, so you do **not** need to seed Firestore
> to test locally. (Seeding the `segments` collection matters only when you deploy — see the bottom.)

> The **Summarize reports** button (F-004), report submission's AI review, and the route check's AI
> assessment will all use their cut-safe fallback here, because `backend/server/` is not running in
> Tier 1. That is expected — turn it on in Tier 2. (Report submission itself still requires
> `backend/server/` to be running at all — it's the only path that writes a report — so Tier 1 alone
> won't let you file a report end to end.)

---

## Tier 2 — run the backend API (required for report submission; Gemini part is optional)

`backend/server/` is the only path that writes a report (`submitReport`) — Tier 1 alone lets you
browse the map, but filing a report needs this running. A Gemini key additionally unlocks the AI
summary/classification; without one, everything still works via each route's cut-safe fallback
(`AI_FEATURES_ENABLED = false` in `backend/server/index.js`).

1. **Install the server's dependencies:**
   ```powershell
   cd backend/server
   npm install
   ```

2. **Configure it** — copy `backend/server/.env.example` to `backend/server/.env` (kept out of git)
   and fill in:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY={"project_id":"demo-saferroute", ...}
   GEMINI_API_KEY=your-gemini-key-here
   CORS_ORIGIN=http://localhost:5173
   ```
   Against the local Firestore emulator, `FIREBASE_SERVICE_ACCOUNT_KEY` can be left empty —
   when `FIRESTORE_EMULATOR_HOST` is set (see step 3) the server skips the credential entirely
   and talks to the emulator with just a project id (see the init branch in
   `backend/server/index.js`).
   `GEMINI_API_KEY` is genuinely optional — a Gemini API key from
   https://aistudio.google.com/apikey unlocks the AI features.

3. **Start it**, pointed at the emulator:
   ```powershell
   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; npm run dev
   ```
   It listens on `http://localhost:8080` by default. Add `VITE_API_BASE_URL=http://localhost:8080`
   to `frontend/.env.local` so the app points at it.

4. In the app, file a report **with a note** on a segment, then press **Summarize reports**. With a
   real `GEMINI_API_KEY` and `AI_FEATURES_ENABLED = true`, the server reads that segment's notes,
   calls Gemini, and returns a deduplicated summary. Otherwise you get the cut-safe raw list.

---

## Tier 3 — see the real map (optional)

Google Maps has no emulator, so the map needs a real key.

1. Google Cloud Console → enable **Maps JavaScript API** → **Create credentials → API key**.
2. Restrict the key: **Application restrictions → Websites →** add `http://localhost:5173/*`.
3. Paste it into `frontend/.env.local`:
   ```
   VITE_MAPS_API_KEY=your-maps-key
   ```
4. Restart `npm run dev`. The zone map renders with red/green pins.

The key ships in the browser bundle by design; the referrer restriction is what protects it.

---

## Seeding Firestore segments (only needed for deploy)

The app reads pins from the local seed file, so skip this locally. When you deploy and want the
`segments` collection populated server-side:
```powershell
cd backend
npm install
# against the emulator:
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; npm run seed
```

---

## Troubleshooting

- **`java` not found / Firestore emulator won't start** — install JDK 21+ and reopen the terminal.
- **Port already in use** — another emulator is still running; close it, or change the port in
  `firebase.json`.
- **Blank map / "Map unavailable"** — no `VITE_MAPS_API_KEY` yet. Expected; the side panel still works.
- **Report write fails with permission-denied** — that is the security rules working. Confirm you are
  signed in (the app signs in anonymously on load) and you are not adding extra fields.
- **Report submission fails with a network/fetch error** — `backend/server/` isn't running, or
  `VITE_API_BASE_URL` in `frontend/.env.local` doesn't match where it's listening. See Tier 2.
- **Env change not applied** — Vite reads `.env.local` at startup. Stop and rerun `npm run dev`.

---

## When local testing passes, then deploy

Local dev uses emulators + a locally-run `backend/server/`; a real deploy splits across Vercel
(frontend), Render (`backend/server/`), and Firebase (Firestore + Auth only). See
[`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for the full step-by-step, including required env
vars for each platform and the pre-demo security checklist in `docs/12-security-compliance.md`.
