<div align="center">
  <table border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td><h1> GuidHer</h1></td>
      <td><img src="frontend/GuidHer_Assets/appicon.png" alt="GuidHer Logo" width="32" height="32" style="margin-left: 10px; margin-bottom: 10px; vertical-align: middle; border-radius: 6px;"></td>
    </tr>
  </table>
  <p>A community-sourced safer-routing guide for women commuting the PUP Sta. Mesa zone.</p>
  <p><i>"Because safety knowledge shouldn't live only in private group chats."</i></p>

  <!-- Developer Links / Badges -->
  <a href="https://github.com/Jimuelle07" target="_blank">
    <img src="https://img.shields.io/badge/Jimuelle07-%236f42c1?style=for-the-badge&logo=github&logoColor=fff&labelColor=%23ffc107" alt="Jimuelle07 GitHub Profile">
  </a>
  <a href="https://github.com/helenaherrero515" target="_blank">
    <img src="https://img.shields.io/badge/helenaherrero515-%236f42c1?style=for-the-badge&logo=github&logoColor=fff&labelColor=%23ffc107" alt="helenaherrero515 GitHub Profile">
  </a>
  <a href="https://github.com/HitsukiMok" target="_blank">
    <img src="https://img.shields.io/badge/HitsukiMok-%236f42c1?style=for-the-badge&logo=github&logoColor=fff&labelColor=%23ffc107" alt="HitsukiMok GitHub Profile">
  </a>
  <a href="https://github.com/Alexandre-Nevero" target="_blank">
    <img src="https://img.shields.io/badge/Alexandre--Nevero-%236f42c1?style=for-the-badge&logo=github&logoColor=fff&labelColor=%23ffc107" alt="Alexandre-Nevero GitHub Profile">
  </a>
</div>

---

> **Team member picking this up?** Start with **[docs/START-HERE.md](docs/START-HERE.md)** — repo
> navigation + what to do next, per person.

## About the Project

This project is developed as part of **SparkFest 2026**, a hackathon organized by **Google Developer Groups on Campus – Polytechnic University of the Philippines (GDG PUP)**.

GuidHer is a web-based community-sourced safer-routing platform designed for women students commuting through the PUP Sta. Mesa commute zone in Manila. It structures the route-safety crowdsourcing that women already do by hand — in group chats, in memory, in whispered warnings — into a visible, trustworthy, and actionable map they can consult before they leave.

The platform covers the LRT-2 Pureza/Legarda corridor, jeepney routes along Pureza and Magsaysay, and walking stretches including Teresa Street — especially for those traveling after evening classes.

---

## Problem Statement

A woman studying at PUP Sta. Mesa who finishes an evening class has no reliable way to know, before she sets out, which stretches of her commute are dangerous tonight — which jeepney route is running half-empty, which stretch of Teresa Street has no working lights, which station approach has been the site of recent snatching or groping.

The knowledge that would keep her safe exists, but it lives:
* Scattered in private group chats
* In a friend's memory
* Only in her own body after something has already happened

Official records capture an incident only on the rare occasion it is formally reported and prosecuted, so the danger stays invisible until it is too late. The entire burden of predicting and avoiding harm falls on her — she re-routes, pays extra to escape, travels in groups, or simply stays home. She carries this cost daily, alone, and it quietly shrinks where and when she is willing to go.

---

## Proposed Solution

GuidHer provides a preventive, community-powered zone safety map that shows women which route segments to avoid tonight and why — before they leave. Unlike women-only train cars (which cover only the rail leg) or panic-button apps (which assume a rescue that can't happen), GuidHer works across the first and last mile where exposure is highest.

* **What it does:** It aggregates real-time, environmental observations from fellow commuters to display street-level or route-level safety conditions.
* **How it solves the problem:** It visualizes safety risks before departure, allowing users to make data-backed adjustments to their evening routes.
* **What makes it different:** It centers strictly on *conditions only, never crime-profiling* (focusing on fixable/observable states like unlit streets or sparse crowds) and maintains a strict privacy-first architecture with no continuous GPS tracking.

---


## Target Users

* **Primary** — Women students aged 18-24 at PUP Main Campus (Sta. Mesa, Manila) who commute the zone daily, especially those traveling after evening classes
* **Secondary** — LGBTQ+ riders in the same commute zone experiencing harassment-driven avoidance

---

## Features

* **Zone Safety Map** — Crowdsourced segment flags showing current conditions on a MapLibre GL + OpenFreeMap rendered map (keyless, non-Google)
* **Client-Side Smart Routing** — Rust/WebAssembly A* engine running in a Web Worker — no external API, no key, no quota. Returns exactly 2 routes: "Recommended" (safest found, avoiding red/yellow segments) and "Alternative" (shortest path) when both exist
* **One-Tap Reporting** — File a condition report (poor lighting, no crowd, recent incident) with optional photo evidence (EXIF metadata stripped automatically; photo upload currently disabled on free tier)
* **Pre-Trip Route Check** — AI-assessed "Is my route okay tonight?" verdict grounded in real, current reports
* **AI Moderation & Summaries** — Gemini-powered report classification, spam rejection, duplicate corroboration, and structured risk summarization
* **Community Heatmap** — Visual layer showing where validated reports cluster (red/yellow severity markers)
* **Admin Control Panel** — Restricted dashboard (`/admin`) for report moderation, barangay PDF export, and analytics cache management
* **Barangay PDF Briefs** — Downloadable infrastructure summary reports with AI-generated mitigations for local government coordination
* **Analytics Dashboard** — Aggregated zone metrics and platform transparency counters

---

## Tech Stack

* **Frontend:** React 18.3, Vite 6, MapLibre GL 5.24, OpenFreeMap (keyless vector tiles), Rust/WebAssembly routing engine ([ADR-0003](docs/adr/ADR-0003-client-side-wasm-routing.md))
* **Backend:** Node.js 20 (Express 4.21)
* **Database:** Supabase (PostgreSQL) for reports/analytics + Cloud Firestore for Auth/users ([ADR-0004](docs/adr/ADR-0004-supabase-reports-analytics.md))
* **AI / ML:** Google Gemini API (gemini-2.5-flash)
* **Authentication:** Firebase Auth (anonymous by default, optional Google/email sign-in)
* **Deployment:** Vercel (frontend), Render (backend API)
* **Dev Tools:** Docker Compose (full local stack), Firebase Emulator Suite, pdfkit (server-side PDF generation)

---

## Installation & Setup

> **Fastest path — Docker:** with Docker Desktop installed, `docker compose up --build` from the repo root starts the whole stack (app on :5173, API on :8080, seeded Firebase emulators) with no Node/Java/firebase-tools setup. See [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) for the full Docker quickstart.

Test everything locally using the **Firebase Emulator Suite** (Auth + Firestore only; reports/analytics use Supabase in production but fall back to Firestore in local dev) alongside your local Express API process.

### Prerequisites
* **Node 20+** — Check version using `node -v`.
* **Java (JDK 21+)** — Required by the Firestore emulator. Check version with `java -version`. (Install via [Adoptium](https://adoptium.net) if absent).
* **Firebase CLI** — Install globally:
  ```bash
  npm install -g firebase-tools
  ```
* **Docker Desktop (optional but recommended)** — for the zero-setup local stack

### Quick Start (Docker)

```bash
git clone https://github.com/1-N-2-Dis/GuidHer.git
cd GuidHer
docker compose up --build
```

Navigate to:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:8080
- **Emulator UI:** http://localhost:4000

The seed service automatically populates demo data on every `docker compose up`, including:
- 8 zone segments
- 9 baseline heatmap reports (4 red, 5 yellow)
- 3 demo accounts: `admin@gmail.com`, `user1@gmail.com`, `user2@gmail.com` (password: `Passw0rd!`)

### Manual Setup (No Docker)

#### 1. Clone the Repository
```bash
git clone https://github.com/1-N-2-Dis/GuidHer.git
cd GuidHer
```

#### 2. Set Up Frontend
```bash
cd frontend
npm install
```

Your local `frontend/.env.local` contains pre-mapped settings (`VITE_USE_EMULATORS=true`), linking local execution ports automatically to your sandboxed mock environment.

#### 3. Set Up Backend
```bash
cd ../backend/server
npm install
```

Create `backend/server/.env` from `backend/server/.env.example`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"project_id":"demo-saferroute", ...}
GEMINI_API_KEY=your-gemini-key-here
CORS_ORIGIN=http://localhost:5173
# Optional for local dev with Supabase:
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Against the local emulator, placeholder Service Account configurations work fine as long as `FIRESTORE_EMULATOR_HOST` is set.

### Running Locally

#### Terminal A — Start Emulators (from repo root):
```bash
firebase emulators:start --project demo-saferroute --only "auth,firestore"
```

Monitor at http://localhost:4000

#### Terminal B — Start Frontend (from `/frontend`):
```bash
cd frontend
npm run dev
```

Navigate to http://localhost:5173

#### Terminal C — Start API Server (from `/backend/server`):
```bash
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; npm run dev
```

Ensure `VITE_API_BASE_URL=http://localhost:8080` is in your `frontend/.env.local`.

### Seeding Production Firestore

To initialize default segment nodes into live production:

```bash
cd backend
npm install
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
node scripts/seed-segments.mjs
node scripts/seed-heatmap-baseline.mjs
node scripts/seed-admin-role.mjs  # For admin account setup
node scripts/compile-analytics.mjs  # For analytics cache
```

### Troubleshooting
* **Java Compilation Flags Missing:** Confirm path matches your JDK setup, reopen terminal
* **Port Conflicts:** Kill conflicting processes or customize ports in `firebase.json`
* **Firestore Write Access Denied:** Check if frontend issued anonymous auth handshake
* **Network Execution Failure:** Ensure backend process is active, verify matching port variables

---

## How to Use

* **Check Your Route:** Before leaving campus, input your starting point and destination in the PUP Sta. Mesa zone. The client-side routing engine instantly computes up to 2 routes: "Recommended" (safest, avoiding red/yellow segments) and "Alternative" (shortest path).

* **Review Warnings:** Look out for red (hard-avoid) and yellow (soft-avoid) segments highlighted on the map, accompanied by Gemini AI risk summaries.

* **Contribute a Report:** Spot a broken street light or an unsafely isolated street? Use the One-Tap Reporting tool to flag it and keep fellow commuters safe.

* **Admin Functions** (admin accounts only): Access the Admin Control Panel at `/admin` to moderate reports, export barangay PDF briefs for 25 target zones, and force-recompile the analytics cache.

---

## Deployed Project

Live Demo: https://guidher.vercel.app/

GitHub Link: https://github.com/1-N-2-Dis/GuidHer/

---

## Video Pitch

[View Video Pitch Here](https://youtu.be/owj2gd-km5s)

---

## License

This project was built for **SparkFest 2026**.

---

<div align="center">
  <i>GuidHer — Because every woman deserves to know before she goes.</i>
</div>
