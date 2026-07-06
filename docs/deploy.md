# Deploy — quick reference

Copy-paste checklist for deploy day. No explanations here — see
[`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for the *why* behind each step, full env var
tables, and troubleshooting.

## 0. Prerequisites (once)

- [ ] Firebase project created (Firestore + Auth, Spark/free plan)
- [ ] Firebase service account key generated (Console → Project settings → Service accounts)
- [ ] Gemini API key (https://aistudio.google.com/apikey)
- [ ] Vercel account + Render account

Routing needs no key/signup at all — it's a client-side Rust/WASM engine over a committed graph
asset (ADR-0003), not an external service.

## 1. Point Firebase at your real project

```powershell
firebase use --add
```

## 2. Verify `submitReport` locally — do not skip

```powershell
firebase emulators:start --only auth,firestore
# separate terminal:
cd backend/server && npm run dev
```
File a test report end to end before touching production rules.

## 3. Deploy Firestore rules + indexes

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

## 4. Deploy the backend API to Render

1. Render dashboard → **New +** → **Web Service** → connect this repo.
2. **Root Directory:** `backend/server`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Environment tab — set:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (full JSON)
   - `GEMINI_API_KEY`
   - `CORS_ORIGIN=http://localhost:5173` (tighten in step 6)
6. Deploy. Confirm: `curl https://<your-render-url>/health` → `{"ok":true}`

## 5. Deploy the frontend to Vercel

1. Import repo into a new Vercel project (`vercel.json` already sets build/output).
2. Set env vars: `VITE_USE_EMULATORS=false`, `VITE_FIREBASE_*` (from Firebase Console),
   `VITE_API_BASE_URL=<your-render-url>`.
3. Deploy.

## 6. Lock down CORS

Back in Render → Environment → set `CORS_ORIGIN=<your-vercel-url>` → redeploy.

## 7. Post-deploy checklist

- [ ] Firestore rules deployed; direct client writes to `reports` denied
- [ ] `/health` on Render responds
- [ ] `GEMINI_API_KEY` / `FIREBASE_SERVICE_ACCOUNT_KEY` never appear in `frontend/dist`
- [ ] `CORS_ORIGIN` on Render = real Vercel URL (not permissive)
- [ ] Smoke test: sign in → submit report → appears in Firestore
- [ ] Smoke test: route check (`assessRoute`)
- [ ] No secrets committed to the repo

Full detail, rationale, and troubleshooting: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).
