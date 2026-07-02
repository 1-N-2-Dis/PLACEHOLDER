<div align="center">
  <table border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td><h1>GuidHer</h1></td>
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

## Project Brief / Overview

GuidHer is a web-based community-sourced safer-routing platform designed for women students commuting through the PUP Sta. Mesa commute zone in Manila. It structures the route-safety crowdsourcing that women already do by hand — in group chats, in memory, in whispered warnings — into a visible, trustworthy, and actionable map they can consult before they leave.

The platform covers the LRT-2 Pureza/Legarda corridor, jeepney routes along Pureza and Magsaysay, and walking stretches including Teresa Street — especially for those traveling after evening classes.

---

## Problem Statement

A woman studying at PUP Sta. Mesa who finishes an evening class has no reliable way to know, before she sets out, which stretches of her commute are dangerous tonight — which jeepney route is running half-empty, which stretch of Teresa Street has no working lights, which station approach has been the site of recent snatching or groping.

The knowledge that would keep her safe exists, but it lives:

* Scattered in private group chats
* In a friend's memory
* Only in her own body after something has already happened

Official records capture an incident only on the rare occasion it is formally reported and prosecuted, so the danger stays invisible until it is too late. The entire burden of predicting and avoiding harm falls on her — she re-routes, pays extra to escape, travels in groups, or simply stays home.

She carries this cost daily, alone, and it quietly shrinks where and when she is willing to go.

---

## Proposed Solution

GuidHer provides a preventive, community-powered zone safety map that shows women which route segments to avoid tonight and why — before they leave. Unlike women-only train cars (which cover only the rail leg) or panic-button apps (which assume a rescue that can't happen), GuidHer works across the first and last mile where exposure is highest.

### Key Features

| Feature | Description |
| :--- | :--- |
| **Zone Safety Map** | Crowdsourced segment flags showing current conditions on a MapLibre GL + OpenFreeMap rendered map |
| **One-Tap Reporting** | File a condition report (poor lighting, no crowd, recent incident) with optional photo evidence |
| **Pre-Trip Route Check** | AI-assessed "Is my route okay tonight?" verdict grounded in real, current reports |
| **Smart Route Recommendations** | Severity-tiered multi-route alternatives with red hard-avoid and yellow soft-avoid logic |
| **AI Moderation** | Gemini-powered report classification, spam rejection, and duplicate corroboration |
| **Structured Risk Summary** | Deduplicated, AI-generated risk picture from community reports |
| **Community Heatmap** | Visual layer showing where validated reports cluster |

### Design Principles

* **Conditions only, never crime-profiling** — reports describe fixable/observable states (lighting, crowd density), never label neighborhoods or people
* **No SOS or rescue promise** — the app is preventive and informational, not a dispatch system
* **Privacy-first** — no GPS trails, no continuous location tracking; EXIF metadata stripped from photos

---

## Google Technology Used

| Technology | Purpose |
| :--- | :--- |
| **Firebase Authentication** | User identity and session management; supports anonymous sign-in by default with optional Google sign-in upgrade via account linking |

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React + Vite |
| **Backend** | Node.js |
| **Database** | Cloud Firestore |
| **Map Rendering** | MapLibre GL + OpenFreeMap |
| **Routing Engine** | OpenRouteService |
| **AI / ML** | Gemini API |
| **Storage** | Firebase Storage |
| **Authentication** | Firebase Auth |

---

## Deployment

| Component | Platform |
| :--- | :--- |
| **Backend** | Render |
| **Frontend** | Vercel |

---

## Demo

[View Live Demo](#)

---

## Target Users

* **Primary** — Women students aged 18-24 at PUP Main Campus (Sta. Mesa, Manila) who commute the zone daily, especially those traveling after evening classes
* **Secondary** — LGBTQ+ riders in the same commute zone experiencing harassment-driven avoidance

---

## Success Metrics

* **Activation** — Percentage of new users who check a route and submit at least one report in week one
* **Retention** — Percentage who return to check a route on three or more distinct commute days per week
* **Contribution Density** — Fresh segment reports per zone per week
* **Behavioral** — Self-reported route changes made because of the guide

---

## License

This project was built for **SparkFest 2026**.

---

<div align="center">
  <i>GuidHer — Because every woman deserves to know before she goes.</i>
</div>
