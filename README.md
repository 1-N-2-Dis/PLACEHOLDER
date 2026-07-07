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

* **Zone Safety Map** — Crowdsourced segment flags showing current conditions on a MapLibre GL + OpenFreeMap rendered map
* **One-Tap Reporting** — File a condition report (poor lighting, no crowd, recent incident) with optional photo evidence (EXIF metadata stripped automatically)
* **Pre-Trip Route Check** — AI-assessed "Is my route okay tonight?" verdict grounded in real, current reports
* **Smart Route Recommendations** — Severity-tiered multi-route alternatives with red hard-avoid and yellow soft-avoid logic
* **AI Moderation & Summaries** — Gemini-powered report classification, spam rejection, duplicate corroboration, and structured risk summarization
* **Community Heatmap** — Visual layer showing where validated reports cluster

---

## Tech Stack

* **Frontend:** React, Vite, MapLibre GL, OpenFreeMap, Rust/WebAssembly (client-side routing engine — [ADR-0003](docs/adr/ADR-0003-client-side-wasm-routing.md))
* **Backend:** Node.js (Express)
* **Database:** Cloud Firestore (Firebase Storage code present but **disabled** — [ADR-0002](docs/adr/ADR-0002-hosting-compute-split.md))
* **AI / ML:** Gemini API
* **Tools & Authentication:** Firebase Auth, Git/GitHub, Render (Backend Hosting), Vercel (Frontend Hosting)

---

## Installation & Setup

> **Fastest path — Docker:** with Docker Desktop installed, `docker compose up --build` from the repo root starts the whole stack (app on :5173, API on :8080, seeded Firebase emulators) with no Node/Java/firebase-tools setup. See the "Docker quickstart" section in [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md).

Test everything locally using the **Firebase Emulator Suite** alongside your local Express API process. Detailed environment specs can be found in the `LOCAL_DEV.md` configuration file.

### Prerequisites
* **Node 20+** — Check version using `node -v`.
* **Java (JDK 21+)** — Required natively by the Firestore emulator engine. Check version with `java -version`. (Install via [Adoptium](https://adoptium.net) if absent).
* **Firebase CLI** — Install globally:
  ```bash
  npm install -g firebase-tools
  ```
  
#### 1. Clone the Repository
```Bash
git clone [https://github.com/1-N-2-Dis/GuidHer.git](https://github.com/1-N-2-Dis/GuidHer.git)
cd GuidHer
```

#### 2. Set Up Frontend App Environment
```Bash
cd frontend
npm install
```

Note: Your local frontend/.env.local contains pre-mapped settings (VITE_USE_EMULATORS=true), linking local execution ports automatically to your sandboxed mock environment.


#### 3. Set Up Backend Workspace
```Bash
cd ../backend/server
npm install
```

Generate an environment container file by duplicating backend/server/.env.example into backend/server/.env and append your variables:

```Code snippet
FIREBASE_SERVICE_ACCOUNT_KEY={"project_id":"demo-saferroute", ...}
GEMINI_API_KEY=your-gemini-key-here
CORS_ORIGIN=http://localhost:5173
```
> Placeholder Service Account configurations work fine against the local emulator environment as long as your terminal specifies an operational FIRESTORE_EMULATOR_HOST target address.

### Running & Testing Tiers


#### Tier 1 — Core Offline Features (No API Keys Needed)

Tests routing parameters, localized security rule configurations, and reporting panels.

##### Terminal A — Fire Up Emulators (Run from repo root level):

```Bash
firebase emulators:start --project demo-saferroute --only "auth,firestore"
```
(Monitor database reads/writes via the graphic terminal console dashboard at http://localhost:4000).

##### Terminal B — Build the Frontend Interface (Run from /frontend workspace):

```Bash
cd frontend
npm run dev
Navigate to http://localhost:5173. Your browser developer inspector console will output [SaferRoute] Using Firebase emulators.
```

#### Tier 2 — Operational API Server (Required for Full Report Submission)
Required for actual database commit logic and automated Gemini processing.

##### Terminal C — Active API Listening (Run from backend/server):

```Bash
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; npm run dev
```

Ensure VITE_API_BASE_URL=http://localhost:8080 is appended inside your frontend .env.local to securely bridge client actions.

> **Note on maps:** GuidHer renders maps with **MapLibre GL + OpenFreeMap**, which are keyless and
> require **no Google Maps API key** (see [ADR-0001](docs/adr/ADR-0001-maps-stack.md)). There is no
> `VITE_MAPS_API_KEY` and no Google Maps setup step — the Google-technology requirement is met by
> Firebase + Gemini, not the map layer.

##### Seeding Standalone Production Datastores

Local testing operates on a local file array fallback `(frontend/src/data/seed-segments.js)`. To deploy or initialize the default segment nodes into live production instances:

```Bash
cd backend
npm install
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"; npm run seed
```

##### Troubleshooting Sandbox Configurations
* Java Compilation Flags Missing: Confirm path indicators match your updated JDK setup, then reopen terminal tabs.

* Port Lockups/Errors: Kill conflicting execution threads or customize assignments inside firebase.json.

* Firestore Write Access Denied: Check if your front end successfully issued an anonymous authentication handshake.

* Network Execution Failure: Ensure your backend directory process is active and verify matching port variables across files.

---

## How to Use:
* Check Your Route: Before leaving campus, input your starting point and destination in the PUP Sta. Mesa zone.

* Review Warnings: Look out for red (hard-avoid) and yellow (soft-avoid) segments highlighted on the map accompanied by the Gemini AI risk summary.

* Contribute a Report: Spot a broken street light or an unsafely isolated street? Use the One-Tap Reporting tool to flag it and keep fellow commuters safe.

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
