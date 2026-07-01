# Running SaferRoute locally

Test everything on your machine before you deploy anything to the cloud. You will run the React app
with the **Firebase Emulator Suite** — local copies of Auth, Firestore, and Functions. No real Firebase
project, no billing, nothing to clean up.

## How the pieces fit

| Part | Where it runs locally | Needs a real key? |
|------|----------------------|-------------------|
| React app (Vite) | `frontend/` on `http://localhost:5173` | no |
| Auth + Firestore | Firebase emulators on your machine | no |
| Gemini summary (F-004) | Functions emulator on your machine | yes — a free Gemini key (optional) |
| Google Map tiles | Google's servers (no emulator exists) | yes — a Maps key (optional) |

You can test most of the app — reporting, the live map flags, the route check, the security rules —
with **zero** real keys. The Maps key and Gemini key only unlock the visual map and the AI summary.

---

## One-time setup

1. **Node 20+** — check with `node -v`. You already have it if the app built.

2. **Java (JDK 11+)** — the Firestore emulator needs it. Check with `java -version`. If it is missing,
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

> The **Summarize reports** button (F-004) will fall back to a raw list here, because the Functions
> emulator is not running in Tier 1. That is expected — turn it on in Tier 2.

---

## Tier 2 — add the Gemini summary (F-004)

Optional. Needs a free Gemini API key from Google AI Studio (https://aistudio.google.com/apikey).

1. **Install the function's dependencies:**
   ```powershell
   cd backend/functions
   npm install
   ```

2. **Give the emulator your Gemini key** (kept out of git). Create
   `backend/functions/.secret.local` with one line:
   ```
   GEMINI_API_KEY=your-gemini-key-here
   ```

3. **Start all emulators** (from the repo root) — drop the `--only` filter:
   ```powershell
   firebase emulators:start --project demo-saferroute
   ```

4. In the app, file a report **with a note** on a segment, then press **Summarize reports**. The local
   function reads that segment's notes, calls Gemini, and returns a deduplicated summary. Delete the key
   or stop the function and the button falls back to the raw list — the cut-safe path.

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
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; npm run seed
```

---

## Troubleshooting

- **`java` not found / Firestore emulator won't start** — install JDK 11+ and reopen the terminal.
- **Port already in use** — another emulator is still running; close it, or change the port in
  `firebase.json`.
- **Blank map / "Map unavailable"** — no `VITE_MAPS_API_KEY` yet. Expected; the side panel still works.
- **Report write fails with permission-denied** — that is the security rules working. Confirm you are
  signed in (the app signs in anonymously on load) and you are not adding extra fields.
- **Env change not applied** — Vite reads `.env.local` at startup. Stop and rerun `npm run dev`.

---

## When local testing passes, then deploy

1. Create a real Firebase project; set it as `default` in `.firebaserc`.
2. Replace the demo values in `frontend/.env.local` with your real Firebase config, and set
   `VITE_USE_EMULATORS=false`.
3. `firebase deploy --only firestore:rules,firestore:indexes` — the pre-demo security gate.
4. (F-004) `firebase functions:secrets:set GEMINI_API_KEY`, then `firebase deploy --only functions`.
5. `cd frontend; npm run build; firebase deploy --only hosting`.

See `docs/12-security-compliance.md` for the full pre-demo security checklist.
