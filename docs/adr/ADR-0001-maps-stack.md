# ADR — Architecture Decision Record

> Append-only log. One entry per significant decision. Never edit a past entry — supersede it
> with a new one.

---

## ADR-0001 — Non-Google map/routing stack (MapLibre + OpenFreeMap + ORS) over Google Maps Platform

- **Date:** 2026-07-01
- **Status:** Accepted
- **Context:** The MVP needs map rendering and walking-route directions for the PUP Sta. Mesa
  zone (F-001, F-003). The original system-design draft assumed Google Maps Platform. Google
  Maps needs a billing account and a restricted API key, which is setup + cost overhead for a
  2-day hackathon build. The SparkFest "≥1 Google technology" requirement is already satisfied
  by Firebase (Auth/Firestore/Hosting/Functions) and the Gemini API, so the map layer does not
  need to be Google to stay compliant.
- **Options considered:**
  1. **Google Maps Platform** — mature tiles, overlays, and routing; but requires a billing
     account, a browser key that must be referrer-restricted, and ongoing cost. Extra setup in
     a time-boxed build.
  2. **MapLibre GL + OpenFreeMap (render) + OpenRouteService (routing)** — OpenFreeMap vector
     tiles are free and keyless (nothing to restrict or leak on the render surface); ORS gives
     free foot-walking directions with avoid-features (route around flagged segments and
     highway-class legs). Trade-off: ORS uses a client-side API key that must be origin-restricted
     + usage-capped, and there are fewer built-in POIs than Google.
- **Decision:** Use **MapLibre GL JS + OpenFreeMap** for map rendering and **OpenRouteService**
  for routing. Keep the Google-technology requirement satisfied via **Firebase + Gemini**, not
  maps. Detailed routing behavior (safety-scored, highway-aware, 2-call cap, green/orange
  labelling) is specified in
  `docs/superpowers/specs/2026-07-01-highway-aware-routing-design.md`.
- **Consequences:**
  - No map billing account or render key to manage — the render surface is keyless (a security
    win, one fewer attack surface).
  - One routing key (ORS) to secure. It currently **ships unrestricted in the client bundle** —
    tracked as an open security item (Security & Compliance doc, Threat T2; pre-demo checklist).
  - Fewer built-in POIs / no Google routing niceties — acceptable for the MVP.
  - Supersedes the original "Google Maps JavaScript API" assumption in the early docs. All MVP
    docs were reconciled to this decision on 2026-07-01. System Design (`docs/06-system-design.md`)
    is the canonical owner of the stack; other docs link to it and must not restate it.
